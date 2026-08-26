import { z } from 'zod';
import type { TutorRequestStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';
import { ORG_NAME_MAX, userText } from '../lib/user-text.js';
import { applyAdminRoleChange } from './adminUserRole.service.js';

const createSchema = z.object({
  orgName: userText({ min: 2, max: ORG_NAME_MAX }),
  // Optional, so min 0 — but still stripped and trimmed, since a NUL here 500s just the same.
  note: userText({ min: 0, max: 1000, multiline: true }).optional(),
});

const approveSchema = z.object({
  // null/omitted = use the plan default; an explicit limit must allow at least one
  // seat (0 would silently lock the tenant out of adding any students).
  seatLimit: z.number().int().min(1).max(100000).nullable().optional(),
});

function formatRequest(req: {
  id: string;
  userId: string;
  orgName: string;
  note: string | null;
  status: TutorRequestStatus;
  decidedAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: req.id,
    userId: req.userId,
    orgName: req.orgName,
    note: req.note,
    status: req.status,
    decidedAt: req.decidedAt?.toISOString() ?? null,
    createdAt: req.createdAt.toISOString(),
  };
}

/** Learner submits a request to become a tutor (creates a PENDING record). */
export async function createTutorRequest(userId: string, input: unknown) {
  const body = createSchema.parse(input ?? {});
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, 'User not found');
  if (user.role !== 'INDIVIDUAL') {
    throw new AppError(400, 'Only individual learners can request a tutor account.');
  }
  const pending = await prisma.tutorRequest.findFirst({ where: { userId, status: 'PENDING' } });
  if (pending) throw new AppError(409, 'You already have a pending tutor request.');

  const request = await prisma.tutorRequest.create({
    data: { userId, orgName: body.orgName.trim(), note: body.note?.trim() || null },
  });
  return formatRequest(request);
}

export async function getMyLatestTutorRequest(userId: string) {
  const request = await prisma.tutorRequest.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  return request ? formatRequest(request) : null;
}

export async function listTutorRequests(params: {
  status?: TutorRequestStatus;
  page: number;
  pageSize: number;
}) {
  const where = params.status ? { status: params.status } : {};
  const skip = (params.page - 1) * params.pageSize;
  const [total, items] = await Promise.all([
    prisma.tutorRequest.count({ where }),
    prisma.tutorRequest.findMany({
      where,
      skip,
      take: params.pageSize,
      // PENDING first, then newest.
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      include: { user: { select: { id: true, email: true, name: true, role: true } } },
    }),
  ]);
  return {
    items: items.map((r) => ({
      ...formatRequest(r),
      userEmail: r.user.email,
      userName: r.user.name,
      userRole: r.user.role,
    })),
    total,
    page: params.page,
    pageSize: params.pageSize,
  };
}

/**
 * Approve a pending request: promotes the user to TENANT_OWNER (which atomically
 * creates the tenant + an ACTIVE subscription), optionally sets a custom seat
 * limit, and marks the request APPROVED.
 */
export async function approveTutorRequest(requestId: string, adminId: string, input: unknown) {
  const body = approveSchema.parse(input ?? {});

  // Claim the request atomically instead of check-then-act. The read-then-write it replaced let
  // two concurrent approvals both pass the PENDING check, both find no tenant for the owner, and
  // both create one — colliding on Tenant.slug (a raw P2002, which the error middleware had no
  // branch for, so it surfaced as a bare 500), or, when the timing let the second slug attempt
  // see the first insert, quietly producing a SECOND org for the same owner. Nothing enforced
  // one-org-per-owner, and resolveTenantIdForUser/getTenantForOwner both use findFirst with no
  // ordering — so which org that tutor landed in, and where their students and join code went,
  // was arbitrary.
  //
  // A single UPDATE ... WHERE status='PENDING' row-locks in Postgres: the second statement blocks,
  // re-evaluates against the new row version, and matches zero rows.
  const claimedAt = new Date();
  const claim = await prisma.tutorRequest.updateMany({
    where: { id: requestId, status: 'PENDING' },
    data: { status: 'APPROVED', decidedById: adminId, decidedAt: claimedAt },
  });
  if (claim.count === 0) {
    const exists = await prisma.tutorRequest.findUnique({ where: { id: requestId } });
    throw exists ? new AppError(400, 'Request already decided') : new AppError(404, 'Request not found');
  }

  const request = await prisma.tutorRequest.findUnique({
    where: { id: requestId },
    include: { user: true },
  });
  if (!request) throw new AppError(404, 'Request not found');

  let tenantId: string | null;
  try {
    ({ tenantId } = await applyAdminRoleChange(request.userId, request.user.role, 'TENANT_OWNER', {
      orgName: request.orgName,
    }));

    // applyAdminRoleChange returns a null tenantId whenever the role did not actually change —
    // correct for its other caller, wrong here. If the user was ALREADY a TENANT_OWNER (an admin
    // promoted them first, or a previous approve died between the role update and the status
    // update), the null silently skipped the seat limit and recorded `tenantId: null` in the
    // audit log, while the response still said 200. Recover the org they own.
    if (!tenantId) {
      tenantId =
        (await prisma.tenant.findFirst({ where: { ownerId: request.userId }, select: { id: true } }))
          ?.id ?? null;
    }

    await prisma.user.update({ where: { id: request.userId }, data: { role: 'TENANT_OWNER' } });
    if (tenantId && body.seatLimit != null) {
      await prisma.tenant.update({ where: { id: tenantId }, data: { seatLimit: body.seatLimit } });
    }
  } catch (err) {
    // Release our own claim so a retry can succeed. Scoped on decidedById + decidedAt so this can
    // only ever un-claim the claim this call made. Without it, a failure here (getDefaultTenantPlanId
    // throws when the TENANT_STARTER plan is missing — a live risk given the prod plan drift) would
    // leave the request permanently APPROVED with no org behind it.
    await prisma.tutorRequest.updateMany({
      where: { id: requestId, status: 'APPROVED', decidedById: adminId, decidedAt: claimedAt },
      data: { status: 'PENDING', decidedById: null, decidedAt: null },
    });
    throw err;
  }

  const updated = await prisma.tutorRequest.findUniqueOrThrow({ where: { id: requestId } });
  return { request: formatRequest(updated), tenantId };
}

export async function rejectTutorRequest(requestId: string, adminId: string, note?: string) {
  const request = await prisma.tutorRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new AppError(404, 'Request not found');
  if (request.status !== 'PENDING') throw new AppError(400, 'Request already decided');

  const updated = await prisma.tutorRequest.update({
    where: { id: requestId },
    data: {
      status: 'REJECTED',
      decidedById: adminId,
      decidedAt: new Date(),
      note: note?.trim() || request.note,
    },
  });
  return formatRequest(updated);
}
