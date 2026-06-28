import type { Response } from 'express';
import { z } from 'zod';
import type { AppLocale, DeckAudience } from '@talim/types';
import { AppError } from '../middleware/error.middleware.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { getParam } from '../lib/params.js';
import { resolveLocale } from '../lib/locale.js';
import { assertQuota } from '../services/subscription.service.js';
import { assertCanAccessContent, assertCanGenerate } from '../services/contentAccess.service.js';
import {
  getSlideDeck,
  getReadySlideDeckAnyLocale,
  generateAndStoreSlideDeck,
} from '../services/slides.service.js';

const slidesBodySchema = z.object({
  sectionId: z.string().optional(),
  locale: z.enum(['uz', 'en', 'ru']).optional(),
  audience: z.enum(['kids', 'students', 'tutors']).optional(),
  regenerate: z.boolean().optional(),
});

export async function getSlides(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const contentId = getParam(req, 'id');
  const sectionId = typeof req.query.sectionId === 'string' ? req.query.sectionId : undefined;
  const locale = resolveLocale(req);
  await assertCanAccessContent(req.user, contentId, { requireReady: true });

  let deck = await getSlideDeck(contentId, locale, sectionId);
  // A learner can't generate, so fall back to the deck pre-generated at ingest in
  // the default locale rather than leaving them on raw text under the Slides tab.
  if (!deck?.deck && req.user.role === 'TENANT_LEARNER') {
    deck = await getReadySlideDeckAnyLocale(contentId, sectionId);
  }
  res.json({ slides: deck });
}

export async function createSlides(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  assertCanGenerate(req.user);
  const contentId = getParam(req, 'id');
  const body = slidesBodySchema.parse(req.body ?? {});
  const locale = (body.locale ?? resolveLocale(req)) as AppLocale;
  const audience: DeckAudience = body.audience ?? 'students';

  const content = await assertCanAccessContent(req.user, contentId, { requireReady: true });

  // Serve a cached, finished deck without re-spending generation quota — unless the
  // caller explicitly asked to regenerate (the "Regenerate" button), which must force a
  // fresh deck rather than silently returning the existing one.
  if (!body.regenerate) {
    const existing = await getSlideDeck(contentId, locale, body.sectionId);
    if (existing && existing.status === 'READY' && existing.deck) {
      res.json({ slides: existing, cached: true });
      return;
    }
  }

  await assertQuota(req.user.userId, 'GENERATION', {
    role: req.user.role,
    tenantId: req.user.tenantId,
  });

  const slides = await generateAndStoreSlideDeck({
    userId: req.user.userId,
    tenantId: req.user.tenantId,
    contentId,
    title: content.title,
    locale,
    audience,
    sectionId: body.sectionId,
  });

  res.json({ slides, cached: false });
}
