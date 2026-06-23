import type { Prisma, SubscriptionStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { formatSubscription } from './shared.js';

export async function listSubscriptionsForAdmin(params: {
  page: number;
  pageSize: number;
  search?: string;
  status?: SubscriptionStatus;
  plan?: string;
  kind?: 'user' | 'tenant' | 'all';
}) {
  const kind = params.kind ?? 'all';
  const where: Prisma.SubscriptionWhereInput = {};

  if (kind === 'user') {
    where.userId = { not: null };
  } else if (kind === 'tenant') {
    where.tenantId = { not: null };
  } else {
    where.OR = [{ userId: { not: null } }, { tenantId: { not: null } }];
  }

  if (params.status) where.status = params.status;
  if (params.plan) {
    where.plan = { code: params.plan };
  }
  if (params.search?.trim()) {
    const q = params.search.trim();
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
      {
        OR: [
          { user: { OR: [{ email: { contains: q, mode: 'insensitive' } }, { name: { contains: q, mode: 'insensitive' } }] } },
          { tenant: { OR: [{ name: { contains: q, mode: 'insensitive' } }, { slug: { contains: q, mode: 'insensitive' } }] } },
        ],
      },
    ];
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
        tenant: { select: { id: true, name: true, slug: true } },
      },
    }),
  ]);

  return {
    items: items.map((sub) => {
      const base = formatSubscription(sub);
      if (sub.tenantId && sub.tenant) {
        return {
          ...base,
          subjectType: 'tenant' as const,
          tenantId: sub.tenant.id,
          tenantName: sub.tenant.name,
          tenantSlug: sub.tenant.slug,
        };
      }
      return {
        ...base,
        subjectType: 'user' as const,
        userId: sub.user!.id,
        userEmail: sub.user!.email,
        userName: sub.user!.name,
      };
    }),
    total,
    page: params.page,
    pageSize: params.pageSize,
  };
}
