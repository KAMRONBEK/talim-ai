import { z } from 'zod';
import { Prisma, type BankQuestionStatus, type QuestionType } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';
import { generateJsonCompletion } from './ai.service.js';
import { buildRagContext } from './rag.service.js';
import {
  ASSESSMENT_SYSTEM_PROMPT,
  buildAssessmentPrompt,
  normalizeQuestionType,
} from '../lib/assessment-prompt.js';

const createBankSchema = z.object({
  title: z.string().min(1),
  topic: z.string().min(1).optional(),
});

const generateSchema = z.object({
  topic: z.string().min(1).optional(),
  contentId: z.string().min(1).optional(),
  sectionId: z.string().min(1).optional(),
  count: z.number().int().min(1).max(30).default(12),
});

const patchQuestionSchema = z.object({
  prompt: z.string().min(1).optional(),
  type: z.enum(['SHORT_ANSWER', 'NUMERIC', 'MULTIPLE_CHOICE']).optional(),
  options: z.array(z.string()).nullable().optional(),
  acceptableAnswers: z.array(z.string()).min(1).optional(),
  explanation: z.string().nullable().optional(),
  status: z.enum(['DRAFT', 'APPROVED', 'REJECTED']).optional(),
});

const createAssessmentSchema = z.object({
  bankId: z.string().min(1).optional(),
  title: z.string().min(1),
  instructions: z.string().optional(),
  maxAttempts: z.number().int().min(1).max(5).default(1),
  questionIds: z.array(z.string()).min(1),
  publish: z.boolean().default(true),
});

const assignAssessmentSchema = z.object({
  learnerIds: z.array(z.string()).min(1),
  contentId: z.string().min(1).optional(),
  sectionId: z.string().min(1).optional(),
});

const submitAssessmentSchema = z.object({
  answers: z.record(z.string(), z.string()),
});

interface GeneratedQuestion {
  type?: string;
  prompt: string;
  options?: string[] | null;
  acceptableAnswers?: string[];
  explanation?: string | null;
}

function jsonStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

function formatBank(bank: {
  id: string;
  tenantId: string;
  title: string;
  topic: string | null;
  createdById: string;
  createdAt: Date;
  questions?: { status: BankQuestionStatus }[];
}) {
  const questions = bank.questions ?? [];
  return {
    id: bank.id,
    tenantId: bank.tenantId,
    title: bank.title,
    topic: bank.topic,
    createdById: bank.createdById,
    createdAt: bank.createdAt.toISOString(),
    questionCount: questions.length,
    approvedCount: questions.filter((q) => q.status === 'APPROVED').length,
  };
}

function formatQuestion(question: {
  id: string;
  bankId: string;
  type: QuestionType;
  prompt: string;
  options: unknown;
  acceptableAnswers: unknown;
  explanation: string | null;
  status: BankQuestionStatus;
  sourceContentId: string | null;
  sourceSectionId: string | null;
  createdAt: Date;
}) {
  return {
    id: question.id,
    bankId: question.bankId,
    type: question.type,
    prompt: question.prompt,
    options: question.options ? jsonStringArray(question.options) : null,
    acceptableAnswers: jsonStringArray(question.acceptableAnswers),
    explanation: question.explanation,
    status: question.status,
    sourceContentId: question.sourceContentId,
    sourceSectionId: question.sourceSectionId,
    createdAt: question.createdAt.toISOString(),
  };
}

function formatAssessment(assessment: {
  id: string;
  tenantId: string;
  bankId: string | null;
  title: string;
  instructions: string | null;
  maxAttempts: number;
  status: 'DRAFT' | 'PUBLISHED';
  createdAt: Date;
  questions?: unknown[];
  assignments?: unknown[];
}) {
  return {
    id: assessment.id,
    tenantId: assessment.tenantId,
    bankId: assessment.bankId,
    title: assessment.title,
    instructions: assessment.instructions,
    maxAttempts: assessment.maxAttempts,
    status: assessment.status,
    createdAt: assessment.createdAt.toISOString(),
    questionCount: assessment.questions?.length ?? 0,
    assignmentCount: assessment.assignments?.length ?? 0,
  };
}

async function assertBank(tenantId: string, bankId: string) {
  const bank = await prisma.questionBank.findFirst({ where: { id: bankId, tenantId } });
  if (!bank) throw new AppError(404, 'Question bank not found');
  return bank;
}

async function getSectionContext(tenantId: string, contentId?: string, sectionId?: string) {
  if (!contentId) return null;
  const content = await prisma.content.findFirst({ where: { id: contentId, tenantId } });
  if (!content) throw new AppError(404, 'Content not found');

  const section = sectionId
    ? await prisma.contentSection.findFirst({ where: { id: sectionId, contentId } })
    : null;
  if (sectionId && !section) throw new AppError(404, 'Section not found');

  const chunks = await prisma.chunk.findMany({
    where: {
      contentId,
      ...(section ? { chunkIndex: { gte: section.startChunk, lte: section.endChunk } } : {}),
    },
    orderBy: { chunkIndex: 'asc' },
    take: 20,
  });
  return buildRagContext(chunks.map((c) => ({ text: c.text, chunkIndex: c.chunkIndex })));
}

export async function listBanks(tenantId: string) {
  const banks = await prisma.questionBank.findMany({
    where: { tenantId },
    include: { questions: { select: { status: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return banks.map(formatBank);
}

export async function createBank(tenantId: string, userId: string, input: unknown) {
  const body = createBankSchema.parse(input);
  const bank = await prisma.questionBank.create({
    data: { tenantId, createdById: userId, title: body.title, topic: body.topic ?? null },
    include: { questions: { select: { status: true } } },
  });
  return formatBank(bank);
}

export async function listQuestions(tenantId: string, bankId: string) {
  await assertBank(tenantId, bankId);
  const questions = await prisma.bankQuestion.findMany({
    where: { bankId },
    orderBy: { createdAt: 'desc' },
  });
  return questions.map(formatQuestion);
}

export async function generateQuestions(
  tenantId: string,
  userId: string,
  bankId: string,
  input: unknown,
) {
  const bank = await assertBank(tenantId, bankId);
  const body = generateSchema.parse(input ?? {});
  const context = await getSectionContext(tenantId, body.contentId, body.sectionId);
  const result = await generateJsonCompletion<{ questions: GeneratedQuestion[] }>(
    [
      { role: 'system', content: ASSESSMENT_SYSTEM_PROMPT },
      {
        role: 'user',
        content: buildAssessmentPrompt({
          title: bank.title,
          topic: body.topic ?? bank.topic,
          context,
          count: body.count,
        }),
      },
    ],
    {
      usage: {
        userId,
        tenantId,
        feature: 'QUESTION_DRAFT',
        metadata: { bankId, contentId: body.contentId, sectionId: body.sectionId },
      },
      temperature: 0.7,
    },
  );

  const created = [];
  for (const q of result.questions ?? []) {
    if (!q.prompt || !q.acceptableAnswers?.length) continue;
    created.push(
      await prisma.bankQuestion.create({
        data: {
          bankId,
          createdById: userId,
          sourceContentId: body.contentId ?? null,
          sourceSectionId: body.sectionId ?? null,
          type: normalizeQuestionType(q.type),
          prompt: q.prompt,
          options: q.options ?? Prisma.JsonNull,
          acceptableAnswers: q.acceptableAnswers,
          explanation: q.explanation ?? null,
        },
      }),
    );
  }
  return created.map(formatQuestion);
}

export async function patchQuestion(
  tenantId: string,
  bankId: string,
  questionId: string,
  input: unknown,
) {
  await assertBank(tenantId, bankId);
  const body = patchQuestionSchema.parse(input ?? {});
  const question = await prisma.bankQuestion.findFirst({ where: { id: questionId, bankId } });
  if (!question) throw new AppError(404, 'Question not found');

  const updated = await prisma.bankQuestion.update({
    where: { id: questionId },
    data: {
      ...(body.prompt !== undefined ? { prompt: body.prompt } : {}),
      ...(body.type !== undefined ? { type: body.type } : {}),
      ...(body.options !== undefined ? { options: body.options ?? Prisma.JsonNull } : {}),
      ...(body.acceptableAnswers !== undefined ? { acceptableAnswers: body.acceptableAnswers } : {}),
      ...(body.explanation !== undefined ? { explanation: body.explanation } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
    },
  });
  return formatQuestion(updated);
}

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
        },
      }),
    );
  }
  return assignments;
}

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
      attemptCount: a.attempts.length,
      latestScore: a.attempts[0]?.score ?? null,
      questions: a.questions.map(({ question }) => ({
        id: question.id,
        type: question.type,
        prompt: question.prompt,
        options: question.options ? jsonStringArray(question.options) : null,
      })),
    }));
}

function normalizeAnswer(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function isCorrect(question: { type: QuestionType; acceptableAnswers: unknown }, answer: string) {
  const acceptable = jsonStringArray(question.acceptableAnswers);
  if (question.type === 'NUMERIC') {
    const answerNumber = Number(answer.replace(',', '.'));
    return acceptable.some((value) => Math.abs(Number(value.replace(',', '.')) - answerNumber) <= 0.001);
  }
  const normalized = normalizeAnswer(answer);
  return acceptable.some((value) => normalizeAnswer(value) === normalized);
}

async function assertLearnerAssignment(tenantId: string, userId: string, assessmentId: string) {
  const assignment = await prisma.assessmentAssignment.findFirst({
    where: { assessmentId, learnerId: userId, assessment: { tenantId } },
  });
  if (!assignment) throw new AppError(403, 'Assessment not assigned to you');
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

  const total = assessment.questions.length;
  const correct = assessment.questions.filter(({ question }) =>
    isCorrect(question, body.answers[question.id] ?? ''),
  ).length;
  const score = total > 0 ? (correct / total) * 100 : 0;

  const attempt = await prisma.$transaction(async (tx) => {
    const attemptCount = await tx.assessmentAttempt.count({
      where: { assessmentId, userId },
    });
    if (attemptCount >= assessment.maxAttempts) {
      throw new AppError(400, 'Attempt limit reached');
    }
    return tx.assessmentAttempt.create({
      data: { assessmentId, userId, answers: body.answers, score, status: 'GRADED' },
    });
  });

  return {
    attempt: {
      id: attempt.id,
      assessmentId,
      score,
      status: attempt.status,
      submittedAt: attempt.submittedAt.toISOString(),
    },
    correct,
    total,
  };
}
