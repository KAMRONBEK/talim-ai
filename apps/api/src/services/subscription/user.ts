import type { Prisma, SubscriptionStatus, UserRole } from '@prisma/client';
import type { PlanCode, QuotaFeature } from '@talim/types';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import { getUsageForPeriod } from '../usage.service.js';
import {
  FREE_PLAN_CODE,
  GENERATION_FEATURES,
  QuotaExceededError,
  type SubscriptionView,
  assertIndividualPlan,
  formatSubscription,
  getFreePlan,
  monthToDateRange,
  parseLimits,
} from './shared.js';
import { assertTenantQuota } from './tenant.js';

export async function getSubscriptionForUser(userId: string): Promise<SubscriptionView> {
  let sub = await prisma.subscription.findUnique({
    where: { userId },
    include: { plan: true },
  });

  if (!sub) {
    const freePlan = await getFreePlan();
    sub = await prisma.subscription.create({
      data: {
        userId,
        planId: freePlan.id,
        status: 'ACTIVE',
        source: 'ADMIN',
      },
      include: { plan: true },
    });
  }

  if (sub.status === 'CANCELED') {
    const freePlan = await getFreePlan();
    return formatSubscription(sub, parseLimits(freePlan.limits));
  }

  return formatSubscription(sub);
}

export async function adminUpdateUserSubscription(
  userId: string,
  input: {
    planCode?: string;
    status?: SubscriptionStatus;
    currentPeriodEnd?: string | null;
  },
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, 'User not found');

  const existing = await prisma.subscription.findUnique({
    where: { userId },
    include: { plan: true },
  });
  if (!existing) throw new AppError(404, 'Subscription not found');

  const data: Prisma.SubscriptionUpdateInput = {
    source: 'ADMIN',
    externalSubscriptionId: null,
  };

  if (input.planCode) {
    const plan = await prisma.plan.findUnique({ where: { code: input.planCode } });
    if (!plan) throw new AppError(400, `Unknown plan: ${input.planCode}`);
    assertIndividualPlan(user.role, plan.kind, plan.code);
    data.plan = { connect: { id: plan.id } };
  }

  if (input.status) {
    data.status = input.status;
    if (input.status === 'CANCELED') {
      const freePlan = await getFreePlan();
      data.plan = { connect: { id: freePlan.id } };
    }
  }

  if (input.currentPeriodEnd !== undefined) {
    data.currentPeriodEnd = input.currentPeriodEnd ? new Date(input.currentPeriodEnd) : null;
  }

  const updated = await prisma.subscription.update({
    where: { userId },
    data,
    include: { plan: true },
  });

  return formatSubscription(updated);
}

async function getUploadCount(userId: string): Promise<number> {
  return prisma.content.count({ where: { userId } });
}

async function getGenerationCount(userId: string, from: Date, to: Date): Promise<number> {
  const usage = await getUsageForPeriod({ userId, from, to });
  return GENERATION_FEATURES.reduce(
    (sum, feature) => sum + (usage.byFeature[feature]?.count ?? 0),
    0,
  );
}

async function getTutorMessageCount(userId: string, from: Date, to: Date): Promise<number> {
  return prisma.apiUsageEvent.count({
    where: {
      userId,
      feature: 'TUTOR_CHAT',
      createdAt: { gte: from, lte: to },
    },
  });
}

function resolveUpgradePlanCode(effectivePlanCode: string): PlanCode | null {
  return effectivePlanCode === FREE_PLAN_CODE ? 'INDIVIDUAL_PRO' : null;
}

export async function assertQuota(
  userId: string,
  feature: QuotaFeature,
  options?: { role?: UserRole; tenantId?: string },
): Promise<void> {
  if (options?.role === 'ADMIN') return;

  if (options?.role === 'TENANT_LEARNER') {
    if (feature === 'UPLOAD' || feature === 'GENERATION') {
      throw new AppError(403, 'Learners cannot upload or generate content');
    }
  }

  if (options?.role === 'TENANT_OWNER' && options.tenantId) {
    await assertTenantQuota(options.tenantId, feature);
    return;
  }

  const subscription = await getSubscriptionForUser(userId);
  const limits = subscription.limits;
  const upgradePlanCode = resolveUpgradePlanCode(subscription.effectivePlanCode);
  const { from, to } = monthToDateRange();

  if (feature === 'UPLOAD') {
    const limit = limits.maxUploads;
    if (limit == null) return;
    const used = await getUploadCount(userId);
    if (used >= limit) {
      throw new QuotaExceededError('UPLOAD', used, limit, upgradePlanCode);
    }
    return;
  }

  if (feature === 'GENERATION') {
    const limit = limits.maxGenerationsPerMonth;
    if (limit == null) return;
    const used = await getGenerationCount(userId, from, to);
    if (used >= limit) {
      throw new QuotaExceededError('GENERATION', used, limit, upgradePlanCode);
    }
    return;
  }

  const limit = limits.maxTutorMessages;
  if (limit == null) return;
  const used = await getTutorMessageCount(userId, from, to);
  if (used >= limit) {
    throw new QuotaExceededError('TUTOR_MESSAGE', used, limit, upgradePlanCode);
  }
}

export async function getUsageVsLimits(userId: string) {
  const subscription = await getSubscriptionForUser(userId);
  const { from, to } = monthToDateRange();

  const [uploadCount, generationCount, tutorCount, usage] = await Promise.all([
    getUploadCount(userId),
    getGenerationCount(userId, from, to),
    getTutorMessageCount(userId, from, to),
    getUsageForPeriod({ userId, from, to }),
  ]);

  const limits = subscription.limits;

  return {
    periodStart: from.toISOString(),
    periodEnd: to.toISOString(),
    uploads: {
      used: uploadCount,
      limit: limits.maxUploads ?? null,
    },
    generations: {
      used: generationCount,
      limit: limits.maxGenerationsPerMonth ?? null,
    },
    tutorMessages: {
      used: tutorCount,
      limit: limits.maxTutorMessages ?? null,
    },
    apiCostUsd: usage.totalCostUsd,
  };
}
