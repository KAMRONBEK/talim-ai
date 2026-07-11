-- Question engine rework: unified generation params, item metadata, Elo-KT mastery.
-- Hand-written additive DDL only (never use `migrate diff` here — it tries to drop the
-- pgvector HNSW indexes and Chunk.tsv).

-- Quiz: unified generation parameters
ALTER TABLE "Quiz" ADD COLUMN "depth" TEXT NOT NULL DEFAULT 'mixed';
ALTER TABLE "Quiz" ADD COLUMN "types" JSONB;

-- QuizQuestion: item metadata for the unified question engine
ALTER TABLE "QuizQuestion" ADD COLUMN "config" JSONB;
ALTER TABLE "QuizQuestion" ADD COLUMN "difficulty" TEXT;
ALTER TABLE "QuizQuestion" ADD COLUMN "bloom" TEXT;
ALTER TABLE "QuizQuestion" ADD COLUMN "sourceQuote" TEXT;
ALTER TABLE "QuizQuestion" ADD COLUMN "optionRationales" JSONB;
ALTER TABLE "QuizQuestion" ADD COLUMN "sourceSectionId" TEXT;

-- BankQuestion: same item metadata for tenant question banks
ALTER TABLE "BankQuestion" ADD COLUMN "difficulty" TEXT;
ALTER TABLE "BankQuestion" ADD COLUMN "bloom" TEXT;
ALTER TABLE "BankQuestion" ADD COLUMN "sourceQuote" TEXT;
ALTER TABLE "BankQuestion" ADD COLUMN "optionRationales" JSONB;

-- SectionMastery: per-(user, content, section) Elo-KT mastery state
CREATE TABLE "SectionMastery" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "sectionId" TEXT,
    "scopeKey" TEXT NOT NULL,
    "theta" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "correct" INTEGER NOT NULL DEFAULT 0,
    "activeDays" INTEGER NOT NULL DEFAULT 0,
    "lastAnswerDay" TEXT,
    "lastAnswerAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SectionMastery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SectionMastery_userId_contentId_scopeKey_key" ON "SectionMastery"("userId", "contentId", "scopeKey");
CREATE INDEX "SectionMastery_userId_idx" ON "SectionMastery"("userId");
CREATE INDEX "SectionMastery_contentId_idx" ON "SectionMastery"("contentId");

ALTER TABLE "SectionMastery" ADD CONSTRAINT "SectionMastery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SectionMastery" ADD CONSTRAINT "SectionMastery_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- QuestionStat: online item-difficulty calibration (no FK — items span three tables)
CREATE TABLE "QuestionStat" (
    "itemKey" TEXT NOT NULL,
    "difficulty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionStat_pkey" PRIMARY KEY ("itemKey")
);
