'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Sparkles } from 'lucide-react';
import { cn } from '@talim/ui';
import { Link } from '@/i18n/navigation';
import {
  ANNUAL_SAVING_PERCENT,
  effectiveMonthlyUzs,
  formatUzs,
  planFeatureSpecs,
  plansForAudience,
  type BillingPeriod,
  type PlanAudience,
  type PricingPlan,
} from '@/lib/pricing';

const CTA_HREF: Record<PricingPlan['cta'], string> = {
  register: '/register',
  requestPro: '/register',
  becomeTutor: '/register',
};

export function Pricing() {
  const t = useTranslations('pricing');
  const [audience, setAudience] = useState<PlanAudience>('individual');
  const [period, setPeriod] = useState<BillingPeriod>('monthly');
  const plans = plansForAudience(audience);

  /** Ordered, localized feature lines for a plan (shared spec → page + modal). */
  const features = (plan: PricingPlan): string[] =>
    planFeatureSpecs(plan).map((s) => t(s.key, s.values));

  return (
    <section id="pricing" className="bg-brand-radial px-6 py-24">
      <div className="mx-auto max-w-6xl">
        {/* Heading */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            {t('eyebrow')}
          </p>
          <h2 className="mt-3 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            {t.rich('title', {
              hl: (c) => <span className="marker-highlight">{c}</span>,
            })}
          </h2>
          <p className="mx-auto mt-4 max-w-md text-lg text-muted-foreground">{t('subtitle')}</p>
        </div>

        {/* Toggles */}
        <div className="mt-9 flex flex-col items-center gap-4">
          <div
            className="inline-flex rounded-full border border-border/70 bg-card/60 p-1 text-sm font-semibold"
            role="tablist"
            aria-label={t('audience.label')}
          >
            {(['individual', 'team'] as const).map((a) => (
              <button
                key={a}
                type="button"
                role="tab"
                aria-selected={audience === a}
                onClick={() => setAudience(a)}
                className={cn(
                  'rounded-full px-5 py-2 transition-colors',
                  audience === a
                    ? 'bg-gradient-brand text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t(`audience.${a}`)}
              </button>
            ))}
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 p-1 text-sm font-medium">
            {(['monthly', 'annual'] as const).map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={period === p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'rounded-full px-4 py-1.5 transition-colors',
                  period === p ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t(`period.${p}`)}
              </button>
            ))}
            <span className="mr-1 rounded-full bg-accent-secondary/20 px-2.5 py-1 text-xs font-semibold text-accent-secondary-foreground">
              {t('period.save', { pct: ANNUAL_SAVING_PERCENT })}
            </span>
          </div>
        </div>

        {/* Cards */}
        <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-2">
          {plans.map((plan) => {
            const free = plan.monthlyUzs === 0;
            const annual = period === 'annual';
            const effMonthly = effectiveMonthlyUzs(plan);
            return (
              <div
                key={plan.code}
                className={cn(
                  'hover-lift relative flex flex-col rounded-3xl border bg-card p-7 shadow-sm',
                  plan.highlighted ? 'border-primary/40 ring-1 ring-primary/30' : 'border-border/70',
                )}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-7 inline-flex items-center gap-1 rounded-full bg-gradient-brand px-3 py-1 text-xs font-semibold text-white shadow-sm">
                    <Sparkles className="h-3.5 w-3.5" />
                    {t('popular')}
                  </span>
                )}

                <h3 className="font-display text-xl font-bold">{t(`plans.${plan.nameKey}`)}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t(`tagline.${plan.nameKey}`)}</p>

                {/* Price */}
                <div className="mt-5 min-h-[4.5rem]">
                  {free ? (
                    <p className="flex items-baseline gap-1.5">
                      <span className="text-4xl font-extrabold tracking-tight">0</span>
                      <span className="text-sm font-medium text-muted-foreground">
                        {t('currency')} {t('perMonth')}
                      </span>
                    </p>
                  ) : (
                    <>
                      <p className="flex items-baseline gap-1.5">
                        <span className="text-4xl font-extrabold tracking-tight">
                          {formatUzs(annual ? effMonthly : plan.monthlyUzs)}
                        </span>
                        <span className="text-sm font-medium text-muted-foreground">
                          {t('currency')} {t('perMonth')}
                        </span>
                      </p>
                      {annual ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t('billedAnnually', { total: formatUzs(plan.annualUzs) })}
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-muted-foreground">{t('orAnnual')}</p>
                      )}
                    </>
                  )}
                </div>

                {/* Features */}
                <ul className="mt-6 flex-1 space-y-3 text-sm">
                  {features(plan).map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  href={CTA_HREF[plan.cta]}
                  className={cn(
                    'mt-7 inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition-all hover:-translate-y-px',
                    plan.highlighted
                      ? 'bg-gradient-brand text-white shadow-sm hover:shadow-glow'
                      : 'border border-border bg-background hover:bg-secondary',
                  )}
                >
                  {t(`cta.${plan.cta}`)}
                </Link>
              </div>
            );
          })}
        </div>

        <p className="mx-auto mt-8 max-w-xl text-center text-xs text-muted-foreground">
          {t('manualNote')}
        </p>
      </div>
    </section>
  );
}
