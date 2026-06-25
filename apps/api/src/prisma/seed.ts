import type { PlanKind } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

/**
 * Idempotent plan seed. Mirrors the rows originally inserted by migration
 * 20250608120000_subscriptions_plans so that environments built with
 * `prisma db push`, a reset, or a fresh non-migrated DB still have the plans
 * the auth/quota/admin code hard-depends on. Safe to run repeatedly.
 *
 * Run via: `pnpm --filter @talim/api exec prisma db seed` (wired through the
 * package.json `prisma.seed` field), or `pnpm db:seed` from the repo root.
 */
interface PlanSeed {
  id: string;
  code: string;
  name: string;
  kind: PlanKind;
  limits: Record<string, number | null>;
}

const PLANS: PlanSeed[] = [
  {
    id: 'plan_free',
    code: 'FREE',
    name: 'Free',
    kind: 'INDIVIDUAL',
    limits: {
      maxUploads: 5,
      maxGenerationsPerMonth: 30,
      maxTutorMessages: 50,
      maxVideosPerMonth: 1,
      priceMonthlyUsd: 0,
    },
  },
  {
    id: 'plan_individual_pro',
    code: 'INDIVIDUAL_PRO',
    name: 'Pro',
    kind: 'INDIVIDUAL',
    limits: {
      maxUploads: null,
      maxGenerationsPerMonth: 600,
      maxTutorMessages: null,
      maxVideosPerMonth: 30,
      priceMonthlyUsd: 10,
    },
  },
  {
    id: 'plan_tenant_starter',
    code: 'TENANT_STARTER',
    name: 'Tenant Starter',
    kind: 'TENANT',
    limits: {
      maxStudents: 25,
      maxContentItems: 100,
      maxGenerationsPerMonth: 500,
      maxVideosPerMonth: 50,
    },
  },
  {
    id: 'plan_tenant_growth',
    code: 'TENANT_GROWTH',
    name: 'Tenant Growth',
    kind: 'TENANT',
    limits: {
      maxStudents: 100,
      maxContentItems: 500,
      maxGenerationsPerMonth: 2000,
      maxVideosPerMonth: 200,
    },
  },
];

async function main(): Promise<void> {
  for (const plan of PLANS) {
    await prisma.plan.upsert({
      where: { code: plan.code },
      update: { name: plan.name, kind: plan.kind, limits: plan.limits },
      create: {
        id: plan.id,
        code: plan.code,
        name: plan.name,
        kind: plan.kind,
        limits: plan.limits,
      },
    });
  }
  console.log(`Seeded ${PLANS.length} plans: ${PLANS.map((p) => p.code).join(', ')}`);
}

main()
  .catch((err) => {
    console.error('Plan seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
