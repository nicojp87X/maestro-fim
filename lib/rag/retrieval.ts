import { createClient } from "@supabase/supabase-js";
import { generateEmbedding } from "./embeddings";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function retrieveRelevantChunks(
  query: string,
  topK = 8
): Promise<string[]> {
  const queryEmbedding = await generateEmbedding(query);

  const { data, error } = await supabaseAdmin.rpc("match_fim_chunks", {
    query_embedding: queryEmbedding,
    match_threshold: 0.7,
    match_count: topK,
  });

  if (error) {
    console.error("RAG retrieval error:", error);
    return [];
  }

  return (data as Array<{ chunk_text: string; source_filename: string }>).map(
    (chunk) => `[Fuente: ${chunk.source_filename}]\n${chunk.chunk_text}`
  );
}

export async function buildRagContext(biomarkerNames: string[]): Promise<string> {
  const query = `Flexibilidad inmunometabólica análisis de: ${biomarkerNames.join(", ")}. AMPK mTOR inflamación metabolismo inmune`;
  const chunks = await retrieveRelevantChunks(query);

  if (chunks.length === 0) {
    return "No se encontró contexto adicional en la base de conocimiento FIM.";
  }

  return chunks.join("\n\n---\n\n");
}
