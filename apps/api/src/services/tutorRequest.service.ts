import { z } from 'zod';
import type { TutorRequestStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';
import { applyAdminRoleChange } from './adminUserRole.service.js';

const createSchema = z.object({
  orgName: z.string().min(2).max(120),
  note: z.string().max(1000).optional(),
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
  const request = await prisma.tutorRequest.findUnique({
    where: { id: requestId },
    include: { user: true },
  });
  if (!request) throw new AppError(404, 'Request not found');
  if (request.status !== 'PENDING') throw new AppError(400, 'Request already decided');

  const { tenantId } = await applyAdminRoleChange(
    request.userId,
    request.user.role,
    'TENANT_OWNER',
    { orgName: request.orgName },
  );
  await prisma.user.update({ where: { id: request.userId }, data: { role: 'TENANT_OWNER' } });
  if (tenantId && body.seatLimit != null) {
    await prisma.tenant.update({ where: { id: tenantId }, data: { seatLimit: body.seatLimit } });
  }

  const updated = await prisma.tutorRequest.update({
    where: { id: requestId },
    data: { status: 'APPROVED', decidedById: adminId, decidedAt: new Date() },
  });
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
