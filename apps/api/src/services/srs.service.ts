import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';
import type { AuthPayload } from '../middleware/auth.middleware.js';
import { assertCanAccessContent } from './contentAccess.service.js';

/** Grades a learner can give a card after flipping it. */
export type FlashcardGrade = 'again' | 'hard' | 'good' | 'easy';

/** SM-2 "quality" (q) for each grade. q < 3 resets the schedule. */
const GRADE_QUALITY: Record<FlashcardGrade, number> = {
  again: 1,
  hard: 3,
  good: 4,
  easy: 5,
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface FlashcardReviewResult {
  flashcardId: string;
  intervalDays: number;
  nextReviewAt: string | null;
  repetitions: number;
  easeFactor: number;
}

/**
 * Apply an SM-2 review to a flashcard for `user` and persist the per-user state.
 * Isolation is enforced through the shared content-access guard: the card must belong
 * to a deck of a Content the user can access.
 */
export async function reviewFlashcard(
  user: AuthPayload,
  flashcardId: string,
  grade: FlashcardGrade,
): Promise<FlashcardReviewResult> {
  const card = await prisma.flashcard.findUnique({
    where: { id: flashcardId },
    select: { id: true, deck: { select: { contentId: true } } },
  });
  if (!card) throw new AppError(404, 'Flashcard not found');

  // A card belongs to a deck belongs to a Content the user must be allowed to read.
  await assertCanAccessContent(user, card.deck.contentId, { requireReady: true });

  const q = GRADE_QUALITY[grade];
  const now = new Date();

  const existing = await prisma.flashcardReview.findUnique({
    where: { userId_flashcardId: { userId: user.userId, flashcardId } },
  });

  let easeFactor = existing?.easeFactor ?? 2.5;
  let repetitions = existing?.repetitions ?? 0;
  let intervalDays = existing?.intervalDays ?? 0;

  if (q < 3) {
    // "Again" — re-queue soon; reset the schedule, keep the ease factor.
    repetitions = 0;
    intervalDays = 0;
  } else {
    repetitions += 1;
    intervalDays =
      repetitions === 1 ? 1 : repetitions === 2 ? 6 : Math.round(intervalDays * easeFactor);
    easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
  }

  const nextReviewAt = new Date(now.getTime() + intervalDays * MS_PER_DAY);

  const review = await prisma.flashcardReview.upsert({
    where: { userId_flashcardId: { userId: user.userId, flashcardId } },
    create: {
      userId: user.userId,
      flashcardId,
      easeFactor,
      repetitions,
      intervalDays,
      lastReviewedAt: now,
      nextReviewAt,
    },
    update: {
      easeFactor,
      repetitions,
      intervalDays,
      lastReviewedAt: now,
      nextReviewAt,
    },
  });

  return {
    flashcardId: review.flashcardId,
    intervalDays: review.intervalDays,
    nextReviewAt: review.nextReviewAt ? review.nextReviewAt.toISOString() : null,
    repetitions: review.repetitions,
    easeFactor: review.easeFactor,
  };
}
