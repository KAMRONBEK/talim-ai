-- Wave 3 area A2: per-assignment due date (soft/informational).
-- Additive only. Nullable, no default, no backfill. Does not touch Chunk / pgvector.
ALTER TABLE "AssessmentAssignment" ADD COLUMN "dueAt" TIMESTAMP(3);
