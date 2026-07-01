import type { ContentType, UserRole } from '@prisma/client';
import type {
  AdminAnalyticsSummary,
  AdminContentByTypeResponse,
  AdminFunnelResponse,
  AdminMrrResponse,
  AdminSpendByModelResponse,
  AdminTopOrgsResponse,
  AdminUserGrowthResponse,
  AdminUsersByRoleResponse,
} from '@talim/types';
import { prisma } from '../../lib/prisma.js';
import {
  estimateTokenCostUsd,
  planMonthlyPriceUsd,
} from '../../config/usage-pricing.js';

const ALL_ROLES: UserRole[] = ['INDIVIDUAL', 'TENANT_OWNER', 'TENANT_LEARNER', 'ADMIN'];
const ALL_CONTENT_TYPES: ContentType[] = ['PDF', 'YOUTUBE', 'SLIDE'];
const FREE_PLAN_CODE = 'FREE';

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

/**
 * MRR = sum of effective plan price over ACTIVE subscriptions. We groupBy planId
 * (one query) so there is no per-subscription N+1, then multiply each plan's
 * price (from the usage-pricing table / plan limits) by its active-sub count.
 */
export async function computeMrr(): Promise<AdminMrrResponse> {
  const [plans, grouped] = await Promise.all([
    prisma.plan.findMany({ select: { id: true, code: true, name: true, kind: true, limits: true } }),
    prisma.subscription.groupBy({
      by: ['planId'],
      where: { status: 'ACTIVE' },
      _count: { _all: true },
    }),
  ]);

  const countByPlan = new Map(grouped.map((g) => [g.planId, g._count._all]));

  const byPlan = plans
    .map((plan) => {
      const activeSubscriptions = countByPlan.get(plan.id) ?? 0;
      const limits = (plan.limits ?? null) as { priceMonthlyUsd?: number | null } | null;
      const priceMonthlyUsd = planMonthlyPriceUsd(plan.code, limits);
      return {
        planCode: plan.code,
        planName: plan.name,
        planKind: plan.kind,
        activeSubscriptions,
        priceMonthlyUsd,
        mrrUsd: Number((priceMonthlyUsd * activeSubscriptions).toFixed(2)),
      };
    })
    .sort((a, b) => b.mrrUsd - a.mrrUsd);

  const mrrUsd = Number(byPlan.reduce((sum, p) => sum + p.mrrUsd, 0).toFixed(2));
  const activeSubscriptions = byPlan.reduce((sum, p) => sum + p.activeSubscriptions, 0);

  return { mrrUsd, activeSubscriptions, byPlan };
}

export async function getAnalyticsSummary(): Promise<AdminAnalyticsSummary> {
  const since30 = daysAgo(30);

  const [users, activeDays, orgs, content, quizAttempts, assessmentAttempts, mrr] =
    await Promise.all([
      prisma.user.count(),
      prisma.learningActivityDay.findMany({
        where: { date: { gte: since30 } },
        distinct: ['userId'],
        select: { userId: true },
      }),
      prisma.tenant.count(),
      prisma.content.count(),
      prisma.quizAttempt.count(),
      prisma.assessmentAttempt.count(),
      computeMrr(),
    ]);

  return {
    users,
    active30d: activeDays.length,
    orgs,
    content,
    quizzesTaken: quizAttempts + assessmentAttempts,
    mrrUsd: mrr.mrrUsd,
  };
}

/** Last 12 months of user signups: new users per month + running cumulative total. */
export async function getUserGrowth(): Promise<AdminUserGrowthResponse> {
  const now = new Date();
  // First day (UTC) of the month 11 months back → 12 buckets inclusive of this month.
  const windowStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));

  const [baseline, rows] = await Promise.all([
    prisma.user.count({ where: { createdAt: { lt: windowStart } } }),
    prisma.$queryRaw<{ month: string; count: number }[]>`
      SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') AS month,
             count(*)::int AS count
      FROM "User"
      WHERE "createdAt" >= ${windowStart}
      GROUP BY 1
      ORDER BY 1
    `,
  ]);

  const newByMonth = new Map(rows.map((r) => [r.month, Number(r.count)]));

  const points: AdminUserGrowthResponse['points'] = [];
  let cumulative = baseline;
  for (let i = 0; i < 12; i += 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11 + i, 1));
    const month = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    const newUsers = newByMonth.get(month) ?? 0;
    cumulative += newUsers;
    points.push({ month, newUsers, totalUsers: cumulative });
  }

  return { points };
}

export async function getUsersByRole(): Promise<AdminUsersByRoleResponse> {
  const grouped = await prisma.user.groupBy({ by: ['role'], _count: { _all: true } });
  const countByRole = new Map(grouped.map((g) => [g.role, g._count._all]));
  return {
    roles: ALL_ROLES.map((role) => ({ role, count: countByRole.get(role) ?? 0 })),
  };
}

/** registered → activated (>=1 content) → tutor (TENANT_OWNER) → paid (active non-FREE sub). */
export async function getFunnel(): Promise<AdminFunnelResponse> {
  const [registered, activated, tutors, paid] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { contents: { some: {} } } }),
    prisma.user.count({ where: { role: 'TENANT_OWNER' } }),
    prisma.subscription.count({
      where: { status: 'ACTIVE', plan: { code: { not: FREE_PLAN_CODE } } },
    }),
  ]);
  return { registered, activated, tutors, paid };
}

export async function getContentByType(): Promise<AdminContentByTypeResponse> {
  const grouped = await prisma.content.groupBy({ by: ['type'], _count: { _all: true } });
  const countByType = new Map(grouped.map((g) => [g.type, g._count._all]));
  return {
    types: ALL_CONTENT_TYPES.map((type) => ({ type, count: countByType.get(type) ?? 0 })),
  };
}

/** Tenants ranked by API-usage spend, then content, then active students. Top 10. */
export async function getTopOrgs(limit = 10): Promise<AdminTopOrgsResponse> {
  const [usageByTenant, tenants] = await Promise.all([
    prisma.apiUsageEvent.groupBy({
      by: ['tenantId'],
      where: { tenantId: { not: null } },
      _sum: { estimatedCostUsd: true },
    }),
    prisma.tenant.findMany({
      include: {
        subscription: { select: { plan: { select: { code: true } } } },
        memberships: { where: { role: 'LEARNER', active: true }, select: { id: true } },
        _count: { select: { contents: true } },
      },
    }),
  ]);

  const costByTenant = new Map(
    usageByTenant.map((u) => [u.tenantId as string, Number(u._sum.estimatedCostUsd ?? 0)]),
  );

  const orgs = tenants
    .map((t) => ({
      tenantId: t.id,
      name: t.name,
      slug: t.slug,
      studentCount: t.memberships.length,
      contentCount: t._count.contents,
      usageCostUsd: Number((costByTenant.get(t.id) ?? 0).toFixed(4)),
      planCode: t.subscription?.plan.code ?? null,
    }))
    .sort(
      (a, b) =>
        b.usageCostUsd - a.usageCostUsd ||
        b.contentCount - a.contentCount ||
        b.studentCount - a.studentCount,
    )
    .slice(0, limit);

  return { orgs };
}

/**
 * Spend grouped by model. Uses the stored `estimatedCostUsd` when present;
 * otherwise DERIVES cost from tokens × the usage-pricing rate table (approximate).
 * `approximated` flags rows (and the response) where the derived path was used.
 */
export async function getSpendByModel(): Promise<AdminSpendByModelResponse> {
  const grouped = await prisma.apiUsageEvent.groupBy({
    by: ['model'],
    _sum: { estimatedCostUsd: true, inputTokens: true, outputTokens: true },
    _count: { _all: true },
  });

  let anyApproximated = false;
  const rows = grouped
    .map((g) => {
      const inputTokens = g._sum.inputTokens ?? 0;
      const outputTokens = g._sum.outputTokens ?? 0;
      const storedCost = Number(g._sum.estimatedCostUsd ?? 0);
      let costUsd = storedCost;
      let approximated = false;
      if (storedCost <= 0 && (inputTokens > 0 || outputTokens > 0)) {
        costUsd = estimateTokenCostUsd(g.model, inputTokens, outputTokens);
        approximated = true;
        anyApproximated = true;
      }
      return {
        model: g.model,
        eventCount: g._count._all,
        inputTokens,
        outputTokens,
        costUsd: Number(costUsd.toFixed(6)),
        approximated,
      };
    })
    .sort((a, b) => b.costUsd - a.costUsd);

  const totalCostUsd = Number(rows.reduce((sum, r) => sum + r.costUsd, 0).toFixed(6));

  return { rows, totalCostUsd, approximated: anyApproximated };
}

// Re-exported so the content-detail controller shares one raw-chunk query helper.
export type AdminChunkSample = {
  chunkIndex: number;
  text: string;
  hasEmbedding: boolean;
};

/**
 * Sample of a content's chunks for the admin content-detail inspector. Uses
 * $queryRaw so we can test `embedding IS NOT NULL` WITHOUT ever selecting the
 * pgvector column itself (Prisma can't type it; and we never want to ship it).
 */
export async function getChunkSample(
  contentId: string,
  take = 20,
  textLength = 300,
): Promise<{ chunks: AdminChunkSample[]; embeddedChunkCount: number }> {
  const [rows, embeddedRows] = await Promise.all([
    prisma.$queryRaw<{ chunkIndex: number; text: string; hasEmbedding: boolean }[]>`
      SELECT "chunkIndex",
             left("text", ${textLength}) AS text,
             ("embedding" IS NOT NULL) AS "hasEmbedding"
      FROM "Chunk"
      WHERE "contentId" = ${contentId}
      ORDER BY "chunkIndex" ASC
      LIMIT ${take}
    `,
    prisma.$queryRaw<{ count: number }[]>`
      SELECT count(*)::int AS count
      FROM "Chunk"
      WHERE "contentId" = ${contentId} AND "embedding" IS NOT NULL
    `,
  ]);

  return {
    chunks: rows.map((r) => ({
      chunkIndex: r.chunkIndex,
      text: r.text ?? '',
      hasEmbedding: Boolean(r.hasEmbedding),
    })),
    embeddedChunkCount: Number(embeddedRows[0]?.count ?? 0),
  };
}
