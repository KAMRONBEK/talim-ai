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
  TTS_MODEL: z.string().default('tts-1-hd'),
  TTS_PROVIDER: z.enum(['openai', 'elevenlabs']).default('openai'),
  ELEVENLABS_API_KEY: z.string().default(''),
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
