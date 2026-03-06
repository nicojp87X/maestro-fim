import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import pdfParse from "pdf-parse";
import { FIM_SYSTEM_PROMPT } from "@/lib/anthropic/prompts/system-context";
import { EXTRACTION_PROMPT } from "@/lib/anthropic/prompts/extraction";
import { buildFIMReportPrompt } from "@/lib/anthropic/prompts/fim-report";
import { buildRagContext } from "@/lib/rag/retrieval";
import type { Profile } from "@/types/database";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MODEL = "gpt-4o";

async function updateJobStatus(
  jobId: string,
  status: string,
  errorMessage?: string
) {
  await supabaseAdmin
    .from("analysis_jobs")
    .update({
      status,
      ...(status === "completed" || status === "failed"
        ? { completed_at: new Date().toISOString() }
        : {}),
      ...(errorMessage ? { error_message: errorMessage } : {}),
    })
    .eq("id", jobId);
}

export async function runAnalysisPipeline(
  jobId: string,
  userId: string,
  storagePath: string,
  inputType: "image" | "pdf"
) {
  const t0 = Date.now();
  const elapsed = () => `${((Date.now() - t0) / 1000).toFixed(1)}s`;

  try {
    // ─── STEP 1: Download file from Supabase Storage ───────────────────────
    console.log(`[Pipeline ${jobId}] STEP 1: Downloading file…`);
    await updateJobStatus(jobId, "extracting");

    const { data: fileData, error: downloadError } =
      await supabaseAdmin.storage.from("analytics").download(storagePath);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }
    console.log(`[Pipeline ${jobId}] STEP 1 done at ${elapsed()}`);

    const fileBuffer = await fileData.arrayBuffer();
    console.log(
      `[Pipeline ${jobId}] File size: ${(fileBuffer.byteLength / 1024).toFixed(0)} KB, inputType: ${inputType}`
    );

    // ─── STEP 2: Extract biomarkers with GPT-4o ────────────────────────────
    console.log(`[Pipeline ${jobId}] STEP 2: Calling OpenAI (extraction)…`);

    // Build the user message content depending on file type
    // PDFs → extract text with pdf-parse and send as text
    // Images → send as base64 vision content
    type OpenAIContent = OpenAI.Chat.ChatCompletionContentPart;
    let extractionContent: OpenAIContent[];

    if (inputType === "pdf") {
      let pdfText: string;
      try {
        const parsed = await pdfParse(Buffer.from(fileBuffer));
        pdfText = parsed.text?.trim() ?? "";
      } catch (parseErr) {
        const msg = parseErr instanceof Error ? parseErr.message : String(parseErr);
        throw new Error(`PDF text extraction failed: ${msg}`);
      }

      if (!pdfText) {
        throw new Error(
          "El PDF no contiene texto extraíble. Por favor, sube una imagen (JPG/PNG) del análisis."
        );
      }

      extractionContent = [
        {
          type: "text",
          text: `${EXTRACTION_PROMPT}\n\n## CONTENIDO DEL DOCUMENTO\n\n${pdfText}`,
        },
      ];
    } else {
      // Image: send as base64 data URL
      const mimeType = storagePath.match(/\.png$/i)
        ? "image/png"
        : storagePath.match(/\.webp$/i)
        ? "image/webp"
        : storagePath.match(/\.heic$/i)
        ? "image/jpeg" // HEIC → treat as jpeg for API compatibility
        : "image/jpeg";

      const base64 = Buffer.from(fileBuffer).toString("base64");
      const dataUrl = `data:${mimeType};base64,${base64}`;

      extractionContent = [
        { type: "text", text: EXTRACTION_PROMPT },
        { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
      ];
    }

    let extractionText: string;
    try {
      const extractionResponse = await openai.chat.completions.create({
        model: MODEL,
        max_tokens: 2048,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: extractionContent }],
      });
      extractionText = extractionResponse.choices[0]?.message?.content ?? "";
    } catch (openaiErr) {
      const msg =
        openaiErr instanceof Error ? openaiErr.message : String(openaiErr);
      throw new Error(`OpenAI extraction failed: ${msg}`);
    }
    console.log(`[Pipeline ${jobId}] STEP 2 done at ${elapsed()}`);

    let extractedData: {
      biomarkers: Array<{
        biomarker_key: string;
        biomarker_name: string;
        raw_value: string;
        numeric_value: number | null;
        unit: string | null;
        reference_range_low: number | null;
        reference_range_high: number | null;
      }>;
    };

    try {
      const jsonText = extractionText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      extractedData = JSON.parse(jsonText);
    } catch {
      throw new Error("Failed to parse biomarker extraction response");
    }

    // Save extracted biomarkers
    if (extractedData.biomarkers.length > 0) {
      await supabaseAdmin.from("biomarker_extractions").insert(
        extractedData.biomarkers.map((b) => ({
          job_id: jobId,
          biomarker_key: b.biomarker_key,
          biomarker_name: b.biomarker_name,
          raw_value: b.raw_value,
          numeric_value: b.numeric_value,
          unit: b.unit,
          reference_range_low: b.reference_range_low,
          reference_range_high: b.reference_range_high,
        }))
      );
    }
    console.log(
      `[Pipeline ${jobId}] Extracted ${extractedData.biomarkers.length} biomarkers`
    );

    // ─── STEP 3: RAG - Retrieve relevant FIM knowledge (optional) ──────────
    await updateJobStatus(jobId, "analyzing");
    console.log(`[Pipeline ${jobId}] STEP 3: Building RAG context…`);

    const biomarkerNames = extractedData.biomarkers.map((b) => b.biomarker_name);
    let ragContext =
      "No se encontró contexto adicional en la base de conocimiento FIM.";

    try {
      ragContext = await buildRagContext(biomarkerNames);
      console.log(`[Pipeline ${jobId}] STEP 3 done at ${elapsed()}`);
    } catch (ragErr) {
      const ragMsg = ragErr instanceof Error ? ragErr.message : String(ragErr);
      console.warn(
        `[Pipeline ${jobId}] RAG failed (continuing without context): ${ragMsg}`
      );
    }

    // ─── STEP 4: Get patient profile for personalization ───────────────────
    console.log(`[Pipeline ${jobId}] STEP 4: Fetching patient profile…`);
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single<Profile>();

    let age: number | null = null;
    if (profile?.date_of_birth) {
      const dob = new Date(profile.date_of_birth);
      age = new Date().getFullYear() - dob.getFullYear();
    }

    // ─── STEP 5: Generate FIM report with GPT-4o ──────────────────────────
    await updateJobStatus(jobId, "generating");
    console.log(`[Pipeline ${jobId}] STEP 5: Calling OpenAI (report)…`);

    const reportPrompt = buildFIMReportPrompt(
      extractedData.biomarkers,
      {
        gender: profile?.gender ?? null,
        age,
        activity_level: profile?.activity_level ?? null,
        health_goals: profile?.health_goals ?? null,
        known_conditions: profile?.known_conditions ?? null,
        medications: profile?.medications ?? null,
      },
      ragContext
    );

    let reportText: string;
    try {
      const reportResponse = await openai.chat.completions.create({
        model: MODEL,
        max_tokens: 4096,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: FIM_SYSTEM_PROMPT },
          { role: "user", content: reportPrompt },
        ],
      });
      reportText = reportResponse.choices[0]?.message?.content ?? "";
    } catch (reportErr) {
      const msg =
        reportErr instanceof Error ? reportErr.message : String(reportErr);
      throw new Error(`OpenAI report generation failed: ${msg}`);
    }
    console.log(`[Pipeline ${jobId}] STEP 5 done at ${elapsed()}`);

    let reportData: Record<string, unknown>;
    try {
      const jsonText = reportText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      reportData = JSON.parse(jsonText);
    } catch {
      throw new Error("Failed to parse FIM report response");
    }

    // ─── STEP 6: Save report ───────────────────────────────────────────────
    console.log(`[Pipeline ${jobId}] STEP 6: Saving report…`);
    const biomarkerAssessments = (
      reportData.biomarker_assessments as Array<{
        biomarker_name: string;
        fim_status: string;
        fim_optimal_low: number | null;
        fim_optimal_high: number | null;
      }>
    ) ?? [];

    for (const assessment of biomarkerAssessments) {
      await supabaseAdmin
        .from("biomarker_extractions")
        .update({
          status: assessment.fim_status,
          fim_range_optimal_low: assessment.fim_optimal_low,
          fim_range_optimal_high: assessment.fim_optimal_high,
        })
        .eq("job_id", jobId)
        .eq("biomarker_name", assessment.biomarker_name);
    }

    await supabaseAdmin.from("fim_reports").insert({
      job_id: jobId,
      user_id: userId,
      fim_score: reportData.fim_score,
      metabolic_flexibility_score: reportData.metabolic_flexibility_score,
      immune_flexibility_score: reportData.immune_flexibility_score,
      executive_summary: reportData.executive_summary,
      metabolic_analysis: reportData.metabolic_analysis,
      immune_analysis: reportData.immune_analysis,
      hormonal_analysis: reportData.hormonal_analysis,
      circadian_analysis: reportData.circadian_analysis,
      ampk_mtor_balance: reportData.ampk_mtor_balance,
      nutrition_recommendations: reportData.nutrition_recommendations,
      exercise_recommendations: reportData.exercise_recommendations,
      sleep_recommendations: reportData.sleep_recommendations,
      supplement_recommendations: reportData.supplement_recommendations,
      priority_actions: reportData.priority_actions,
      follow_up_markers: reportData.follow_up_markers,
      rag_sources_used: biomarkerNames,
      model_version: MODEL,
    });

    await updateJobStatus(jobId, "completed");
    console.log(`[Pipeline ${jobId}] COMPLETED at ${elapsed()} ✓`);
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown pipeline error";
    console.error(`[Pipeline ${jobId}] FAILED at ${elapsed()}: ${errorMessage}`);
    await updateJobStatus(jobId, "failed", errorMessage);
  }
}
