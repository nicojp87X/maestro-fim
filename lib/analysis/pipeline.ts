import { createClient } from "@supabase/supabase-js";
import { anthropic } from "@/lib/anthropic/client";
import { FIM_SYSTEM_PROMPT } from "@/lib/anthropic/prompts/system-context";
import { EXTRACTION_PROMPT } from "@/lib/anthropic/prompts/extraction";
import { buildFIMReportPrompt } from "@/lib/anthropic/prompts/fim-report";
import { buildRagContext } from "@/lib/rag/retrieval";
import type { Profile } from "@/types/database";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
  try {
    // ─── STEP 1: Download file from Supabase Storage ───────────────────────
    await updateJobStatus(jobId, "extracting");

    const { data: fileData, error: downloadError } =
      await supabaseAdmin.storage.from("analytics").download(storagePath);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    const fileBuffer = await fileData.arrayBuffer();
    const base64 = Buffer.from(fileBuffer).toString("base64");

    // ─── STEP 2: Extract biomarkers with Claude Vision ─────────────────────
    let mediaType: "image/jpeg" | "image/png" | "application/pdf" =
      "image/jpeg";
    if (inputType === "pdf") mediaType = "application/pdf";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const documentBlock: any = {
      type: inputType === "pdf" ? "document" : "image",
      source: {
        type: "base64",
        media_type: mediaType,
        data: base64,
      },
    };

    const extractionResponse = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            documentBlock,
            { type: "text", text: EXTRACTION_PROMPT },
          ],
        },
      ],
    });

    const extractionText =
      extractionResponse.content[0].type === "text"
        ? extractionResponse.content[0].text
        : "";

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
      // Clean JSON from potential markdown code blocks
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

    // ─── STEP 3: RAG - Retrieve relevant FIM knowledge ─────────────────────
    await updateJobStatus(jobId, "analyzing");

    const biomarkerNames = extractedData.biomarkers.map((b) => b.biomarker_name);
    const ragContext = await buildRagContext(biomarkerNames);

    // ─── STEP 4: Get patient profile for personalization ───────────────────
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

    // ─── STEP 5: Generate FIM report with Claude ───────────────────────────
    await updateJobStatus(jobId, "generating");

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

    const reportResponse = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 4096,
      system: FIM_SYSTEM_PROMPT,
      messages: [{ role: "user", content: reportPrompt }],
    });

    const reportText =
      reportResponse.content[0].type === "text"
        ? reportResponse.content[0].text
        : "";

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
    const biomarkerAssessments = (
      reportData.biomarker_assessments as Array<{
        biomarker_name: string;
        fim_status: string;
        fim_optimal_low: number | null;
        fim_optimal_high: number | null;
      }>
    ) ?? [];

    // Update biomarker statuses
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
      model_version: "claude-3-5-haiku-20241022",
    });

    await updateJobStatus(jobId, "completed");
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown pipeline error";
    console.error(`Pipeline error for job ${jobId}:`, errorMessage);
    await updateJobStatus(jobId, "failed", errorMessage);
  }
}
