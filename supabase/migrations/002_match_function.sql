-- Function for semantic search on FIM knowledge chunks
CREATE OR REPLACE FUNCTION match_fim_chunks(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 8
)
RETURNS TABLE (
  id UUID,
  chunk_text TEXT,
  source_filename TEXT,
  module TEXT,
  topic_tags TEXT[],
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    fim_knowledge_chunks.id,
    fim_knowledge_chunks.chunk_text,
    fim_knowledge_chunks.source_filename,
    fim_knowledge_chunks.module,
    fim_knowledge_chunks.topic_tags,
    1 - (fim_knowledge_chunks.embedding <=> query_embedding) AS similarity
  FROM fim_knowledge_chunks
  WHERE 1 - (fim_knowledge_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY fim_knowledge_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
