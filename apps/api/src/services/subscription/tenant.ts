import type { Prisma, SubscriptionStatus } from '@prisma/client';
import type { PlanCode, QuotaFeature } from '@talim/types';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import { getUsageForPeriod } from '../usage.service.js';
import {
  GENERATION_FEATURES,
  QuotaExceededError,
  type SubscriptionView,
  formatSubscription,
  monthToDateRange,
} from './shared.js';

function resolveTenantUpgradePlanCode(effectivePlanCode: string): PlanCode | null {
  if (effectivePlanCode === 'TENANT_STARTER') return 'TENANT_GROWTH';
  return null;
}

export async function getSubscriptionForTenant(tenantId: string): Promise<SubscriptionView | null> {
  const sub = await prisma.subscription.findUnique({
    where: { tenantId },
    include: { plan: true },
  });
  if (!sub) return null;
  return formatSubscription(sub);
}

export async function requireActiveTenantSubscription(tenantId: string): Promise<SubscriptionView> {
  const sub = await getSubscriptionForTenant(tenantId);
  if (!sub || sub.status !== 'ACTIVE') {
    throw new AppError(402, 'Tenant subscription required. Contact admin to activate your organization.');
  }
  if (sub.planKind !== 'TENANT') {
    throw new AppError(402, 'Tenant subscription required. Contact admin to activate your organization.');
  }
  return sub;
}

async function getTenantContentCount(tenantId: string): Promise<number> {
  return prisma.content.count({ where: { tenantId } });
}

async function getActiveStudentCount(tenantId: string): Promise<number> {
  return prisma.tenantMembership.count({
    where: { tenantId, role: 'LEARNER', active: true },
  });
}

async function getTenantGenerationCount(tenantId: string, from: Date, to: Date): Promise<number> {
  const usage = await getUsageForPeriod({ tenantId, from, to });
  return GENERATION_FEATURES.reduce(
    (sum, feature) => sum + (usage.byFeature[feature]?.count ?? 0),
    0,
  );
}

export async function assertTenantQuota(
  tenantId: string,
  feature: QuotaFeature | 'STUDENT',
): Promise<void> {
  const subscription = await requireActiveTenantSubscription(tenantId);
  const limits = subscription.limits;
  const upgradePlanCode = resolveTenantUpgradePlanCode(subscription.effectivePlanCode);
  const { from, to } = monthToDateRange();

  if (feature === 'STUDENT') {
    // A per-tenant seatLimit set by an admin overrides the plan's maxStudents.
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { seatLimit: true },
    });
    const limit = tenant?.seatLimit ?? limits.maxStudents;
    if (limit == null) return;
    const used = await getActiveStudentCount(tenantId);
    if (used >= limit) {
      throw new QuotaExceededError('STUDENT', used, limit, upgradePlanCode);
    }
    return;
  }

  if (feature === 'UPLOAD') {
    const limit = limits.maxContentItems;
    if (limit == null) return;
    const used = await getTenantContentCount(tenantId);
    if (used >= limit) {
      throw new QuotaExceededError('UPLOAD', used, limit, upgradePlanCode);
    }
    return;
  }

  if (feature === 'GENERATION') {
    const limit = limits.maxGenerationsPerMonth;
    if (limit == null) return;
    const used = await getTenantGenerationCount(tenantId, from, to);
    if (used >= limit) {
      throw new QuotaExceededError('GENERATION', used, limit, upgradePlanCode);
    }
    return;
  }

  const limit = limits.maxTutorMessages;
  if (limit == null) return;
  const used = await prisma.apiUsageEvent.count({
    where: {
      tenantId,
      feature: 'TUTOR_CHAT',
      createdAt: { gte: from, lte: to },
    },
  });
  if (used >= limit) {
    throw new QuotaExceededError('TUTOR_MESSAGE', used, limit, upgradePlanCode);
  }
}

export async function getTenantUsageVsLimits(tenantId: string) {
  const sub = await getSubscriptionForTenant(tenantId);
  const limits = sub?.limits ?? {};
  const { from, to } = monthToDateRange();

  const [contentCount, studentCount, generationCount, usage, tenant] = await Promise.all([
    getTenantContentCount(tenantId),
    getActiveStudentCount(tenantId),
    getTenantGenerationCount(tenantId, from, to),
    getUsageForPeriod({ tenantId, from, to }),
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { seatLimit: true } }),
  ]);
  const seatLimit = tenant?.seatLimit ?? limits.maxStudents ?? null;

  return {
    subscription: sub,
    periodStart: from.toISOString(),
    periodEnd: to.toISOString(),
    uploads: { used: contentCount, limit: limits.maxContentItems ?? null },
    generations: { used: generationCount, limit: limits.maxGenerationsPerMonth ?? null },
    tutorMessages: {
      used: usage.byFeature.TUTOR_CHAT?.count ?? 0,
      limit: limits.maxTutorMessages ?? null,
    },
    students: { used: studentCount, limit: seatLimit },
    contentItems: { used: contentCount, limit: limits.maxContentItems ?? null },
    apiCostUsd: usage.totalCostUsd,
  };
}

export async function adminUpdateTenantSubscription(
  tenantId: string,
  input: {
    planCode?: string;
    status?: SubscriptionStatus;
    currentPeriodEnd?: string | null;
  },
) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new AppError(404, 'Tenant not found');

  let existing = await prisma.subscription.findUnique({
    where: { tenantId },
    include: { plan: true },
  });

  if (!existing && input.planCode) {
    const plan = await prisma.plan.findUnique({ where: { code: input.planCode } });
    if (!plan) throw new AppError(400, `Unknown plan: ${input.planCode}`);
    if (plan.kind !== 'TENANT') {
      throw new AppError(400, `Plan ${input.planCode} is not a tenant plan`);
    }
    existing = await prisma.subscription.create({
      data: {
        tenantId,
        planId: plan.id,
        status: input.status ?? 'ACTIVE',
        source: 'ADMIN',
        currentPeriodEnd: input.currentPeriodEnd ? new Date(input.currentPeriodEnd) : null,
      },
      include: { plan: true },
    });
    return formatSubscription(existing);
  }

  if (!existing) throw new AppError(404, 'Tenant subscription not found');

  const data: Prisma.SubscriptionUpdateInput = {
    source: 'ADMIN',
    externalSubscriptionId: null,
  };

  if (input.planCode) {
    const plan = await prisma.plan.findUnique({ where: { code: input.planCode } });
    if (!plan) throw new AppError(400, `Unknown plan: ${input.planCode}`);
    if (plan.kind !== 'TENANT') {
      throw new AppError(400, `Plan ${input.planCode} is not a tenant plan`);
    }
    data.plan = { connect: { id: plan.id } };
  }

  if (input.status) {
    data.status = input.status;
  }

  if (input.currentPeriodEnd !== undefined) {
    data.currentPeriodEnd = input.currentPeriodEnd ? new Date(input.currentPeriodEnd) : null;
  }

  const updated = await prisma.subscription.update({
    where: { tenantId },
    data,
    include: { plan: true },
  });

  return formatSubscription(updated);
}
