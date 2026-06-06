-- CreateEnum
CREATE TYPE "TranscriptSource" AS ENUM ('YOUTUBE_CAPTIONS', 'AI_TRANSCRIPTION');

-- CreateTable
CREATE TABLE "ContentTranscriptSegment" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "startMs" INTEGER NOT NULL,
    "endMs" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "source" "TranscriptSource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentTranscriptSegment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContentTranscriptSegment_contentId_order_key" ON "ContentTranscriptSegment"("contentId", "order");

-- CreateIndex
CREATE INDEX "ContentTranscriptSegment_contentId_idx" ON "ContentTranscriptSegment"("contentId");

-- CreateIndex
CREATE INDEX "ContentTranscriptSegment_contentId_startMs_idx" ON "ContentTranscriptSegment"("contentId", "startMs");

-- AddForeignKey
ALTER TABLE "ContentTranscriptSegment" ADD CONSTRAINT "ContentTranscriptSegment_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;
