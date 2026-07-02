-- Section hierarchy: optional 2-level outline (chapters with subsections).
-- Additive only. Existing flat sections stay depth 0 / parentId null and render
-- unchanged. onDelete SET NULL avoids bulk-delete recursion; content-level delete
-- still cascades via contentId. Does not touch Chunk / pgvector.
ALTER TABLE "ContentSection" ADD COLUMN "parentId" TEXT;
ALTER TABLE "ContentSection" ADD COLUMN "depth" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX "ContentSection_parentId_idx" ON "ContentSection"("parentId");
ALTER TABLE "ContentSection" ADD CONSTRAINT "ContentSection_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ContentSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
