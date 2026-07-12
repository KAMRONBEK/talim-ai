-- Retire QUICK quizzes (data-only migration, hand-written — no DDL).
--
-- The quick-check product surface was removed by the question-engine rework
-- (20260711000000_question_engine): the UI no longer offers it, the API coerces
-- incoming kind=QUICK to FULL, and generation always runs the unified pipeline.
-- This migration retires the legacy DATA so no code path needs a QUICK branch:
--
-- 1. Relabel legacy QUICK quizzes as FULL practice quizzes. Their attempts are
--    kept (learner history) and now participate in the best-practice-score
--    coverage component like any other practice quiz.
-- 2. Null out stored quick-check accuracy on section progress — the 30% blend
--    weight it fed was folded into the quiz/AI components, so the stored values
--    are meaningless and would otherwise be served stale by the progress API.
--
-- The QuizKind enum keeps its QUICK member: dropping a Postgres enum value is a
-- destructive type rewrite, and the API still tolerates stale clients sending it.

UPDATE "Quiz" SET "kind" = 'FULL' WHERE "kind" = 'QUICK';

UPDATE "SectionProgress" SET "quickCheckAccuracy" = NULL WHERE "quickCheckAccuracy" IS NOT NULL;
