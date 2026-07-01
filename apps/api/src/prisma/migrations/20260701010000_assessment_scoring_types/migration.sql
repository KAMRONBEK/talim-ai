-- Wave 3 B1: strict scoring config + 3 core new question types.
-- Additive only. New enum values are not USED in this migration (only added), so they
-- are safe inside the migration transaction on PG16. Does not touch Chunk / pgvector.

ALTER TYPE "QuestionType" ADD VALUE IF NOT EXISTS 'TRUE_FALSE';
ALTER TYPE "QuestionType" ADD VALUE IF NOT EXISTS 'MULTIPLE_SELECT';
ALTER TYPE "QuestionType" ADD VALUE IF NOT EXISTS 'FILL_BLANK';

ALTER TABLE "TenantAssessment"
  ADD COLUMN "strictScoring" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "wrongPenalty" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  ADD COLUMN "partialCredit" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "AssessmentAttempt"
  ADD COLUMN "pointsEarned" DOUBLE PRECISION,
  ADD COLUMN "maxPoints" DOUBLE PRECISION;

ALTER TABLE "AttemptAnswer"
  ADD COLUMN "pointsEarned" DOUBLE PRECISION,
  ADD COLUMN "creditFraction" DOUBLE PRECISION;

ALTER TABLE "BankQuestion"
  ADD COLUMN "config" JSONB;
