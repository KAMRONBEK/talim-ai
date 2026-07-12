import { Prisma, type QuestionType } from '@prisma/client';
import { parseAppLocale } from '@talim/types';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import { PRACTICE_QUESTION_TYPES } from '@talim/types';
import { normalizeAssessmentQuestionType } from '../../lib/assessment-prompt.js';
import {
  typesFromStyle,
  type GeneratableQuestionType,
} from '../../lib/question-gen-prompt.js';
import { generateQuestionSet } from '../../lib/question-gen.js';
import {
  buildStructuredQuestion,
  buildHotspotQuestion,
  buildDragDropQuestion,
  STRUCTURED_QUESTION_ERROR,
  type StructuredStorage,
} from '../../lib/question-builders.js';
import {
  assertBank,
  assertTenantContentIds,
  createBankSchema,
  createQuestionSchema,
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

  // Generate in the tutor's language (Uzbek-first default), with explicit types winning
  // over the legacy single-style knob.
  const owner = await prisma.user.findUnique({
    where: { id: userId },
    select: { preferredLocale: true },
  });
  const locale = parseAppLocale(owner?.preferredLocale);
  // Tenant banks feed assessment players that only handle auto-graded types — the
  // default mix is the shared auto-graded set (PRACTICE_QUESTION_TYPES excludes the
  // self-graded FLASHCARD by definition).
  const requestedTypes =
    body.types && body.types.length > 0
      ? (body.types as GeneratableQuestionType[])
      : (typesFromStyle(body.style) ?? ([...PRACTICE_QUESTION_TYPES] as GeneratableQuestionType[]));

  const { questions, skipped, breakdown, passes } = await generateQuestionSet({
    locale,
    title: bank.title,
    topic: body.topic ?? bank.topic,
    context,
    count: body.count,
    types: requestedTypes,
    depth: body.depth,
    normalizeType: normalizeAssessmentQuestionType,
    usage: {
      userId,
      tenantId,
      feature: 'QUESTION_DRAFT',
      metadata: { bankId, contentId: sourceContentId, sectionId: body.sectionId },
    },
    temperature: 0.7,
  });

  const created = [];
  for (const q of questions) {
    created.push(
      await prisma.bankQuestion.create({
        data: {
          bankId,
          createdById: userId,
          sourceContentId: sourceContentId ?? null,
          sourceSectionId: body.sectionId ?? null,
          type: q.type,
          prompt: q.prompt,
          options: q.options ? q.options : Prisma.JsonNull,
          acceptableAnswers: q.acceptableAnswers,
          config: q.config ? (q.config as Prisma.InputJsonValue) : Prisma.JsonNull,
          explanation: q.explanation,
          difficulty: q.difficulty,
          bloom: q.bloom,
          sourceQuote: q.sourceQuote,
          optionRationales: q.optionRationales
            ? (q.optionRationales as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        },
      }),
    );
  }
  if (skipped > 0 || created.length < body.count) {
    console.warn(
      `generateQuestions: bank ${bankId} delivered ${created.length}/${body.count} in ${passes} pass(es), skipped ${skipped} ${JSON.stringify(breakdown)}`,
    );
  }
  return created.map(formatQuestion);
}

/**
 * Validate + normalize a manually authored/edited question into its storage shape,
 * mirroring what the generator builders produce so a hand-made question is stored (and,
 * for the structured types, shuffled/validated) exactly like a generated one. Throws
 * AppError(400) when the question would be unanswerable/malformed.
 */
function buildManualStorage(
  type: QuestionType,
  source: {
    prompt: string;
    options: string[] | null;
    acceptableAnswers: string[];
    config: Record<string, unknown> | null;
  },
): StructuredStorage {
  if (type === 'MATCHING' || type === 'ORDERING' || type === 'DROPDOWN_CLOZE') {
    const built = buildStructuredQuestion(
      type,
      {
        prompt: source.prompt,
        options: source.options,
        acceptableAnswers: source.acceptableAnswers,
        config: source.config,
      },
      source.acceptableAnswers,
    );
    if (!built) throw new AppError(400, STRUCTURED_QUESTION_ERROR[type]);
    return built;
  }
  // HOTSPOT / DRAG_DROP are manual-authoring-only structured types (never AI-generated), so they
  // build directly here rather than through buildStructuredQuestion (the generator switch).
  if (type === 'HOTSPOT') {
    const built = buildHotspotQuestion({ config: source.config });
    if (!built) throw new AppError(400, STRUCTURED_QUESTION_ERROR.HOTSPOT);
    return built;
  }
  if (type === 'DRAG_DROP') {
    const built = buildDragDropQuestion({
      acceptableAnswers: source.acceptableAnswers,
      config: source.config,
    });
    if (!built) throw new AppError(400, STRUCTURED_QUESTION_ERROR.DRAG_DROP);
    return built;
  }
  // Never persist an unanswerable option question: the accepted answer(s) must map to options.
  if (
    (type === 'MULTIPLE_CHOICE' || type === 'TRUE_FALSE') &&
    !isAnswerableMultipleChoice(source.options, source.acceptableAnswers)
  ) {
    throw new AppError(
      400,
      'Multiple-choice questions need at least 2 options and a correct answer that exactly matches one option.',
    );
  }
  if (
    type === 'MULTIPLE_SELECT' &&
    !isAnswerableMultipleSelect(source.options, source.acceptableAnswers)
  ) {
    throw new AppError(
      400,
      'Multiple-select questions need at least 2 options and every correct answer must exactly match an option.',
    );
  }
  const hasOptions =
    type === 'MULTIPLE_CHOICE' || type === 'TRUE_FALSE' || type === 'MULTIPLE_SELECT';
  // FILL_BLANK stores blank metadata in config (default single blank), like the generator.
  const config = type === 'FILL_BLANK' ? (source.config ?? { blanks: 1 }) : source.config;
  return {
    options: hasOptions && source.options ? source.options : null,
    acceptableAnswers: source.acceptableAnswers,
    config,
  };
}

/**
 * Manually author a bank question from scratch (the non-AI path). Scoped to the tenant/owner
 * like the other bank ops. Validates answerability via the same guards/builders the generator
 * uses, then persists the question as APPROVED (manually authored = trusted).
 */
export async function createBankQuestion(
  tenantId: string,
  userId: string,
  bankId: string,
  input: unknown,
) {
  await assertBank(tenantId, bankId);
  const body = createQuestionSchema.parse(input ?? {});
  const storage = buildManualStorage(body.type, {
    prompt: body.prompt,
    options: body.options ?? null,
    acceptableAnswers: body.acceptableAnswers,
    config: parseQuestionConfig(body.config),
  });

  const created = await prisma.bankQuestion.create({
    data: {
      bankId,
      createdById: userId,
      type: body.type,
      prompt: body.prompt,
      options: storage.options ? storage.options : Prisma.JsonNull,
      acceptableAnswers: storage.acceptableAnswers,
      config: storage.config ? (storage.config as Prisma.InputJsonValue) : Prisma.JsonNull,
      explanation: body.explanation ?? null,
      status: 'APPROVED',
    },
  });
  return formatQuestion(created);
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

  const finalType = body.type ?? question.type;
  const finalPrompt = body.prompt ?? question.prompt;
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
  const finalConfig =
    body.config !== undefined ? body.config : parseQuestionConfig(question.config);

  // Structured types (MATCHING / ORDERING / DROPDOWN_CLOZE / HOTSPOT / DRAG_DROP): when their
  // content changes, re-run the manual-storage builders so the edited question is
  // normalized/shuffled/validated into the same canonical storage shape a generated one has. A
  // status-only change (e.g. approve/reject) leaves the stored storage untouched.
  const editingContent =
    body.prompt !== undefined ||
    body.type !== undefined ||
    body.options !== undefined ||
    body.acceptableAnswers !== undefined ||
    body.config !== undefined;
  if (
    (finalType === 'MATCHING' ||
      finalType === 'ORDERING' ||
      finalType === 'DROPDOWN_CLOZE' ||
      finalType === 'HOTSPOT' ||
      finalType === 'DRAG_DROP') &&
    editingContent
  ) {
    const storage = buildManualStorage(finalType, {
      prompt: finalPrompt,
      options: finalOptions,
      acceptableAnswers: finalAcceptable,
      config: finalConfig,
    });
    const updated = await prisma.bankQuestion.update({
      where: { id: questionId },
      data: {
        type: finalType,
        prompt: finalPrompt,
        options: storage.options ? storage.options : Prisma.JsonNull,
        acceptableAnswers: storage.acceptableAnswers,
        config: storage.config ? (storage.config as Prisma.InputJsonValue) : Prisma.JsonNull,
        ...(body.explanation !== undefined ? { explanation: body.explanation } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
      },
    });
    return formatQuestion(updated);
  }

  // Guard the multiple-choice / multiple-select invariant on edits/approval so a tutor can
  // never approve an unanswerable question.
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
