import type { MasteryDelta } from '@talim/types';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import { jobEvents } from '../events/jobEvents.service.js';
import {
  answerToString,
  assertLearnerAssignment,
  computeGamePoints,
  gradeQuestion,
  jsonStringArray,
  parseQuestionConfig,
  submitAssessmentSchema,
} from './shared.js';
import { recordAnswers, type AnswerEvidence } from '../sectionMastery.service.js';
import { applyAiJudgeToGrades, bankQuestionKey } from '../answerJudge.service.js';
import { getAssessmentLeaderboard } from './results.js';

export async function listLearnerAssessments(tenantId: string, userId: string) {
  const assignments = await prisma.assessmentAssignment.findMany({
    where: {
      learnerId: userId,
      assessment: { tenantId, status: 'PUBLISHED' },
    },
    include: {
      assessment: {
        include: {
          questions: { include: { question: true }, orderBy: { order: 'asc' } },
          attempts: { where: { userId }, orderBy: { submittedAt: 'desc' } },
        },
      },
    },
    orderBy: { assignedAt: 'desc' },
  });

  // Earliest (soft) due date per assessment — a learner may hold multiple assignment
  // rows for one assessment (e.g. per content/section); surface the nearest deadline.
  const dueByAssessment = new Map<string, Date>();
  for (const a of assignments) {
    if (!a.dueAt) continue;
    const current = dueByAssessment.get(a.assessmentId);
    if (!current || a.dueAt < current) dueByAssessment.set(a.assessmentId, a.dueAt);
  }

  const seen = new Set<string>();
  return assignments
    .map((a) => a.assessment)
    .filter((a) => {
      if (seen.has(a.id)) return false;
      seen.add(a.id);
      return true;
    })
    .map((a) => ({
      id: a.id,
      title: a.title,
      instructions: a.instructions,
      maxAttempts: a.maxAttempts,
      mode: a.mode,
      secondsPerQuestion: a.secondsPerQuestion,
      scheduledAt: a.scheduledAt?.toISOString() ?? null,
      isLive: a.isLive,
      liveEndsAt: a.liveEndsAt?.toISOString() ?? null,
      dueAt: dueByAssessment.get(a.id)?.toISOString() ?? null,
      attemptCount: a.attempts.length,
      latestScore: a.attempts[0]?.score ?? null,
      latestPoints: a.attempts[0]?.pointsTotal ?? null,
      questions: a.questions.map(({ question }) => ({
        id: question.id,
        type: question.type,
        prompt: question.prompt,
        options: question.options ? jsonStringArray(question.options) : null,
        config: parseQuestionConfig(question.config),
      })),
    }));
}

export async function submitLearnerAssessment(
  tenantId: string,
  userId: string,
  assessmentId: string,
  input: unknown,
) {
  const body = submitAssessmentSchema.parse(input ?? {});
  await assertLearnerAssignment(tenantId, userId, assessmentId);

  // Enforce the due date. A learner may hold multiple assignment rows for one assessment
  // (per content/section), so the effective deadline is the earliest non-null dueAt —
  // exactly the value listLearnerAssessments surfaces to the UI. Past that instant we
  // block late submissions for both WRITTEN and GAME modes; a null dueAt never blocks.
  const dueAssignments = await prisma.assessmentAssignment.findMany({
    where: { assessmentId, learnerId: userId, assessment: { tenantId } },
    select: { dueAt: true },
  });
  let dueAt: Date | null = null;
  for (const a of dueAssignments) {
    if (!a.dueAt) continue;
    if (!dueAt || a.dueAt < dueAt) dueAt = a.dueAt;
  }
  if (dueAt && Date.now() > dueAt.getTime()) {
    throw new AppError(403, 'This assessment is past its due date and no longer accepts submissions');
  }

  const assessment = await prisma.tenantAssessment.findFirst({
    where: { id: assessmentId, tenantId, status: 'PUBLISHED' },
    include: {
      questions: { include: { question: true }, orderBy: { order: 'asc' } },
    },
  });
  if (!assessment) throw new AppError(404, 'Assessment not found');

  // Reject over-limit submissions before doing any grading work.
  const priorAttempts = await prisma.assessmentAttempt.count({ where: { assessmentId, userId } });
  if (priorAttempts >= assessment.maxAttempts) {
    throw new AppError(409, 'Attempt limit reached');
  }

  const isGame = assessment.mode === 'GAME';
  const limitSec = assessment.secondsPerQuestion ?? 30;
  // Strict scoring is opt-in. When OFF, the percentage/game path below is byte-for-byte
  // unchanged and the strict-only fields (pointsEarned/maxPoints/creditFraction) stay null.
  const strict = assessment.strictScoring;

  let correct = 0;
  let pointsTotal = 0;
  let streak = 0;
  let maxStreak = 0;
  // Strict-scoring accumulators — signed points sum and max attainable points.
  let attemptPointsEarned = 0;
  let maxPoints = 0;
  const results: Array<{
    questionId: string;
    correct: boolean;
    submittedAnswer: string;
    acceptableAnswers: string[];
    explanation: string | null;
    pointsAwarded: number;
    creditFraction?: number | null;
    pointsEarned?: number | null;
  }> = [];
  const answerDetails: Array<{
    questionId: string;
    answer: string;
    correct: boolean;
    responseMs: number | null;
    pointsAwarded: number;
    creditFraction?: number | null;
    pointsEarned?: number | null;
  }> = [];
  // Elo-KT mastery evidence, grouped by the source material each question came from.
  // (Speed points and streaks stay out of mastery — correctness only.)
  const masteryByContent = new Map<string, AnswerEvidence[]>();

  // Pass 1: deterministic grading (exact + typo tolerance). Written answers the engine
  // rejects get a second, semantic pass through the AI judge; its verdicts must land
  // BEFORE the scoring loop because streaks and game points depend on question order.
  // The judge fails open — grading never breaks on an AI failure.
  const graded = assessment.questions.map((aq) => {
    const raw = body.answers[aq.question.id];
    return {
      aq,
      submitted: answerToString(raw),
      acceptable: jsonStringArray(aq.question.acceptableAnswers),
      grade: gradeQuestion(aq.question, raw, assessment.partialCredit),
    };
  });
  await applyAiJudgeToGrades(
    graded.map(({ aq, submitted, acceptable, grade }) => ({
      key: bankQuestionKey(aq.question.id),
      type: aq.question.type,
      prompt: aq.question.prompt,
      referenceAnswers: acceptable,
      explanation: aq.question.explanation,
      answer: submitted,
      grade,
    })),
    { usage: { userId, tenantId } },
  );

  for (const { aq, submitted, acceptable, grade } of graded) {
    const question = aq.question;
    const ok = grade.correct;
    let points = 0;
    if (ok) {
      correct += 1;
      streak += 1;
      maxStreak = Math.max(maxStreak, streak);
      if (isGame) {
        points = computeGamePoints(body.timings?.[question.id], limitSec, streak);
        pointsTotal += points;
      }
    } else {
      streak = 0;
    }

    // Strict weighted points: partial credit scales up, a wrong (answered) response is
    // penalized, and a blank scores 0. Left null entirely when strict scoring is off.
    let creditFraction: number | null = null;
    let questionPointsEarned: number | null = null;
    if (strict) {
      const qPoints = aq.points ?? 1;
      maxPoints += qPoints;
      creditFraction = grade.creditFraction;
      if (grade.creditFraction > 0) {
        questionPointsEarned = grade.creditFraction * qPoints;
      } else if (grade.answered) {
        questionPointsEarned = -assessment.wrongPenalty * qPoints;
      } else {
        questionPointsEarned = 0;
      }
      attemptPointsEarned += questionPointsEarned;
    }

    answerDetails.push({
      questionId: question.id,
      answer: submitted,
      correct: ok,
      responseMs: body.timings?.[question.id] ?? null,
      pointsAwarded: points,
      ...(strict ? { creditFraction, pointsEarned: questionPointsEarned } : {}),
    });
    results.push({
      questionId: question.id,
      correct: ok,
      submittedAnswer: submitted,
      acceptableAnswers: acceptable,
      explanation: question.explanation,
      pointsAwarded: points,
      ...(strict ? { creditFraction, pointsEarned: questionPointsEarned } : {}),
    });

    if (question.sourceContentId) {
      const list = masteryByContent.get(question.sourceContentId) ?? [];
      list.push({
        itemKey: `bank:${question.id}`,
        sectionId: question.sourceSectionId,
        questionType: question.type,
        options: question.options,
        credit: grade.creditFraction,
        declaredDifficulty: question.difficulty,
      });
      masteryByContent.set(question.sourceContentId, list);
    }
  }

  const total = assessment.questions.length;
  const score = total > 0 ? (correct / total) * 100 : 0;

  const attempt = await prisma.$transaction(async (tx) => {
    const attemptCount = await tx.assessmentAttempt.count({ where: { assessmentId, userId } });
    if (attemptCount >= assessment.maxAttempts) {
      throw new AppError(409, 'Attempt limit reached');
    }
    return tx.assessmentAttempt.create({
      data: {
        assessmentId,
        userId,
        answers: body.answers,
        score,
        pointsTotal,
        maxStreak,
        durationMs: body.durationMs ?? null,
        status: 'GRADED',
        ...(strict ? { pointsEarned: attemptPointsEarned, maxPoints } : {}),
        answerDetails: { create: answerDetails },
      },
    });
  });

  // Elo-KT mastery update — must never break a submission, so failures are swallowed.
  let masteryDeltas: MasteryDelta[] = [];
  try {
    for (const [contentId, evidence] of masteryByContent) {
      masteryDeltas = masteryDeltas.concat(await recordAnswers(userId, contentId, evidence));
    }
  } catch (err) {
    console.error('submitLearnerAssessment: mastery update failed', err);
  }

  // Live leaderboard: nudge everyone in this tenant who may be watching (the owner and
  // every learner assigned to this assessment) to refetch, so the board updates in
  // real time instead of only for the submitter. The SSE bus is keyed per user, so we
  // fan out over the recipient set. Event delivery must never break a submission, so any
  // failure here is swallowed (mirrors the "job success can't depend on delivery" rule).
  try {
    const [tenant, assignees] = await Promise.all([
      prisma.tenant.findUnique({ where: { id: tenantId }, select: { ownerId: true } }),
      prisma.assessmentAssignment.findMany({
        where: { assessmentId, learnerId: { not: null } },
        select: { learnerId: true },
        distinct: ['learnerId'],
      }),
    ]);
    const recipients = new Set<string>([userId]);
    if (tenant) recipients.add(tenant.ownerId);
    for (const a of assignees) if (a.learnerId) recipients.add(a.learnerId);
    for (const recipient of recipients) {
      jobEvents.publish(recipient, { type: 'leaderboard.update', assessmentId, tenantId });
    }
  } catch (err) {
    console.error('submitLearnerAssessment: leaderboard event publish failed', err);
  }

  return {
    attempt: {
      id: attempt.id,
      assessmentId,
      score,
      pointsTotal: attempt.pointsTotal,
      maxStreak: attempt.maxStreak,
      status: attempt.status,
      submittedAt: attempt.submittedAt.toISOString(),
      ...(strict ? { pointsEarned: attempt.pointsEarned, maxPoints: attempt.maxPoints } : {}),
    },
    correct,
    total,
    results,
    masteryDeltas,
  };
}

/** Leaderboard for a learner — only for assessments assigned to them. */
export async function getLearnerAssessmentLeaderboard(
  tenantId: string,
  userId: string,
  assessmentId: string,
) {
  await assertLearnerAssignment(tenantId, userId, assessmentId);
  return getAssessmentLeaderboard(tenantId, assessmentId);
}
