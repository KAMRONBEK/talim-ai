-- AlterTable
ALTER TABLE "ChatMessage" ADD COLUMN IF NOT EXISTS "excerpt" TEXT;
ALTER TABLE "ChatMessage" ADD COLUMN IF NOT EXISTS "excerptImage" TEXT;
