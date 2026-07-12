import type { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { getParam } from '../lib/params.js';
import { resolveLocale } from '../lib/locale.js';
import { assertQuota } from '../services/subscription.service.js';
import { assertCanAccessContent, assertCanGenerate } from '../services/contentAccess.service.js';
import { flashcardQueue } from '../services/queue.service.js';
import { reviewFlashcard as applyFlashcardReview } from '../services/srs.service.js';
import { recordFlashcardReview } from '../services/sectionMastery.service.js';

const flashcardsBodySchema = z.object({
  sectionId: z.string().optional(),
  locale: z.enum(['uz', 'en', 'ru']).optional(),
  regenerate: z.boolean().optional(),
  // Requested card count from the unified Practice generator (default handled by the job).
  count: z.number().int().min(1).max(30).optional(),
});

const reviewBodySchema = z.object({
  grade: z.enum(['again', 'hard', 'good', 'easy']),
});

function scopeKey(sectionId?: string): string {
  return sectionId ?? 'full';
}

type ReviewRow = {
  flashcardId: string;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewAt: Date | null;
};

function formatDeck(
  deck: {
    id: string;
    contentId: string;
    sectionId: string | null;
    scopeKey: string;
    locale: string;
    status: string;
    createdAt: Date;
    cards?: { id: string; front: string; back: string; order: number }[];
  },
  reviews?: Map<string, ReviewRow>,
  now: Date = new Date(),
) {
  const cards = (deck.cards ?? []).map((c) => {
    const r = reviews?.get(c.id);
    // Due when the card has never been reviewed or its next review time has passed.
    const due = !r || !r.nextReviewAt || r.nextReviewAt <= now;
    return {
      id: c.id,
      front: c.front,
      back: c.back,
      order: c.order,
      due,
      intervalDays: r?.intervalDays ?? 0,
      repetitions: r?.repetitions ?? 0,
      easeFactor: r?.easeFactor ?? 2.5,
      nextReviewAt: r?.nextReviewAt ? r.nextReviewAt.toISOString() : null,
    };
  });
  return {
    id: deck.id,
    contentId: deck.contentId,
    sectionId: deck.sectionId,
    scopeKey: deck.scopeKey,
    locale: deck.locale,
    status: deck.status,
    cards,
    dueCount: cards.filter((c) => c.due).length,
    createdAt: deck.createdAt.toISOString(),
  };
}

export async function getFlashcards(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const contentId = getParam(req, 'id');
  const sectionId = typeof req.query.sectionId === 'string' ? req.query.sectionId : undefined;
  const locale = resolveLocale(req);
  await assertCanAccessContent(req.user, contentId, { requireReady: true });

  const deck = await prisma.flashcardDeck.findUnique({
    where: { contentId_locale_scopeKey: { contentId, locale, scopeKey: scopeKey(sectionId) } },
    include: { cards: { orderBy: { order: 'asc' } } },
  });

  // Enrich each card with this user's SM-2 review state (nextReviewAt / due) + a deck-level dueCount.
  let reviews: Map<string, ReviewRow> | undefined;
  if (deck && deck.cards.length > 0) {
    const rows = await prisma.flashcardReview.findMany({
      where: { userId: req.user.userId, flashcardId: { in: deck.cards.map((c) => c.id) } },
      select: {
        flashcardId: true,
        easeFactor: true,
        intervalDays: true,
        repetitions: true,
        nextReviewAt: true,
      },
    });
    reviews = new Map(rows.map((r) => [r.flashcardId, r]));
  }

  res.json({ deck: deck ? formatDeck(deck, reviews) : null });
}

export async function reviewFlashcard(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const flashcardId = getParam(req, 'cardId');
  const { grade } = reviewBodySchema.parse(req.body ?? {});

  const review = await applyFlashcardReview(req.user, flashcardId, grade);

  // Self-report evidence for Elo-KT mastery (half weight; only "again" counts as a fail).
  // Must never break the review itself.
  let masteryDeltas: unknown[] = [];
  try {
    const card = await prisma.flashcard.findUnique({
      where: { id: flashcardId },
      select: { deck: { select: { contentId: true, sectionId: true } } },
    });
    if (card) {
      masteryDeltas = await recordFlashcardReview(
        req.user.userId,
        card.deck.contentId,
        card.deck.sectionId,
        flashcardId,
        grade,
      );
    }
  } catch (err) {
    console.error('reviewFlashcard: mastery update failed', err);
  }

  res.json({ review, masteryDeltas });
}

export async function createFlashcards(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  assertCanGenerate(req.user);
  const contentId = getParam(req, 'id');
  const body = flashcardsBodySchema.parse(req.body ?? {});
  const locale = body.locale ?? resolveLocale(req);
  await assertCanAccessContent(req.user, contentId, { requireReady: true });

  const key = scopeKey(body.sectionId);
  const existing = await prisma.flashcardDeck.findUnique({
    where: { contentId_locale_scopeKey: { contentId, locale, scopeKey: key } },
    include: { cards: { orderBy: { order: 'asc' } } },
  });

  // A ready/in-progress deck is reused unless the caller explicitly regenerates.
  if (existing && existing.status !== 'FAILED' && !body.regenerate) {
    res.json({ deck: formatDeck(existing), cached: true });
    return;
  }

  await assertQuota(req.user.userId, 'GENERATION', {
    role: req.user.role,
    tenantId: req.user.tenantId,
  });

  const deck = existing
    ? await prisma.flashcardDeck.update({
        where: { id: existing.id },
        data: { status: 'GENERATING', sectionId: body.sectionId ?? null, cards: { deleteMany: {} } },
        include: { cards: true },
      })
    : await prisma.flashcardDeck.create({
        data: {
          contentId,
          locale,
          scopeKey: key,
          sectionId: body.sectionId ?? null,
          status: 'GENERATING',
        },
        include: { cards: true },
      });

  await flashcardQueue.add({ contentId, deckId: deck.id, locale, count: body.count });

  res.status(202).json({ deck: formatDeck(deck), cached: false });
}
