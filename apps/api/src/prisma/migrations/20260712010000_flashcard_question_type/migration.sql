-- Additive enum value (hand-written): FLASHCARD becomes a first-class practice question
-- type so the unified Practice generator can mix self-graded study cards into the same
-- quiz session as auto-graded items (B2C only; tenant banks keep the auto-graded set).
ALTER TYPE "QuestionType" ADD VALUE IF NOT EXISTS 'FLASHCARD';
