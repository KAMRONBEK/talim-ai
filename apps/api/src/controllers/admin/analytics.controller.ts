import type { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { listSubscriptionsForAdmin } from '../../services/subscription.service.js';
import {
  computeMrr,
  getAnalyticsSummary,
  getContentByType,
  getFunnel,
  getSpendByModel,
  getTopOrgs,
  getUserGrowth,
  getUsersByRole,
} from '../../services/admin/analytics.service.js';
import { paginationSchema } from './shared.js';

const usageDaysSchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(30),
});

const subscriptionListSchema = paginationSchema.extend({
  status: z.enum(['ACTIVE', 'PAST_DUE', 'CANCELED', 'TRIALING']).optional(),
  plan: z.string().optional(),
  kind: z.enum(['user', 'tenant', 'all']).optional(),
});

export async function listSubscriptions(req: AuthenticatedRequest, res: Response): Promise<void> {
  const query = subscriptionListSchema.parse(req.query);
  const result = await listSubscriptionsForAdmin({
    page: query.page,
    pageSize: query.pageSize,
    search: query.search,
    status: query.status,
    plan: query.plan,
    kind: query.kind,
  });
  res.json(result);
}

export async function usageSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
  const query = usageDaysSchema.parse(req.query);
  const from = new Date();
  from.setDate(from.getDate() - query.days);

  const events = await prisma.apiUsageEvent.groupBy({
    by: ['userId'],
    where: { createdAt: { gte: from } },
    _sum: { inputTokens: true, outputTokens: true, estimatedCostUsd: true },
    _count: { id: true },
  });

  const userIds = events.map((e) => e.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true, name: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  const rows = events
    .map((e) => {
      const user = userMap.get(e.userId);
      return {
        userId: e.userId,
        userEmail: user?.email ?? 'unknown',
        userName: user?.name ?? null,
        tenantId: null,
        totalInputTokens: e._sum.inputTokens ?? 0,
        totalOutputTokens: e._sum.outputTokens ?? 0,
        estimatedCostUsd: Number(e._sum.estimatedCostUsd ?? 0),
        eventCount: e._count.id,
      };
    })
    .sort((a, b) => b.estimatedCostUsd - a.estimatedCostUsd);

  res.json({ days: query.days, rows });
}

// ---------------------------------------------------------------------------
// Analytics dashboard (read-only). Thin handlers over analytics.service.ts.
// ---------------------------------------------------------------------------

export async function analyticsSummary(_req: AuthenticatedRequest, res: Response): Promise<void> {
  res.json(await getAnalyticsSummary());
}

export async function analyticsMrr(_req: AuthenticatedRequest, res: Response): Promise<void> {
  res.json(await computeMrr());
}

export async function analyticsUserGrowth(_req: AuthenticatedRequest, res: Response): Promise<void> {
  res.json(await getUserGrowth());
}

export async function analyticsByRole(_req: AuthenticatedRequest, res: Response): Promise<void> {
  res.json(await getUsersByRole());
}

export async function analyticsFunnel(_req: AuthenticatedRequest, res: Response): Promise<void> {
  res.json(await getFunnel());
}

export async function analyticsContentByType(
  _req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  res.json(await getContentByType());
}

export async function analyticsTopOrgs(_req: AuthenticatedRequest, res: Response): Promise<void> {
  res.json(await getTopOrgs());
}

export async function analyticsSpendByModel(
  _req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  res.json(await getSpendByModel());
}

export async function platformStats(_req: AuthenticatedRequest, res: Response): Promise<void> {
  const now = new Date();
  const d7 = new Date(now);
  d7.setDate(d7.getDate() - 7);
  const d30 = new Date(now);
  d30.setDate(d30.getDate() - 30);

  const [
    totalUsers,
    signupsLast7Days,
    signupsLast30Days,
    totalContents,
    pendingContents,
    processingContents,
    readyContents,
    failedContents,
    totalQuizzes,
    totalPodcasts,
    totalSlideshows,
    totalSummaries,
    spendAgg,
    activeUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: d7 } } }),
    prisma.user.count({ where: { createdAt: { gte: d30 } } }),
    prisma.content.count(),
    prisma.content.count({ where: { status: 'PENDING' } }),
    prisma.content.count({ where: { status: 'PROCESSING' } }),
    prisma.content.count({ where: { status: 'READY' } }),
    prisma.content.count({ where: { status: 'FAILED' } }),
    prisma.quiz.count(),
    prisma.podcast.count(),
    prisma.contentVideo.count(),
    prisma.contentSummary.count(),
    prisma.apiUsageEvent.aggregate({ _sum: { estimatedCostUsd: true } }),
    prisma.content.findMany({
      where: { updatedAt: { gte: d30 } },
      distinct: ['userId'],
      select: { userId: true },
    }),
  ]);

  res.json({
    totalUsers,
    signupsLast7Days,
    signupsLast30Days,
    totalContents,
    contentsByStatus: {
      PENDING: pendingContents,
      PROCESSING: processingContents,
      READY: readyContents,
      FAILED: failedContents,
    },
    totalQuizzes,
    totalPodcasts,
    totalSlideshows,
    totalSummaries,
    estimatedApiSpendUsd: Number(spendAgg._sum.estimatedCostUsd ?? 0),
    activeUsersLast30Days: activeUsers.length,
  });
}
