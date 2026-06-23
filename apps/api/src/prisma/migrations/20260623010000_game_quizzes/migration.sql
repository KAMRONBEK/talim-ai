-- CreateEnum
CREATE TYPE "AssessmentMode" AS ENUM ('WRITTEN', 'GAME');

-- AlterTable: assessment game-mode config
ALTER TABLE "TenantAssessment" ADD COLUMN     "mode" "AssessmentMode" NOT NULL DEFAULT 'WRITTEN',
ADD COLUMN     "secondsPerQuestion" INTEGER;

-- AlterTable: attempt scoring fields
ALTER TABLE "AssessmentAttempt" ADD COLUMN     "pointsTotal" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "maxStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "durationMs" INTEGER;

-- CreateTable
CREATE TABLE "AttemptAnswer" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "responseMs" INTEGER,
    "pointsAwarded" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AttemptAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssessmentAttempt_assessmentId_pointsTotal_idx" ON "AssessmentAttempt"("assessmentId", "pointsTotal");

-- CreateIndex
CREATE INDEX "AttemptAnswer_attemptId_idx" ON "AttemptAnswer"("attemptId");

-- AddForeignKey
ALTER TABLE "AttemptAnswer" ADD CONSTRAINT "AttemptAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "AssessmentAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
