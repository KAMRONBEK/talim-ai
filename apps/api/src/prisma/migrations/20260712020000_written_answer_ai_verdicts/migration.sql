-- Hand-written, additive only (never `migrate diff` here — it emits DROPs for the
-- pgvector HNSW indexes and Chunk.tsv).

-- New usage feature for AI written-answer judging.
-- (Safe inside Prisma's migration transaction on PG >= 12 because the new value is
-- not referenced later in this same migration.)
ALTER TYPE "UsageFeature" ADD VALUE IF NOT EXISTS 'ANSWER_JUDGE';

-- Cached AI judge verdicts for written (SHORT_ANSWER) answers, keyed by question +
-- normalized-answer hash so instant checks, submits, and re-grades always agree.
CREATE TABLE "WrittenAnswerVerdict" (
    "id" TEXT NOT NULL,
    "questionKey" TEXT NOT NULL,
    "answerHash" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "feedback" TEXT,
    "model" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WrittenAnswerVerdict_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WrittenAnswerVerdict_questionKey_answerHash_key" ON "WrittenAnswerVerdict"("questionKey", "answerHash");
