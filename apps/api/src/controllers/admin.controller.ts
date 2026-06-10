import type { Response } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import type { Prisma, UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { getParam } from '../lib/params.js';
import { parseAppLocale } from '@talim/types';
import { writeAdminAuditLog } from '../services/admin/audit.service.js';
import { getUsageForPeriod } from '../services/usage.service.js';
import {
  adminUpdateUserSubscription,
  adminUpdateTenantSubscription,
  getSubscriptionForTenant,
  getSubscriptionForUser,
  getTenantUsageVsLimits,
  getUsageVsLimits,
  listSubscriptionsForAdmin,
} from '../services/subscription.service.js';
import { formatTenant } from '../services/tenant.service.js';
import { applyAdminRoleChange } from '../services/adminUserRole.service.js';
import { resolveTenantIdForUser } from '../services/contentAccess.service.js';
import { contentQueue } from '../services/queue.service.js';
import { cancelContentJobs } from '../services/queue.service.js';
import { storageService } from '../services/storage.service.js';

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.enum(['INDIVIDUAL', 'TENANT_OWNER', 'TENANT_LEARNER', 'ADMIN']).optional(),
});

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).optional(),
  role: z.enum(['INDIVIDUAL', 'TENANT_OWNER', 'TENANT_LEARNER', 'ADMIN']).default('INDIVIDUAL'),
});

const patchUserSchema = z
  .object({
    name: z.string().min(1).optional(),
    role: z.enum(['INDIVIDUAL', 'TENANT_OWNER', 'TENANT_LEARNER', 'ADMIN']).optional(),
    preferredLocale: z.enum(['uz', 'en', 'ru']).optional(),
    tenantId: z.string().min(1).optional(),
    orgName: z.string().min(1).optional(),
    newOwnerId: z.string().min(1).optional(),
  })
  .refine(
    (body) => {
      if (body.role === 'TENANT_LEARNER' && !body.tenantId) return false;
      if (body.role === 'TENANT_OWNER' && !body.tenantId && !body.orgName) return false;
      return true;
    },
    { message: 'tenantId required for learner; orgName or tenantId required for tenant owner' },
  );

const resetPasswordSchema = z.object({
  password: z.string().min(8),
});

const usageDaysSchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(30),
});

const subscriptionListSchema = paginationSchema.extend({
  status: z.enum(['ACTIVE', 'PAST_DUE', 'CANCELED', 'TRIALING']).optional(),
  plan: z.string().optional(),
  kind: z.enum(['user', 'tenant', 'all']).optional(),
});

const patchSubscriptionSchema = z
  .object({
    planCode: z.enum(['FREE', 'INDIVIDUAL_PRO', 'TENANT_STARTER', 'TENANT_GROWTH']).optional(),
    status: z.enum(['ACTIVE', 'PAST_DUE', 'CANCELED', 'TRIALING']).optional(),
    currentPeriodEnd: z.string().datetime().nullable().optional(),
  })
  .refine((body) => body.planCode !== undefined || body.status !== undefined || body.currentPeriodEnd !== undefined, {
    message: 'At least one field required',
  });

function formatAdminUser(user: {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  preferredLocale: string;
  createdAt: Date;
  _count?: { contents: number };
  contents?: { updatedAt: Date }[];
  subscription?: { status: string; plan: { code: string } } | null;
}) {
  const lastActivity = user.contents?.[0]?.updatedAt;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    preferredLocale: parseAppLocale(user.preferredLocale),
    createdAt: user.createdAt.toISOString(),
    contentCount: user._count?.contents ?? 0,
    lastActivityAt: lastActivity ? lastActivity.toISOString() : null,
    planCode: user.subscription?.plan.code ?? null,
    subscriptionStatus: (user.subscription?.status as
      | 'ACTIVE'
      | 'PAST_DUE'
      | 'CANCELED'
      | 'TRIALING'
      | undefined) ?? null,
  };
}

function buildUserWhere(search?: string, role?: UserRole): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {};
  if (role) where.role = role;
  if (search?.trim()) {
    const q = search.trim();
    where.OR = [
      { email: { contains: q, mode: 'insensitive' } },
      { name: { contains: q, mode: 'insensitive' } },
    ];
  }
  return where;
}

export async function listUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
  const query = paginationSchema.parse(req.query);
  const where = buildUserWhere(query.search, query.role);
  const skip = (query.page - 1) * query.pageSize;

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: query.pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { contents: true } },
        contents: { orderBy: { updatedAt: 'desc' }, take: 1, select: { updatedAt: true } },
        subscription: { include: { plan: { select: { code: true } } } },
      },
    }),
  ]);

  res.json({
    items: users.map(formatAdminUser),
    total,
    page: query.page,
    pageSize: query.pageSize,
  });
}

export async function createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const body = createUserSchema.parse(req.body);
  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) throw new AppError(409, 'Email already registered');

  const passwordHash = await bcrypt.hash(body.password, 12);
  const freePlan = await prisma.plan.findUnique({ where: { code: 'FREE' } });
  if (!freePlan) throw new AppError(500, 'FREE plan not configured');

  const user = await prisma.user.create({
    data: {
      email: body.email,
      passwordHash,
      name: body.name ?? null,
      role: body.role,
      subscription: {
        create: {
          planId: freePlan.id,
          status: 'ACTIVE',
          source: 'ADMIN',
        },
      },
    },
    include: {
      _count: { select: { contents: true } },
      subscription: { include: { plan: { select: { code: true } } } },
    },
  });

  await writeAdminAuditLog({
    adminUserId: req.user.userId,
    action: 'user.create',
    targetType: 'user',
    targetId: user.id,
    metadata: { email: user.email, role: user.role },
  });

  res.status(201).json({ user: formatAdminUser(user) });
}

export async function getUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  const id = getParam(req, 'id');
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      _count: { select: { contents: true, quizzes: true, contentSummaries: true } },
      contents: { orderBy: { updatedAt: 'desc' }, take: 1, select: { updatedAt: true } },
    },
  });
  if (!user) throw new AppError(404, 'User not found');

  const from = new Date();
  from.setDate(from.getDate() - 30);
  const usage = await getUsageForPeriod({ userId: id, from, to: new Date() });
  const tenantId = await resolveTenantIdForUser(id, user.role);
  const ownedTenant =
    user.role === 'TENANT_OWNER'
      ? await prisma.tenant.findFirst({
          where: { ownerId: id },
          select: { id: true, name: true, slug: true },
        })
      : null;
  const learnerMembership =
    user.role === 'TENANT_LEARNER'
      ? await prisma.tenantMembership.findFirst({
          where: { userId: id, role: 'LEARNER', active: true },
          include: { tenant: { select: { id: true, name: true, slug: true } } },
        })
      : null;

  let subscription;
  let usageVsLimits;
  if (user.role === 'TENANT_OWNER' && tenantId) {
    usageVsLimits = await getTenantUsageVsLimits(tenantId);
    subscription = usageVsLimits.subscription ?? (await getSubscriptionForTenant(tenantId));
  } else {
    [subscription, usageVsLimits] = await Promise.all([
      getSubscriptionForUser(id),
      getUsageVsLimits(id),
    ]);
  }

  res.json({
    user: {
      ...formatAdminUser(user),
      quizCount: user._count.quizzes,
      summaryCount: user._count.contentSummaries,
      usageLast30Days: usage.totalCostUsd,
      tenantId,
      ownedTenant,
      learnerTenant: learnerMembership?.tenant ?? null,
    },
    subscription,
    usageVsLimits,
    contents: await prisma.content.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        createdAt: true,
      },
    }),
  });
}

export async function patchUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const id = getParam(req, 'id');
  const body = patchUserSchema.parse(req.body ?? {});

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'User not found');
  if (id === req.user.userId && body.role && body.role !== 'ADMIN') {
    throw new AppError(400, 'Cannot change your own admin role');
  }

  const newRole = body.role ?? existing.role;
  if (body.role && body.role !== existing.role) {
    await applyAdminRoleChange(id, existing.role, body.role, {
      tenantId: body.tenantId,
      orgName: body.orgName,
      newOwnerId: body.newOwnerId,
    });
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.role !== undefined ? { role: body.role } : {}),
      ...(body.preferredLocale !== undefined ? { preferredLocale: body.preferredLocale } : {}),
    },
    include: { _count: { select: { contents: true } } },
  });

  if (body.role && body.role !== existing.role) {
    await writeAdminAuditLog({
      adminUserId: req.user.userId,
      action: 'user.role_change',
      targetType: 'user',
      targetId: id,
      metadata: {
        from: existing.role,
        to: body.role,
        tenantId: body.tenantId ?? null,
        orgName: body.orgName ?? null,
      },
    });
  }

  const tenantId = await resolveTenantIdForUser(user.id, newRole);
  res.json({ user: { ...formatAdminUser(user), tenantId } });
}

export async function deleteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const id = getParam(req, 'id');
  if (id === req.user.userId) throw new AppError(400, 'Cannot delete your own admin account');

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'User not found');

  await prisma.user.delete({ where: { id } });
  await writeAdminAuditLog({
    adminUserId: req.user.userId,
    action: 'user.delete',
    targetType: 'user',
    targetId: id,
    metadata: { email: existing.email },
  });

  res.status(204).send();
}

export async function resetUserPassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const id = getParam(req, 'id');
  const body = resetPasswordSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'User not found');

  const passwordHash = await bcrypt.hash(body.password, 12);
  await prisma.user.update({ where: { id }, data: { passwordHash } });

  await writeAdminAuditLog({
    adminUserId: req.user.userId,
    action: 'user.reset_password',
    targetType: 'user',
    targetId: id,
  });

  res.json({ ok: true });
}

const patchTenantSubscriptionSchema = z
  .object({
    planCode: z.enum(['TENANT_STARTER', 'TENANT_GROWTH']).optional(),
    status: z.enum(['ACTIVE', 'PAST_DUE', 'CANCELED', 'TRIALING']).optional(),
    currentPeriodEnd: z.string().datetime().nullable().optional(),
    name: z.string().min(1).optional(),
  })
  .refine(
    (body) =>
      body.planCode !== undefined ||
      body.status !== undefined ||
      body.currentPeriodEnd !== undefined ||
      body.name !== undefined,
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

  if (body.name) {
    await prisma.tenant.update({ where: { id }, data: { name: body.name } });
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

export async function listContents(req: AuthenticatedRequest, res: Response): Promise<void> {
  const query = paginationSchema.parse(req.query);
  const skip = (query.page - 1) * query.pageSize;
  const where: Prisma.ContentWhereInput = query.search?.trim()
    ? { title: { contains: query.search.trim(), mode: 'insensitive' } }
    : {};

  const [total, contents] = await Promise.all([
    prisma.content.count({ where }),
    prisma.content.findMany({
      where,
      skip,
      take: query.pageSize,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { email: true, name: true } } },
    }),
  ]);

  res.json({
    items: contents.map((c) => ({
      id: c.id,
      userId: c.userId,
      userEmail: c.user.email,
      userName: c.user.name,
      type: c.type,
      title: c.title,
      status: c.status,
      createdAt: c.createdAt.toISOString(),
    })),
    total,
    page: query.page,
    pageSize: query.pageSize,
  });
}

export async function deleteContent(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const id = getParam(req, 'id');
  const content = await prisma.content.findUnique({ where: { id } });
  if (!content) throw new AppError(404, 'Content not found');

  await cancelContentJobs(id);
  if (content.storagePath) {
    await storageService.delete(content.storagePath).catch(() => {});
  }
  await prisma.content.delete({ where: { id } });

  await writeAdminAuditLog({
    adminUserId: req.user.userId,
    action: 'content.delete',
    targetType: 'content',
    targetId: id,
    metadata: { title: content.title, userId: content.userId },
  });

  res.status(204).send();
}

export async function retryContentJob(req: AuthenticatedRequest, res: Response): Promise<void> {
  const id = getParam(req, 'id');
  const content = await prisma.content.findUnique({ where: { id } });
  if (!content) throw new AppError(404, 'Content not found');
  if (content.status !== 'FAILED') {
    throw new AppError(400, 'Only failed content can be retried');
  }

  const updated = await prisma.content.update({
    where: { id },
    data: { status: 'PENDING' },
  });
  await contentQueue.add({ contentId: id });
  res.json({
    content: {
      id: updated.id,
      status: updated.status,
      title: updated.title,
    },
  });
}

export async function listGenerated(req: AuthenticatedRequest, res: Response): Promise<void> {
  const kind = typeof req.query.kind === 'string' ? req.query.kind : 'all';

  const [podcasts, quizzes, slideshows, summaries] = await Promise.all([
    kind === 'all' || kind === 'podcast'
      ? prisma.podcast.findMany({
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: { content: { select: { title: true, userId: true, user: { select: { email: true } } } } },
        })
      : [],
    kind === 'all' || kind === 'quiz'
      ? prisma.quiz.findMany({
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: { content: { select: { title: true, userId: true, user: { select: { email: true } } } } },
        })
      : [],
    kind === 'all' || kind === 'slideshow'
      ? prisma.contentVideo.findMany({
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: { content: { select: { title: true, userId: true, user: { select: { email: true } } } } },
        })
      : [],
    kind === 'all' || kind === 'summary'
      ? prisma.contentSummary.findMany({
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: { content: { select: { title: true, userId: true, user: { select: { email: true } } } } },
        })
      : [],
  ]);

  const items = [
    ...podcasts.map((p) => ({
      id: p.id,
      kind: 'podcast' as const,
      contentId: p.contentId,
      contentTitle: p.content.title,
      userId: p.content.userId,
      userEmail: p.content.user.email,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
    })),
    ...quizzes.map((q) => ({
      id: q.id,
      kind: 'quiz' as const,
      contentId: q.contentId,
      contentTitle: q.content.title,
      userId: q.content.userId,
      userEmail: q.content.user.email,
      createdAt: q.createdAt.toISOString(),
    })),
    ...slideshows.map((v) => ({
      id: v.id,
      kind: 'slideshow' as const,
      contentId: v.contentId,
      contentTitle: v.content.title,
      userId: v.content.userId,
      userEmail: v.content.user.email,
      status: v.status,
      createdAt: v.createdAt.toISOString(),
    })),
    ...summaries.map((s) => ({
      id: s.id,
      kind: 'summary' as const,
      contentId: s.contentId,
      contentTitle: s.content.title,
      userId: s.content.userId,
      userEmail: s.content.user.email,
      createdAt: s.createdAt.toISOString(),
    })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  res.json({ items });
}

export async function deleteGenerated(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const id = getParam(req, 'id');
  const kind = typeof req.query.kind === 'string' ? req.query.kind : '';

  if (kind === 'podcast') {
    await prisma.podcast.delete({ where: { id } });
  } else if (kind === 'quiz') {
    await prisma.quiz.delete({ where: { id } });
  } else if (kind === 'slideshow') {
    const video = await prisma.contentVideo.findUnique({ where: { id } });
    if (!video) throw new AppError(404, 'Generated item not found');
    if (video.storagePath) await storageService.delete(video.storagePath).catch(() => {});
    await prisma.contentVideo.delete({ where: { id } });
  } else if (kind === 'summary') {
    await prisma.contentSummary.delete({ where: { id } });
  } else {
    throw new AppError(400, 'kind query param required: podcast|quiz|slideshow|summary');
  }

  await writeAdminAuditLog({
    adminUserId: req.user.userId,
    action: 'generated.delete',
    targetType: kind,
    targetId: id,
  });

  res.status(204).send();
}

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

export async function patchUserSubscription(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const id = getParam(req, 'id');
  const body = patchSubscriptionSchema.parse(req.body ?? {});

  const existing = await prisma.subscription.findUnique({
    where: { userId: id },
    include: { plan: true },
  });
  if (!existing) throw new AppError(404, 'Subscription not found');

  const subscription = await adminUpdateUserSubscription(id, body);

  await writeAdminAuditLog({
    adminUserId: req.user.userId,
    action: 'subscription.update',
    targetType: 'subscription',
    targetId: subscription.id,
    metadata: {
      fromPlan: existing.plan.code,
      toPlan: subscription.planCode,
      fromStatus: existing.status,
      toStatus: subscription.status,
    },
  });

  res.json({ subscription });
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
