import type { Prisma } from '@prisma/client';
import type { UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';
import type { AuthPayload } from '../middleware/auth.middleware.js';

export async function resolveTenantIdForUser(
  userId: string,
  role: UserRole,
): Promise<string | null> {
  if (role === 'TENANT_OWNER') {
    const tenant = await prisma.tenant.findFirst({ where: { ownerId: userId } });
    return tenant?.id ?? null;
  }
  if (role === 'TENANT_LEARNER') {
    const membership = await prisma.tenantMembership.findFirst({
      where: { userId, role: 'LEARNER', active: true },
    });
    return membership?.tenantId ?? null;
  }
  return null;
}

export async function getAssignedContentIds(
  learnerId: string,
  tenantId?: string,
): Promise<string[]> {
  const rows = await prisma.contentAssignment.findMany({
    where: {
      learnerId,
      // Scope to a single tenant's materials so a learner who switched tutors
      // never sees assignments that survived from a former tenant.
      ...(tenantId ? { content: { tenantId } } : {}),
    },
    select: { contentId: true },
  });
  return rows.map((r) => r.contentId);
}

export async function buildContentListWhere(user: AuthPayload): Promise<Prisma.ContentWhereInput> {
  if (user.role === 'INDIVIDUAL') {
    return { userId: user.userId, tenantId: null };
  }
  if (user.role === 'TENANT_LEARNER') {
    // Only expose assigned content while the learner's membership is active, and
    // only content owned by their CURRENT tenant. ContentAssignment rows are not
    // deleted when a learner is deactivated or switches tutors via a join code,
    // so without the tenant scope the list endpoint would leak a former tenant's
    // content metadata.
    const activeMembership = await prisma.tenantMembership.findFirst({
      where: { userId: user.userId, role: 'LEARNER', active: true },
      select: { tenantId: true },
    });
    if (!activeMembership) return { id: { in: [] } };
    const ids = await getAssignedContentIds(user.userId, activeMembership.tenantId);
    return { id: { in: ids } };
  }
  throw new AppError(403, 'Use /api/tenant/content for organization materials');
}

export function assertIndividualContentRoute(user: AuthPayload): void {
  if (user.role === 'TENANT_OWNER') {
    throw new AppError(403, 'Use /api/tenant/content for organization materials');
  }
}

export function assertCanMutateContent(user: AuthPayload): void {
  if (user.role === 'TENANT_LEARNER') {
    throw new AppError(403, 'Learners cannot upload or generate content');
  }
  assertIndividualContentRoute(user);
}

export function assertCanGenerate(user: AuthPayload): void {
  if (user.role === 'TENANT_LEARNER') {
    throw new AppError(403, 'Learners cannot generate content');
  }
}

export async function assertCanAccessContent(
  user: AuthPayload,
  contentId: string,
  options?: { requireReady?: boolean },
): Promise<{
  id: string;
  userId: string;
  tenantId: string | null;
  type: string;
  title: string;
  url: string | null;
  storagePath: string | null;
  status: string;
}> {
  let content:
    | {
        id: string;
        userId: string;
        tenantId: string | null;
        type: string;
        title: string;
        url: string | null;
        storagePath: string | null;
        status: string;
      }
    | null
    | undefined;

  if (user.role === 'INDIVIDUAL') {
    content = await prisma.content.findFirst({
      where: { id: contentId, userId: user.userId, tenantId: null },
    });
  } else if (user.role === 'TENANT_OWNER' && user.tenantId) {
    content = await prisma.content.findFirst({
      where: { id: contentId, tenantId: user.tenantId },
    });
  } else if (user.role === 'TENANT_LEARNER') {
    const assignment = await prisma.contentAssignment.findFirst({
      where: { contentId, learnerId: user.userId },
      include: { content: true },
    });
    // A learner may only access assigned content while their tenant membership
    // is still active — a deactivated/removed student loses access immediately,
    // not only once their JWT expires.
    if (assignment?.content?.tenantId) {
      const activeMembership = await prisma.tenantMembership.findFirst({
        where: {
          userId: user.userId,
          tenantId: assignment.content.tenantId,
          role: 'LEARNER',
          active: true,
        },
        select: { id: true },
      });
      if (activeMembership) content = assignment.content;
    }
  } else {
    throw new AppError(403, 'Use /api/tenant/content for organization materials');
  }

  if (!content) throw new AppError(404, 'Content not found');
  if (options?.requireReady && content.status !== 'READY') {
    throw new AppError(404, 'Content not found or not ready');
  }
  return content;
}

export async function assertTenantOwnsContent(tenantId: string, contentId: string) {
  const content = await prisma.content.findFirst({
    where: { id: contentId, tenantId },
  });
  if (!content) throw new AppError(404, 'Content not found');
  return content;
}
