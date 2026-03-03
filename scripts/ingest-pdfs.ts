/**
 * Script de ingesta de los 297 PDFs de FIM en pgvector (Supabase)
 *
 * Uso:
 *   npx tsx scripts/ingest-pdfs.ts
 *
 * Requiere: OPENAI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   en .env.local
 */

import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import pdfParse from "pdf-parse";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

dotenv.config({ path: ".env.local" });

const PDFS_PATH =
  process.env.FIM_PDFS_PATH ||
  "/Users/n./Desktop/Maestro-Flexibilidad-Inmunometabolica";
const CHUNK_SIZE = 1500; // characters per chunk
const CHUNK_OVERLAP = 200;
const BATCH_SIZE = 20; // embeddings per OpenAI API call

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// ─── Helpers ────────────────────────────────────────────────────────────────

function extractModuleInfo(filename: string): {
  module: string | null;
  lesson: string | null;
} {
  const moduleMatch = filename.match(/M(\d+)/i);
  const lessonMatch = filename.match(/L(\d+)/i);
  return {
    module: moduleMatch ? `M${moduleMatch[1]}` : "standalone",
    lesson: lessonMatch ? `L${lessonMatch[1]}` : null,
  };
}

function extractTopicTags(filename: string, text: string): string[] {
  const tags: string[] = [];
  const lower = filename.toLowerCase() + " " + text.slice(0, 500).toLowerCase();

  const tagMap: Record<string, string> = {
    glucosa: "glucosa",
    insulina: "insulina",
    "resistencia a la insulina": "resistencia_insulina",
    inflamacion: "inflamacion",
    "inflamación": "inflamacion",
    ampk: "AMPK",
    mtor: "mTOR",
    cetosis: "cetosis",
    cetonico: "cetosis",
    ayuno: "ayuno_intermitente",
    "ayuno intermitente": "ayuno_intermitente",
    autofagia: "autofagia",
    mitocondria: "mitocondria",
    circadiano: "ritmos_circadianos",
    sueno: "sueño",
    sueño: "sueño",
    cortisol: "cortisol",
    tiroides: "tiroides",
    hormona: "hormonas",
    vitamina: "vitaminas_minerales",
    suplemento: "suplementacion",
    ejercicio: "ejercicio",
    actividad: "ejercicio",
    obesidad: "obesidad",
    grasa: "grasa_visceral",
    visceral: "grasa_visceral",
    metabolismo: "metabolismo",
    inmune: "inmunidad",
    inmunidad: "inmunidad",
    autoinmunidad: "autoinmunidad",
    microbiota: "microbiota",
    gut: "microbiota",
    omega: "omega3",
    magnesio: "magnesio",
    vitamina_d: "vitamina_d",
  };

  for (const [keyword, tag] of Object.entries(tagMap)) {
    if (lower.includes(keyword.toLowerCase()) && !tags.includes(tag)) {
      tags.push(tag);
    }
  }

  return tags;
}

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;

  // Clean text
  const cleaned = text
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  while (start < cleaned.length) {
    let end = start + CHUNK_SIZE;

    if (end < cleaned.length) {
      // Try to break at a sentence boundary
      const lastPeriod = cleaned.lastIndexOf(".", end);
      const lastNewline = cleaned.lastIndexOf("\n", end);
      const breakPoint = Math.max(lastPeriod, lastNewline);

      if (breakPoint > start + CHUNK_SIZE / 2) {
        end = breakPoint + 1;
      }
    }

    const chunk = cleaned.slice(start, Math.min(end, cleaned.length)).trim();
    if (chunk.length > 100) {
      chunks.push(chunk);
    }

    start = Math.max(start + 1, end - CHUNK_OVERLAP);
  }

  return chunks;
}

async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: texts.map((t) => t.slice(0, 8000)),
    encoding_format: "float",
  });
  return response.data.map((d) => d.embedding);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🚀 Iniciando ingesta de PDFs FIM desde: ${PDFS_PATH}\n`);

  const pdfFiles = fs
    .readdirSync(PDFS_PATH)
    .filter((f) => f.endsWith(".pdf"))
    .sort();

  console.log(`📚 PDFs encontrados: ${pdfFiles.length}\n`);

  // Check already ingested
  const { data: existing } = await supabase
    .from("fim_knowledge_chunks")
    .select("source_filename")
    .limit(1000);

  const ingestedFiles = new Set(
    (existing ?? []).map((r: { source_filename: string }) => r.source_filename)
  );

  let totalChunks = 0;
  let processed = 0;
  let skipped = 0;

  for (const filename of pdfFiles) {
    if (ingestedFiles.has(filename)) {
      console.log(`⏭️  Skipping (already ingested): ${filename}`);
      skipped++;
      continue;
    }

    console.log(`\n📄 Processing [${processed + 1}/${pdfFiles.length}]: ${filename}`);

    const filePath = path.join(PDFS_PATH, filename);
    let text = "";

    try {
      const buffer = fs.readFileSync(filePath);
      const parsed = await pdfParse(buffer);
      text = parsed.text;
    } catch (err) {
      console.error(`  ❌ Error reading PDF: ${err}`);
      continue;
    }

    if (text.length < 100) {
      console.log(`  ⚠️  PDF appears to have no extractable text, skipping`);
      continue;
    }

    const chunks = chunkText(text);
    const { module, lesson } = extractModuleInfo(filename);
    const topicTags = extractTopicTags(filename, text);

    console.log(
      `  📦 Chunks: ${chunks.length} | Module: ${module} | Tags: ${topicTags.slice(0, 5).join(", ")}`
    );

    // Process in batches
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batchChunks = chunks.slice(i, i + BATCH_SIZE);

      let embeddings: number[][];
      try {
        embeddings = await generateEmbeddingsBatch(batchChunks);
      } catch (err) {
        console.error(`  ❌ Embedding error for batch ${i}: ${err}`);
        continue;
      }

      const rows = batchChunks.map((chunk, idx) => ({
        source_filename: filename,
        module,
        lesson,
        topic_tags: topicTags,
        chunk_index: i + idx,
        chunk_text: chunk,
        embedding: embeddings[idx],
        token_count: Math.ceil(chunk.length / 4), // rough estimate
      }));

      const { error } = await supabase
        .from("fim_knowledge_chunks")
        .insert(rows);

      if (error) {
        console.error(`  ❌ DB insert error: ${error.message}`);
      } else {
        process.stdout.write(
          `  ✅ Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(chunks.length / BATCH_SIZE)} ingested\r`
        );
        totalChunks += batchChunks.length;
      }

      // Rate limit: pause between batches
      await new Promise((r) => setTimeout(r, 500));
    }

    console.log(`  ✅ Done: ${chunks.length} chunks ingested`);
    processed++;
  }

  console.log(`\n\n✨ Ingesta completada:`);
  console.log(`   PDFs procesados: ${processed}`);
  console.log(`   PDFs omitidos (ya existían): ${skipped}`);
  console.log(`   Total chunks nuevos: ${totalChunks}`);
  console.log(`\nBase de conocimiento FIM lista para búsqueda semántica.\n`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
