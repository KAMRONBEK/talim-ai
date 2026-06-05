-- AlterTable User
ALTER TABLE "User" ADD COLUMN "preferredLocale" TEXT NOT NULL DEFAULT 'uz';

-- AlterTable ContentSummary
ALTER TABLE "ContentSummary" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'uz';
DROP INDEX IF EXISTS "ContentSummary_userId_contentId_scopeKey_key";
CREATE UNIQUE INDEX "ContentSummary_userId_contentId_scopeKey_locale_key" ON "ContentSummary"("userId", "contentId", "scopeKey", "locale");

-- AlterTable Quiz
ALTER TABLE "Quiz" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'uz';
DROP INDEX IF EXISTS "Quiz_contentId_userId_sectionId_kind_idx";
CREATE INDEX "Quiz_contentId_userId_sectionId_kind_locale_idx" ON "Quiz"("contentId", "userId", "sectionId", "kind", "locale");

-- AlterTable Podcast
ALTER TABLE "Podcast" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'uz';
DROP INDEX IF EXISTS "Podcast_contentId_key";
CREATE UNIQUE INDEX "Podcast_contentId_locale_key" ON "Podcast"("contentId", "locale");

-- CreateEnum
CREATE TYPE "GeneratedMediaStatus" AS ENUM ('PENDING', 'GENERATING', 'READY', 'FAILED');

-- CreateTable ContentVideo
CREATE TABLE "ContentVideo" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'uz',
    "scopeKey" TEXT NOT NULL,
    "sectionId" TEXT,
    "status" "GeneratedMediaStatus" NOT NULL DEFAULT 'PENDING',
    "script" TEXT,
    "storagePath" TEXT,
    "durationSec" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentVideo_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ContentVideo_contentId_locale_scopeKey_key" ON "ContentVideo"("contentId", "locale", "scopeKey");
CREATE INDEX "ContentVideo_contentId_idx" ON "ContentVideo"("contentId");

ALTER TABLE "ContentVideo" ADD CONSTRAINT "ContentVideo_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;
