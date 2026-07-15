import type {
  PlanKind,
  Prisma,
  SubscriptionSource,
  SubscriptionStatus,
  UserRole,
} from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { AppError, QuotaExceededError } from '../../middleware/error.middleware.js';

export { QuotaExceededError };

export const FREE_PLAN_CODE = 'FREE';

// "Generations" = the general AI generation bucket. Podcasts and videos have
// their own per-day allowances, so they are NOT counted here.
export const GENERATION_FEATURES = [
  'QUIZ_GEN',
  'SECTION_GEN',
  'SUMMARY_GEN',
  'SLIDESHOW_GEN',
] as const;

export interface PlanLimits {
  maxUploadsPerDay?: number | null;
  maxGenerationsPerDay?: number | null;
  maxPodcastsPerDay?: number | null;
  maxVideosPerDay?: number | null;
  maxTutorMessagesPerDay?: number | null;
  maxPagesPerFile?: number | null;
  maxFileSizeMb?: number | null;
  maxStudents?: number | null;
  maxContentItems?: number | null;
  priceMonthlyUsd?: number | null;
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

export function parseLimits(raw: Prisma.JsonValue): PlanLimits {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  return raw as PlanLimits;
}

/** Today's window: local midnight → now. Per-day quotas reset at this boundary. */
export function dayRange(): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return { from, to };
}

function resolveEffectivePlanCode(planCode: string, status: SubscriptionStatus): string {
  if (status === 'CANCELED') return FREE_PLAN_CODE;
  return planCode;
}

export async function getFreePlan() {
  const plan = await prisma.plan.findUnique({ where: { code: FREE_PLAN_CODE } });
  if (!plan) throw new AppError(500, 'FREE plan not configured');
  return plan;
}

export function formatSubscription(
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

export function assertIndividualPlan(role: UserRole, planKind: PlanKind, planCode: string): void {
  if (planKind === 'TENANT') {
    throw new AppError(400, `Plan ${planCode} is for tenants only`);
  }
  if (role === 'TENANT_OWNER') {
    throw new AppError(400, 'Tenant owners use tenant billing (Epic 3)');
  }
}
