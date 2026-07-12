import type { QuestionType } from './index';
import { isSelectedAnswerCorrect } from './quiz-answer';

/**
 * Shared answer-grading engine — the single implementation used by the API (authoritative
 * grading on submit) and the web app (instant practice feedback). Behavior is a superset of
 * the previous apps/api assessment grader: everything that graded correct before still does.
 */

/**
 * Apostrophe-like codepoints folded to U+0027 before comparison. Critical for Uzbek Latin:
 * oʻ/gʻ are officially U+02BB (modifier letter turned comma) and the tutuq belgisi is
 * U+02BC, but real users type straight quotes, smart quotes, backticks, or acute accents
 * depending on keyboard — toʻgʻri / to'g'ri / to'g'ri must all match.
 */
const APOSTROPHE_VARIANTS = /[ʻʼ‘’`´]/g;

/** Trailing sentence punctuation and wrapping quotes stripped from free-text answers. */
const EDGE_PUNCTUATION = /^["'«»\s]+|["'«»\s]+$|[.!?…]+$/g;

export function normalizeAnswer(value: string): string {
  const base = value
    .trim()
    .normalize('NFKC')
    .toLowerCase()
    .replace(APOSTROPHE_VARIANTS, "'")
    .replace(/\s+/g, ' ');
  const stripped = base.replace(EDGE_PUNCTUATION, '').trim();
  // If stripping punctuation empties the answer (it *was* punctuation), keep the base form.
  return stripped || base;
}

/** Coerce a Json column / unknown value into a string array (drops non-strings). */
export function jsonStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

/**
 * Accepted answers with the legacy fallback: pre-migration rows have no acceptableAnswers
 * and grade against correctAnswer. The single implementation of this rule — the API
 * graders and the web UI must resolve reference answers identically.
 */
export function resolveAcceptedAnswers(
  acceptableAnswers: unknown,
  correctAnswer?: string | null,
): string[] {
  const acceptable = jsonStringArray(acceptableAnswers);
  if (acceptable.length > 0) return acceptable;
  return correctAnswer ? [correctAnswer] : [];
}

/**
 * Which question types get an AI semantic verdict when the deterministic engine rejects
 * an answered submission. Shared by the API's judge candidate selection and the web's
 * Check button, so the client never skips (or pointlessly issues) a server check.
 */
export function isAiJudgedQuestionType(type: QuestionType): boolean {
  return type === 'SHORT_ANSWER';
}

/** Parse a Json question `config` blob into a plain object (or null). */
export function parseQuestionConfig(config: unknown): Record<string, unknown> | null {
  if (config && typeof config === 'object' && !Array.isArray(config)) {
    return config as Record<string, unknown>;
  }
  return null;
}

/**
 * Parse a numeric answer leniently: comma or dot decimal separator (Uzbek/Russian users
 * type "3,14"), thin/regular spaces as digit grouping, scientific notation.
 */
export function parseNumericAnswer(value: string): number | null {
  const cleaned = value.trim().replace(/[\s  ]/g, '').replace(',', '.');
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Numeric closeness: |x − a| ≤ max(absFloor, rel·|a|). The absolute floor (0.001) keeps
 * the legacy behavior for small answers; the relative term (1%) stops large-magnitude
 * answers from demanding absurd precision.
 */
export function isNumericMatch(submitted: number, accepted: number): boolean {
  return Math.abs(submitted - accepted) <= Math.max(0.001, 0.01 * Math.abs(accepted));
}

/**
 * Optimal-string-alignment (Damerau-Levenshtein with adjacent transpositions) distance,
 * capped at `max` — returns max+1 as soon as the distance provably exceeds the cap.
 * Answers are short (words/phrases), so the plain O(n·m) DP is plenty.
 */
function boundedEditDistance(a: string, b: string, max: number): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev2: number[] = [];
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const curr: number[] = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let best = Math.min((prev[j] ?? 0) + 1, (curr[j - 1] ?? 0) + 1, (prev[j - 1] ?? 0) + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        best = Math.min(best, (prev2[j - 2] ?? 0) + 1);
      }
      curr[j] = best;
      if (best < rowMin) rowMin = best;
    }
    if (rowMin > max) return max + 1;
    prev2 = prev;
    prev = curr;
  }
  return Math.min(prev[b.length] ?? max + 1, max + 1);
}

/**
 * One word of a typed answer against the expected word, tolerating a single spelling
 * slip. Deliberately conservative — an over-accept here awards authoritative credit
 * with no AI second look (the judge only reviews REJECTED answers), so:
 * - words of ≤4 letters get no tolerance (one edit lands on a different word: ot/o't);
 * - digit-bearing words must match exactly (1945 vs 1946 is a wrong answer);
 * - the first two characters must agree — negation/antonym pairs differ at the word's
 *   start (noto'g'ri/to'g'ri, независимый/зависимый, in-/de-creases, billion/million)
 *   while real typos cluster mid-word;
 * - exactly ONE edit, never two: hyper-/hypo- style pairs survive every other guard.
 * Anything this rejects still reaches the AI judge for a semantic verdict.
 */
function isWordTypo(word: string, want: string): boolean {
  if (word === want) return true;
  if (/\d/.test(word) || /\d/.test(want)) return false;
  if (Math.min(word.length, want.length) < 5) return false;
  if (word.slice(0, 2) !== want.slice(0, 2)) return false;
  return boundedEditDistance(word, want, 1) <= 1;
}

/** Apostrophes are dropped for fuzzy comparison: Uzbek keyboards often lack the tutuq
 * belgisi, so "togri" for "to'g'ri" is the most common way a correct answer is typed. */
function fuzzyForm(normalized: string): string {
  return normalized.replace(/'/g, '');
}

/**
 * Free-text answer match: exact on the normalized form, else word-by-word typo
 * tolerance (see isWordTypo). Same word count required — a missing word is a content
 * difference, not a typo; that case escalates to the AI judge server-side. This is THE
 * matcher for typed answers: the grading engine (SHORT_ANSWER + FILL_BLANK) and the
 * web's per-blank feedback both call it, so display and grade can never drift.
 */
export function matchesAcceptedAnswer(submitted: string, accepted: string[]): boolean {
  const normalized = normalizeAnswer(submitted);
  if (!normalized) return false;
  const fuzzy = fuzzyForm(normalized);
  const words = fuzzy.split(' ');
  return accepted.some((value) => {
    const acceptedNormalized = normalizeAnswer(value);
    if (acceptedNormalized === normalized) return true;
    const acceptedFuzzy = fuzzyForm(acceptedNormalized);
    if (!fuzzy || !acceptedFuzzy) return false;
    if (acceptedFuzzy === fuzzy) return true;
    const acceptedWords = acceptedFuzzy.split(' ');
    if (words.length !== acceptedWords.length) return false;
    return words.every((word, i) => isWordTypo(word, acceptedWords[i] ?? ''));
  });
}

/**
 * Grade a single-string answer (SHORT_ANSWER / NUMERIC / MULTIPLE_CHOICE / TRUE_FALSE)
 * against the accepted list. A blank/whitespace answer (including a game-quiz timer
 * expiry, which submits '') is never correct — without this guard NUMERIC grading treats
 * Number('') === 0 as a match whenever the correct answer is 0.
 */
export function isCorrect(
  question: { type: QuestionType; acceptableAnswers: unknown; options?: unknown },
  answer: string,
): boolean {
  const acceptable = jsonStringArray(question.acceptableAnswers);
  if (!answer.trim()) return false;
  if (question.type === 'NUMERIC') {
    const answerNumber = parseNumericAnswer(answer);
    if (answerNumber == null) return false;
    return acceptable.some((value) => {
      const accepted = parseNumericAnswer(value);
      return accepted != null && isNumericMatch(answerNumber, accepted);
    });
  }
  // SHORT_ANSWER is typed free text — tolerate spelling slips (option-based types stay
  // exact: their answers are picked, not typed, so any difference is a wrong pick).
  if (question.type === 'SHORT_ANSWER') {
    if (matchesAcceptedAnswer(answer, acceptable)) return true;
  } else {
    const normalized = normalizeAnswer(answer);
    if (acceptable.some((value) => normalizeAnswer(value) === normalized)) return true;
  }
  // MULTIPLE_CHOICE: also resolve option-label answers ("B" / "B) text") against options.
  if (question.type === 'MULTIPLE_CHOICE') {
    const options = jsonStringArray(question.options);
    if (options.length > 0) {
      return acceptable.some((value) => isSelectedAnswerCorrect(options, answer, value));
    }
  }
  return false;
}

/**
 * Canonical String form stored in answer columns. Plain strings are kept verbatim
 * (back-compat); structured answers (arrays/objects) are JSON-stringified so they
 * round-trip through a single String column.
 */
export function answerToString(raw: unknown): string {
  if (raw == null) return '';
  if (typeof raw === 'string') return raw;
  return JSON.stringify(raw);
}

/**
 * Coerce a submitted answer into an array of strings for the multi-value types.
 * Accepts a real array, an object of strings (per-blank map), or a string that may
 * itself be a JSON-encoded array/object; a bare non-empty string becomes a 1-element
 * array so single-blank FILL_BLANK / single-select still work.
 */
export function parseArrayAnswer(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((v): v is string => typeof v === 'string');
  if (raw && typeof raw === 'object') {
    return Object.values(raw).filter((v): v is string => typeof v === 'string');
  }
  if (typeof raw === 'string') {
    const s = raw.trim();
    if (s.startsWith('[') || s.startsWith('{')) {
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) return parsed.filter((v): v is string => typeof v === 'string');
        if (parsed && typeof parsed === 'object') {
          return Object.values(parsed).filter((v): v is string => typeof v === 'string');
        }
      } catch {
        /* not JSON — treat as a single bare answer below */
      }
    }
    return s ? [raw] : [];
  }
  return [];
}

/**
 * Coerce a submitted structured answer into a plain array or object (or null), preserving
 * object keys (the MATCHING grader resolves a `{ leftPrompt: chosenRight }` map).
 */
function coerceStructuredAnswer(raw: unknown): unknown[] | Record<string, unknown> | null {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') return raw as Record<string, unknown>;
  if (typeof raw === 'string') {
    const s = raw.trim();
    if (s.startsWith('[') || s.startsWith('{')) {
      try {
        const parsed: unknown = JSON.parse(s);
        if (Array.isArray(parsed)) return parsed;
        if (parsed && typeof parsed === 'object') return parsed as Record<string, unknown>;
      } catch {
        /* not JSON — no structured value */
      }
    }
  }
  return null;
}

/**
 * Resolve a MATCHING submission into the learner's chosen right-hand value per left prompt
 * (index-aligned with `left`). Accepted shapes: an ordered array of right values, or an
 * object keyed by left prompt text (or by the left index as a string).
 */
function parseMatchingChoices(raw: unknown, left: string[], count: number): string[] {
  const parsed = coerceStructuredAnswer(raw);
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    let value: unknown;
    if (Array.isArray(parsed)) {
      value = parsed[i];
    } else if (parsed && typeof parsed === 'object') {
      const obj = parsed as Record<string, unknown>;
      const key = left[i];
      value = (key != null ? obj[key] : undefined) ?? obj[String(i)];
    }
    out.push(typeof value === 'string' ? value : '');
  }
  return out;
}

/** A single hotspot region as normalized (0..1, top-left origin) x/y offset + w/h fractions. */
export interface HotspotRegion {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Extract the well-formed hotspot regions from a question `config` blob (drops malformed ones). */
export function parseHotspotRegions(config: Record<string, unknown> | null): HotspotRegion[] {
  const raw = config?.regions;
  if (!Array.isArray(raw)) return [];
  const regions: HotspotRegion[] = [];
  for (const r of raw) {
    if (r && typeof r === 'object' && !Array.isArray(r)) {
      const { x, y, w, h } = r as Record<string, unknown>;
      if (
        typeof x === 'number' &&
        typeof y === 'number' &&
        typeof w === 'number' &&
        typeof h === 'number'
      ) {
        regions.push({ x, y, w, h });
      }
    }
  }
  return regions;
}

/** Parse a HOTSPOT submission ({ x, y } normalized click point) into a point, or null. */
function parseHotspotPoint(raw: unknown): { x: number; y: number } | null {
  const parsed = coerceStructuredAnswer(raw);
  if (parsed && !Array.isArray(parsed)) {
    const { x, y } = parsed as Record<string, unknown>;
    if (typeof x === 'number' && typeof y === 'number') return { x, y };
  }
  return null;
}

/** True when a normalized click point lies inside ANY region (binary hit-test, inclusive edges). */
export function pointInAnyRegion(regions: HotspotRegion[], point: { x: number; y: number }): boolean {
  return regions.some(
    (r) => point.x >= r.x && point.x <= r.x + r.w && point.y >= r.y && point.y <= r.y + r.h,
  );
}

/**
 * A MULTIPLE_CHOICE question is only answerable if it has at least two options
 * AND at least one accepted answer exactly matches one of those options (after
 * normalization). Otherwise a learner can never select the correct string and is
 * guaranteed 0% — so such questions must never be persisted or approved.
 */
export function isAnswerableMultipleChoice(
  options: string[] | null | undefined,
  acceptableAnswers: string[],
): boolean {
  if (!options || options.length < 2) return false;
  const normalizedOptions = new Set(options.map(normalizeAnswer));
  return acceptableAnswers.some((a) => normalizedOptions.has(normalizeAnswer(a)));
}

/**
 * A MULTIPLE_SELECT question is answerable only if it has at least two options and at
 * least one accepted answer, and every accepted answer exactly matches one option.
 */
export function isAnswerableMultipleSelect(
  options: string[] | null | undefined,
  acceptableAnswers: string[],
): boolean {
  if (!options || options.length < 2) return false;
  if (acceptableAnswers.length < 1) return false;
  const normalizedOptions = new Set(options.map(normalizeAnswer));
  return acceptableAnswers.every((a) => normalizedOptions.has(normalizeAnswer(a)));
}

/** Accepted answers per blank for a FILL_BLANK question (index = blank position). */
function fillBlankAcceptedPerBlank(config: Record<string, unknown> | null, flat: string[]): string[][] {
  const blankAnswers = config?.blankAnswers;
  if (Array.isArray(blankAnswers) && blankAnswers.length > 0) {
    return blankAnswers.map((b) => jsonStringArray(b));
  }
  const blanks = typeof config?.blanks === 'number' && config.blanks > 0 ? config.blanks : 1;
  if (blanks <= 1) return [flat];
  // Multi-blank without an explicit per-blank map: match each accepted answer to its blank by index.
  return Array.from({ length: blanks }, (_, i) => (flat[i] != null ? [flat[i]] : []));
}

export interface GradeResult {
  /** Fully correct (exact/complete match) — drives the correct-count percentage and game streak. */
  correct: boolean;
  /** 0..1 credit for this answer (before strict weighting). */
  creditFraction: number;
  /** Whether the learner supplied any non-blank answer (a blank is neither correct nor penalized). */
  answered: boolean;
}

/**
 * Pairwise (Kendall-tau) ordering credit: the fraction of item pairs whose relative order
 * matches the key. Rewards "mostly right order, one item misplaced" instead of zeroing
 * every slot after a single early shift. Items that don't match any key entry (or resolve
 * ambiguously) contribute no correct pairs.
 */
function orderingPairwiseCredit(correctOrder: string[], submitted: string[]): number {
  const n = correctOrder.length;
  if (n < 2) {
    // A 1-item ordering has no pairs — fall back to exact-slot.
    return submitted.length === n &&
      n === 1 &&
      normalizeAnswer(submitted[0] ?? '') === normalizeAnswer(correctOrder[0] ?? '')
      ? 1
      : 0;
  }
  const keyIndex = new Map<string, number>();
  correctOrder.forEach((item, i) => keyIndex.set(normalizeAnswer(item), i));
  const positions = submitted
    .map((item) => keyIndex.get(normalizeAnswer(item)))
    .filter((v): v is number => v != null);
  let correctPairs = 0;
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const a = positions[i];
      const b = positions[j];
      if (a != null && b != null && a < b) correctPairs += 1;
    }
  }
  return correctPairs / ((n * (n - 1)) / 2);
}

/** Canonical self-report answer values for FLASHCARD practice items. */
export const FLASHCARD_KNOWN = 'known';
export const FLASHCARD_UNKNOWN = 'unknown';
/** Self-reported flashcard evidence counts at half the weight of auto-graded answers. */
export const FLASHCARD_SELF_REPORT_WEIGHT = 0.5;
/** Guess floor for self-reported flashcards (mirrors deck-review evidence). */
export const FLASHCARD_GUESS_FLOOR = 0.2;

/**
 * Grade one question against a (possibly structured) submitted answer, computing
 * both full correctness and a 0..1 credit fraction. The string-answer types
 * (SHORT_ANSWER / NUMERIC / MULTIPLE_CHOICE / TRUE_FALSE) reuse `isCorrect`.
 */
export function gradeQuestion(
  question: { type: QuestionType; options: unknown; acceptableAnswers: unknown; config?: unknown },
  raw: unknown,
  partialCredit: boolean,
): GradeResult {
  const acceptable = jsonStringArray(question.acceptableAnswers);

  if (question.type === 'FLASHCARD') {
    // Self-graded study card: the learner reveals the back and reports whether they knew
    // it. The submitted value is the FLASHCARD_KNOWN / FLASHCARD_UNKNOWN sentinel.
    const report = normalizeAnswer(answerToString(raw));
    const known = report === FLASHCARD_KNOWN;
    return { correct: known, creditFraction: known ? 1 : 0, answered: report.length > 0 };
  }

  if (question.type === 'MULTIPLE_SELECT') {
    // Clamped +/- ratio (Moodle-style): each correct selection earns 1/totalCorrect, each
    // wrong selection deducts the same; floor at 0 so select-everything can't game it.
    const selected = [...new Set(parseArrayAnswer(raw).map(normalizeAnswer).filter(Boolean))];
    const correctSet = new Set(acceptable.map(normalizeAnswer));
    let correctlySelected = 0;
    let wronglySelected = 0;
    for (const s of selected) {
      if (correctSet.has(s)) correctlySelected += 1;
      else wronglySelected += 1;
    }
    const exact = correctlySelected === correctSet.size && wronglySelected === 0 && correctSet.size > 0;
    const denom = correctSet.size || 1;
    const partial = Math.min(Math.max((correctlySelected - wronglySelected) / denom, 0), 1);
    return {
      correct: exact,
      creditFraction: partialCredit ? partial : exact ? 1 : 0,
      answered: selected.length > 0,
    };
  }

  // DROPDOWN_CLOZE grades exactly like FILL_BLANK: one selected value per blank, matched
  // against the accepted value(s) for that blank. The only difference is presentation — the
  // learner picks from a per-blank option list (config.blankOptions) rather than typing.
  if (question.type === 'FILL_BLANK' || question.type === 'DROPDOWN_CLOZE') {
    const perBlank = fillBlankAcceptedPerBlank(parseQuestionConfig(question.config), acceptable);
    const answers = parseArrayAnswer(raw);
    // FILL_BLANK blanks are typed → typo-tolerant; DROPDOWN_CLOZE values are picked → exact.
    const typed = question.type === 'FILL_BLANK';
    let hit = 0;
    for (let i = 0; i < perBlank.length; i++) {
      const accepted = perBlank[i] ?? [];
      const got = normalizeAnswer(answers[i] ?? '');
      const ok = typed
        ? matchesAcceptedAnswer(answers[i] ?? '', accepted)
        : got !== '' && accepted.some((a) => normalizeAnswer(a) === got);
      if (ok) hit += 1;
    }
    const fraction = perBlank.length > 0 ? hit / perBlank.length : 0;
    const exact = fraction >= 1;
    return {
      correct: exact,
      creditFraction: partialCredit ? fraction : exact ? 1 : 0,
      answered: answers.some((a) => a.trim() !== ''),
    };
  }

  if (question.type === 'MATCHING') {
    // acceptableAnswers = the correct right-hand value per left prompt, index-aligned with
    // config.left. creditFraction = (#correctly matched pairs) / (#pairs); correct = all right.
    const config = parseQuestionConfig(question.config);
    const left = jsonStringArray(config?.left);
    const correct = acceptable;
    const count = correct.length;
    const chosen = parseMatchingChoices(raw, left, count);
    let hit = 0;
    for (let i = 0; i < count; i++) {
      const got = chosen[i] ?? '';
      const want = correct[i] ?? '';
      if (got && normalizeAnswer(got) === normalizeAnswer(want)) hit += 1;
    }
    const fraction = count > 0 ? hit / count : 0;
    const exact = count > 0 && hit === count;
    return {
      correct: exact,
      creditFraction: partialCredit ? fraction : exact ? 1 : 0,
      answered: chosen.some((c) => c.trim() !== ''),
    };
  }

  if (question.type === 'ORDERING') {
    // acceptableAnswers = the items in their correct order. correct = the full submitted
    // sequence matches; partial credit = pairwise relative-order (Kendall-tau) fraction.
    const correctOrder = acceptable;
    const submitted = parseArrayAnswer(raw);
    const count = correctOrder.length;
    let hitInSlot = 0;
    for (let i = 0; i < count; i++) {
      const got = submitted[i] ?? '';
      if (got && normalizeAnswer(got) === normalizeAnswer(correctOrder[i] ?? '')) hitInSlot += 1;
    }
    const exact = count > 0 && hitInSlot === count && submitted.length === count;
    const fraction = exact ? 1 : orderingPairwiseCredit(correctOrder, submitted);
    return {
      correct: exact,
      creditFraction: partialCredit ? fraction : exact ? 1 : 0,
      answered: submitted.some((a) => a.trim() !== ''),
    };
  }

  if (question.type === 'HOTSPOT') {
    // Binary spatial grading: correct iff the clicked point lies inside any region.
    // acceptableAnswers is unused — the answer is the config.regions geometry. Empty/absent
    // click => not answered and incorrect (no partial credit).
    const regions = parseHotspotRegions(parseQuestionConfig(question.config));
    const point = parseHotspotPoint(raw);
    const correct = point != null && pointInAnyRegion(regions, point);
    return { correct, creditFraction: correct ? 1 : 0, answered: point != null };
  }

  if (question.type === 'DRAG_DROP') {
    // acceptableAnswers = the correct target label per item, index-aligned with config.items.
    // Absolute-position scoring: creditFraction = (#items dropped in their correct target) /
    // (#items); correct = every item placed correctly.
    const correctTargets = acceptable;
    const chosen = parseArrayAnswer(raw);
    const count = correctTargets.length;
    let hit = 0;
    for (let i = 0; i < count; i++) {
      const got = chosen[i] ?? '';
      const want = correctTargets[i] ?? '';
      if (got && normalizeAnswer(got) === normalizeAnswer(want)) hit += 1;
    }
    const fraction = count > 0 ? hit / count : 0;
    const exact = count > 0 && hit === count && chosen.length === count;
    return {
      correct: exact,
      creditFraction: partialCredit ? fraction : exact ? 1 : 0,
      answered: chosen.some((a) => a.trim() !== ''),
    };
  }

  // SHORT_ANSWER / NUMERIC / MULTIPLE_CHOICE / TRUE_FALSE — single string answer.
  const answerString = answerToString(raw);
  const correct = isCorrect(question, answerString);
  return { correct, creditFraction: correct ? 1 : 0, answered: answerString.trim() !== '' };
}

/**
 * The number of answer options a guesser picks from, per type — the mastery model's guess
 * floor is 1/optionCount. Free-recall types return Infinity (guess floor 0).
 */
export function guessFloorForQuestion(question: {
  type: QuestionType;
  options?: unknown;
}): number {
  switch (question.type) {
    case 'TRUE_FALSE':
      return 0.5;
    case 'MULTIPLE_CHOICE': {
      const n = jsonStringArray(question.options).length;
      return n >= 2 ? 1 / n : 0.25;
    }
    case 'MULTIPLE_SELECT':
    case 'MATCHING':
    case 'ORDERING':
    case 'DRAG_DROP':
    case 'DROPDOWN_CLOZE':
      // Guessing whole configurations is hard; small non-zero floor.
      return 0.05;
    case 'HOTSPOT':
      return 0.1;
    case 'FLASHCARD':
      // Self-report has no options to derive a floor from; mirrors deck-review evidence.
      return FLASHCARD_GUESS_FLOOR;
    default:
      // SHORT_ANSWER / NUMERIC / FILL_BLANK free recall.
      return 0;
  }
}

/**
 * How much a graded answer counts as mastery evidence. Auto-graded answers count fully;
 * self-reported flashcard answers count at half weight — the single place this rule
 * lives, so every submission path (quizzes, assessments, deck reviews) agrees.
 */
export function evidenceWeightForQuestion(type: QuestionType): number {
  return type === 'FLASHCARD' ? FLASHCARD_SELF_REPORT_WEIGHT : 1;
}
