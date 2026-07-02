import OpenAI from 'openai';
import { env } from '../config/env.js';
import type { AppLocale } from '@talim/types';
import { normalizeScriptForTts, splitScriptIntoChunks } from '../lib/tts-normalize.js';
import { recordUsage, type UsageContext } from './usage.service.js';

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

type OpenAiVoice = 'alloy' | 'nova' | 'onyx' | 'shimmer' | 'echo' | 'fable';
// [host A, host B] per locale — two distinct voices so the conversational podcast
// has two speakers. Index 0 is also the single voice used for narrated videos.
const OPENAI_VOICES_BY_LOCALE: Record<AppLocale, [OpenAiVoice, OpenAiVoice]> = {
  uz: ['onyx', 'nova'],
  en: ['onyx', 'shimmer'],
  ru: ['onyx', 'nova'],
};

// OpenAI's voices are English-trained — they read Uzbek/Russian with an English
// accent. Azure AI Speech has genuinely NATIVE neural voices (uz-UZ-SardorNeural,
// ru-RU-DmitryNeural, …), so when an Azure Speech resource is configured we route
// synthesis through it for natural Uzbek/Russian/English. Falls back to OpenAI
// when Azure isn't configured, so nothing breaks without the key.
const azureConfigured = Boolean(env.AZURE_SPEECH_KEY && env.AZURE_SPEECH_REGION);

const AZURE_LANG: Record<AppLocale, string> = { uz: 'uz-UZ', ru: 'ru-RU', en: 'en-US' };
// [host A, host B] native voices per locale.
const AZURE_VOICES_BY_LOCALE: Record<AppLocale, [string, string]> = {
  uz: [env.AZURE_TTS_VOICE_UZ, env.AZURE_TTS_VOICE_UZ_2],
  ru: [env.AZURE_TTS_VOICE_RU, env.AZURE_TTS_VOICE_RU_2],
  en: [env.AZURE_TTS_VOICE_EN, env.AZURE_TTS_VOICE_EN_2],
};

/** Host index in a two-speaker podcast (0 = host A, 1 = host B). */
export type Speaker = 0 | 1;

// Bound how many synthesis requests run at once. Long scripts split into many
// ~700-char chunks; firing them all at once trips Azure's per-resource rate limit.
const TTS_CONCURRENCY = 4;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * SSML-safe text. Strips characters that are illegal in XML 1.0 even when escaped
 * (NUL/control chars, the form-feed PDF page-break char, …) — Azure rejects such
 * SSML with HTTP 400 — keeping tab/newline/CR, then escapes the XML metacharacters.
 */
function sanitizeForXml(text: string): string {
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    // Drop C0 control chars except tab (9), LF (10), CR (13).
    out += code < 0x20 && code !== 9 && code !== 10 && code !== 13 ? ' ' : text[i];
  }
  return escapeXml(out);
}

function recordTtsUsage(model: string, text: string, usage?: UsageContext): void {
  if (!usage) return;
  recordUsage({
    userId: usage.userId,
    tenantId: usage.tenantId,
    feature: 'PODCAST_GEN',
    model,
    inputTokens: text.length,
    outputTokens: 0,
    metadata: usage.metadata,
  });
}

async function azurePostWithRetry(ssml: string, voice: string): Promise<Buffer> {
  const url = `https://${env.AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;
  const maxAttempts = 4;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': env.AZURE_SPEECH_KEY,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
        'User-Agent': 'talim-ai',
      },
      body: ssml,
    });
    if (res.ok) return Buffer.from(await res.arrayBuffer());

    // Back off + retry on throttling / transient server errors (honor Retry-After).
    const retriable = res.status === 429 || res.status >= 500;
    if (retriable && attempt < maxAttempts - 1) {
      const retryAfter = Number(res.headers.get('retry-after'));
      const backoff = retryAfter > 0 ? retryAfter * 1000 : Math.min(8000, 500 * 2 ** attempt);
      await sleep(backoff);
      continue;
    }
    const detail = await res.text().catch(() => '');
    throw new Error(`Azure TTS failed (${res.status} ${voice}): ${detail.slice(0, 300)}`);
  }
  throw new Error(`Azure TTS failed after ${maxAttempts} attempts (${voice})`);
}

async function synthesizeChunkAzure(
  text: string,
  locale: AppLocale,
  usage: UsageContext | undefined,
  speaker: Speaker,
): Promise<Buffer> {
  const voice = AZURE_VOICES_BY_LOCALE[locale][speaker];
  const ssml =
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${AZURE_LANG[locale]}">` +
    `<voice name="${voice}">${sanitizeForXml(text)}</voice>` +
    `</speak>`;

  const buffer = await azurePostWithRetry(ssml, voice);
  recordTtsUsage(`azure-tts:${voice}`, text, usage);
  return buffer;
}

async function synthesizeChunkOpenai(
  text: string,
  locale: AppLocale,
  usage: UsageContext | undefined,
  speaker: Speaker,
): Promise<Buffer> {
  const response = await openai.audio.speech.create({
    model: env.TTS_MODEL,
    voice: OPENAI_VOICES_BY_LOCALE[locale][speaker],
    input: text,
    response_format: 'mp3',
  });
  recordTtsUsage(env.TTS_MODEL, text, usage);
  return Buffer.from(await response.arrayBuffer());
}

function synthesizeChunk(
  text: string,
  locale: AppLocale,
  usage: UsageContext | undefined,
  speaker: Speaker = 0,
): Promise<Buffer> {
  return azureConfigured
    ? synthesizeChunkAzure(text, locale, usage, speaker)
    : synthesizeChunkOpenai(text, locale, usage, speaker);
}

/** Run async tasks with a bounded concurrency, preserving input order. */
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  async function worker(): Promise<void> {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i]!);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

export async function synthesizeSpeech(
  script: string,
  locale: AppLocale = 'uz',
  usage?: UsageContext,
): Promise<Buffer> {
  if (!azureConfigured && !env.OPENAI_API_KEY) {
    throw new Error(
      'No TTS provider configured. Set AZURE_SPEECH_KEY + AZURE_SPEECH_REGION (native voices) or OPENAI_API_KEY.',
    );
  }

  const normalized = normalizeScriptForTts(script, locale);
  const chunks = splitScriptIntoChunks(normalized);

  if (chunks.length === 1) {
    return synthesizeChunk(chunks[0]!, locale, usage);
  }

  const buffers = await mapLimit(chunks, TTS_CONCURRENCY, (chunk) =>
    synthesizeChunk(chunk, locale, usage),
  );
  return Buffer.concat(buffers);
}

export interface DialogueTurn {
  speaker: Speaker;
  text: string;
}

/** Synthesized audio byte length for a single dialogue turn, aligned 1:1 to input turns. */
export interface DialogueSegmentBytes {
  speaker: Speaker;
  bytes: number;
}

/**
 * Like {@link synthesizeDialogue}, but also returns each turn's synthesized audio
 * BYTE length aligned 1:1 to the input turns. Our TTS output is (near-)constant
 * bitrate — Azure emits `audio-24khz-48kbitrate-mono-mp3` (48 kbit/s = 6000 bytes/s)
 * and OpenAI's mp3 is near-CBR — so a turn's byte length is an accurate proxy for
 * its duration (bytes / 6 ≈ ms), letting callers build a real time-aligned
 * transcript instead of a character-proportion estimate.
 */
export async function synthesizeDialogueWithSegments(
  turns: DialogueTurn[],
  locale: AppLocale = 'uz',
  usage?: UsageContext,
): Promise<{ audio: Buffer; segments: DialogueSegmentBytes[] }> {
  if (!azureConfigured && !env.OPENAI_API_KEY) {
    throw new Error(
      'No TTS provider configured. Set AZURE_SPEECH_KEY + AZURE_SPEECH_REGION (native voices) or OPENAI_API_KEY.',
    );
  }

  // Flatten turns into chunk tasks (long turns still split), preserving order +
  // speaker + the originating turn so byte lengths can be re-aggregated per turn.
  const tasks: { text: string; speaker: Speaker; turnIndex: number }[] = [];
  for (let i = 0; i < turns.length; i++) {
    const turn = turns[i]!;
    const normalized = normalizeScriptForTts(turn.text, locale);
    for (const chunk of splitScriptIntoChunks(normalized)) {
      tasks.push({ text: chunk, speaker: turn.speaker, turnIndex: i });
    }
  }
  if (tasks.length === 0) return { audio: Buffer.alloc(0), segments: [] };

  const buffers = await mapLimit(tasks, TTS_CONCURRENCY, (t) =>
    synthesizeChunk(t.text, locale, usage, t.speaker),
  );

  // Sum each turn's chunk byte lengths back onto its turn (1:1 with input turns;
  // a turn that normalized to nothing keeps a 0-byte entry so alignment holds).
  const segments: DialogueSegmentBytes[] = turns.map((t) => ({ speaker: t.speaker, bytes: 0 }));
  for (let i = 0; i < tasks.length; i++) {
    segments[tasks[i]!.turnIndex]!.bytes += buffers[i]!.length;
  }

  return { audio: Buffer.concat(buffers), segments };
}

/**
 * Synthesize a two-host conversation: each turn is voiced by its speaker's voice
 * (host A vs host B), then concatenated in order — a 2-person podcast.
 */
export async function synthesizeDialogue(
  turns: DialogueTurn[],
  locale: AppLocale = 'uz',
  usage?: UsageContext,
): Promise<Buffer> {
  const { audio } = await synthesizeDialogueWithSegments(turns, locale, usage);
  return audio;
}
