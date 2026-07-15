import { defineConfig, devices } from '@playwright/test';

// Lean CI smoke: boot the real API + web (production builds) and drive a few
// critical flows in Chromium. Locally, `reuseExistingServer` attaches to an
// already-running `pnpm dev:all` stack instead of starting its own.
const WEB = process.env.E2E_WEB_URL ?? 'http://localhost:3000';
const API = process.env.E2E_API_URL ?? 'http://localhost:4000';

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: WEB,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      // apps/web (config cwd) → sibling apps/api build output.
      command: 'node ../api/dist/index.js',
      url: `${API}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        NODE_ENV: 'production',
        PORT: '4000',
        DATABASE_URL: process.env.DATABASE_URL ?? '',
        REDIS_URL: process.env.REDIS_URL ?? 'redis://localhost:6379',
        // ≥32 chars to satisfy the API's zod env check; CI-only throwaway.
        JWT_SECRET: process.env.JWT_SECRET ?? 'ci-e2e-jwt-secret-not-a-real-secret-32ch',
        OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? 'sk-ci-dummy',
        DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY ?? 'ci-dummy',
        CORS_ORIGIN: WEB,
        UPLOAD_DIR: process.env.UPLOAD_DIR ?? '/tmp/talim-uploads',
      },
    },
    {
      command: 'pnpm start',
      url: WEB,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: { NODE_ENV: 'production', PORT: '3000' },
    },
  ],
});
