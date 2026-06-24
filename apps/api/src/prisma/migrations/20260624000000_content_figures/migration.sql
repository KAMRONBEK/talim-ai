-- Figures/diagrams/charts/tables extracted from source material, captioned by a
-- vision model and embedded so they're retrievable alongside text chunks.
CREATE TABLE "ContentFigure" (
  "id" TEXT NOT NULL,
  "contentId" TEXT NOT NULL,
  "page" INTEGER,
  "caption" TEXT NOT NULL,
  "storagePath" TEXT,
  "embedding" vector(1536),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContentFigure_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContentFigure_contentId_idx" ON "ContentFigure"("contentId");

ALTER TABLE "ContentFigure"
  ADD CONSTRAINT "ContentFigure_contentId_fkey"
  FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;
