import OpenAI from 'openai';
import { env } from '../config/env.js';

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export async function synthesizeSpeech(script: string): Promise<Buffer> {
  if (!env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required for podcast generation');
  }

  const trimmed = script.slice(0, 4096);
  const response = await openai.audio.speech.create({
    model: 'tts-1',
    voice: 'alloy',
    input: trimmed,
    response_format: 'mp3',
  });

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
