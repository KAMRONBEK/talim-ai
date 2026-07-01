-- Wave 3 area C: polymorphic generated-media review (admin approve/flag).
-- Additive only — new enum + new table. Does not touch Chunk / pgvector.
CREATE TYPE "MediaReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'FLAGGED');

CREATE TABLE "GeneratedMediaReview" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "status" "MediaReviewStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GeneratedMediaReview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GeneratedMediaReview_kind_mediaId_key" ON "GeneratedMediaReview"("kind", "mediaId");
CREATE INDEX "GeneratedMediaReview_status_idx" ON "GeneratedMediaReview"("status");
