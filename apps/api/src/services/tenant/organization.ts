import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import { assertTenantQuota } from '../subscription.service.js';
import {
  formatTenant,
  generateUniqueJoinCode,
  getDefaultTenantPlanId,
  patchTenantSchema,
  uniqueSlug,
} from './shared.js';

/**
 * Guarantees a tenant has an ACTIVE subscription so its owner is not immediately
 * blocked by requireActiveTenantSubscription. Idempotent — safe to call on
 * tenants that already have a subscription.
 */
export async function ensureTenantSubscription(tenantId: string): Promise<void> {
  const existing = await prisma.subscription.findUnique({ where: { tenantId } });
  if (existing) return;
  const planId = await getDefaultTenantPlanId();
  await prisma.subscription.create({
    data: { tenantId, planId, status: 'ACTIVE', source: 'ADMIN' },
  });
}

export async function createTenantForOwner(
  ownerId: string,
  orgName: string,
): Promise<{ tenantId: string }> {
  const slug = await uniqueSlug(orgName);
  const planId = await getDefaultTenantPlanId();
  const joinCode = await generateUniqueJoinCode();
  const tenant = await prisma.tenant.create({
    data: {
      name: orgName.trim(),
      slug,
      joinCode,
      ownerId,
      memberships: {
        create: { userId: ownerId, role: 'OWNER' },
      },
      // Provision the tenant subscription atomically so a freshly-promoted owner
      // is never 402-locked waiting on a second admin action.
      subscription: {
        create: { planId, status: 'ACTIVE', source: 'ADMIN' },
      },
    },
  });
  return { tenantId: tenant.id };
}

export async function getTenantForOwner(ownerId: string) {
  let tenant = await prisma.tenant.findFirst({ where: { ownerId } });
  if (!tenant) throw new AppError(404, 'Organization not found');
  // Backfill a join code for tenants created before join codes existed.
  if (!tenant.joinCode) {
    tenant = await prisma.tenant.update({
      where: { id: tenant.id },
      data: { joinCode: await generateUniqueJoinCode() },
    });
  }
  return formatTenant(tenant);
}

export async function regenerateJoinCode(ownerId: string) {
  const tenant = await prisma.tenant.findFirst({ where: { ownerId } });
  if (!tenant) throw new AppError(404, 'Organization not found');
  const updated = await prisma.tenant.update({
    where: { id: tenant.id },
    data: { joinCode: await generateUniqueJoinCode() },
  });
  return formatTenant(updated);
}

/**
 * A learner joins a tutor's class via its join code. Enforces the seat quota,
 * makes the user a TENANT_LEARNER, and (since a student belongs to one tutor)
 * deactivates any prior learner memberships in other tenants.
 */
/**
 * Signup pre-flight: resolve a join code and confirm the class can actually take someone,
 * WITHOUT touching any user.
 *
 * Registration creates the account first and joins second, so every rule that only
 * `joinTenantByCode` enforced fired *after* the insert — and nothing rolled it back. Signing up
 * for a class that was already full left a stranded INDIVIDUAL account holding the email
 * hostage: retrying returned "Email already registered", and the app has no join-class screen
 * to recover through.
 *
 * Lives here rather than in the auth controller so join rules stay in the tenant service.
 * `joinTenantByCode` keeps its own checks — it is the authoritative join for
 * `POST /auth/join-class`, which calls the service directly. Checking twice is the existing
 * pattern; see createStudent's unconditional up-front seat assert.
 */
export async function assertJoinableByCode(joinCode: string): Promise<{ tenantId: string }> {
  const code = joinCode.trim().toUpperCase();
  if (!code) throw new AppError(400, 'Join code required');
  const tenant = await prisma.tenant.findUnique({ where: { joinCode: code } });
  if (!tenant) throw new AppError(404, 'Invalid join code');
  // Also runs requireActiveTenantSubscription, so a lapsed org is refused before the insert too.
  await assertTenantQuota(tenant.id, 'STUDENT');
  return { tenantId: tenant.id };
}

export async function joinTenantByCode(
  userId: string,
  joinCode: string,
): Promise<{ tenantId: string; tenantName: string }> {
  const code = joinCode.trim().toUpperCase();
  if (!code) throw new AppError(400, 'Join code required');
  const tenant = await prisma.tenant.findUnique({ where: { joinCode: code } });
  if (!tenant) throw new AppError(404, 'Invalid join code');
  if (tenant.ownerId === userId) throw new AppError(400, 'You own this organization');

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, 'User not found');
  if (user.role === 'TENANT_OWNER') throw new AppError(400, 'Tutors cannot join a class');
  if (user.role === 'ADMIN') throw new AppError(400, 'Admins cannot join a class');

  const existing = await prisma.tenantMembership.findUnique({
    where: { tenantId_userId: { tenantId: tenant.id, userId } },
  });
  if (existing?.active && user.role === 'TENANT_LEARNER') {
    return { tenantId: tenant.id, tenantName: tenant.name };
  }
  // Only consume a seat when (re)activating an inactive/absent membership.
  if (!existing?.active) {
    await assertTenantQuota(tenant.id, 'STUDENT');
  }
  await prisma.$transaction([
    prisma.tenantMembership.updateMany({
      where: { userId, role: 'LEARNER', tenantId: { not: tenant.id } },
      data: { active: false },
    }),
    prisma.tenantMembership.upsert({
      where: { tenantId_userId: { tenantId: tenant.id, userId } },
      create: { tenantId: tenant.id, userId, role: 'LEARNER' },
      update: { active: true, role: 'LEARNER' },
    }),
    prisma.user.update({ where: { id: userId }, data: { role: 'TENANT_LEARNER' } }),
  ]);
  return { tenantId: tenant.id, tenantName: tenant.name };
}

export async function patchTenantForOwner(ownerId: string, input: { name?: string }) {
  const body = patchTenantSchema.parse(input);
  const tenant = await prisma.tenant.findFirst({ where: { ownerId } });
  if (!tenant) throw new AppError(404, 'Organization not found');

  const updated = await prisma.tenant.update({
    where: { id: tenant.id },
    data: { ...(body.name ? { name: body.name } : {}) },
  });
  return formatTenant(updated);
}
