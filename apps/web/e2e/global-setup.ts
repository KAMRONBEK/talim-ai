import { request, type FullConfig } from '@playwright/test';

// The DB seed only creates Plans (no users), so the login smoke needs a user.
// We register one straight through the JSON API (no i18n selectors involved) so
// the UI test below has real credentials to sign in with. Idempotent: a re-run
// against a warm DB gets a 409, which we treat as "already there".
export const TEST_USER = {
  email: 'e2e.smoke@talim.local',
  password: 'e2e-smoke-pass-123',
  name: 'E2E Smoke',
};

export default async function globalSetup(_config: FullConfig): Promise<void> {
  const api = process.env.E2E_API_URL ?? 'http://localhost:4000';
  const ctx = await request.newContext({ baseURL: api });
  try {
    const res = await ctx.post('/auth/register', { data: TEST_USER });
    if (!res.ok() && res.status() !== 409) {
      throw new Error(`register failed: ${res.status()} ${await res.text()}`);
    }
  } finally {
    await ctx.dispose();
  }
}
