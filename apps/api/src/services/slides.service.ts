import type { AppLocale, Deck, DeckAudience, DeckSlide, ContentSlideDeck } from '@talim/types';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';
import { getOrderedChunks, buildRagContext } from './rag.service.js';
import { getSectionBody } from './section.service.js';
import { generateJsonCompletion } from './ai.service.js';
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

export function formatSlideDeck(row: SlideDeckRow): ContentSlideDeck {
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

async function buildContext(contentId: string, sectionId?: string): Promise<string> {
  if (sectionId) {
    const body = await getSectionBody(contentId, sectionId);
    if (!body.trim()) throw new AppError(400, 'No section text available for slides');
    return body.slice(0, 16000);
  }
  const chunks = await getOrderedChunks(contentId);
  if (chunks.length === 0) throw new AppError(400, 'No content text available for slides');
  return buildRagContext(chunks).slice(0, 16000);
}

type Overrides = Pick<Deck, 'accent' | 'language' | 'audience' | 'sourceContentId'> & { title: string };

const FILENAME_RE = /\.(pdf|pptx?|docx?|txt)$/i;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function toBulletObjects(arr: unknown[]): unknown[] {
  return arr.map((b) => (typeof b === 'string' ? { text: b } : isRecord(b) ? b : { text: String(b) }));
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
    if (pts) slide.points = pts.map((p) => String(typeof p === 'object' && p && 'text' in p ? (p as { text: unknown }).text : p));
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
    if (Array.isArray(slide.options) && slide.options.length && typeof slide.options[0] === 'string') {
      const correctIdx = Array.isArray(slide.correct)
        ? slide.correct
        : typeof slide.correctIndex === 'number'
          ? [slide.correctIndex]
          : [];
      slide.options = slide.options.map((opt, i) => ({ text: String(opt), correct: correctIdx.includes(i) }));
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
  if (typeof obj.title === 'string' && obj.title.trim() && !FILENAME_RE.test(obj.title)) return obj.title;
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
  if (typeof obj.estimatedMinutes !== 'number') obj.estimatedMinutes = estimatedMinutesFor(rawSlides.length);

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

export async function generateSlideDeck(params: {
  userId: string;
  contentId: string;
  title: string;
  locale: AppLocale;
  audience: DeckAudience;
  sectionId?: string;
}): Promise<Deck> {
  const { userId, contentId, title, locale, audience, sectionId } = params;
  const context = await buildContext(contentId, sectionId);
  const wordCount = context.split(/\s+/).filter(Boolean).length;
  const targetSlides = targetSlideCount(wordCount, audience);
  const accent = pickAccent(contentId);

  const raw = await generateJsonCompletion<unknown>(
    [
      { role: 'system', content: getDeckSystemPrompt(locale, audience) },
      {
        role: 'user',
        content: buildDeckUserPrompt({ title, audience, locale, targetSlides, contentId, accent, context }),
      },
    ],
    {
      temperature: 0.4,
      usage: { userId, feature: 'SLIDESHOW_GEN', metadata: { contentId, sectionId } },
    },
  );

  return coerceDeck(raw, { accent, language: locale, audience, sourceContentId: contentId, title });
}

export async function generateAndStoreSlideDeck(params: {
  userId: string;
  contentId: string;
  title: string;
  locale: AppLocale;
  audience: DeckAudience;
  sectionId?: string;
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
  return formatSlideDeck(row);
}
