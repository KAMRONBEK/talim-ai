import type {
  PlanKind,
  Prisma,
  SubscriptionSource,
  SubscriptionStatus,
  UserRole,
} from '@prisma/client';
import type { PlanCode, QuotaFeature } from '@talim/types';
import { prisma } from '../lib/prisma.js';
import { AppError, QuotaExceededError } from '../middleware/error.middleware.js';
import { getUsageForPeriod } from './usage.service.js';

export type { QuotaFeature };
export { QuotaExceededError };

const FREE_PLAN_CODE = 'FREE';

const GENERATION_FEATURES = [
  'QUIZ_GEN',
  'PODCAST_GEN',
  'SECTION_GEN',
  'SUMMARY_GEN',
  'SLIDESHOW_GEN',
] as const;

export interface PlanLimits {
  maxUploads?: number | null;
  maxGenerationsPerMonth?: number | null;
  maxTutorMessages?: number | null;
  maxStudents?: number | null;
  maxContentItems?: number | null;
}

export interface SubscriptionView {
  id: string;
  planCode: string;
  planName: string;
  planKind: PlanKind;
  status: SubscriptionStatus;
  source: SubscriptionSource;
  externalSubscriptionId: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  limits: PlanLimits;
  effectivePlanCode: string;
}

function parseLimits(raw: Prisma.JsonValue): PlanLimits {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  return raw as PlanLimits;
}

function monthToDateRange(): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date(to.getFullYear(), to.getMonth(), 1);
  return { from, to };
}

function resolveEffectivePlanCode(
  planCode: string,
  status: SubscriptionStatus,
): string {
  if (status === 'CANCELED') return FREE_PLAN_CODE;
  return planCode;
}

async function getFreePlan() {
  const plan = await prisma.plan.findUnique({ where: { code: FREE_PLAN_CODE } });
  if (!plan) throw new AppError(500, 'FREE plan not configured');
  return plan;
}

function formatSubscription(
  sub: {
    id: string;
    status: SubscriptionStatus;
    source: SubscriptionSource;
    externalSubscriptionId: string | null;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
    plan: { code: string; name: string; kind: PlanKind; limits: Prisma.JsonValue };
  },
  effectiveLimits?: PlanLimits,
): SubscriptionView {
  const effectivePlanCode = resolveEffectivePlanCode(sub.plan.code, sub.status);
  const limits = effectiveLimits ?? parseLimits(sub.plan.limits);

  return {
    id: sub.id,
    planCode: sub.plan.code,
    planName: sub.plan.name,
    planKind: sub.plan.kind,
    status: sub.status,
    source: sub.source,
    externalSubscriptionId: sub.externalSubscriptionId,
    currentPeriodStart: sub.currentPeriodStart?.toISOString() ?? null,
    currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
    limits,
    effectivePlanCode,
  };
}

function assertIndividualPlan(role: UserRole, planKind: PlanKind, planCode: string): void {
  if (planKind === 'TENANT') {
    throw new AppError(400, `Plan ${planCode} is for tenants only`);
  }
  if (role === 'TENANT_OWNER') {
    throw new AppError(400, 'Tenant owners use tenant billing (Epic 3)');
  }
}

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

export async function listSubscriptionsForAdmin(params: {
  page: number;
  pageSize: number;
  search?: string;
  status?: SubscriptionStatus;
  plan?: string;
}) {
  const where: Prisma.SubscriptionWhereInput = {
    userId: { not: null },
  };

  if (params.status) where.status = params.status;
  if (params.plan) {
    where.plan = { code: params.plan };
  }
  if (params.search?.trim()) {
    const q = params.search.trim();
    where.user = {
      OR: [
        { email: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
      ],
    };
  }

  const skip = (params.page - 1) * params.pageSize;
  const [total, items] = await Promise.all([
    prisma.subscription.count({ where }),
    prisma.subscription.findMany({
      where,
      skip,
      take: params.pageSize,
      orderBy: { updatedAt: 'desc' },
      include: {
        plan: true,
        user: { select: { id: true, email: true, name: true } },
      },
    }),
  ]);

  return {
    items: items.map((sub) => ({
      ...formatSubscription(sub),
      userId: sub.user!.id,
      userEmail: sub.user!.email,
      userName: sub.user!.name,
    })),
    total,
    page: params.page,
    pageSize: params.pageSize,
  };
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
  void options?.tenantId;

  if (options?.role === 'ADMIN') return;

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
