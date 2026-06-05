-- CreateEnum
CREATE TYPE "QuizKind" AS ENUM ('FULL', 'QUICK');

-- AlterTable
ALTER TABLE "Quiz" ADD COLUMN "sectionId" TEXT,
ADD COLUMN "kind" "QuizKind" NOT NULL DEFAULT 'FULL';

-- CreateTable
CREATE TABLE "ContentProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "lastSectionId" TEXT,
    "overallCoverage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SectionProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "coverageScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quizBestScore" DOUBLE PRECISION,
    "quickCheckAccuracy" DOUBLE PRECISION,
    "viewedAt" TIMESTAMP(3),
    "aiFeedback" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SectionProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentSummary" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "scopeKey" TEXT NOT NULL,
    "sectionId" TEXT,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PodcastEpisodeProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "listenedSec" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PodcastEpisodeProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningActivityDay" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,

    CONSTRAINT "LearningActivityDay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Quiz_contentId_userId_sectionId_kind_idx" ON "Quiz"("contentId", "userId", "sectionId", "kind");

-- CreateIndex
CREATE INDEX "ContentProgress_userId_idx" ON "ContentProgress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentProgress_userId_contentId_key" ON "ContentProgress"("userId", "contentId");

-- CreateIndex
CREATE INDEX "SectionProgress_userId_idx" ON "SectionProgress"("userId");

-- CreateIndex
CREATE INDEX "SectionProgress_contentId_idx" ON "SectionProgress"("contentId");

-- CreateIndex
CREATE UNIQUE INDEX "SectionProgress_userId_sectionId_key" ON "SectionProgress"("userId", "sectionId");

-- CreateIndex
CREATE INDEX "ContentSummary_userId_idx" ON "ContentSummary"("userId");

-- CreateIndex
CREATE INDEX "ContentSummary_contentId_idx" ON "ContentSummary"("contentId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentSummary_userId_contentId_scopeKey_key" ON "ContentSummary"("userId", "contentId", "scopeKey");

-- CreateIndex
CREATE INDEX "PodcastEpisodeProgress_userId_idx" ON "PodcastEpisodeProgress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PodcastEpisodeProgress_userId_episodeId_key" ON "PodcastEpisodeProgress"("userId", "episodeId");

-- CreateIndex
CREATE INDEX "LearningActivityDay_userId_idx" ON "LearningActivityDay"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LearningActivityDay_userId_date_key" ON "LearningActivityDay"("userId", "date");

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ContentSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentProgress" ADD CONSTRAINT "ContentProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentProgress" ADD CONSTRAINT "ContentProgress_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionProgress" ADD CONSTRAINT "SectionProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionProgress" ADD CONSTRAINT "SectionProgress_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ContentSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentSummary" ADD CONSTRAINT "ContentSummary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentSummary" ADD CONSTRAINT "ContentSummary_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PodcastEpisodeProgress" ADD CONSTRAINT "PodcastEpisodeProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PodcastEpisodeProgress" ADD CONSTRAINT "PodcastEpisodeProgress_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "PodcastEpisode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningActivityDay" ADD CONSTRAINT "LearningActivityDay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
