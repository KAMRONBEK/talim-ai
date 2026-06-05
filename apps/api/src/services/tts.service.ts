import OpenAI from 'openai';
import { env } from '../config/env.js';
import type { AppLocale } from '@talim/types';
import { normalizeScriptForTts, splitScriptIntoChunks } from '../lib/tts-normalize.js';

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

const VOICE_BY_LOCALE: Record<AppLocale, 'alloy' | 'nova' | 'onyx' | 'shimmer'> = {
  uz: 'alloy',
  en: 'nova',
  ru: 'onyx',
};

async function synthesizeChunk(text: string, voice: string): Promise<Buffer> {
  const response = await openai.audio.speech.create({
    model: env.TTS_MODEL,
    voice: voice as 'alloy' | 'nova' | 'onyx' | 'shimmer',
    input: text,
    response_format: 'mp3',
  });
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function synthesizeSpeech(script: string, locale: AppLocale = 'uz'): Promise<Buffer> {
  if (!env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required for podcast generation');
  }

  const normalized = normalizeScriptForTts(script, locale);
  const chunks = splitScriptIntoChunks(normalized);
  const voice = VOICE_BY_LOCALE[locale];

  if (chunks.length === 1) {
    return synthesizeChunk(chunks[0]!, voice);
  }

  const buffers = await Promise.all(chunks.map((chunk) => synthesizeChunk(chunk, voice)));
  return Buffer.concat(buffers);
}
