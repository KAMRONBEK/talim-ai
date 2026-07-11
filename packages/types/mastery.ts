/**
 * Shared mastery math for the question engine — pure functions used by the API (Elo-KT
 * updates in mastery.service) and the web app (band display). Model: per-(user, section)
 * Elo with a per-type guess floor, lazy inactivity decay, and Khan-style bands gated by
 * BOTH score and evidence (attempt counts + distinct active days) so a single correct
 * answer can never show a topic as learnt, while wrong answers honestly pull mastery down.
 */

export type MasteryBand = 'none' | 'attempted' | 'familiar' | 'proficient' | 'mastered';

export const MASTERY_BAND_ORDER: MasteryBand[] = [
  'none',
  'attempted',
  'familiar',
  'proficient',
  'mastered',
];

/** Score threshold + evidence gates per band (attempted has no score gate). */
export const MASTERY_BANDS = {
  familiar: { score: 60, attempts: 4, activeDays: 1 },
  proficient: { score: 75, attempts: 8, activeDays: 1 },
  mastered: { score: 85, attempts: 12, activeDays: 2 },
} as const;

/** Points of grace before an earned band is demoted (hysteresis). */
export const BAND_HYSTERESIS = 3;

/** Days of inactivity before decay starts (grace week). */
export const DECAY_GRACE_DAYS = 7;
/** Exponential decay time constant (days) applied beyond the grace week. */
export const DECAY_TAU_DAYS = 60;

/** Ability/difficulty logits are clamped to this range. */
export const THETA_CLAMP = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

export function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/** Displayed 0–100 mastery score. 50 = coin-flip on a medium-difficulty item. */
export function masteryScore(theta: number): number {
  return Math.round(100 * sigmoid(theta));
}

/**
 * Lazily decayed theta: unchanged within the grace week, then decays exponentially on the
 * days beyond it (smooth — no cliff at day 7). Computed at read/update time; nothing is
 * scheduled.
 */
export function decayedTheta(theta: number, lastAnswerAt: Date | string | null, now: Date): number {
  if (!lastAnswerAt) return theta;
  const last = typeof lastAnswerAt === 'string' ? new Date(lastAnswerAt) : lastAnswerAt;
  const days = (now.getTime() - last.getTime()) / DAY_MS;
  if (days <= DECAY_GRACE_DAYS) return theta;
  return theta * Math.exp(-(days - DECAY_GRACE_DAYS) / DECAY_TAU_DAYS);
}

function bandIndex(band: MasteryBand): number {
  return MASTERY_BAND_ORDER.indexOf(band);
}

/**
 * Resolve the band for a mastery score. `previousBand` enables hysteresis (an earned band
 * holds until the score falls BAND_HYSTERESIS below its threshold). When the score change
 * comes from inactivity decay alone (`decayOnly`), an earned band never falls below
 * `familiar` — only demonstrated weakness (wrong answers) can drop it further.
 */
export function resolveMasteryBand(
  score: number,
  attempts: number,
  activeDays: number,
  previousBand: MasteryBand | null = null,
  decayOnly = false,
): MasteryBand {
  if (attempts < 1) return 'none';
  const prevIdx = previousBand ? bandIndex(previousBand) : 0;
  const candidates: Array<[MasteryBand, { score: number; attempts: number; activeDays: number }]> = [
    ['mastered', MASTERY_BANDS.mastered],
    ['proficient', MASTERY_BANDS.proficient],
    ['familiar', MASTERY_BANDS.familiar],
  ];
  let resolved: MasteryBand = 'attempted';
  for (const [band, gate] of candidates) {
    if (attempts < gate.attempts || activeDays < gate.activeDays) continue;
    const threshold = prevIdx >= bandIndex(band) ? gate.score - BAND_HYSTERESIS : gate.score;
    if (score >= threshold) {
      resolved = band;
      break;
    }
  }
  if (
    decayOnly &&
    previousBand &&
    bandIndex(previousBand) >= bandIndex('familiar') &&
    bandIndex(resolved) < bandIndex('familiar') &&
    attempts >= MASTERY_BANDS.familiar.attempts
  ) {
    return 'familiar';
  }
  return resolved;
}

export interface EloUpdateInput {
  /** Learner ability logit (already decayed). */
  theta: number;
  /** Item difficulty logit. */
  difficulty: number;
  /** Guess floor g for this question type (0 for free recall, 0.25 for 4-option MCQ, ...). */
  guessFloor: number;
  /** Learner's prior attempt count on this topic (drives K shrinkage). */
  userAttempts: number;
  /** Item's prior attempt count including the pseudo-count prior (drives item K shrinkage). */
  itemAttempts: number;
  /** Graded outcome 0..1 (partial credit counts partially). */
  credit: number;
  /** Evidence weight (1 for auto-graded, lower for self-reported flashcards). */
  weight: number;
}

export interface EloUpdateResult {
  theta: number;
  difficulty: number;
  /** Expected correctness E used in the update (useful for telemetry). */
  expected: number;
}

/**
 * One Elo-KT update (Pelánek's uncertainty function K = 1/(1 + 0.05·n), guess-floor
 * expected correctness E = g + (1−g)·σ(θ−d)). Correct answers push theta up, wrong
 * answers push it down; item difficulty co-calibrates online in the opposite direction.
 */
export function eloUpdate(input: EloUpdateInput): EloUpdateResult {
  const { theta, difficulty, guessFloor, userAttempts, itemAttempts, credit, weight } = input;
  const expected = guessFloor + (1 - guessFloor) * sigmoid(theta - difficulty);
  const kUser = 1 / (1 + 0.05 * Math.max(0, userAttempts));
  const kItem = 1 / (1 + 0.05 * Math.max(0, itemAttempts));
  const clamp = (v: number) => Math.min(Math.max(v, -THETA_CLAMP), THETA_CLAMP);
  return {
    theta: clamp(theta + weight * kUser * (credit - expected)),
    difficulty: clamp(difficulty + weight * kItem * (expected - credit)),
    expected,
  };
}

/** Map an LLM-declared difficulty label to the Elo item-difficulty prior (logit). */
export function difficultyPrior(declared: string | null | undefined): number {
  switch (declared) {
    case 'easy':
      return -1;
    case 'hard':
      return 1;
    default:
      return 0;
  }
}

/** Pseudo-count behind the LLM difficulty prior (early answers refine, not erase, it). */
export const ITEM_PRIOR_PSEUDO_COUNT = 5;

/**
 * Flashcard self-grades as mastery evidence: only "again" is a fail (Anki/FSRS semantics —
 * "hard" is a PASS), and self-report carries less weight than auto-graded answers.
 */
export function flashcardEvidence(grade: 'again' | 'hard' | 'good' | 'easy'): {
  credit: number;
  weight: number;
} {
  const credit = grade === 'again' ? 0 : grade === 'hard' ? 0.6 : 1;
  return { credit, weight: 0.5 };
}
