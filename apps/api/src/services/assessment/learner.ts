import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import {
  answerToString,
  assertLearnerAssignment,
  computeGamePoints,
  gradeQuestion,
  jsonStringArray,
  parseQuestionConfig,
  submitAssessmentSchema,
} from './shared.js';
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

  for (const aq of assessment.questions) {
    const question = aq.question;
    const raw = body.answers[question.id];
    const grade = gradeQuestion(question, raw, assessment.partialCredit);
    const ok = grade.correct;
    const submitted = answerToString(raw);
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
      acceptableAnswers: jsonStringArray(question.acceptableAnswers),
      explanation: question.explanation,
      pointsAwarded: points,
      ...(strict ? { creditFraction, pointsEarned: questionPointsEarned } : {}),
    });
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
