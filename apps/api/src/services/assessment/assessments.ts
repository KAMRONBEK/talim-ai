import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import {
  assignAssessmentSchema,
  createAssessmentSchema,
  formatAssessment,
} from './shared.js';

export async function listAssessments(tenantId: string) {
  const assessments = await prisma.tenantAssessment.findMany({
    where: { tenantId },
    include: { questions: true, assignments: true },
    orderBy: { createdAt: 'desc' },
  });
  return assessments.map(formatAssessment);
}

export async function createAssessment(tenantId: string, userId: string, input: unknown) {
  const body = createAssessmentSchema.parse(input ?? {});
  const questions = await prisma.bankQuestion.findMany({
    where: { id: { in: body.questionIds }, bank: { tenantId }, status: 'APPROVED' },
  });
  if (questions.length !== body.questionIds.length) throw new AppError(400, 'Invalid questions');

  const assessment = await prisma.tenantAssessment.create({
    data: {
      tenantId,
      bankId: body.bankId ?? questions[0]?.bankId ?? null,
      title: body.title,
      instructions: body.instructions ?? null,
      maxAttempts: body.maxAttempts,
      mode: body.mode,
      secondsPerQuestion: body.mode === 'GAME' ? (body.secondsPerQuestion ?? 20) : null,
      status: body.publish ? 'PUBLISHED' : 'DRAFT',
      createdById: userId,
      questions: {
        create: body.questionIds.map((questionId, index) => ({
          questionId,
          order: index,
        })),
      },
    },
    include: { questions: true, assignments: true },
  });
  return formatAssessment(assessment);
}

export async function assignAssessment(
  tenantId: string,
  userId: string,
  assessmentId: string,
  input: unknown,
) {
  const body = assignAssessmentSchema.parse(input ?? {});
  const assessment = await prisma.tenantAssessment.findFirst({
    where: { id: assessmentId, tenantId },
  });
  if (!assessment) throw new AppError(404, 'Assessment not found');
  // Only PUBLISHED assessments can be assigned: a DRAFT is filtered out of the learner's
  // PUBLISHED-only list (services/assessment/learner.ts) and 404s on submit, so assigning one
  // silently produces a dead assignment the owner gets no signal about.
  if (assessment.status !== 'PUBLISHED') {
    throw new AppError(400, 'Assessment must be published before it can be assigned');
  }

  if (body.contentId) {
    const content = await prisma.content.findFirst({ where: { id: body.contentId, tenantId } });
    if (!content) throw new AppError(404, 'Content not found');
  }
  if (body.sectionId) {
    if (!body.contentId) throw new AppError(400, 'contentId is required with sectionId');
    const section = await prisma.contentSection.findFirst({
      where: { id: body.sectionId, contentId: body.contentId, content: { tenantId } },
    });
    if (!section) throw new AppError(404, 'Section not found');
  }

  const assignments = [];
  for (const learnerId of body.learnerIds) {
    const membership = await prisma.tenantMembership.findFirst({
      where: { tenantId, userId: learnerId, role: 'LEARNER', active: true },
    });
    if (!membership) throw new AppError(400, `Invalid learner: ${learnerId}`);

    const existing = await prisma.assessmentAssignment.findFirst({
      where: { assessmentId, learnerId },
    });
    if (existing) continue;

    assignments.push(
      await prisma.assessmentAssignment.create({
        data: {
          assessmentId,
          learnerId,
          contentId: body.contentId ?? null,
          sectionId: body.sectionId ?? null,
          assignedById: userId,
          dueAt: body.dueAt ?? null,
        },
      }),
    );
  }
  return assignments;
}
