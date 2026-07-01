-- Wave 3 B2: structured question types. Additive only — enum values only, not used
-- in this migration, safe in the transaction on PG16. No pgvector touch.
ALTER TYPE "QuestionType" ADD VALUE IF NOT EXISTS 'DROPDOWN_CLOZE';
ALTER TYPE "QuestionType" ADD VALUE IF NOT EXISTS 'MATCHING';
ALTER TYPE "QuestionType" ADD VALUE IF NOT EXISTS 'ORDERING';
