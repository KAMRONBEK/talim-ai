import type { UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';
import { createTenantForOwner } from './tenant.service.js';

export interface AdminRoleChangeInput {
  tenantId?: string;
  orgName?: string;
  newOwnerId?: string;
}

async function transferTenantOwnership(
  tenantId: string,
  fromUserId: string,
  toUserId: string,
): Promise<void> {
  if (fromUserId === toUserId) {
    throw new AppError(400, 'Cannot transfer ownership to the same user');
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new AppError(404, 'Organization not found');
  if (tenant.ownerId !== fromUserId) {
    throw new AppError(400, 'User is not the current organization owner');
  }

  const newOwner = await prisma.user.findUnique({ where: { id: toUserId } });
  if (!newOwner) throw new AppError(404, 'New owner not found');

  const membership = await prisma.tenantMembership.findUnique({
    where: { tenantId_userId: { tenantId, userId: toUserId } },
  });
  if (!membership) {
    throw new AppError(400, 'New owner must be a member of the organization');
  }

  await prisma.$transaction([
    prisma.tenant.update({ where: { id: tenantId }, data: { ownerId: toUserId } }),
    prisma.user.update({ where: { id: toUserId }, data: { role: 'TENANT_OWNER' } }),
    prisma.tenantMembership.updateMany({
      where: { userId: toUserId, tenantId, role: 'LEARNER' },
      data: { active: false },
    }),
    prisma.tenantMembership.upsert({
      where: { tenantId_userId: { tenantId, userId: toUserId } },
      create: { tenantId, userId: toUserId, role: 'OWNER' },
      update: { active: true, role: 'OWNER' },
    }),
    prisma.tenantMembership.updateMany({
      where: { userId: fromUserId, role: 'OWNER' },
      data: { active: false },
    }),
  ]);
}

async function ensureIndividualSubscription(userId: string): Promise<void> {
  const existing = await prisma.subscription.findUnique({ where: { userId } });
  if (existing) return;

  const freePlan = await prisma.plan.findUnique({ where: { code: 'FREE' } });
  if (!freePlan) throw new AppError(500, 'FREE plan not configured');

  await prisma.subscription.create({
    data: {
      userId,
      planId: freePlan.id,
      status: 'ACTIVE',
      source: 'ADMIN',
    },
  });
}

export async function applyAdminRoleChange(
  userId: string,
  fromRole: UserRole,
  toRole: UserRole,
  input: AdminRoleChangeInput = {},
): Promise<{ tenantId: string | null }> {
  if (fromRole === toRole) return { tenantId: null };

  if (toRole === 'ADMIN') {
    if (fromRole === 'TENANT_OWNER') {
      const owned = await prisma.tenant.findFirst({ where: { ownerId: userId } });
      if (owned) {
        throw new AppError(
          400,
          `User owns organization "${owned.name}". Reassign the owner before changing role.`,
        );
      }
    }
    if (fromRole === 'TENANT_LEARNER') {
      await prisma.tenantMembership.updateMany({
        where: { userId, role: 'LEARNER' },
        data: { active: false },
      });
    }
    await ensureIndividualSubscription(userId);
    return { tenantId: null };
  }

  if (toRole === 'INDIVIDUAL') {
    if (fromRole === 'TENANT_OWNER') {
      const owned = await prisma.tenant.findFirst({ where: { ownerId: userId } });
      if (owned) {
        if (!input.newOwnerId) {
          throw new AppError(
            400,
            `User owns organization "${owned.name}". Select a new owner before demoting to individual.`,
          );
        }
        await transferTenantOwnership(owned.id, userId, input.newOwnerId);
      } else {
        await prisma.tenantMembership.updateMany({
          where: { userId, role: 'OWNER' },
          data: { active: false },
        });
      }
    }
    if (fromRole === 'TENANT_LEARNER') {
      await prisma.tenantMembership.updateMany({
        where: { userId, role: 'LEARNER' },
        data: { active: false },
      });
    }
    await ensureIndividualSubscription(userId);
    return { tenantId: null };
  }

  if (toRole === 'TENANT_OWNER') {
    const existingOwned = await prisma.tenant.findFirst({ where: { ownerId: userId } });
    if (existingOwned) {
      await prisma.tenantMembership.upsert({
        where: {
          tenantId_userId: { tenantId: existingOwned.id, userId },
        },
        create: { tenantId: existingOwned.id, userId, role: 'OWNER' },
        update: { active: true, role: 'OWNER' },
      });
      return { tenantId: existingOwned.id };
    }

    if (input.orgName?.trim()) {
      const { tenantId } = await createTenantForOwner(userId, input.orgName.trim());
      return { tenantId };
    }

    if (input.tenantId) {
      const tenant = await prisma.tenant.findUnique({ where: { id: input.tenantId } });
      if (!tenant) throw new AppError(404, 'Organization not found');

      await prisma.$transaction([
        prisma.tenant.update({
          where: { id: tenant.id },
          data: { ownerId: userId },
        }),
        prisma.tenantMembership.upsert({
          where: { tenantId_userId: { tenantId: tenant.id, userId } },
          create: { tenantId: tenant.id, userId, role: 'OWNER' },
          update: { active: true, role: 'OWNER' },
        }),
      ]);
      return { tenantId: tenant.id };
    }

    throw new AppError(400, 'orgName or tenantId required when promoting to tenant owner');
  }

  if (toRole === 'TENANT_LEARNER') {
    if (!input.tenantId) {
      throw new AppError(400, 'tenantId required when assigning tenant learner role');
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: input.tenantId } });
    if (!tenant) throw new AppError(404, 'Organization not found');
    if (tenant.ownerId === userId) {
      throw new AppError(400, 'Organization owner cannot be a learner in the same org');
    }

    if (fromRole === 'TENANT_OWNER') {
      const owned = await prisma.tenant.findFirst({ where: { ownerId: userId } });
      if (owned && owned.id !== input.tenantId) {
        throw new AppError(400, 'Reassign organization ownership before changing to learner');
      }
      if (owned?.id === input.tenantId) {
        throw new AppError(400, 'Cannot make owner a learner of their own organization');
      }
    }

    await prisma.tenantMembership.updateMany({
      where: { userId, role: 'LEARNER', tenantId: { not: input.tenantId } },
      data: { active: false },
    });

    await prisma.tenantMembership.upsert({
      where: { tenantId_userId: { tenantId: input.tenantId, userId } },
      create: { tenantId: input.tenantId, userId, role: 'LEARNER' },
      update: { active: true, role: 'LEARNER' },
    });

    return { tenantId: input.tenantId };
  }

  return { tenantId: null };
}
