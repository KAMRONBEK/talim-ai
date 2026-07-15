import type { UserRole } from '@prisma/client';
import type { AppLocale, Deck, DeckAudience, DeckSlide, ContentSlideDeck } from '@talim/types';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { AppError, QuotaExceededError } from '../middleware/error.middleware.js';
import { assertQuota } from './subscription.service.js';
import { getOrderedChunks, buildRagContext, boundContextByTokens } from './rag.service.js';
import { getSectionBody } from './section.service.js';
import { generateJsonCompletion } from './ai.service.js';
import { slidesQueue, type GenerateSlidesJobData } from './queue.service.js';
import {
  publishContentEvent,
  publishContentEventTo,
  resolveContentAudience,
} from './events/jobEventAudience.js';
import { deckSchema, slideSchema } from '../lib/deck-schema.js';
import {
  getDeckSystemPrompt,
  buildDeckUserPrompt,
  pickAccent,
  targetSlideCount,
  estimatedMinutesFor,
} from '../lib/deck-prompt.js';

const MIN_SLIDES = 4;

interface SlideDeckRow {
  id: string;
  contentId: string;
  sectionId: string | null;
  scopeKey: string;
  locale: string;
  status: string;
  deck: unknown;
  createdAt: Date;
}

export function deckScopeKey(sectionId?: string): string {
  return sectionId ?? 'full';
}

function formatSlideDeck(row: SlideDeckRow): ContentSlideDeck {
  return {
    id: row.id,
    contentId: row.contentId,
    sectionId: row.sectionId,
    scopeKey: row.scopeKey,
    locale: row.locale,
    status: row.status as ContentSlideDeck['status'],
    deck: (row.deck as Deck | null) ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getSlideDeck(
  contentId: string,
  locale: AppLocale,
  sectionId?: string,
): Promise<ContentSlideDeck | null> {
  const row = await prisma.contentSlideDeck.findUnique({
    where: {
      contentId_locale_scopeKey: { contentId, locale, scopeKey: deckScopeKey(sectionId) },
    },
  });
  return row ? formatSlideDeck(row) : null;
}

/**
 * Learners cannot trigger generation, so when no deck exists in their interface
 * locale we serve any READY deck for the same content/section — preferring the
 * default content locale. Slides are pre-generated at ingest in the default
 * locale (Uzbek); without this fallback a student using the English/Russian UI
 * sees raw text under the "Slides" tab even though a deck exists.
 */
export async function getReadySlideDeckAnyLocale(
  contentId: string,
  sectionId?: string,
): Promise<ContentSlideDeck | null> {
  const rows = await prisma.contentSlideDeck.findMany({
    where: { contentId, scopeKey: deckScopeKey(sectionId), status: 'READY' },
  });
  const ready = rows.filter((r) => r.deck);
  if (ready.length === 0) return null;
  const preferred = ready.find((r) => r.locale === env.DEFAULT_CONTENT_LOCALE) ?? ready[0]!;
  return formatSlideDeck(preferred);
}

// Below this much readable text we refuse to generate — better to fail cleanly
// than let the model fabricate a "couldn't read the document" placeholder deck.
const MIN_SLIDE_CONTEXT_CHARS = 400;

async function buildContext(contentId: string, sectionId?: string): Promise<string> {
  if (sectionId) {
    const body = await getSectionBody(contentId, sectionId);
    if (body.trim().length < MIN_SLIDE_CONTEXT_CHARS) {
      throw new AppError(422, 'Not enough readable text in this section to build slides');
    }
    // Token-bound (not a tiny char cap) so a long section produces a full deck.
    return boundContextByTokens(body, 12000);
  }
  const context = buildRagContext(await getOrderedChunks(contentId));
  if (context.trim().length < MIN_SLIDE_CONTEXT_CHARS) {
    throw new AppError(422, 'Not enough readable text to build slides');
  }
  return boundContextByTokens(context, 18000);
}

type Overrides = Pick<Deck, 'accent' | 'language' | 'audience' | 'sourceContentId'> & {
  title: string;
};

const FILENAME_RE = /\.(pdf|pptx?|docx?|txt)$/i;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function toBulletObjects(arr: unknown[]): unknown[] {
  return arr.map((b) =>
    typeof b === 'string' ? { text: b } : isRecord(b) ? b : { text: String(b) },
  );
}

/**
 * Anti-corruption layer: map the model's natural-but-drifting field conventions
 * onto our schema (it tends to use `type`, `items`, `questionType`, string options
 * with `correct` indices, and to put the question in `body`).
 */
function normalizeSlide(s: unknown): unknown {
  if (!isRecord(s)) return s;
  const slide = { ...s };

  if (typeof slide.layout !== 'string' && typeof slide.type === 'string') {
    slide.layout = slide.type;
    delete slide.type;
  }
  const layout = slide.layout;
  const items = Array.isArray(slide.items) ? slide.items : null;

  if (layout === 'bullets') {
    if (!Array.isArray(slide.bullets) && items) slide.bullets = items;
    if (Array.isArray(slide.bullets)) slide.bullets = toBulletObjects(slide.bullets);
  } else if (layout === 'recap') {
    const pts = Array.isArray(slide.points) ? slide.points : items;
    if (pts)
      slide.points = pts.map((p) =>
        String(typeof p === 'object' && p && 'text' in p ? (p as { text: unknown }).text : p),
      );
  } else if (layout === 'statTrio') {
    if (!Array.isArray(slide.stats) && items) slide.stats = items;
  } else if (layout === 'process') {
    const steps = Array.isArray(slide.steps) ? slide.steps : items;
    if (steps) slide.steps = steps.map((it) => (typeof it === 'string' ? { title: it } : it));
  } else if (layout === 'quickCheck') {
    if (!slide.kind && typeof slide.questionType === 'string') slide.kind = slide.questionType;
    if (!slide.question || typeof slide.question !== 'string') {
      const fromBody = typeof slide.body === 'string' && slide.body.trim() ? slide.body : undefined;
      slide.question = fromBody ?? (typeof slide.title === 'string' ? slide.title : undefined);
    }
    if (
      Array.isArray(slide.options) &&
      slide.options.length &&
      typeof slide.options[0] === 'string'
    ) {
      const correctIdx = Array.isArray(slide.correct)
        ? slide.correct
        : typeof slide.correctIndex === 'number'
          ? [slide.correctIndex]
          : [];
      slide.options = slide.options.map((opt, i) => ({
        text: String(opt),
        correct: correctIdx.includes(i),
      }));
    }
  }

  if (Array.isArray(slide.sourceRefs)) {
    slide.sourceRefs = slide.sourceRefs
      .filter((x) => typeof x === 'string')
      .slice(0, 8)
      .map((x) => (x as string).slice(0, 120));
  }
  return slide;
}

/** Prefer a real deck title; else the cover slide's title; else the filename sans extension. */
function deriveTitle(obj: Record<string, unknown>, slides: unknown[], fallback: string): string {
  if (typeof obj.title === 'string' && obj.title.trim() && !FILENAME_RE.test(obj.title))
    return obj.title;
  const cover = slides.find((s) => isRecord(s) && s.layout === 'cover');
  if (isRecord(cover) && typeof cover.title === 'string' && cover.title.trim()) return cover.title;
  return fallback.replace(FILENAME_RE, '').trim() || fallback;
}

/** Validate the (normalized) model output, salvaging valid slides if the whole-deck parse fails. */
function coerceDeck(raw: unknown, overrides: Overrides): Deck {
  const obj = isRecord(raw) ? { ...raw } : {};
  const rawSlides = Array.isArray(obj.slides) ? obj.slides.map(normalizeSlide) : [];
  obj.slides = rawSlides;

  // Inject authoritative deck-level fields the model often omits or drifts on.
  obj.schemaVersion = '1';
  obj.accent = overrides.accent;
  obj.language = overrides.language;
  obj.audience = overrides.audience;
  obj.sourceContentId = overrides.sourceContentId;
  obj.title = deriveTitle(obj, rawSlides, overrides.title);
  if (typeof obj.estimatedMinutes !== 'number')
    obj.estimatedMinutes = estimatedMinutesFor(rawSlides.length);

  const direct = deckSchema.safeParse(obj);
  if (direct.success) return direct.data as Deck;

  // Salvage: keep individually valid slides, recompute deck minutes.
  const slides: DeckSlide[] = [];
  for (const s of rawSlides) {
    const parsed = slideSchema.safeParse(s);
    if (parsed.success) slides.push(parsed.data as DeckSlide);
  }
  if (slides.length < MIN_SLIDES) {
    throw new AppError(502, 'The model returned an invalid slide deck. Please try again.');
  }
  return {
    schemaVersion: '1',
    title: String(obj.title),
    subtitle: typeof obj.subtitle === 'string' ? obj.subtitle : undefined,
    audience: overrides.audience,
    accent: overrides.accent,
    language: overrides.language,
    estimatedMinutes: estimatedMinutesFor(slides.length),
    sourceContentId: overrides.sourceContentId,
    slides,
  };
}

async function generateSlideDeck(params: {
  userId: string;
  tenantId?: string | null;
  contentId: string;
  title: string;
  locale: AppLocale;
  audience: DeckAudience;
  sectionId?: string;
}): Promise<Deck> {
  const { userId, tenantId, contentId, title, locale, audience, sectionId } = params;
  const context = await buildContext(contentId, sectionId);
  const wordCount = context.split(/\s+/).filter(Boolean).length;
  const targetSlides = targetSlideCount(wordCount, audience);
  const accent = pickAccent(contentId);

  const raw = await generateJsonCompletion<unknown>(
    [
      { role: 'system', content: getDeckSystemPrompt(locale, audience) },
      {
        role: 'user',
        content: buildDeckUserPrompt({
          title,
          audience,
          locale,
          targetSlides,
          contentId,
          accent,
          context,
        }),
      },
    ],
    {
      temperature: 0.4,
      // tenantId is required so tenant generation counts toward the tenant's quota.
      usage: {
        userId,
        tenantId: tenantId ?? undefined,
        feature: 'SLIDESHOW_GEN',
        metadata: { contentId, sectionId },
      },
    },
  );

  return coerceDeck(raw, { accent, language: locale, audience, sourceContentId: contentId, title });
}

export async function generateAndStoreSlideDeck(params: {
  userId: string;
  tenantId?: string | null;
  contentId: string;
  title: string;
  locale: AppLocale;
  audience: DeckAudience;
  sectionId?: string;
  /**
   * Pre-resolved audience for the READY event. Pass this when generating many decks for
   * one content in a loop (autoGenerateSectionDecks) so the fan-out doesn't re-run the
   * assignee query per section. Omit to resolve lazily.
   */
  recipients?: readonly string[];
  /**
   * Suppress the `slides.status READY` publish. The video job builds a deck as a side
   * effect; it must not tell every viewer's slides tab that a deck they never requested
   * is ready. Defaults to publishing.
   */
  emitEvent?: boolean;
}): Promise<ContentSlideDeck> {
  const deck = await generateSlideDeck(params);
  const scopeKey = deckScopeKey(params.sectionId);
  const row = await prisma.contentSlideDeck.upsert({
    where: {
      contentId_locale_scopeKey: { contentId: params.contentId, locale: params.locale, scopeKey },
    },
    create: {
      contentId: params.contentId,
      locale: params.locale,
      scopeKey,
      sectionId: params.sectionId ?? null,
      status: 'READY',
      audience: params.audience,
      accent: deck.accent,
      deck: deck as unknown as object,
    },
    update: {
      status: 'READY',
      audience: params.audience,
      accent: deck.accent,
      deck: deck as unknown as object,
      sectionId: params.sectionId ?? null,
    },
  });
  // Single completion point for every caller (manual slides job, ingest-time
  // autoGenerateSectionDecks). Tell the owner and assigned learners the deck is ready —
  // unless the caller opts out (video job's implicit build) or passes a pre-resolved
  // audience (loop callers, so we don't re-query assignees per section).
  if (params.emitEvent !== false) {
    if (params.recipients) {
      publishContentEventTo(params.recipients, {
        type: 'slides.status',
        contentId: params.contentId,
        sectionId: params.sectionId,
        status: 'READY',
      });
    } else {
      void publishContentEvent(params.contentId, {
        type: 'slides.status',
        contentId: params.contentId,
        sectionId: params.sectionId,
        status: 'READY',
      });
    }
  }
  return formatSlideDeck(row);
}

/**
 * Async manual generation: mark the deck row GENERATING (so the UI shows progress and
 * duplicate requests can short-circuit) and enqueue the Bull job that runs
 * `generateAndStoreSlideDeck`. Returns the GENERATING row for the 202 response.
 */
export async function enqueueSlideDeckGeneration(params: {
  userId: string;
  tenantId?: string | null;
  contentId: string;
  title: string;
  locale: AppLocale;
  audience: DeckAudience;
  sectionId?: string;
}): Promise<ContentSlideDeck> {
  const scopeKey = deckScopeKey(params.sectionId);
  const row = await prisma.contentSlideDeck.upsert({
    where: {
      contentId_locale_scopeKey: { contentId: params.contentId, locale: params.locale, scopeKey },
    },
    create: {
      contentId: params.contentId,
      locale: params.locale,
      scopeKey,
      sectionId: params.sectionId ?? null,
      status: 'GENERATING',
      audience: params.audience,
    },
    // Keep the previous `deck` JSON so a regenerate can keep showing the old deck
    // while the replacement renders.
    update: {
      status: 'GENERATING',
      audience: params.audience,
      sectionId: params.sectionId ?? null,
    },
  });
  const jobData: GenerateSlidesJobData = {
    contentId: params.contentId,
    userId: params.userId,
    tenantId: params.tenantId ?? null,
    title: params.title,
    locale: params.locale,
    audience: params.audience,
    sectionId: params.sectionId,
  };
  try {
    await slidesQueue.add(jobData);
  } catch (err) {
    // Enqueue failed (e.g. Redis down) — release the GENERATING claim, or every later
    // non-regenerate POST would 202 against a job that never existed (permanent spinner).
    // The status guard avoids clobbering a concurrent run's READY write; the old deck
    // JSON is kept so a failed regenerate still shows the previous deck.
    await prisma.contentSlideDeck
      .updateMany({
        where: {
          contentId: params.contentId,
          locale: params.locale,
          scopeKey,
          status: 'GENERATING',
        },
        data: { status: 'FAILED' },
      })
      .catch(() => undefined);
    void publishContentEvent(params.contentId, {
      type: 'slides.status',
      contentId: params.contentId,
      sectionId: params.sectionId,
      status: 'FAILED',
    });
    throw err;
  }
  return formatSlideDeck(row);
}

/**
 * Pre-generate a slide deck for every section of a content right after ingestion,
 * so students see ready slides without triggering generation themselves. Best-effort
 * and quota-aware: skips sections that already have a deck, and stops cleanly once
 * the owner's monthly generation limit is reached (never throws / never fails ingest).
 */
export async function autoGenerateSectionDecks(params: {
  contentId: string;
  userId: string;
  tenantId: string | null;
  role: UserRole;
  title: string;
  locale: AppLocale;
  audience?: DeckAudience;
}): Promise<void> {
  const sections = await prisma.contentSection.findMany({
    where: { contentId: params.contentId },
    orderBy: { order: 'asc' },
    select: { id: true },
  });
  const audience = params.audience ?? 'students';
  // Resolve the fan-out audience ONCE for the whole batch: publishing per section would
  // otherwise re-run the assignee query for every section (N+1) and, for an assigned
  // class, hammer every learner with S back-to-back slide refetches on the completion spike.
  const recipients = await resolveContentAudience(params.contentId);

  for (const section of sections) {
    try {
      const existing = await getSlideDeck(params.contentId, params.locale, section.id);
      if (existing?.status === 'READY' && existing.deck) continue;
      // Respect the plan limit; recorded SLIDESHOW_GEN usage makes this self-limiting.
      await assertQuota(params.userId, 'GENERATION', {
        role: params.role,
        tenantId: params.tenantId ?? undefined,
      });
      await generateAndStoreSlideDeck({
        userId: params.userId,
        tenantId: params.tenantId,
        contentId: params.contentId,
        title: params.title,
        locale: params.locale,
        audience,
        sectionId: section.id,
        recipients,
      });
    } catch (err) {
      // Out of quota → stop; any other per-section failure → skip and continue.
      if (err instanceof QuotaExceededError) break;
    }
  }
}
