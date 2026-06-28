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

const flashcardsBodySchema = z.object({
  sectionId: z.string().optional(),
  locale: z.enum(['uz', 'en', 'ru']).optional(),
  regenerate: z.boolean().optional(),
});

function scopeKey(sectionId?: string): string {
  return sectionId ?? 'full';
}

function formatDeck(deck: {
  id: string;
  contentId: string;
  sectionId: string | null;
  scopeKey: string;
  locale: string;
  status: string;
  createdAt: Date;
  cards?: { id: string; front: string; back: string; order: number }[];
}) {
  return {
    id: deck.id,
    contentId: deck.contentId,
    sectionId: deck.sectionId,
    scopeKey: deck.scopeKey,
    locale: deck.locale,
    status: deck.status,
    cards: (deck.cards ?? []).map((c) => ({
      id: c.id,
      front: c.front,
      back: c.back,
      order: c.order,
    })),
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

  res.json({ deck: deck ? formatDeck(deck) : null });
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

  await flashcardQueue.add({ contentId, deckId: deck.id, locale });

  res.status(202).json({ deck: formatDeck(deck), cached: false });
}
