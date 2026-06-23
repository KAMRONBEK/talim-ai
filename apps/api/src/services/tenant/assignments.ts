import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import { assignmentSchema } from './shared.js';

export async function assignContent(
  tenantId: string,
  assignedById: string,
  input: unknown,
) {
  const body = assignmentSchema.parse(input);
  const [content, membership] = await Promise.all([
    prisma.content.findFirst({ where: { id: body.contentId, tenantId } }),
    prisma.tenantMembership.findFirst({
      where: { tenantId, userId: body.learnerId, role: 'LEARNER', active: true },
    }),
  ]);
  if (!content) throw new AppError(404, 'Content not found');
  if (!membership) throw new AppError(404, 'Student not found');

  const assignment = await prisma.contentAssignment.upsert({
    where: {
      contentId_learnerId: { contentId: body.contentId, learnerId: body.learnerId },
    },
    create: {
      contentId: body.contentId,
      learnerId: body.learnerId,
      assignedById,
    },
    update: {},
  });

  return {
    id: assignment.id,
    contentId: assignment.contentId,
    learnerId: assignment.learnerId,
    assignedById: assignment.assignedById,
    assignedAt: assignment.assignedAt.toISOString(),
  };
}

export async function unassignContent(tenantId: string, input: unknown) {
  const body = assignmentSchema.parse(input);
  const content = await prisma.content.findFirst({
    where: { id: body.contentId, tenantId },
  });
  if (!content) throw new AppError(404, 'Content not found');

  await prisma.contentAssignment.deleteMany({
    where: { contentId: body.contentId, learnerId: body.learnerId },
  });
}

export async function listContentAssignments(tenantId: string, contentId: string) {
  const content = await prisma.content.findFirst({ where: { id: contentId, tenantId } });
  if (!content) throw new AppError(404, 'Content not found');

  const rows = await prisma.contentAssignment.findMany({
    where: { contentId },
    include: { learner: { select: { id: true, email: true, name: true } } },
  });

  return rows.map((r) => ({
    id: r.id,
    contentId: r.contentId,
    learnerId: r.learnerId,
    learnerEmail: r.learner.email,
    learnerName: r.learner.name,
    assignedAt: r.assignedAt.toISOString(),
  }));
}
