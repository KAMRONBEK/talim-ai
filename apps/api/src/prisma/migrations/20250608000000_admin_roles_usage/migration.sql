-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('INDIVIDUAL', 'TENANT_OWNER', 'TENANT_LEARNER', 'ADMIN');

-- CreateEnum
CREATE TYPE "UsageFeature" AS ENUM ('EMBED', 'TUTOR_CHAT', 'QUIZ_GEN', 'PODCAST_GEN', 'SECTION_GEN', 'SUMMARY_GEN', 'SLIDESHOW_GEN', 'TRANSCRIBE', 'PDF_PARSE', 'TENANT_ASSISTANT');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'INDIVIDUAL';

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateTable
CREATE TABLE "ApiUsageEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT,
    "feature" "UsageFeature" NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "estimatedCostUsd" DECIMAL(12,6) NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiUsageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApiUsageEvent_userId_createdAt_idx" ON "ApiUsageEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ApiUsageEvent_tenantId_createdAt_idx" ON "ApiUsageEvent"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "ApiUsageEvent_feature_createdAt_idx" ON "ApiUsageEvent"("feature", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_adminUserId_createdAt_idx" ON "AdminAuditLog"("adminUserId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_targetType_targetId_idx" ON "AdminAuditLog"("targetType", "targetId");

-- AddForeignKey
ALTER TABLE "ApiUsageEvent" ADD CONSTRAINT "ApiUsageEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
