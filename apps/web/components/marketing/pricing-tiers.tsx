'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import {
  ANNUAL_SAVING_PERCENT,
  effectiveMonthlyUzs,
  formatUzs,
  planFeatureSpecs,
  plansForAudience,
  type BillingPeriod,
  type PricingPlan,
} from '@/lib/pricing';

/**
 * The shared real-price tier grid for BOTH public pricing surfaces (the landing
 * `#pricing` band and the `/pricing` route) — one component so the two never
 * drift. Renders all four `PRICING_PLANS` grouped by audience with the same
 * so'm prices the in-app upgrade modal shows. Billing is still manual: every
 * CTA routes to /register, where the user signs up and requests activation.
 */
export function PricingTiers() {
  const t = useTranslations('pricing');
  const [period, setPeriod] = useState<BillingPeriod>('monthly');

  const groups = [
    { key: 'individual', plans: plansForAudience('individual') },
    { key: 'team', plans: plansForAudience('team') },
  ] as const;

  return (
    <div>
      {/* Monthly / annual toggle */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-1 rounded-full border border-border bg-background p-1">
          {(['monthly', 'annual'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded-full px-4 py-1.5 font-label text-xs font-semibold transition-colors ${
                period === p
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t(`period.${p}`)}
              {p === 'annual' && ` · ${t('period.save', { pct: ANNUAL_SAVING_PERCENT })}`}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 grid gap-10 xl:grid-cols-2 xl:gap-6">
        {groups.map((group) => (
          <div key={group.key}>
            <div className="mb-4 text-center font-label text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {t(`audience.${group.key}`)}
            </div>
            <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2">
              {group.plans.map((plan) => (
                <TierCard key={plan.code} plan={plan} period={period} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="mx-auto mt-8 max-w-xl text-pretty text-center text-xs text-muted-foreground">
        {t('manualNote')}
      </p>
    </div>
  );
}

function TierCard({ plan, period }: { plan: PricingPlan; period: BillingPeriod }) {
  const t = useTranslations('pricing');
  const isFree = plan.monthlyUzs === 0;
  const monthly = period === 'annual' ? effectiveMonthlyUzs(plan) : plan.monthlyUzs;

  return (
    <div
      className={`relative flex flex-col rounded-2xl p-6 sm:p-7 ${
        plan.highlighted
          ? 'border-2 border-primary bg-card shadow-elevated'
          : 'border border-border bg-background'
      }`}
    >
      {plan.highlighted && (
        <span className="absolute -top-3 left-6 inline-flex items-center rounded-full bg-accent-secondary px-3 py-1 font-label text-[10px] font-bold uppercase tracking-[0.1em] text-accent-secondary-foreground shadow-soft">
          {t('popular')}
        </span>
      )}

      <div
        className={`font-label text-[11px] font-semibold uppercase tracking-[0.12em] ${
          plan.highlighted ? 'text-primary' : 'text-muted-foreground'
        }`}
      >
        {t(`plans.${plan.nameKey}`)}
      </div>

      <div className="mt-2 font-display text-4xl font-semibold tracking-tight text-foreground">
        {isFree ? (
          t('plans.free')
        ) : (
          <>
            {formatUzs(monthly)}
            <span className="font-display text-base font-normal italic text-muted-foreground">
              {' '}
              {t('currency')} {t('perMonth')}
            </span>
          </>
        )}
      </div>
      <p className="mt-1 min-h-4 text-xs text-muted-foreground">
        {!isFree &&
          (period === 'annual'
            ? t('billedAnnually', { total: formatUzs(plan.annualUzs) })
            : t('orAnnual'))}
      </p>

      <p className="mb-5 mt-1.5 text-sm text-muted-foreground">{t(`tagline.${plan.nameKey}`)}</p>

      <ul className="flex flex-col gap-2.5 text-sm text-foreground">
        {planFeatureSpecs(plan).map((spec) => (
          <li key={spec.key} className="flex items-start gap-2.5">
            <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2.5} />
            <span>{t(spec.key, spec.values)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-6">
        <Link
          href="/register"
          className={`flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            plan.highlighted
              ? 'bg-primary text-primary-foreground shadow-sm hover:-translate-y-px hover:shadow-glow'
              : 'border border-border bg-card text-foreground hover:bg-secondary'
          }`}
        >
          {t(`cta.${plan.cta}`)}
        </Link>
      </div>
    </div>
  );
}
