-- CreateEnum
CREATE TYPE "PodcastStatus" AS ENUM ('PENDING', 'GENERATING', 'READY', 'FAILED');

-- CreateTable
CREATE TABLE "ContentSection" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "startChunk" INTEGER NOT NULL,
    "endChunk" INTEGER NOT NULL,
    "readMinutes" INTEGER,

    CONSTRAINT "ContentSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Podcast" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "status" "PodcastStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Podcast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PodcastEpisode" (
    "id" TEXT NOT NULL,
    "podcastId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "script" TEXT NOT NULL,
    "audioPath" TEXT,
    "durationSec" INTEGER,
    "sectionId" TEXT,

    CONSTRAINT "PodcastEpisode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentSection_contentId_idx" ON "ContentSection"("contentId");
CREATE INDEX "ContentSection_contentId_order_idx" ON "ContentSection"("contentId", "order");
CREATE UNIQUE INDEX "Podcast_contentId_key" ON "Podcast"("contentId");
CREATE INDEX "Podcast_contentId_idx" ON "Podcast"("contentId");
CREATE INDEX "PodcastEpisode_podcastId_idx" ON "PodcastEpisode"("podcastId");
CREATE INDEX "PodcastEpisode_podcastId_order_idx" ON "PodcastEpisode"("podcastId", "order");

-- AddForeignKey
ALTER TABLE "ContentSection" ADD CONSTRAINT "ContentSection_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Podcast" ADD CONSTRAINT "Podcast_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PodcastEpisode" ADD CONSTRAINT "PodcastEpisode_podcastId_fkey" FOREIGN KEY ("podcastId") REFERENCES "Podcast"("id") ON DELETE CASCADE ON UPDATE CASCADE;
