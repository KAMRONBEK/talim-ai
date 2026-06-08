import OpenAI from 'openai';
import { env } from '../config/env.js';
import type { AppLocale } from '@talim/types';
import { normalizeScriptForTts, splitScriptIntoChunks } from '../lib/tts-normalize.js';
import { recordUsage, type UsageContext } from './usage.service.js';

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

const VOICE_BY_LOCALE: Record<AppLocale, 'alloy' | 'nova' | 'onyx' | 'shimmer'> = {
  uz: 'alloy',
  en: 'nova',
  ru: 'onyx',
};

async function synthesizeChunk(
  text: string,
  voice: string,
  usage?: UsageContext,
): Promise<Buffer> {
  const response = await openai.audio.speech.create({
    model: env.TTS_MODEL,
    voice: voice as 'alloy' | 'nova' | 'onyx' | 'shimmer',
    input: text,
    response_format: 'mp3',
  });

  if (usage) {
    recordUsage({
      userId: usage.userId,
      tenantId: usage.tenantId,
      feature: 'PODCAST_GEN',
      model: env.TTS_MODEL,
      inputTokens: text.length,
      outputTokens: 0,
      metadata: usage.metadata,
    });
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function synthesizeSpeech(
  script: string,
  locale: AppLocale = 'uz',
  usage?: UsageContext,
): Promise<Buffer> {
  if (!env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required for podcast generation');
  }

  const normalized = normalizeScriptForTts(script, locale);
  const chunks = splitScriptIntoChunks(normalized);
  const voice = VOICE_BY_LOCALE[locale];

  if (chunks.length === 1) {
    return synthesizeChunk(chunks[0]!, voice, usage);
  }

  const buffers = await Promise.all(
    chunks.map((chunk) => synthesizeChunk(chunk, voice, usage)),
  );
  return Buffer.concat(buffers);
}
