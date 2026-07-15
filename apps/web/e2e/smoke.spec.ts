import { test, expect } from '@playwright/test';
import { TEST_USER } from './global-setup';

const API = process.env.E2E_API_URL ?? 'http://localhost:4000';

// Critical-path smoke: does the whole stack boot and can a learner actually get in?
// Intentionally small and selector-stable (ids + input types, no i18n copy) so it
// stays green as UI text changes — it guards "the app is alive", not pixels.

test('marketing home renders and the API is healthy', async ({ page, request }) => {
  const res = await page.goto('/');
  expect(res?.ok()).toBeTruthy();
  await expect(page).toHaveURL(/\/uz(\/|$)/); // default locale prefix
  await expect(page.locator('body')).not.toBeEmpty();

  const health = await request.get(`${API}/health`);
  expect(health.ok()).toBeTruthy();
});

test('login page renders the sign-in form', async ({ page }) => {
  await page.goto('/uz/login');
  await expect(page.locator('#email')).toBeVisible();
  await expect(page.locator('#password')).toBeVisible();
  await expect(page.locator('button[type="submit"]')).toBeVisible();
});

test('a learner can log in and reach the dashboard', async ({ page }) => {
  await page.goto('/uz/login');
  await page.locator('#email').fill(TEST_USER.email);
  await page.locator('#password').fill(TEST_USER.password);
  await page.locator('button[type="submit"]').click();
  // INDIVIDUAL post-login lands on /dashboard (locale-prefixed).
  await expect(page).toHaveURL(/\/(uz\/)?dashboard/, { timeout: 20_000 });
});
