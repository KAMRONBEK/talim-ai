-- P2: hybrid retrieval. HNSW ANN indexes (cosine) for scale, plus a language-
-- agnostic lexical tsvector column so dense + keyword results can be fused (RRF).

CREATE INDEX IF NOT EXISTS "Chunk_embedding_hnsw"
  ON "Chunk" USING hnsw ("embedding" vector_cosine_ops);

CREATE INDEX IF NOT EXISTS "ContentFigure_embedding_hnsw"
  ON "ContentFigure" USING hnsw ("embedding" vector_cosine_ops);

-- 'simple' config = lowercase + tokenize, no language stemming. Best for mixed
-- Uzbek/Russian/English where exact-term recall matters (names, numbers, terms).
ALTER TABLE "Chunk"
  ADD COLUMN "tsv" tsvector GENERATED ALWAYS AS (to_tsvector('simple', "text")) STORED;

CREATE INDEX "Chunk_tsv_gin" ON "Chunk" USING gin ("tsv");
