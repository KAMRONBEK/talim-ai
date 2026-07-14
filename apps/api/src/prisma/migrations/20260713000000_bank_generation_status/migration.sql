-- Async question-bank AI generation tracking (Bull job + bank.status SSE).
-- Additive only: reuses the existing "GeneratedMediaStatus" enum.
ALTER TABLE "QuestionBank" ADD COLUMN "generationStatus" "GeneratedMediaStatus";
ALTER TABLE "QuestionBank" ADD COLUMN "generationError" TEXT;
