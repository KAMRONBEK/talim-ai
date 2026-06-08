-- CreateEnum
CREATE TYPE "PlanKind" AS ENUM ('INDIVIDUAL', 'TENANT');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'TRIALING');

-- CreateEnum
CREATE TYPE "SubscriptionSource" AS ENUM ('ADMIN', 'PAYMENT_PROVIDER');

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "PlanKind" NOT NULL,
    "limits" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "tenantId" TEXT,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "source" "SubscriptionSource" NOT NULL DEFAULT 'ADMIN',
    "externalSubscriptionId" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Plan_code_key" ON "Plan"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_tenantId_key" ON "Subscription"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_externalSubscriptionId_key" ON "Subscription"("externalSubscriptionId");

-- CreateIndex
CREATE INDEX "Subscription_planId_idx" ON "Subscription"("planId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed plans
INSERT INTO "Plan" ("id", "code", "name", "kind", "limits", "updatedAt") VALUES
  ('plan_free', 'FREE', 'Free', 'INDIVIDUAL', '{"maxUploads":3,"maxGenerationsPerMonth":20,"maxTutorMessages":50}', CURRENT_TIMESTAMP),
  ('plan_individual_pro', 'INDIVIDUAL_PRO', 'Individual Pro', 'INDIVIDUAL', '{"maxUploads":null,"maxGenerationsPerMonth":500,"maxTutorMessages":null}', CURRENT_TIMESTAMP),
  ('plan_tenant_starter', 'TENANT_STARTER', 'Tenant Starter', 'TENANT', '{"maxStudents":25,"maxContentItems":100,"maxGenerationsPerMonth":500}', CURRENT_TIMESTAMP),
  ('plan_tenant_growth', 'TENANT_GROWTH', 'Tenant Growth', 'TENANT', '{"maxStudents":100,"maxContentItems":500,"maxGenerationsPerMonth":2000}', CURRENT_TIMESTAMP);

-- Backfill FREE subscriptions for existing users
INSERT INTO "Subscription" ("id", "userId", "planId", "status", "source", "updatedAt")
SELECT
  'sub_' || "User"."id",
  "User"."id",
  'plan_free',
  'ACTIVE',
  'ADMIN',
  CURRENT_TIMESTAMP
FROM "User";
