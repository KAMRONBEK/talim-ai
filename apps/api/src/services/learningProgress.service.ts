import type { Quiz, QuizAttempt, QuestionType } from '@prisma/client';
import { AppError } from '../middleware/error.middleware.js';
import { prisma } from '../lib/prisma.js';
import { generateJsonCompletion } from './ai.service.js';
import { getSectionBody } from './section.service.js';
import { gradeQuestion, resolveAcceptedAnswers } from '@talim/types';
import { applyAiJudgeToGrades, quizQuestionKey } from './answerJudge.service.js';
import {
  LEARNING_COVERAGE_SYSTEM_PROMPT,
  buildLearningCoverageUserPrompt,
  type CoverageQuestionResult,
} from '../lib/learning-coverage-prompt.js';

const SECTION_COMPLETE_THRESHOLD = 70;

function todayUtcDate(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function recordLearningActivity(userId: string): Promise<void> {
  const date = todayUtcDate();
  await prisma.learningActivityDay.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date },
    update: {},
  });
}

export async function computeStreakDays(userId: string): Promise<number> {
  const days = await prisma.learningActivityDay.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    take: 365,
  });

  if (days.length === 0) return 0;

  let streak = 0;
  const check = todayUtcDate();

  for (const row of days) {
    const rowDate = new Date(row.date);
    const diff = Math.round((check.getTime() - rowDate.getTime()) / 86400000);
    if (diff === streak) {
      streak++;
    } else if (diff === streak + 1 && streak === 0) {
      // Allow starting streak from yesterday if no activity today yet
      streak++;
      check.setUTCDate(check.getUTCDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export async function markSectionViewed(
  userId: string,
  contentId: string,
  sectionId: string,
): Promise<void> {
  const section = await prisma.contentSection.findFirst({
    where: { id: sectionId, contentId },
  });
  if (!section) throw new AppError(400, 'Section not found for this content');

  const now = new Date();

  await prisma.sectionProgress.upsert({
    where: { userId_sectionId: { userId, sectionId } },
    create: {
      userId,
      sectionId,
      contentId,
      viewedAt: now,
    },
    update: { viewedAt: now },
  });

  await prisma.contentProgress.upsert({
    where: { userId_contentId: { userId, contentId } },
    create: {
      userId,
      contentId,
      lastSectionId: sectionId,
      lastActivityAt: now,
    },
    update: {
      lastSectionId: sectionId,
      lastActivityAt: now,
    },
  });

  await recordLearningActivity(userId);
  await recalculateContentProgress(userId, contentId);
}

async function estimateAiCoverage(
  sectionTitle: string,
  sectionExcerpt: string,
  results: CoverageQuestionResult[],
): Promise<{ coverageScore: number; feedback: string } | null> {
  try {
    const result = await generateJsonCompletion<{ coverageScore: number; feedback: string }>([
      { role: 'system', content: LEARNING_COVERAGE_SYSTEM_PROMPT },
      {
        role: 'user',
        content: buildLearningCoverageUserPrompt(sectionTitle, sectionExcerpt, results),
      },
    ]);
    const score = Math.max(0, Math.min(100, Math.round(result.coverageScore ?? 0)));
    return { coverageScore: score, feedback: result.feedback ?? '' };
  } catch {
    return null;
  }
}

async function computeBestFullQuizScore(userId: string, sectionId: string): Promise<number | null> {
  const attempts = await prisma.quizAttempt.findMany({
    where: {
      userId,
      quiz: { sectionId, kind: 'FULL' },
    },
    orderBy: { score: 'desc' },
    take: 1,
  });
  return attempts[0]?.score ?? null;
}

function blendCoverageScore(params: {
  quizBestScore: number | null;
  viewedAt: Date | null;
  aiEstimate: number | null;
}): number {
  const quizComponent = params.quizBestScore ?? 0;
  const viewedBonus = params.viewedAt ? 100 : 0;
  const aiEstimate = params.aiEstimate ?? quizComponent;

  // QUICK quizzes are fully retired (legacy rows were relabeled FULL by the
  // 20260712000000_retire_quick_quizzes migration), so the old 30% quick-check
  // weight is permanently folded into the quiz and AI components.
  const blended = 0.6 * quizComponent + 0.1 * viewedBonus + 0.3 * aiEstimate;

  return Math.round(Math.max(0, Math.min(100, blended)) * 10) / 10;
}

async function recalculateContentProgress(userId: string, contentId: string): Promise<void> {
  const sections = await prisma.contentSection.findMany({
    where: { contentId },
    select: { id: true },
  });

  if (sections.length === 0) {
    await prisma.contentProgress.upsert({
      where: { userId_contentId: { userId, contentId } },
      create: { userId, contentId, overallCoverage: 0 },
      update: { overallCoverage: 0 },
    });
    return;
  }

  const sectionProgress = await prisma.sectionProgress.findMany({
    where: {
      userId,
      sectionId: { in: sections.map((s) => s.id) },
    },
  });

  const scoreMap = new Map(sectionProgress.map((s) => [s.sectionId, s.coverageScore]));
  const total = sections.reduce((sum, s) => sum + (scoreMap.get(s.id) ?? 0), 0);
  const overall = Math.round((total / sections.length) * 10) / 10;

  await prisma.contentProgress.upsert({
    where: { userId_contentId: { userId, contentId } },
    create: { userId, contentId, overallCoverage: overall },
    update: { overallCoverage: overall },
  });
}

type QuizWithQuestions = Quiz & {
  questions: {
    id: string;
    question: string;
    type: QuestionType;
    options: unknown;
    correctAnswer: string;
    acceptableAnswers: unknown;
    config?: unknown;
    explanation: string | null;
  }[];
};

async function buildCoverageResults(
  questions: QuizWithQuestions['questions'],
  answers: Record<string, string>,
): Promise<CoverageQuestionResult[]> {
  const graded = questions.map((q) => {
    // Stored answers are canonical strings (structured values JSON-stringified); the shared
    // grading engine parses and grades every question type, so the correctness flags fed to
    // the AI coverage estimate stay accurate for the full type set.
    const selected = answers[q.id] ?? '';
    const accepted = resolveAcceptedAnswers(q.acceptableAnswers, q.correctAnswer);
    const grade = gradeQuestion(
      { type: q.type, options: q.options, acceptableAnswers: accepted, config: q.config },
      selected,
      /* partialCredit */ true,
    );
    return { q, selected, accepted, grade };
  });

  // Cached AI verdicts only — this runs right after submit populated the cache, so a
  // written answer the judge accepted must count as correct here too (coverage and the
  // score the learner saw have to agree).
  await applyAiJudgeToGrades(
    graded.map(({ q, selected, accepted, grade }) => ({
      key: quizQuestionKey(q.id),
      type: q.type,
      prompt: q.question,
      referenceAnswers: accepted,
      explanation: q.explanation,
      answer: selected,
      grade,
    })),
    { cachedOnly: true },
  );

  return graded.map(({ q, selected, grade }) => ({
    question: q.question,
    selectedAnswer: selected,
    correct: grade.correct,
    explanation: q.explanation,
  }));
}

async function isLatestSectionAttempt(
  userId: string,
  sectionId: string,
  attemptId: string,
): Promise<boolean> {
  const latest = await prisma.quizAttempt.findFirst({
    where: { userId, quiz: { sectionId } },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });
  return latest?.id === attemptId;
}

async function persistSectionProgress(
  userId: string,
  quiz: QuizWithQuestions,
  aiEstimate: number | null,
  aiFeedback: string | null,
  options?: { preventDowngrade?: boolean },
): Promise<void> {
  if (!quiz.sectionId) return;

  const existing = await prisma.sectionProgress.findUnique({
    where: { userId_sectionId: { userId, sectionId: quiz.sectionId } },
  });

  const quizBestScore = await computeBestFullQuizScore(userId, quiz.sectionId);

  let coverageScore = blendCoverageScore({
    quizBestScore,
    viewedAt: existing?.viewedAt ?? null,
    aiEstimate,
  });

  if (options?.preventDowngrade && existing != null) {
    coverageScore = Math.max(existing.coverageScore, coverageScore);
  }

  await prisma.sectionProgress.upsert({
    where: { userId_sectionId: { userId, sectionId: quiz.sectionId } },
    create: {
      userId,
      sectionId: quiz.sectionId,
      contentId: quiz.contentId,
      coverageScore,
      quizBestScore,
      aiFeedback,
    },
    update: {
      coverageScore,
      quizBestScore,
      aiFeedback: aiFeedback ?? existing?.aiFeedback ?? null,
    },
  });

  await prisma.contentProgress.upsert({
    where: { userId_contentId: { userId, contentId: quiz.contentId } },
    create: {
      userId,
      contentId: quiz.contentId,
      lastActivityAt: new Date(),
    },
    update: { lastActivityAt: new Date() },
  });

  await recordLearningActivity(userId);
  await recalculateContentProgress(userId, quiz.contentId);
}

async function refineSectionProgressWithAi(
  userId: string,
  quiz: QuizWithQuestions,
  answers: Record<string, string>,
  attemptId: string,
): Promise<void> {
  if (!quiz.sectionId) return;

  const section = await prisma.contentSection.findUnique({
    where: { id: quiz.sectionId },
  });
  if (!section) return;

  const results = await buildCoverageResults(quiz.questions, answers);

  let sectionExcerpt = '';
  try {
    sectionExcerpt = await getSectionBody(quiz.contentId, quiz.sectionId);
  } catch {
    sectionExcerpt = '';
  }

  const aiResult = await estimateAiCoverage(section.title, sectionExcerpt, results);
  if (!aiResult) return;

  if (!(await isLatestSectionAttempt(userId, quiz.sectionId, attemptId))) return;

  await persistSectionProgress(userId, quiz, aiResult.coverageScore, aiResult.feedback, {
    preventDowngrade: true,
  });
}

export async function updateProgressAfterQuizSubmit(
  userId: string,
  quiz: QuizWithQuestions,
  attempt: QuizAttempt,
  answers: Record<string, string>,
): Promise<void> {
  // Whole-material quizzes (sectionId null) have no section-coverage row to update, but
  // they still count as learning activity for the streak.
  await recordLearningActivity(userId);
  if (!quiz.sectionId) return;

  const section = await prisma.contentSection.findUnique({
    where: { id: quiz.sectionId },
  });
  if (!section) return;

  await persistSectionProgress(userId, quiz, null, null);
  void refineSectionProgressWithAi(userId, quiz, answers, attempt.id).catch((err: unknown) => {
    console.error('AI progress refinement failed:', err);
  });
}

export { SECTION_COMPLETE_THRESHOLD };
