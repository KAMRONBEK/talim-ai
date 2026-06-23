import type { Response } from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { getParam } from '../../lib/params.js';
import { writeAdminAuditLog } from '../../services/admin/audit.service.js';
import {
  adminUpdateTenantSubscription,
  getSubscriptionForTenant,
  getTenantUsageVsLimits,
} from '../../services/subscription.service.js';
import { formatTenant } from '../../services/tenant.service.js';
import { paginationSchema } from './shared.js';

const patchTenantSubscriptionSchema = z
  .object({
    planCode: z.enum(['TENANT_STARTER', 'TENANT_GROWTH']).optional(),
    status: z.enum(['ACTIVE', 'PAST_DUE', 'CANCELED', 'TRIALING']).optional(),
    currentPeriodEnd: z.string().datetime().nullable().optional(),
    name: z.string().min(1).optional(),
    // Custom per-tenant seat (student) limit; null clears the override and
    // falls back to the plan's maxStudents. An explicit limit must allow at least
    // one seat — 0 would silently lock the tenant out of adding any students.
    seatLimit: z.number().int().min(1).max(100000).nullable().optional(),
  })
  .refine(
    (body) =>
      body.planCode !== undefined ||
      body.status !== undefined ||
      body.currentPeriodEnd !== undefined ||
      body.name !== undefined ||
      body.seatLimit !== undefined,
    { message: 'At least one field required' },
  );

export async function listTenants(req: AuthenticatedRequest, res: Response): Promise<void> {
  const query = paginationSchema.parse(req.query);
  const skip = (query.page - 1) * query.pageSize;
  const where: Prisma.TenantWhereInput = query.search?.trim()
    ? {
        OR: [
          { name: { contains: query.search.trim(), mode: 'insensitive' } },
          { slug: { contains: query.search.trim(), mode: 'insensitive' } },
        ],
      }
    : {};

  const [total, tenants] = await Promise.all([
    prisma.tenant.count({ where }),
    prisma.tenant.findMany({
      where,
      skip,
      take: query.pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { id: true, email: true, name: true } },
        subscription: { include: { plan: true } },
        memberships: {
          where: { role: 'LEARNER', active: true },
          select: { id: true },
        },
        _count: { select: { contents: true } },
      },
    }),
  ]);

  res.json({
    items: tenants.map((t) => ({
      ...formatTenant(t),
      ownerEmail: t.owner.email,
      ownerName: t.owner.name,
      studentCount: t.memberships.length,
      contentCount: t._count.contents,
      planCode: t.subscription?.plan.code ?? null,
      subscriptionStatus: t.subscription?.status ?? null,
    })),
    total,
    page: query.page,
    pageSize: query.pageSize,
  });
}

export async function getTenant(req: AuthenticatedRequest, res: Response): Promise<void> {
  const id = getParam(req, 'id');
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, email: true, name: true } },
      subscription: { include: { plan: true } },
    },
  });
  if (!tenant) throw new AppError(404, 'Tenant not found');

  const [usageVsLimits, memberships, contentCount] = await Promise.all([
    getTenantUsageVsLimits(id).catch(() => null),
    prisma.tenantMembership.findMany({
      where: { tenantId: id },
      include: { user: { select: { id: true, email: true, name: true, role: true } } },
      orderBy: [{ role: 'desc' }, { joinedAt: 'desc' }],
    }),
    prisma.content.count({ where: { tenantId: id } }),
  ]);
  const studentCount = memberships.filter((m) => m.role === 'LEARNER' && m.active).length;
  const subscription =
    usageVsLimits?.subscription ??
    (tenant.subscription ? await getSubscriptionForTenant(id) : null);

  res.json({
    tenant: {
      ...formatTenant(tenant),
      owner: tenant.owner,
      studentCount,
      contentCount,
      members: memberships.map((m) => ({
        membershipId: m.id,
        userId: m.user.id,
        email: m.user.email,
        name: m.user.name,
        userRole: m.user.role,
        memberRole: m.role,
        active: m.active,
        joinedAt: m.joinedAt.toISOString(),
      })),
    },
    subscription,
    usageVsLimits,
  });
}

export async function patchTenant(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const id = getParam(req, 'id');
  const body = patchTenantSubscriptionSchema.parse(req.body);

  const tenant = await prisma.tenant.findUnique({ where: { id } });
  if (!tenant) throw new AppError(404, 'Tenant not found');

  if (body.name !== undefined || body.seatLimit !== undefined) {
    await prisma.tenant.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.seatLimit !== undefined ? { seatLimit: body.seatLimit } : {}),
      },
    });
  }

  let subscription = null;
  if (body.planCode || body.status !== undefined || body.currentPeriodEnd !== undefined) {
    subscription = await adminUpdateTenantSubscription(id, {
      planCode: body.planCode,
      status: body.status,
      currentPeriodEnd: body.currentPeriodEnd,
    });
  } else {
    subscription = await getSubscriptionForTenant(id);
  }

  await writeAdminAuditLog({
    adminUserId: req.user.userId,
    action: 'tenant.patch',
    targetType: 'tenant',
    targetId: id,
    metadata: body,
  });

  const updated = await prisma.tenant.findUniqueOrThrow({ where: { id } });
  res.json({ tenant: formatTenant(updated), subscription });
}
