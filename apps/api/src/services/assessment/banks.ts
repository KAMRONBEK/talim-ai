import { Prisma, type QuestionType } from '@prisma/client';
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
  createQuestionSchema,
  formatBank,
  formatQuestion,
  generateSchema,
  getSectionContext,
  isAnswerableMultipleChoice,
  isAnswerableMultipleSelect,
  jsonStringArray,
  normalizeAnswer,
  parseHotspotRegions,
  parseQuestionConfig,
  patchQuestionSchema,
} from './shared.js';

/** Storage shape produced for a structured (MATCHING / ORDERING / DROPDOWN_CLOZE) question. */
interface StructuredStorage {
  options: string[] | null;
  acceptableAnswers: string[];
  config: Record<string, unknown> | null;
}

/** Fisher–Yates shuffle on a copy — used so a structured question's display order
 *  (the `options` pool) never leaks the correct order/mapping held in acceptableAnswers. */
function shuffled<T>(input: T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr;
}

/**
 * MATCHING storage: acceptableAnswers = correct right value per left prompt (parallel to
 * config.left). options = the right-hand pool the learner picks from (correct answers +
 * distractors, shuffled). Returns null (skip) when malformed/unanswerable.
 */
function buildMatchingQuestion(q: GeneratedQuestion, correct: string[]): StructuredStorage | null {
  const config = parseQuestionConfig(q.config) ?? {};
  const left = jsonStringArray(config.left).map((s) => s.trim());
  if (left.length < 2 || correct.length !== left.length) return null;
  if (left.some((x) => !x) || correct.some((x) => !x.trim())) return null;
  // Left prompts are the keys of the object-answer form → must be distinct.
  if (new Set(left.map(normalizeAnswer)).size !== left.length) return null;
  // Right pool = the correct answers ∪ any provided distractors, de-duplicated (normalized).
  const providedRight = jsonStringArray(config.right).map((s) => s.trim());
  const pool: string[] = [];
  const seen = new Set<string>();
  for (const r of [...correct.map((s) => s.trim()), ...providedRight]) {
    const k = normalizeAnswer(r);
    if (r && !seen.has(k)) {
      seen.add(k);
      pool.push(r);
    }
  }
  if (pool.length < 2) return null;
  return { options: shuffled(pool), acceptableAnswers: correct, config: { left, pairs: left.length } };
}

/**
 * ORDERING storage: acceptableAnswers = the items in their correct order. options = the same
 * items shuffled for display. Absolute-position scoring needs distinct items. Returns null when
 * fewer than two items or duplicates are present.
 */
function buildOrderingQuestion(_q: GeneratedQuestion, correct: string[]): StructuredStorage | null {
  const items = correct.map((s) => s.trim()).filter(Boolean);
  if (items.length < 2) return null;
  if (new Set(items.map(normalizeAnswer)).size !== items.length) return null;
  return { options: shuffled(items), acceptableAnswers: items, config: null };
}

/**
 * DROPDOWN_CLOZE storage: acceptableAnswers = the correct choice per blank (parallel to blanks);
 * config = { blanks: N, blankOptions: string[][] } (the per-blank dropdown choices). options is
 * null — the flat column can't hold nested per-blank choices. Returns null when a blank is
 * under-specified, a correct choice isn't in its option list, or the prompt lacks enough markers.
 */
function buildDropdownClozeQuestion(q: GeneratedQuestion, correct: string[]): StructuredStorage | null {
  const config = parseQuestionConfig(q.config) ?? {};
  const blanks = typeof config.blanks === 'number' && config.blanks > 0 ? config.blanks : correct.length;
  const rawOptions = Array.isArray(config.blankOptions) ? config.blankOptions : [];
  if (blanks < 1 || correct.length !== blanks || rawOptions.length !== blanks) return null;
  const blankOptions: string[][] = [];
  for (let i = 0; i < blanks; i++) {
    const opts = jsonStringArray(rawOptions[i]).map((s) => s.trim()).filter(Boolean);
    const ans = (correct[i] ?? '').trim();
    if (opts.length < 2 || !ans) return null;
    if (!opts.some((o) => normalizeAnswer(o) === normalizeAnswer(ans))) return null;
    blankOptions.push(opts);
  }
  // The prompt must contain at least one "___" marker per blank.
  const markers = (q.prompt.match(/_{2,}/g) ?? []).length;
  if (markers < blanks) return null;
  return { options: null, acceptableAnswers: correct, config: { blanks, blankOptions } };
}

function buildStructuredQuestion(
  type: 'MATCHING' | 'ORDERING' | 'DROPDOWN_CLOZE',
  q: GeneratedQuestion,
  correct: string[],
): StructuredStorage | null {
  switch (type) {
    case 'MATCHING':
      return buildMatchingQuestion(q, correct);
    case 'ORDERING':
      return buildOrderingQuestion(q, correct);
    case 'DROPDOWN_CLOZE':
      return buildDropdownClozeQuestion(q, correct);
  }
}

/**
 * HOTSPOT storage (manual-authoring only): config = { imageUrl, regions } with regions normalized
 * to 0..1 (top-left origin, w/h fractions). options is null and acceptableAnswers is empty — the
 * answer is spatial (a click inside any region). Returns null when the image is missing or there is
 * not at least one region whose normalized box stays within the image bounds.
 */
function buildHotspotQuestion(source: {
  config: Record<string, unknown> | null;
}): StructuredStorage | null {
  const config = source.config ?? {};
  const imageUrl = typeof config.imageUrl === 'string' ? config.imageUrl.trim() : '';
  if (!imageUrl) return null;
  const regions = parseHotspotRegions(config);
  if (regions.length < 1) return null;
  const valid = regions.every(
    (r) => r.w > 0 && r.h > 0 && r.x >= 0 && r.y >= 0 && r.x + r.w <= 1 && r.y + r.h <= 1,
  );
  if (!valid) return null;
  return { options: null, acceptableAnswers: [], config: { imageUrl, regions } };
}

/**
 * DRAG_DROP storage (manual-authoring only): config = { items, targets }; acceptableAnswers = the
 * correct target label per item (parallel to config.items, each ∈ config.targets). options is null.
 * Returns null with fewer than 2 items or 2 targets, when the correct-target list isn't parallel to
 * the items, or when a correct target isn't one of the targets.
 */
function buildDragDropQuestion(source: {
  acceptableAnswers: string[];
  config: Record<string, unknown> | null;
}): StructuredStorage | null {
  const config = source.config ?? {};
  const items = jsonStringArray(config.items).map((s) => s.trim()).filter(Boolean);
  const targets = jsonStringArray(config.targets).map((s) => s.trim()).filter(Boolean);
  const correct = source.acceptableAnswers.map((s) => s.trim());
  if (items.length < 2 || targets.length < 2) return null;
  if (correct.length !== items.length) return null;
  const targetSet = new Set(targets.map(normalizeAnswer));
  if (correct.some((c) => !c || !targetSet.has(normalizeAnswer(c)))) return null;
  return { options: null, acceptableAnswers: correct, config: { items, targets } };
}

/** Rejection messages when a manually authored/edited structured question is malformed
 *  or unanswerable (the matching builder above returned null). */
const STRUCTURED_QUESTION_ERROR: Record<
  'MATCHING' | 'ORDERING' | 'DROPDOWN_CLOZE' | 'HOTSPOT' | 'DRAG_DROP',
  string
> = {
  MATCHING:
    'Matching questions need at least 2 distinct left prompts (config.left), one correct right value per prompt, and a right-hand pool of at least 2 options.',
  ORDERING: 'Ordering questions need at least 2 distinct items given in their correct order.',
  DROPDOWN_CLOZE:
    'Cloze questions need one "___" marker per blank and, for each blank, at least 2 options (config.blankOptions) including the correct choice.',
  HOTSPOT:
    'Hotspot questions need an image (config.imageUrl) and at least 1 region with normalized 0..1 coordinates (config.regions).',
  DRAG_DROP:
    'Drag-and-drop questions need at least 2 items and 2 targets (config.items, config.targets), and one correct target per item (acceptableAnswers, parallel to items) that is one of the targets.',
};

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

    // Structured types build their own options/acceptableAnswers/config shape (the model puts
    // the mapping/order/per-blank data in `config` + top-level acceptableAnswers). Skip any
    // the model emitted malformed so a learner can never face an ungradeable question.
    if (type === 'MATCHING' || type === 'ORDERING' || type === 'DROPDOWN_CLOZE') {
      const built = buildStructuredQuestion(type, q, acceptableAnswers);
      if (!built) {
        skipped++;
        continue;
      }
      created.push(
        await prisma.bankQuestion.create({
          data: {
            bankId,
            createdById: userId,
            sourceContentId: sourceContentId ?? null,
            sourceSectionId: body.sectionId ?? null,
            type,
            prompt: q.prompt,
            options: built.options ? built.options : Prisma.JsonNull,
            acceptableAnswers: built.acceptableAnswers,
            config: built.config ? (built.config as Prisma.InputJsonValue) : Prisma.JsonNull,
            explanation: q.explanation ?? null,
          },
        }),
      );
      continue;
    }

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
