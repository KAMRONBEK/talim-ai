import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  DEEPSEEK_API_KEY: z.string().default(''),
  DEEPSEEK_MODEL: z.string().default('deepseek-v4-flash'),
  DEEPSEEK_THINKING: z.enum(['enabled', 'disabled']).default('disabled'),
  OPENAI_API_KEY: z.string().default(''),
  // Optional Cohere Rerank API key. When set, hybrid retrieval results are reranked
  // (rerank-v3.5) for a quality boost; when empty, retrieval falls back to RRF order.
  COHERE_API_KEY: z.string().default(''),
  TRANSCRIPTION_MODEL: z.string().default('whisper-1'),
  // Scanned-PDF ingest: max pages to rasterize + OCR, and OCR concurrency. Default
  // concurrency is conservative (3) to stay within the 2GB VPS during fallback OCR.
  OCR_MAX_PAGES: z.coerce.number().int().min(1).max(600).default(250),
  // OCR calls are network-bound (each page holds ~9MB); 8-in-flight stays well
  // within the api container's 512MB limit and cuts a 200-page book to ~15-20 min.
  OCR_CONCURRENCY: z.coerce.number().int().min(1).max(16).default(8),
  // Optional OpenRouter-hosted Mistral OCR. When OPENROUTER_API_KEY is set it's the
  // PRIMARY scanned-PDF path: OpenRouter's file-parser plugin runs Mistral OCR
  // (verbatim — correct for Quranic Arabic) and we read the parsed text from the
  // response annotations. The chat model only triggers parsing, so use a cheap,
  // large-context one (a 210-page book yields a lot of parsed text to carry).
  OPENROUTER_API_KEY: z.string().default(''),
  OPENROUTER_OCR_MODEL: z.string().default('google/gemini-2.5-flash-lite'),
  TTS_MODEL: z.string().default('tts-1-hd'),
  TTS_PROVIDER: z.enum(['openai', 'elevenlabs', 'azure']).default('openai'),
  ELEVENLABS_API_KEY: z.string().default(''),
  // Azure AI Speech — native uz/ru/en neural voices. Set KEY + REGION to activate
  // (overrides OpenAI TTS automatically). Voice IDs overridable per locale.
  AZURE_SPEECH_KEY: z.string().default(''),
  AZURE_SPEECH_REGION: z.string().default(''),
  AZURE_TTS_VOICE_UZ: z.string().default('uz-UZ-SardorNeural'),
  AZURE_TTS_VOICE_RU: z.string().default('ru-RU-DmitryNeural'),
  AZURE_TTS_VOICE_EN: z.string().default('en-US-GuyNeural'),
  DEFAULT_CONTENT_LOCALE: z.enum(['uz', 'en', 'ru']).default('uz'),
  TUTOR_MODEL: z.string().default('gpt-4o'),
  TUTOR_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.7),
  MANIM_BIN: z.string().default(''),
  UPLOAD_DIR: z.string().default('/uploads'),
  CORS_ORIGIN: z.string().default('http://localhost:3000,http://localhost:3001'),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:', result.error.flatten().fieldErrors);
    process.exit(1);
  }
  return result.data;
}

export const env = loadEnv();
