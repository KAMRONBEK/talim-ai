import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import { generateJsonCompletion } from '../ai.service.js';
import {
  ASSESSMENT_SYSTEM_PROMPT,
  buildAssessmentPrompt,
  normalizeAssessmentQuestionType,
} from '../../lib/assessment-prompt.js';
import { dropParrotingQuestions } from '../../lib/question-quality.js';
import {
  type GeneratedQuestion,
  assertBank,
  assertTenantContentIds,
  createBankSchema,
  formatBank,
  formatQuestion,
  generateSchema,
  getSectionContext,
  isAnswerableMultipleChoice,
  isAnswerableMultipleSelect,
  jsonStringArray,
  parseQuestionConfig,
  patchQuestionSchema,
} from './shared.js';

export async function listBanks(tenantId: string) {
  const banks = await prisma.questionBank.findMany({
    where: { tenantId },
    include: {
      questions: { select: { status: true } },
      materials: { include: { content: { select: { id: true, title: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return banks.map(formatBank);
}

export async function createBank(tenantId: string, userId: string, input: unknown) {
  const body = createBankSchema.parse(input);
  const contentIds = await assertTenantContentIds(tenantId, body.contentIds);
  const bank = await prisma.questionBank.create({
    data: {
      tenantId,
      createdById: userId,
      title: body.title,
      topic: body.topic ?? null,
      ...(contentIds.length
        ? { materials: { create: contentIds.map((contentId) => ({ contentId })) } }
        : {}),
    },
    include: {
      questions: { select: { status: true } },
      materials: { include: { content: { select: { id: true, title: true } } } },
    },
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
  // Default the generation source to the bank's linked materials when the caller didn't pin a
  // specific content, so questions are drawn from (and attributed to) the bank's materials.
  let sourceContentId = body.contentId;
  if (!sourceContentId) {
    const link = await prisma.questionBankContent.findFirst({
      where: { bankId },
      orderBy: { createdAt: 'asc' },
      select: { contentId: true },
    });
    sourceContentId = link?.contentId;
  }
  const context = await getSectionContext(tenantId, sourceContentId, body.sectionId);
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
          style: body.style,
        }),
      },
    ],
    {
      usage: {
        userId,
        tenantId,
        feature: 'QUESTION_DRAFT',
        metadata: { bankId, contentId: sourceContentId, sectionId: body.sectionId },
      },
      temperature: 0.7,
    },
  );

  const created = [];
  let skipped = 0;
  // Drop questions copied near-verbatim from the material (no parroting).
  for (const q of dropParrotingQuestions(result.questions ?? [], context ?? '')) {
    const acceptableAnswers = jsonStringArray(q.acceptableAnswers);
    if (!q.prompt || !acceptableAnswers.length) {
      skipped++;
      continue;
    }
    const type = normalizeAssessmentQuestionType(q.type);
    const options = Array.isArray(q.options) ? jsonStringArray(q.options) : null;
    // Types that carry a fixed set of options a learner picks from.
    const hasOptions =
      type === 'MULTIPLE_CHOICE' || type === 'TRUE_FALSE' || type === 'MULTIPLE_SELECT';
    // Never persist an unanswerable option question: the accepted answer(s) must map to options.
    if (
      (type === 'MULTIPLE_CHOICE' || type === 'TRUE_FALSE') &&
      !isAnswerableMultipleChoice(options, acceptableAnswers)
    ) {
      skipped++;
      continue;
    }
    if (type === 'MULTIPLE_SELECT' && !isAnswerableMultipleSelect(options, acceptableAnswers)) {
      skipped++;
      continue;
    }
    // FILL_BLANK stores blank metadata in config (default single blank).
    const config =
      type === 'FILL_BLANK'
        ? (parseQuestionConfig(q.config) ?? { blanks: 1 })
        : parseQuestionConfig(q.config);
    created.push(
      await prisma.bankQuestion.create({
        data: {
          bankId,
          createdById: userId,
          sourceContentId: sourceContentId ?? null,
          sourceSectionId: body.sectionId ?? null,
          type,
          prompt: q.prompt,
          options: hasOptions && options ? options : Prisma.JsonNull,
          acceptableAnswers,
          config: config ? (config as Prisma.InputJsonValue) : Prisma.JsonNull,
          explanation: q.explanation ?? null,
        },
      }),
    );
  }
  if (skipped > 0) {
    console.warn(
      `generateQuestions: skipped ${skipped} invalid/unanswerable question(s) for bank ${bankId} (created ${created.length}/${body.count})`,
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

  // Guard the multiple-choice invariant on edits/approval so a tutor can never
  // approve an unanswerable question.
  const finalType = body.type ?? question.type;
  const finalOptions =
    body.options !== undefined
      ? body.options
      : question.options
        ? jsonStringArray(question.options)
        : null;
  const finalAcceptable =
    body.acceptableAnswers !== undefined
      ? body.acceptableAnswers
      : jsonStringArray(question.acceptableAnswers);
  if (
    (finalType === 'MULTIPLE_CHOICE' || finalType === 'TRUE_FALSE') &&
    !isAnswerableMultipleChoice(finalOptions, finalAcceptable)
  ) {
    throw new AppError(
      400,
      'Multiple-choice questions need at least 2 options and a correct answer that exactly matches one option.',
    );
  }
  if (finalType === 'MULTIPLE_SELECT' && !isAnswerableMultipleSelect(finalOptions, finalAcceptable)) {
    throw new AppError(
      400,
      'Multiple-select questions need at least 2 options and every correct answer must exactly match an option.',
    );
  }

  const updated = await prisma.bankQuestion.update({
    where: { id: questionId },
    data: {
      ...(body.prompt !== undefined ? { prompt: body.prompt } : {}),
      ...(body.type !== undefined ? { type: body.type } : {}),
      ...(body.options !== undefined ? { options: body.options ?? Prisma.JsonNull } : {}),
      ...(body.acceptableAnswers !== undefined ? { acceptableAnswers: body.acceptableAnswers } : {}),
      ...(body.config !== undefined
        ? { config: body.config ? (body.config as Prisma.InputJsonValue) : Prisma.JsonNull }
        : {}),
      ...(body.explanation !== undefined ? { explanation: body.explanation } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
    },
  });
  return formatQuestion(updated);
}
