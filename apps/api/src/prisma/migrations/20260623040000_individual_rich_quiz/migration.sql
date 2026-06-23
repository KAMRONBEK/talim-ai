-- Individual learners can generate the same rich question types as tutors.
-- Quiz gains a generation style + requested count; QuizQuestion gains a type and
-- acceptableAnswers, and options becomes nullable (only multiple-choice has options).

ALTER TABLE "Quiz" ADD COLUMN "style" TEXT NOT NULL DEFAULT 'mixed';
ALTER TABLE "Quiz" ADD COLUMN "count" INTEGER;

ALTER TABLE "QuizQuestion" ADD COLUMN "type" "QuestionType" NOT NULL DEFAULT 'MULTIPLE_CHOICE';
ALTER TABLE "QuizQuestion" ADD COLUMN "acceptableAnswers" JSONB;
ALTER TABLE "QuizQuestion" ALTER COLUMN "options" DROP NOT NULL;

-- Refresh the quiz-lookup index to include style (cache key for generation).
DROP INDEX IF EXISTS "Quiz_contentId_userId_sectionId_kind_locale_idx";
CREATE INDEX "Quiz_contentId_userId_sectionId_kind_locale_style_idx"
  ON "Quiz" ("contentId", "userId", "sectionId", "kind", "locale", "style");
