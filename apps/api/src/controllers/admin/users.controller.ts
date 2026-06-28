import type { Response } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { getParam } from '../../lib/params.js';
import { writeAdminAuditLog } from '../../services/admin/audit.service.js';
import { getUsageForPeriod } from '../../services/usage.service.js';
import {
  adminUpdateUserSubscription,
  getSubscriptionForTenant,
  getSubscriptionForUser,
  getTenantUsageVsLimits,
  getUsageVsLimits,
} from '../../services/subscription.service.js';
import { applyAdminRoleChange } from '../../services/adminUserRole.service.js';
import { resolveTenantIdForUser } from '../../services/contentAccess.service.js';
import {
  buildUserWhere,
  formatAdminUser,
  generateTemporaryPassword,
  paginationSchema,
} from './shared.js';

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
    adminPasswordNote: z.string().nullable().optional(),
  })
  .refine(
    (body) => {
      if (body.role === 'TENANT_LEARNER' && !body.tenantId) return false;
      if (body.role === 'TENANT_OWNER' && !body.tenantId && !body.orgName) return false;
      return true;
    },
    { message: 'tenantId required for learner; orgName or tenantId required for tenant owner' },
  );

const resetPasswordSchema = z
  .object({
    password: z.string().min(8).optional(),
    generate: z.literal(true).optional(),
  })
  .refine((body) => body.generate === true || body.password !== undefined, {
    message: 'password or generate: true required',
  });

const deleteUserSchema = z.object({
  confirmCascade: z.coerce.boolean().optional(),
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
      adminPasswordNote: body.password,
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
      ...(body.adminPasswordNote !== undefined ? { adminPasswordNote: body.adminPasswordNote } : {}),
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

  // Non-role edits (name / locale / the sensitive plaintext password note) must also be
  // audited — "every admin action recorded". Log only which fields changed, never the
  // password-note value.
  const updatedFields = [
    body.name !== undefined && body.name !== existing.name ? 'name' : null,
    body.preferredLocale !== undefined && body.preferredLocale !== existing.preferredLocale
      ? 'preferredLocale'
      : null,
    body.adminPasswordNote !== undefined ? 'adminPasswordNote' : null,
  ].filter((f): f is string => f !== null);
  if (updatedFields.length > 0) {
    await writeAdminAuditLog({
      adminUserId: req.user.userId,
      action: 'user.update',
      targetType: 'user',
      targetId: id,
      metadata: { fields: updatedFields },
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

  const body = deleteUserSchema.parse(req.body ?? {});

  // Tenant.owner is onDelete: Cascade, so deleting a TENANT_OWNER destroys the
  // entire organization (memberships, content, assessments, subscription).
  // Refuse by default and require an explicit acknowledgement.
  const ownedTenant = await prisma.tenant.findFirst({ where: { ownerId: id } });
  if (ownedTenant) {
    const [studentCount, contentCount] = await Promise.all([
      prisma.tenantMembership.count({ where: { tenantId: ownedTenant.id, role: 'LEARNER' } }),
      prisma.content.count({ where: { tenantId: ownedTenant.id } }),
    ]);
    if (!body.confirmCascade) {
      throw new AppError(
        409,
        `User owns organization "${ownedTenant.name}" (${studentCount} students, ${contentCount} materials). ` +
          `Deleting permanently destroys the whole organization. Transfer ownership first ` +
          `(demote to individual with a new owner), or resend with confirmCascade: true.`,
      );
    }
    await prisma.user.delete({ where: { id } });
    await writeAdminAuditLog({
      adminUserId: req.user.userId,
      action: 'user.delete',
      targetType: 'user',
      targetId: id,
      metadata: {
        email: existing.email,
        cascadedTenantId: ownedTenant.id,
        cascadedTenantName: ownedTenant.name,
        cascadedStudents: studentCount,
        cascadedContent: contentCount,
      },
    });
    res.status(204).send();
    return;
  }

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

  const temporaryPassword = body.generate ? generateTemporaryPassword() : body.password!;
  const passwordHash = await bcrypt.hash(temporaryPassword, 12);
  await prisma.user.update({
    where: { id },
    data: { passwordHash, adminPasswordNote: temporaryPassword, mustChangePassword: true },
  });

  await writeAdminAuditLog({
    adminUserId: req.user.userId,
    action: 'user.reset_password',
    targetType: 'user',
    targetId: id,
  });

  res.json({ temporaryPassword });
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
