import type { QuestionType } from '@prisma/client';
import {
  decayedTheta,
  difficultyPrior,
  eloUpdate,
  flashcardEvidence,
  guessFloorForQuestion,
  masteryScore,
  resolveMasteryBand,
  ITEM_PRIOR_PSEUDO_COUNT,
  type ContentMasteryResponse,
  type MasteryDelta,
  type SectionMasteryInfo,
} from '@talim/types';
import { prisma } from '../lib/prisma.js';

/**
 * Elo-KT answer-driven mastery tracking (docs/plans/question-engine.md §4) — distinct from
 * mastery.service.ts, which aggregates coverage-based progress for tenant dashboards. One
 * SectionMastery row per (user, content, section); every graded answer moves theta up
 * (correct) or down (wrong), partial credit counts partially, and item difficulty
 * co-calibrates online in QuestionStat. Inactivity decays theta lazily — no cron.
 * Flashcard self-reports feed the same model at half weight ("again" = fail).
 */

export interface AnswerEvidence {
  /** "quiz:<quizQuestionId>" | "bank:<bankQuestionId>" | "card:<flashcardId>" */
  itemKey: string;
  sectionId: string | null;
  questionType: QuestionType;
  options?: unknown;
  /** Graded credit 0..1 (full correct = 1; partial credit counts partially). */
  credit: number;
  /** LLM-declared difficulty label, used to seed the item prior on first sight. */
  declaredDifficulty?: string | null;
  /** Evidence weight (1 = auto-graded; flashcard self-report passes 0.5). */
  weight?: number;
  /** Guess floor override (flashcard self-report has no options to derive it from). */
  guessFloorOverride?: number;
}

const FULL_SCOPE = 'full';

function scopeKeyFor(sectionId: string | null): string {
  return sectionId ?? FULL_SCOPE;
}

/** YYYY-MM-DD in UTC — good enough for the distinct-active-days mastery gate. */
function dayStamp(now: Date): string {
  return now.toISOString().slice(0, 10);
}

/**
 * Record a batch of graded answers for one (user, content) and return the per-section
 * mastery movement. Answers are grouped by section so each SectionMastery row is loaded,
 * decayed, updated through every answer in order, and written once.
 */
export async function recordAnswers(
  userId: string,
  contentId: string,
  answers: AnswerEvidence[],
  now = new Date(),
): Promise<MasteryDelta[]> {
  if (answers.length === 0) return [];

  const bySection = new Map<string, AnswerEvidence[]>();
  for (const a of answers) {
    const key = scopeKeyFor(a.sectionId);
    const list = bySection.get(key) ?? [];
    list.push(a);
    bySection.set(key, list);
  }

  // Item difficulty stats for every answered item (shared across users).
  const itemKeys = [...new Set(answers.map((a) => a.itemKey))];
  const stats = await prisma.questionStat.findMany({ where: { itemKey: { in: itemKeys } } });
  const statByKey = new Map(
    stats.map((s) => [s.itemKey, { difficulty: s.difficulty, attempts: s.attempts }]),
  );

  const deltas: MasteryDelta[] = [];
  const today = dayStamp(now);

  for (const [scopeKey, sectionAnswers] of bySection) {
    const sectionId = scopeKey === FULL_SCOPE ? null : scopeKey;
    const existing = await prisma.sectionMastery.findUnique({
      where: { userId_contentId_scopeKey: { userId, contentId, scopeKey } },
    });

    // Lazy inactivity decay happens before new evidence lands.
    let theta = decayedTheta(existing?.theta ?? 0, existing?.lastAnswerAt ?? null, now);
    let attempts = existing?.attempts ?? 0;
    let correct = existing?.correct ?? 0;
    const activeDays = (existing?.activeDays ?? 0) + (existing?.lastAnswerDay === today ? 0 : 1);

    const beforeScore = masteryScore(theta);
    const beforeBand = resolveMasteryBand(beforeScore, attempts, existing?.activeDays ?? 0, null);

    for (const a of sectionAnswers) {
      const stat = statByKey.get(a.itemKey) ?? {
        difficulty: difficultyPrior(a.declaredDifficulty),
        attempts: 0,
      };
      const updated = eloUpdate({
        theta,
        difficulty: stat.difficulty,
        guessFloor:
          a.guessFloorOverride ??
          guessFloorForQuestion({ type: a.questionType, options: a.options }),
        userAttempts: attempts,
        itemAttempts: stat.attempts + ITEM_PRIOR_PSEUDO_COUNT,
        credit: Math.min(Math.max(a.credit, 0), 1),
        weight: a.weight ?? 1,
      });
      theta = updated.theta;
      statByKey.set(a.itemKey, { difficulty: updated.difficulty, attempts: stat.attempts + 1 });
      attempts += 1;
      if (a.credit >= 1) correct += 1;
    }

    await prisma.sectionMastery.upsert({
      where: { userId_contentId_scopeKey: { userId, contentId, scopeKey } },
      create: {
        userId,
        contentId,
        sectionId,
        scopeKey,
        theta,
        attempts,
        correct,
        activeDays,
        lastAnswerDay: today,
        lastAnswerAt: now,
      },
      update: {
        theta,
        attempts,
        correct,
        activeDays,
        lastAnswerDay: today,
        lastAnswerAt: now,
      },
    });

    const afterScore = masteryScore(theta);
    deltas.push({
      sectionId,
      scopeKey,
      before: beforeScore,
      after: afterScore,
      bandBefore: beforeBand,
      band: resolveMasteryBand(afterScore, attempts, activeDays, beforeBand),
    });
  }

  // Persist the co-calibrated item difficulties (a lost race between concurrent learners
  // only costs a little calibration signal — acceptable).
  for (const key of itemKeys) {
    const stat = statByKey.get(key);
    if (!stat) continue;
    await prisma.questionStat.upsert({
      where: { itemKey: key },
      create: { itemKey: key, difficulty: stat.difficulty, attempts: stat.attempts },
      update: { difficulty: stat.difficulty, attempts: stat.attempts },
    });
  }

  return deltas;
}

/** Flashcard review as mastery evidence (self-report: half weight, "again" = fail). */
export async function recordFlashcardReview(
  userId: string,
  contentId: string,
  sectionId: string | null,
  flashcardId: string,
  grade: 'again' | 'hard' | 'good' | 'easy',
): Promise<MasteryDelta[]> {
  const { credit, weight } = flashcardEvidence(grade);
  return recordAnswers(userId, contentId, [
    {
      itemKey: `card:${flashcardId}`,
      sectionId,
      // Deck cards predate the FLASHCARD question type; typing the evidence as FLASHCARD
      // derives the same guess floor the in-quiz flashcards use (single source of truth).
      questionType: 'FLASHCARD',
      credit,
      weight,
    },
  ]);
}

/**
 * Per-section mastery for the progress rail. Scores are decayed at read time; a band
 * earned earlier can therefore show `needsReview` (and, capped at `familiar`, a lower
 * band) after long inactivity — mastery honestly goes down.
 */
export async function getContentMastery(
  userId: string,
  contentId: string,
  now = new Date(),
): Promise<ContentMasteryResponse> {
  const rows = await prisma.sectionMastery.findMany({
    where: { userId, contentId },
    orderBy: { updatedAt: 'desc' },
  });

  const sections: SectionMasteryInfo[] = rows.map((row) => {
    const storedScore = masteryScore(row.theta);
    const effectiveTheta = decayedTheta(row.theta, row.lastAnswerAt, now);
    const effectiveScore = masteryScore(effectiveTheta);
    const storedBand = resolveMasteryBand(storedScore, row.attempts, row.activeDays, null);
    const band = resolveMasteryBand(
      effectiveScore,
      row.attempts,
      row.activeDays,
      storedBand,
      /* decayOnly */ true,
    );
    return {
      sectionId: row.sectionId,
      scopeKey: row.scopeKey,
      score: effectiveScore,
      band,
      attempts: row.attempts,
      correct: row.correct,
      lastAnswerAt: row.lastAnswerAt?.toISOString() ?? null,
      needsReview: effectiveScore <= storedScore - 5,
    };
  });

  return { contentId, sections };
}
