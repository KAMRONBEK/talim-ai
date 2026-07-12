import type { QuestionType } from '@prisma/client';
import {
  jsonStringArray,
  normalizeAnswer,
  parseQuestionConfig,
  isAnswerableMultipleChoice,
  isAnswerableMultipleSelect,
} from '@talim/types';
import type { GeneratedQuestion } from '../services/assessment/shared.js';
import { dropParrotingQuestions } from './question-quality.js';
import { buildStructuredQuestion, shuffled } from './question-builders.js';

/**
 * Shared post-generation pipeline for BOTH question pipelines (B2C practice quizzes and
 * tenant banks): rule-filter (ban list, answerability, structured-shape validation, stem
 * dedupe, parroting), sourceQuote verification against the material (hallucination
 * firewall), balanced option shuffling (kills LLM key-position bias), and a type-balanced
 * trim to the requested count. Callers overgenerate (~1.5x) so filtering still leaves
 * enough items.
 */

export interface ProcessedQuestion {
  type: QuestionType;
  prompt: string;
  options: string[] | null;
  acceptableAnswers: string[];
  config: Record<string, unknown> | null;
  explanation: string | null;
  difficulty: 'easy' | 'medium' | 'hard' | null;
  bloom: 'recall' | 'understanding' | 'application' | null;
  sourceQuote: string | null;
  optionRationales: (string | null)[] | null;
}

/** Options that reveal test-wiseness cues — a question containing one is dropped outright. */
const BANNED_OPTION_PATTERNS = [
  // en
  'all of the above',
  'none of the above',
  // uz
  "barchasi to'g'ri",
  "barcha javoblar to'g'ri",
  'hech biri',
  "hech qaysi javob to'g'ri emas",
  // ru
  'все вышеперечисленное',
  'все перечисленное',
  'ничего из перечисленного',
  'нет правильного ответа',
];

function hasBannedOption(options: string[]): boolean {
  return options.some((o) => {
    const n = normalizeAnswer(o);
    return BANNED_OPTION_PATTERNS.some((p) => n === normalizeAnswer(p));
  });
}

/**
 * Canonicalize math delimiters at STORAGE time: the prompt mandates $...$ / $$...$$, but
 * models still emit \( ... \) / \[ ... \] — store the canonical form so every consumer
 * (web KaTeX, tenant editor textareas, exports) sees one dialect. The web renderer keeps
 * its own normalization only as a legacy fallback for rows stored before this existed.
 */
function canonicalizeMathDelimiters(value: string): string {
  return value
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, expr: string) => `$$${expr}$$`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, expr: string) => `$${expr}$`);
}

function canonicalizeNullable(value: string | null | undefined): string | null {
  return typeof value === 'string' ? canonicalizeMathDelimiters(value) : null;
}

/** Loose text normalization for containment checks (drops punctuation/scripts noise). */
function containmentNormalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Verify the LLM's verbatim source anchor actually appears in the material. A missing quote
 * is tolerated (kept as null); a PRESENT quote that can't be found in the context means the
 * model invented support for its answer — the question is rejected.
 */
function verifySourceQuote(quote: string | null | undefined, context: string): {
  ok: boolean;
  quote: string | null;
} {
  const trimmed = typeof quote === 'string' ? quote.trim() : '';
  if (!trimmed) return { ok: true, quote: null };
  if (!context.trim()) return { ok: true, quote: trimmed };
  const normalizedQuote = containmentNormalize(trimmed);
  // Too-short quotes carry no verification signal — keep without judging.
  if (normalizedQuote.length < 15) return { ok: true, quote: trimmed };
  const normalizedContext = containmentNormalize(context);
  return normalizedContext.includes(normalizedQuote)
    ? { ok: true, quote: trimmed }
    : { ok: false, quote: null };
}

function sanitizeDifficulty(value: unknown): 'easy' | 'medium' | 'hard' | null {
  return value === 'easy' || value === 'medium' || value === 'hard' ? value : null;
}

function sanitizeBloom(value: unknown): 'recall' | 'understanding' | 'application' | null {
  return value === 'recall' || value === 'understanding' || value === 'application' ? value : null;
}

/** Rationales must be index-aligned with options; anything malformed becomes null. */
function sanitizeRationales(
  value: unknown,
  optionCount: number,
): (string | null)[] | null {
  if (!Array.isArray(value) || optionCount === 0) return null;
  const aligned = value.slice(0, optionCount).map((v) => (typeof v === 'string' && v.trim() ? v : null));
  while (aligned.length < optionCount) aligned.push(null);
  return aligned.some((v) => v != null) ? aligned : null;
}

/**
 * Shuffle options (and their aligned rationales) placing the key at `keyTarget` when given —
 * the batch-level round-robin of key positions erases the model's position bias.
 */
function shuffleOptionsWithKey(
  options: string[],
  rationales: (string | null)[] | null,
  acceptableAnswers: string[],
  keyTarget: number | null,
): { options: string[]; rationales: (string | null)[] | null } {
  const indices = shuffled(options.map((_, i) => i));
  if (keyTarget != null) {
    const acceptedSet = new Set(acceptableAnswers.map(normalizeAnswer));
    const keyPos = indices.findIndex((orig) => acceptedSet.has(normalizeAnswer(options[orig]!)));
    const target = Math.min(keyTarget, indices.length - 1);
    if (keyPos >= 0 && keyPos !== target) {
      const tmp = indices[target]!;
      indices[target] = indices[keyPos]!;
      indices[keyPos] = tmp;
    }
  }
  return {
    options: indices.map((i) => options[i]!),
    rationales: rationales ? indices.map((i) => rationales[i] ?? null) : null,
  };
}

export interface PostprocessInput {
  generated: GeneratedQuestion[];
  /** The material context questions were generated from ('' when topic-only). */
  context: string;
  /** Target question count (output is trimmed to this, type-balanced). */
  count: number;
  /** Only these types survive (a model type outside the set is skipped). Null = all. */
  allowedTypes?: QuestionType[] | null;
  /** Type normalizer for this pipeline (B2C practice vs B2B assessment). */
  normalizeType: (type: string | undefined) => QuestionType;
  /** Stems kept by previous passes (fill-to-count retry) — mutated with newly kept stems. */
  seenStems?: Set<string>;
}

/** Per-filter rejection counts — logged by callers so a heavy-filter run is diagnosable. */
export type SkipReason =
  | 'parroting'
  | 'missingAnswer'
  | 'typeNotAllowed'
  | 'duplicateStem'
  | 'quoteNotFound'
  | 'bannedOption'
  | 'malformedStructured'
  | 'unanswerable';

export interface PostprocessResult {
  questions: ProcessedQuestion[];
  skipped: number;
  breakdown: Partial<Record<SkipReason, number>>;
}

export function postprocessGeneratedQuestions(input: PostprocessInput): PostprocessResult {
  const { context, count, allowedTypes, normalizeType } = input;
  let skipped = 0;
  const breakdown: Partial<Record<SkipReason, number>> = {};
  const skip = (reason: SkipReason, n = 1) => {
    if (n <= 0) return;
    skipped += n;
    breakdown[reason] = (breakdown[reason] ?? 0) + n;
  };

  // Drop questions copied near-verbatim from the material (no parroting).
  const notParroting = dropParrotingQuestions(input.generated, context);
  skip('parroting', input.generated.length - notParroting.length);

  const seenStems = input.seenStems ?? new Set<string>();
  const kept: ProcessedQuestion[] = [];

  for (const q of notParroting) {
    const acceptableAnswers = jsonStringArray(q.acceptableAnswers);
    if (!q.prompt?.trim() || acceptableAnswers.length === 0) {
      skip('missingAnswer');
      continue;
    }
    const type = normalizeType(q.type);
    if (allowedTypes && allowedTypes.length > 0 && !allowedTypes.includes(type)) {
      skip('typeNotAllowed');
      continue;
    }
    const stemKey = normalizeAnswer(q.prompt);
    if (seenStems.has(stemKey)) {
      skip('duplicateStem');
      continue;
    }

    const quoteCheck = verifySourceQuote(q.sourceQuote, context);
    if (!quoteCheck.ok) {
      skip('quoteNotFound');
      continue;
    }

    const rawOptions = Array.isArray(q.options) ? jsonStringArray(q.options) : null;
    if (rawOptions && hasBannedOption(rawOptions)) {
      skip('bannedOption');
      continue;
    }

    const base = {
      prompt: canonicalizeMathDelimiters(q.prompt.trim()),
      explanation: canonicalizeNullable(q.explanation),
      difficulty: sanitizeDifficulty(q.difficulty),
      bloom: sanitizeBloom(q.bloom),
      // sourceQuote stays verbatim — it must remain re-verifiable against the material.
      sourceQuote: quoteCheck.quote,
    };

    // Structured types build their own options/acceptableAnswers/config shape. Skip any the
    // model emitted malformed so a learner can never face an ungradeable question.
    if (type === 'MATCHING' || type === 'ORDERING' || type === 'DROPDOWN_CLOZE') {
      const built = buildStructuredQuestion(type, q, acceptableAnswers);
      if (!built) {
        skip('malformedStructured');
        continue;
      }
      seenStems.add(stemKey);
      kept.push({
        ...base,
        type,
        options: built.options,
        acceptableAnswers: built.acceptableAnswers,
        config: built.config,
        optionRationales: null,
      });
      continue;
    }

    const hasOptions = type === 'MULTIPLE_CHOICE' || type === 'TRUE_FALSE' || type === 'MULTIPLE_SELECT';
    if (
      (type === 'MULTIPLE_CHOICE' || type === 'TRUE_FALSE') &&
      !isAnswerableMultipleChoice(rawOptions, acceptableAnswers)
    ) {
      skip('unanswerable');
      continue;
    }
    if (type === 'MULTIPLE_SELECT' && !isAnswerableMultipleSelect(rawOptions, acceptableAnswers)) {
      skip('unanswerable');
      continue;
    }

    // FILL_BLANK stores blank metadata in config (default single blank).
    const config =
      type === 'FILL_BLANK'
        ? (parseQuestionConfig(q.config) ?? { blanks: 1 })
        : parseQuestionConfig(q.config);

    // Options and acceptableAnswers must stay character-identical for grading, so the
    // same canonicalization applies to both.
    const options = hasOptions && rawOptions ? rawOptions.map(canonicalizeMathDelimiters) : null;
    const rationales = options ? sanitizeRationales(q.optionRationales, options.length) : null;
    seenStems.add(stemKey);
    kept.push({
      ...base,
      type,
      options,
      acceptableAnswers: acceptableAnswers.map(canonicalizeMathDelimiters),
      config,
      optionRationales: rationales ? rationales.map(canonicalizeNullable) : null,
    });
  }

  // Balanced key-position shuffle for MULTIPLE_CHOICE (models cluster keys on specific
  // letters; a uniform per-question shuffle alone still lets small batches skew, so key
  // positions are dealt round-robin from a shuffled cycle). TRUE_FALSE keeps its canonical
  // [true, false] option order; MULTIPLE_SELECT gets a plain shuffle.
  const positionCycle = shuffled([0, 1, 2, 3]);
  let mcIndex = 0;
  for (const item of kept) {
    if (!item.options || item.options.length < 2) continue;
    if (item.type === 'MULTIPLE_CHOICE') {
      const target = positionCycle[mcIndex % positionCycle.length]!;
      mcIndex++;
      const res = shuffleOptionsWithKey(item.options, item.optionRationales, item.acceptableAnswers, target);
      item.options = res.options;
      item.optionRationales = res.rationales;
    } else if (item.type === 'MULTIPLE_SELECT') {
      const res = shuffleOptionsWithKey(item.options, item.optionRationales, item.acceptableAnswers, null);
      item.options = res.options;
      item.optionRationales = res.rationales;
    }
  }

  // Type-balanced trim to the requested count: round-robin across types (preserving each
  // type's generation order) so one over-produced type can't crowd out the others.
  if (kept.length > count) {
    const byType = new Map<QuestionType, ProcessedQuestion[]>();
    for (const item of kept) {
      const list = byType.get(item.type) ?? [];
      list.push(item);
      byType.set(item.type, list);
    }
    const order = [...byType.keys()];
    const picked: ProcessedQuestion[] = [];
    let round = 0;
    while (picked.length < count) {
      let took = false;
      for (const t of order) {
        const list = byType.get(t)!;
        if (round < list.length && picked.length < count) {
          picked.push(list[round]!);
          took = true;
        }
      }
      if (!took) break;
      round++;
    }
    // Restore original relative order for a natural quiz flow.
    const pickedSet = new Set(picked);
    return { questions: kept.filter((k) => pickedSet.has(k)), skipped, breakdown };
  }

  return { questions: kept, skipped, breakdown };
}

/** How many items to request from the model so post-filter output still meets `count`. */
export function overgenerateCount(count: number): number {
  return Math.min(45, Math.ceil(count * 1.5));
}
