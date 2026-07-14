import { parseAppLocale, type AppLocale, type Deck } from '@talim/types';
import { prisma } from '../lib/prisma.js';
import { generateJsonCompletion } from '../services/ai.service.js';
import { synthesizeSpeech } from '../services/tts.service.js';
import { storageService } from '../services/storage.service.js';
import { getSlideDeck, generateAndStoreSlideDeck } from '../services/slides.service.js';
import { videoQueue, type GenerateVideoJobData } from '../services/queue.service.js';
import { publishContentEvent } from '../services/events/jobEventAudience.js';

/**
 * "AI video" = a narrated slideshow. We reuse the slide-deck generator for the
 * visuals and TTS for the voice-over, then store a per-slide narration timeline
 * (the `segments` JSON) that the web app plays back in-browser as an
 * auto-advancing, narrated presentation. There is no server-side MP4 encode
 * (no ffmpeg/rasterizer in the API) — the browser is the renderer.
 */

interface StoredSegment {
  index: number;
  title: string;
  narration: string;
  audioPath: string | null;
  durationSec: number;
}

const LANGUAGE_NAME: Record<AppLocale, string> = {
  uz: 'Uzbek (latin script)',
  ru: 'Russian',
  en: 'English',
};

/** Flatten any slide layout into a short plain-text gist for the narrator prompt. */
function slideToText(slide: unknown): string {
  if (!slide || typeof slide !== 'object') return '';
  const s = slide as Record<string, unknown>;
  const parts: string[] = [];
  const pushStr = (v: unknown) => {
    if (typeof v === 'string' && v.trim()) parts.push(v.trim());
    else if (typeof v === 'number') parts.push(String(v));
  };
  pushStr(s.title);
  pushStr(s.subtitle);
  pushStr(s.body);
  pushStr(s.definition);
  pushStr(s.stat);
  pushStr(s.caption);
  pushStr(s.quote);
  pushStr(s.question);
  const arr = (v: unknown) => (Array.isArray(v) ? v : []);
  for (const b of arr(s.bullets)) {
    if (typeof b === 'string') pushStr(b);
    else if (b && typeof b === 'object') pushStr((b as Record<string, unknown>).text);
  }
  for (const p of arr(s.points)) pushStr(p);
  for (const st of arr(s.steps)) {
    if (typeof st === 'string') pushStr(st);
    else if (st && typeof st === 'object') {
      const o = st as Record<string, unknown>;
      pushStr([o.title, o.detail].filter(Boolean).join(': '));
    }
  }
  for (const st of arr(s.stats)) {
    if (st && typeof st === 'object') {
      const o = st as Record<string, unknown>;
      pushStr([o.value, o.label].filter(Boolean).join(' '));
    } else pushStr(st);
  }
  return parts.join('. ').slice(0, 1200);
}

function estimateDurationSec(narration: string): number {
  const words = narration.split(/\s+/).filter(Boolean).length;
  // ~150 wpm spoken; floor so a terse slide still lingers long enough to read.
  return Math.max(4, Math.round((words / 150) * 60));
}

async function buildNarrations(
  deck: Deck,
  locale: AppLocale,
  usage: { userId: string; tenantId?: string | null; metadata: Record<string, unknown> },
): Promise<string[]> {
  const slideList = deck.slides
    .map((slide, i) => `Slide ${i + 1}: ${slideToText(slide) || '(visual only)'}`)
    .join('\n');

  const system = [
    `You are a warm, clear lesson narrator. Write spoken voice-over narration in ${LANGUAGE_NAME[locale]}.`,
    'For EACH slide write 2-4 natural spoken sentences a teacher would say while that slide is on screen.',
    'Connect the slides into one flowing lesson. No markdown, no slide numbers, no stage directions — only the words to be spoken.',
    'Return strict JSON: {"segments":[{"index":<0-based slide index>,"narration":"..."}]} with exactly one entry per slide.',
  ].join(' ');

  const user = `Lesson title: ${deck.title}\n\nSlides:\n${slideList}`;

  const result = await generateJsonCompletion<{ segments?: Array<{ index?: number; narration?: string }> }>(
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    {
      temperature: 0.5,
      usage: { userId: usage.userId, tenantId: usage.tenantId ?? undefined, feature: 'VIDEO_GEN', metadata: usage.metadata },
    },
  );

  const byIndex = new Map<number, string>();
  for (const seg of result.segments ?? []) {
    if (typeof seg.index === 'number' && typeof seg.narration === 'string' && seg.narration.trim()) {
      byIndex.set(seg.index, seg.narration.trim());
    }
  }
  // Fall back to the slide gist so every slide gets a voice even if the model
  // skipped one.
  return deck.slides.map((slide, i) => byIndex.get(i) || slideToText(slide) || deck.title);
}

export function registerGenerateVideoJob(): void {
  videoQueue.process(async (job) => {
    const { contentId, videoId, locale: jobLocale } = job.data as GenerateVideoJobData;

    const video = await prisma.contentVideo.findUnique({ where: { id: videoId } });
    if (!video) throw new Error(`Video ${videoId} not found`);

    const content = await prisma.content.findUnique({ where: { id: contentId } });
    if (!content) throw new Error(`Content ${contentId} not found`);

    const locale = parseAppLocale(jobLocale ?? video.locale);
    const sectionId = video.sectionId ?? undefined;

    // 1) Ensure a slide deck exists for this scope (reuse what's there, else build it).
    let deckRow = await getSlideDeck(contentId, locale, sectionId);
    if (!deckRow || deckRow.status !== 'READY' || !deckRow.deck) {
      deckRow = await generateAndStoreSlideDeck({
        userId: content.userId,
        tenantId: content.tenantId,
        contentId,
        title: content.title,
        locale,
        audience: 'students',
        sectionId,
        // This deck is an internal dependency of the video — don't publish slides.status,
        // or a video request would surprise every viewer with a deck they never asked for.
        emitEvent: false,
      });
    }
    const deck = deckRow.deck;
    if (!deck || deck.slides.length === 0) {
      throw new Error('No slides available to build a video');
    }

    // 2) Narration per slide (one LLM call), metered as VIDEO_GEN.
    const narrations = await buildNarrations(deck, locale, {
      userId: content.userId,
      tenantId: content.tenantId,
      metadata: { contentId, videoId },
    });

    // 3) TTS each slide's narration into its own clip.
    const segments: StoredSegment[] = [];
    let audioCount = 0;
    for (let i = 0; i < deck.slides.length; i++) {
      const slide = deck.slides[i]!;
      const narration = narrations[i] ?? '';
      const title = (slide as { title?: string }).title ?? `${content.title} ${i + 1}`;
      const seg: StoredSegment = {
        index: i,
        title,
        narration,
        audioPath: null,
        durationSec: estimateDurationSec(narration),
      };
      try {
        const audio = await synthesizeSpeech(narration, locale, {
          userId: content.userId,
          tenantId: content.tenantId,
          metadata: { contentId, videoId, segment: i },
        });
        seg.audioPath = await storageService.save(audio, `video-${videoId}-${i}.mp3`);
        audioCount++;
      } catch (err) {
        console.error(`Video TTS failed for ${videoId} segment ${i}:`, err);
      }
      segments.push(seg);
    }

    const totalDuration = segments.reduce((sum, s) => sum + s.durationSec, 0);

    await prisma.contentVideo.update({
      where: { id: videoId },
      data: {
        status: audioCount > 0 ? 'READY' : 'FAILED',
        script: narrations.join('\n\n'),
        durationSec: totalDuration,
        segments: segments as unknown as object,
      },
    });
    void publishContentEvent(contentId, {
      type: 'video.status',
      contentId,
      sectionId,
      status: audioCount > 0 ? 'READY' : 'FAILED',
    });
  });

  videoQueue.on('failed', async (job, err) => {
    console.error(`Video job ${job?.id} failed:`, err.message);
    const data = job?.data as GenerateVideoJobData | undefined;
    if (!data?.videoId) return;
    const video = await prisma.contentVideo
      .update({ where: { id: data.videoId }, data: { status: 'FAILED' } })
      .catch(() => null);
    await publishContentEvent(data.contentId, {
      type: 'video.status',
      contentId: data.contentId,
      sectionId: video?.sectionId ?? undefined,
      status: 'FAILED',
    });
  });
}
