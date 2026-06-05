-- CreateTable
CREATE TABLE "ContentSectionTitle" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "ContentSectionTitle_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "ChatSession" ADD COLUMN IF NOT EXISTS "locale" TEXT NOT NULL DEFAULT 'uz';

-- Deduplicate chat sessions before unique constraint (keep earliest per user/content/locale)
DELETE FROM "ChatSession" cs
WHERE cs."id" NOT IN (
    SELECT DISTINCT ON ("userId", "contentId", "locale") "id"
    FROM "ChatSession"
    ORDER BY "userId", "contentId", "locale", "createdAt" ASC
);

-- CreateIndex
CREATE INDEX "ContentSectionTitle_sectionId_idx" ON "ContentSectionTitle"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentSectionTitle_sectionId_locale_key" ON "ContentSectionTitle"("sectionId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "ChatSession_userId_contentId_locale_key" ON "ChatSession"("userId", "contentId", "locale");

-- AddForeignKey
ALTER TABLE "ContentSectionTitle" ADD CONSTRAINT "ContentSectionTitle_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ContentSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
