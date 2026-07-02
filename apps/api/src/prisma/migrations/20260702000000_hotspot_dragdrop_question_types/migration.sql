-- Manual-authoring question types: HOTSPOT (click a spot on an image) and DRAG_DROP
-- (categorize items into target buckets). Additive only — enum values only, not used
-- in this migration, safe in the transaction on PG16. No pgvector touch.
ALTER TYPE "QuestionType" ADD VALUE IF NOT EXISTS 'HOTSPOT';
ALTER TYPE "QuestionType" ADD VALUE IF NOT EXISTS 'DRAG_DROP';
