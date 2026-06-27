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
  dayRange,
  formatSubscription,
  getFreePlan,
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
    // Keep the paid plan on cancel (matches the tenant path). CANCELED already gets
    // free-plan limits at read time (getSubscriptionForUser), so rewriting planId→FREE
    // here only loses the original plan, making a later re-ACTIVATE return FREE.
    data.status = input.status;
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

async function getUploadCount(userId: string, from: Date, to: Date): Promise<number> {
  return prisma.content.count({ where: { userId, createdAt: { gte: from, lte: to } } });
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
    where: { userId, feature: 'TUTOR_CHAT', createdAt: { gte: from, lte: to } },
  });
}

async function getVideoCount(userId: string, from: Date, to: Date): Promise<number> {
  return prisma.contentVideo.count({
    where: { content: { userId }, createdAt: { gte: from, lte: to } },
  });
}

async function getPodcastCount(userId: string, from: Date, to: Date): Promise<number> {
  return prisma.podcast.count({
    where: { content: { userId }, createdAt: { gte: from, lte: to } },
  });
}

function resolveUpgradePlanCode(effectivePlanCode: string): PlanCode | null {
  return effectivePlanCode === FREE_PLAN_CODE ? 'INDIVIDUAL_PRO' : null;
}

/** Per-file page/size caps for a user's current plan (for upload gating). */
export async function getFileLimitsForUser(userId: string) {
  const subscription = await getSubscriptionForUser(userId);
  return {
    maxPagesPerFile: subscription.limits.maxPagesPerFile ?? null,
    maxFileSizeMb: subscription.limits.maxFileSizeMb ?? null,
    upgradePlanCode: resolveUpgradePlanCode(subscription.effectivePlanCode),
  };
}

export async function assertQuota(
  userId: string,
  feature: QuotaFeature,
  options?: { role?: UserRole; tenantId?: string },
): Promise<void> {
  if (options?.role === 'ADMIN') return;

  if (options?.role === 'TENANT_LEARNER') {
    if (feature === 'UPLOAD' || feature === 'GENERATION' || feature === 'VIDEO' || feature === 'PODCAST') {
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
  const { from, to } = dayRange();

  if (feature === 'UPLOAD') {
    const limit = limits.maxUploadsPerDay;
    if (limit == null) return;
    const used = await getUploadCount(userId, from, to);
    if (used >= limit) throw new QuotaExceededError('UPLOAD', used, limit, upgradePlanCode);
    return;
  }

  if (feature === 'GENERATION') {
    const limit = limits.maxGenerationsPerDay;
    if (limit == null) return;
    const used = await getGenerationCount(userId, from, to);
    if (used >= limit) throw new QuotaExceededError('GENERATION', used, limit, upgradePlanCode);
    return;
  }

  if (feature === 'VIDEO') {
    const limit = limits.maxVideosPerDay;
    if (limit == null) return;
    const used = await getVideoCount(userId, from, to);
    if (used >= limit) throw new QuotaExceededError('VIDEO', used, limit, upgradePlanCode);
    return;
  }

  if (feature === 'PODCAST') {
    const limit = limits.maxPodcastsPerDay;
    if (limit == null) return;
    const used = await getPodcastCount(userId, from, to);
    if (used >= limit) throw new QuotaExceededError('PODCAST', used, limit, upgradePlanCode);
    return;
  }

  const limit = limits.maxTutorMessagesPerDay;
  if (limit == null) return;
  const used = await getTutorMessageCount(userId, from, to);
  if (used >= limit) {
    throw new QuotaExceededError('TUTOR_MESSAGE', used, limit, upgradePlanCode);
  }
}

export async function getUsageVsLimits(userId: string) {
  const subscription = await getSubscriptionForUser(userId);
  const { from, to } = dayRange();

  const [uploadCount, generationCount, tutorCount, videoCount, podcastCount, usage] =
    await Promise.all([
      getUploadCount(userId, from, to),
      getGenerationCount(userId, from, to),
      getTutorMessageCount(userId, from, to),
      getVideoCount(userId, from, to),
      getPodcastCount(userId, from, to),
      getUsageForPeriod({ userId, from, to }),
    ]);

  const limits = subscription.limits;

  return {
    periodStart: from.toISOString(),
    periodEnd: to.toISOString(),
    uploads: { used: uploadCount, limit: limits.maxUploadsPerDay ?? null },
    generations: { used: generationCount, limit: limits.maxGenerationsPerDay ?? null },
    tutorMessages: { used: tutorCount, limit: limits.maxTutorMessagesPerDay ?? null },
    videos: { used: videoCount, limit: limits.maxVideosPerDay ?? null },
    podcasts: { used: podcastCount, limit: limits.maxPodcastsPerDay ?? null },
    apiCostUsd: usage.totalCostUsd,
  };
}
