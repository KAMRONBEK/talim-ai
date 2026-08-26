import { prisma } from '../../lib/prisma.js';
import { jobEvents } from '../events/jobEvents.service.js';
import { AppError } from '../../middleware/error.middleware.js';
import {
  assignAssessmentSchema,
  createAssessmentSchema,
  formatAssessment,
  goLiveAssessmentSchema,
  scheduleAssessmentSchema,
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
      strictScoring: body.strictScoring,
      wrongPenalty: body.wrongPenalty,
      partialCredit: body.partialCredit,
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

/** Set (or clear) the scheduled start of a live game — powers the learner "starts soon" banner. */
export async function scheduleAssessment(tenantId: string, assessmentId: string, input: unknown) {
  const body = scheduleAssessmentSchema.parse(input ?? {});
  const assessment = await prisma.tenantAssessment.findFirst({
    where: { id: assessmentId, tenantId },
  });
  if (!assessment) throw new AppError(404, 'Assessment not found');
  if (assessment.mode !== 'GAME') {
    throw new AppError(400, 'Only game assessments can be scheduled');
  }
  const updated = await prisma.tenantAssessment.update({
    where: { id: assessmentId },
    data: { scheduledAt: body.scheduledAt ?? null },
    include: { questions: true, assignments: true },
  });
  return formatAssessment(updated);
}

/** Start or end a live game session (isLive + optional auto-close time). */
export async function setAssessmentLive(tenantId: string, assessmentId: string, input: unknown) {
  const body = goLiveAssessmentSchema.parse(input ?? {});
  const assessment = await prisma.tenantAssessment.findFirst({
    where: { id: assessmentId, tenantId },
  });
  if (!assessment) throw new AppError(404, 'Assessment not found');
  if (assessment.mode !== 'GAME') {
    throw new AppError(400, 'Only game assessments can go live');
  }
  const goingLive = body.live !== false;
  // A live session must be takeable — learners only see PUBLISHED assessments.
  if (goingLive && assessment.status !== 'PUBLISHED') {
    throw new AppError(400, 'Publish the assessment before starting a live session');
  }
  const updated = await prisma.tenantAssessment.update({
    where: { id: assessmentId },
    data: goingLive
      ? { isLive: true, liveEndsAt: body.liveEndsAt ?? null }
      : { isLive: false },
    include: { questions: true, assignments: true },
  });

  // Push the state change to the students it concerns. The tutor's own screen promises
  // "students will see the join banner on their dashboard" — but a learner already
  // sitting on that dashboard, which is exactly where a class waits when the tutor says
  // "we're starting now", saw nothing until they reloaded by hand.
  //
  // Fan-out mirrors the leaderboard.update path: assigned learners plus the owner, so
  // the tutor's own list stays correct too. Delivery must never break go-live, so every
  // failure is swallowed — a missed push costs a manual refresh, a thrown one costs the
  // lesson.
  try {
    const assignees = await prisma.assessmentAssignment.findMany({
      where: { assessmentId, learnerId: { not: null } },
      select: { learnerId: true },
      distinct: ['learnerId'],
    });
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { ownerId: true },
    });
    const recipients = new Set<string>();
    if (tenant) recipients.add(tenant.ownerId);
    for (const a of assignees) if (a.learnerId) recipients.add(a.learnerId);
    for (const recipient of recipients) {
      jobEvents.publish(recipient, {
        type: 'assessment.live',
        assessmentId,
        tenantId,
        isLive: goingLive,
      });
    }
  } catch (err) {
    console.error('setAssessmentLive: live event publish failed', err);
  }

  return formatAssessment(updated);
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
