import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  DEEPSEEK_API_KEY: z.string().default(''),
  OPENAI_API_KEY: z.string().default(''),
  TUTOR_MODEL: z.string().default('gpt-4o'),
  TUTOR_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.7),
  UPLOAD_DIR: z.string().default('/uploads'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
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
