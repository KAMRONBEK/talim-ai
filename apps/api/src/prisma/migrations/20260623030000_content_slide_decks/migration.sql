-- AI-generated slide decks (presentation view) derived from a content's material.
CREATE TABLE "ContentSlideDeck" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'uz',
    "scopeKey" TEXT NOT NULL,
    "sectionId" TEXT,
    "status" "GeneratedMediaStatus" NOT NULL DEFAULT 'PENDING',
    "audience" TEXT NOT NULL DEFAULT 'students',
    "accent" TEXT NOT NULL DEFAULT 'teal',
    "deck" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentSlideDeck_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ContentSlideDeck_contentId_locale_scopeKey_key" ON "ContentSlideDeck"("contentId", "locale", "scopeKey");
CREATE INDEX "ContentSlideDeck_contentId_idx" ON "ContentSlideDeck"("contentId");

ALTER TABLE "ContentSlideDeck"
  ADD CONSTRAINT "ContentSlideDeck_contentId_fkey"
  FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;
