import type { PlanCode } from '@talim/types';

/**
 * Pricing config for every surface that shows plans: the PUBLIC pricing
 * surfaces (the landing `#pricing` band and the `/pricing` route, both via
 * `components/marketing/pricing-tiers.tsx`) and the in-app upgrade modal
 * (`components/account/upgrade-dialog.tsx`). All render the same
 * `PRICING_PLANS` so'm prices and limits, so nothing can drift. Limits mirror
 * the runtime plan limits seeded in `apps/api/src/prisma/seed.ts` (keep them
 * in sync). Billing is **manual** (no payment gateway) — CTAs request
 * activation (or route to /register), never charge.
 *
 * Note on file size: paid tiers seed `maxFileSizeMb` 300/500, but the real
 * enforced cap is the 120 MB multer limit (`upload.middleware.ts UPLOAD_MAX_MB`),
 * so we advertise the honest 120 MB here.
 */

export type PlanAudience = 'individual' | 'team';
export type BillingPeriod = 'monthly' | 'annual';

/** Per-plan limits, in display terms. `null` means unlimited. */
interface PlanLimitsView {
  uploadsPerDay: number | null;
  generationsPerDay: number | null;
  tutorPerDay: number | null;
  podcastsPerDay: number | null;
  videosPerDay: number | null;
  /** Team plans only. */
  students?: number;
  contentItems?: number;
  maxPages: number;
  maxFileMb: number;
}

export interface PricingPlan {
  code: PlanCode;
  /** i18n key under `pricing.plans.<nameKey>`. */
  nameKey: string;
  audience: PlanAudience;
  /** Monthly price in so'm (0 for Free). */
  monthlyUzs: number;
  /** Total yearly price in so'm when billed annually (0 for Free). */
  annualUzs: number;
  /** Featured card (visually emphasised). */
  highlighted?: boolean;
  /** Which CTA flow this plan routes to (billing is manual). */
  cta: 'register' | 'requestPro' | 'becomeTutor';
  limits: PlanLimitsView;
}

const PRICING_PLANS: PricingPlan[] = [
  {
    code: 'FREE',
    nameKey: 'free',
    audience: 'individual',
    monthlyUzs: 0,
    annualUzs: 0,
    cta: 'register',
    limits: {
      uploadsPerDay: 3,
      generationsPerDay: 5,
      tutorPerDay: 20,
      podcastsPerDay: 1,
      videosPerDay: 1,
      maxPages: 100,
      maxFileMb: 25,
    },
  },
  {
    code: 'INDIVIDUAL_PRO',
    nameKey: 'pro',
    audience: 'individual',
    monthlyUzs: 119_000,
    annualUzs: 1_140_000, // ~95 000/mo — saves ~20%
    highlighted: true,
    cta: 'requestPro',
    limits: {
      uploadsPerDay: null,
      generationsPerDay: null,
      tutorPerDay: null,
      podcastsPerDay: 12,
      videosPerDay: 4,
      maxPages: 2000,
      maxFileMb: 120,
    },
  },
  {
    code: 'TENANT_STARTER',
    nameKey: 'team',
    audience: 'team',
    monthlyUzs: 349_000,
    annualUzs: 3_348_000, // ~279 000/mo — saves ~20%
    cta: 'becomeTutor',
    limits: {
      uploadsPerDay: null,
      generationsPerDay: 50,
      tutorPerDay: null,
      podcastsPerDay: 20,
      videosPerDay: 10,
      students: 25,
      contentItems: 100,
      maxPages: 2000,
      maxFileMb: 120,
    },
  },
  {
    code: 'TENANT_GROWTH',
    nameKey: 'school',
    audience: 'team',
    monthlyUzs: 1_190_000,
    annualUzs: 11_400_000, // ~950 000/mo — saves ~20%
    highlighted: true,
    cta: 'becomeTutor',
    limits: {
      uploadsPerDay: null,
      generationsPerDay: 200,
      tutorPerDay: null,
      podcastsPerDay: 50,
      videosPerDay: 30,
      students: 100,
      contentItems: 500,
      maxPages: 2000,
      maxFileMb: 120,
    },
  },
];

export const ANNUAL_SAVING_PERCENT = 20;

/** An i18n key (under the `pricing` namespace) + interpolation values. */
export interface FeatureSpec {
  key: string;
  values?: Record<string, number>;
}

/** Ordered feature rows for a plan, as `pricing.*` i18n specs. Shared by the
 *  pricing page and the upgrade modal so the two never drift. */
export function planFeatureSpecs(plan: PricingPlan): FeatureSpec[] {
  const l = plan.limits;
  const daily = (n: number | null, unlimitedKey: string, countKey: string): FeatureSpec =>
    n === null ? { key: unlimitedKey } : { key: countKey, values: { n } };
  const file: FeatureSpec = {
    key: 'features.file',
    values: { pages: l.maxPages, mb: l.maxFileMb },
  };

  if (plan.audience === 'individual') {
    return [
      daily(l.uploadsPerDay, 'features.uploadsUnlimited', 'features.uploadsN'),
      daily(l.tutorPerDay, 'features.tutorUnlimited', 'features.tutorN'),
      daily(l.generationsPerDay, 'features.genUnlimited', 'features.genN'),
      { key: 'features.podcastsN', values: { n: l.podcastsPerDay ?? 0 } },
      { key: 'features.videosN', values: { n: l.videosPerDay ?? 0 } },
      file,
    ];
  }
  return [
    { key: 'features.students', values: { n: l.students ?? 0 } },
    { key: 'features.materials', values: { n: l.contentItems ?? 0 } },
    { key: 'features.genN', values: { n: l.generationsPerDay ?? 0 } },
    { key: 'features.podcastsN', values: { n: l.podcastsPerDay ?? 0 } },
    { key: 'features.videosN', values: { n: l.videosPerDay ?? 0 } },
    { key: 'features.tutorUnlimited' },
    file,
  ];
}

export function plansForAudience(audience: PlanAudience): PricingPlan[] {
  return PRICING_PLANS.filter((p) => p.audience === audience);
}

export function getPlan(code: PlanCode): PricingPlan | undefined {
  return PRICING_PLANS.find((p) => p.code === code);
}

/** Effective monthly price when billed annually (so'm). */
export function effectiveMonthlyUzs(plan: PricingPlan): number {
  return Math.round(plan.annualUzs / 12);
}

/** Group thousands with a thin space: 119000 -> "119 000". */
export function formatUzs(value: number): string {
  return value.toLocaleString('en-US').replace(/,/g, ' ');
}
