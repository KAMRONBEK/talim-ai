/**
 * Smoke test for subscription quota enforcement.
 *
 * Run:
 *   doppler run -- pnpm --filter @talim/api exec tsx src/scripts/smoke-quota.ts --email user@example.com
 *
 * Manual API checks (replace TOKEN and API base):
 *
 *   # Upload limit (FREE: 3 materials)
 *   curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:4000/api/content/upload \
 *     -H "Authorization: Bearer TOKEN" -F "file=@sample.pdf"
 *   # Expect 402 when at limit
 *
 *   # Generation limit (FREE: 20/month) — new quiz after cache miss
 *   curl -s -X POST http://localhost:4000/api/quiz/content/CONTENT_ID \
 *     -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" \
 *     -d '{"sectionId":"SECTION_ID","kind":"FULL"}'
 *
 *   # Tutor message limit (FREE: 50/month)
 *   curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:4000/api/chat/stream \
 *     -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" \
 *     -d '{"contentId":"CONTENT_ID","message":"Hello"}'
 *
 * Expected 402 body:
 *   { "message": "...", "code": "QUOTA_EXCEEDED", "feature": "UPLOAD", "used": 3, "limit": 3, "upgradePlanCode": "INDIVIDUAL_PRO" }
 */
import { prisma } from '../lib/prisma.js';
import {
  assertQuota,
  getUsageVsLimits,
  QuotaExceededError,
} from '../services/subscription.service.js';

function parseArgs(argv: string[]): Record<string, string> {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key?.startsWith('--')) continue;
    const value = argv[i + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for ${key}`);
    }
    args[key.slice(2)] = value;
    i += 1;
  }
  return args;
}

async function expectQuotaError(
  label: string,
  fn: () => Promise<void>,
  feature: 'UPLOAD' | 'GENERATION' | 'TUTOR_MESSAGE',
): Promise<void> {
  try {
    await fn();
    throw new Error(`${label}: expected QuotaExceededError but call succeeded`);
  } catch (err) {
    if (!(err instanceof QuotaExceededError)) throw err;
    if (err.feature !== feature) {
      throw new Error(`${label}: expected feature ${feature}, got ${err.feature}`);
    }
    console.log(`  OK ${label}: ${err.feature} used=${err.used} limit=${err.limit}`);
  }
}

async function expectQuotaPass(label: string, fn: () => Promise<void>): Promise<void> {
  await fn();
  console.log(`  OK ${label}: within quota`);
}

async function main(): Promise<void> {
  const { email } = parseArgs(process.argv.slice(2).filter((arg) => arg !== '--'));
  if (!email) {
    console.error('Usage: smoke-quota --email <user@example.com>');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }

  const freePlan = await prisma.plan.findUnique({ where: { code: 'FREE' } });
  if (!freePlan) {
    console.error('FREE plan not seeded — run migrations first.');
    process.exit(1);
  }

  const limits = freePlan.limits as {
    maxUploads?: number;
    maxGenerationsPerMonth?: number;
    maxTutorMessages?: number;
  };

  console.log(`Testing quota for ${email} (${user.id})`);

  const usage = await getUsageVsLimits(user.id);
  console.log('Current usage vs limits:', JSON.stringify(usage, null, 2));

  const uploadLimit = limits.maxUploads ?? 3;
  const uploadCount = await prisma.content.count({ where: { userId: user.id } });

  if (uploadCount < uploadLimit) {
    await expectQuotaPass('UPLOAD under limit', () => assertQuota(user.id, 'UPLOAD'));
  } else {
    await expectQuotaError('UPLOAD at limit', () => assertQuota(user.id, 'UPLOAD'), 'UPLOAD');
  }

  const genLimit = limits.maxGenerationsPerMonth ?? 20;
  const genUsed = usage.generations.used;
  if (genUsed < genLimit) {
    await expectQuotaPass('GENERATION under limit', () => assertQuota(user.id, 'GENERATION'));
  } else {
    await expectQuotaError(
      'GENERATION at limit',
      () => assertQuota(user.id, 'GENERATION'),
      'GENERATION',
    );
  }

  const tutorLimit = limits.maxTutorMessages ?? 50;
  const tutorUsed = usage.tutorMessages.used;
  if (tutorUsed < tutorLimit) {
    await expectQuotaPass('TUTOR_MESSAGE under limit', () => assertQuota(user.id, 'TUTOR_MESSAGE'));
  } else {
    await expectQuotaError(
      'TUTOR_MESSAGE at limit',
      () => assertQuota(user.id, 'TUTOR_MESSAGE'),
      'TUTOR_MESSAGE',
    );
  }

  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (admin) {
    await expectQuotaPass('ADMIN bypass', () =>
      assertQuota(admin.id, 'UPLOAD', { role: 'ADMIN' }),
    );
    console.log(`  OK ADMIN bypass verified for ${admin.email}`);
  } else {
    console.log('  SKIP ADMIN bypass (no admin user in DB)');
  }

  console.log('smoke-quota passed');
}

main()
  .catch((err) => {
    console.error('smoke-quota failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
