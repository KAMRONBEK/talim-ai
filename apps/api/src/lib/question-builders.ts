import { jsonStringArray, normalizeAnswer, parseQuestionConfig, parseHotspotRegions } from '@talim/types';
import type { GeneratedQuestion } from '../services/assessment/shared.js';

/**
 * Storage builders for the structured question types, shared by BOTH generation pipelines
 * (B2C practice quizzes and tenant question banks) and by manual authoring. Moved here from
 * services/assessment/banks.ts when the B2C quiz gained the full type set.
 */

/** Storage shape produced for a structured (MATCHING / ORDERING / DROPDOWN_CLOZE) question. */
export interface StructuredStorage {
  options: string[] | null;
  acceptableAnswers: string[];
  config: Record<string, unknown> | null;
}

/** Fisher–Yates shuffle on a copy — used so a structured question's display order
 *  (the `options` pool) never leaks the correct order/mapping held in acceptableAnswers. */
export function shuffled<T>(input: T[]): T[] {
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
 * items shuffled for display. Scoring needs distinct items. Returns null when fewer than two
 * items or duplicates are present.
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

export function buildStructuredQuestion(
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
export function buildHotspotQuestion(source: {
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
export function buildDragDropQuestion(source: {
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
export const STRUCTURED_QUESTION_ERROR: Record<
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
