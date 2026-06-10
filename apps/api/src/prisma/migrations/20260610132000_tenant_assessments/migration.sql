-- Add question-drafting usage tracking.
ALTER TYPE "UsageFeature" ADD VALUE IF NOT EXISTS 'QUESTION_DRAFT';

CREATE TYPE "QuestionType" AS ENUM ('SHORT_ANSWER', 'NUMERIC', 'MULTIPLE_CHOICE');
CREATE TYPE "BankQuestionStatus" AS ENUM ('DRAFT', 'APPROVED', 'REJECTED');
CREATE TYPE "TenantAssessmentStatus" AS ENUM ('DRAFT', 'PUBLISHED');
CREATE TYPE "AssessmentAttemptStatus" AS ENUM ('SUBMITTED', 'GRADED');

CREATE TABLE "QuestionBank" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "topic" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "QuestionBank_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BankQuestion" (
  "id" TEXT NOT NULL,
  "bankId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "sourceContentId" TEXT,
  "sourceSectionId" TEXT,
  "type" "QuestionType" NOT NULL DEFAULT 'SHORT_ANSWER',
  "prompt" TEXT NOT NULL,
  "options" JSONB,
  "acceptableAnswers" JSONB NOT NULL,
  "explanation" TEXT,
  "status" "BankQuestionStatus" NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BankQuestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TenantAssessment" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "bankId" TEXT,
  "title" TEXT NOT NULL,
  "instructions" TEXT,
  "maxAttempts" INTEGER NOT NULL DEFAULT 1,
  "status" "TenantAssessmentStatus" NOT NULL DEFAULT 'DRAFT',
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TenantAssessment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssessmentQuestion" (
  "id" TEXT NOT NULL,
  "assessmentId" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  "points" DOUBLE PRECISION NOT NULL DEFAULT 1,
  CONSTRAINT "AssessmentQuestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssessmentAssignment" (
  "id" TEXT NOT NULL,
  "assessmentId" TEXT NOT NULL,
  "learnerId" TEXT,
  "contentId" TEXT,
  "sectionId" TEXT,
  "assignedById" TEXT NOT NULL,
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssessmentAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssessmentAttempt" (
  "id" TEXT NOT NULL,
  "assessmentId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "answers" JSONB NOT NULL,
  "score" DOUBLE PRECISION,
  "status" "AssessmentAttemptStatus" NOT NULL DEFAULT 'SUBMITTED',
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssessmentAttempt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "QuestionBank_tenantId_idx" ON "QuestionBank"("tenantId");
CREATE INDEX "QuestionBank_createdById_idx" ON "QuestionBank"("createdById");
CREATE INDEX "BankQuestion_bankId_idx" ON "BankQuestion"("bankId");
CREATE INDEX "BankQuestion_createdById_idx" ON "BankQuestion"("createdById");
CREATE INDEX "BankQuestion_sourceContentId_idx" ON "BankQuestion"("sourceContentId");
CREATE INDEX "BankQuestion_sourceSectionId_idx" ON "BankQuestion"("sourceSectionId");
CREATE INDEX "BankQuestion_status_idx" ON "BankQuestion"("status");
CREATE INDEX "TenantAssessment_tenantId_idx" ON "TenantAssessment"("tenantId");
CREATE INDEX "TenantAssessment_bankId_idx" ON "TenantAssessment"("bankId");
CREATE INDEX "TenantAssessment_createdById_idx" ON "TenantAssessment"("createdById");
CREATE INDEX "TenantAssessment_status_idx" ON "TenantAssessment"("status");
CREATE UNIQUE INDEX "AssessmentQuestion_assessmentId_questionId_key" ON "AssessmentQuestion"("assessmentId", "questionId");
CREATE INDEX "AssessmentQuestion_assessmentId_idx" ON "AssessmentQuestion"("assessmentId");
CREATE INDEX "AssessmentQuestion_questionId_idx" ON "AssessmentQuestion"("questionId");
CREATE INDEX "AssessmentAssignment_assessmentId_idx" ON "AssessmentAssignment"("assessmentId");
CREATE INDEX "AssessmentAssignment_learnerId_idx" ON "AssessmentAssignment"("learnerId");
CREATE INDEX "AssessmentAssignment_contentId_idx" ON "AssessmentAssignment"("contentId");
CREATE INDEX "AssessmentAssignment_sectionId_idx" ON "AssessmentAssignment"("sectionId");
CREATE INDEX "AssessmentAssignment_assignedById_idx" ON "AssessmentAssignment"("assignedById");
CREATE INDEX "AssessmentAttempt_assessmentId_idx" ON "AssessmentAttempt"("assessmentId");
CREATE INDEX "AssessmentAttempt_userId_idx" ON "AssessmentAttempt"("userId");

ALTER TABLE "QuestionBank" ADD CONSTRAINT "QuestionBank_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuestionBank" ADD CONSTRAINT "QuestionBank_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BankQuestion" ADD CONSTRAINT "BankQuestion_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "QuestionBank"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BankQuestion" ADD CONSTRAINT "BankQuestion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BankQuestion" ADD CONSTRAINT "BankQuestion_sourceContentId_fkey" FOREIGN KEY ("sourceContentId") REFERENCES "Content"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BankQuestion" ADD CONSTRAINT "BankQuestion_sourceSectionId_fkey" FOREIGN KEY ("sourceSectionId") REFERENCES "ContentSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TenantAssessment" ADD CONSTRAINT "TenantAssessment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TenantAssessment" ADD CONSTRAINT "TenantAssessment_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "QuestionBank"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TenantAssessment" ADD CONSTRAINT "TenantAssessment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentQuestion" ADD CONSTRAINT "AssessmentQuestion_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "TenantAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentQuestion" ADD CONSTRAINT "AssessmentQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "BankQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentAssignment" ADD CONSTRAINT "AssessmentAssignment_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "TenantAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentAssignment" ADD CONSTRAINT "AssessmentAssignment_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentAssignment" ADD CONSTRAINT "AssessmentAssignment_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentAssignment" ADD CONSTRAINT "AssessmentAssignment_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ContentSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AssessmentAssignment" ADD CONSTRAINT "AssessmentAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "TenantAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
