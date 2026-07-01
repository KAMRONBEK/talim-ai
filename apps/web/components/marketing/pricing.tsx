'use client';

import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { MANUAL_TIERS } from '@/lib/pricing';

/**
 * Public `/pricing` route — the full-page counterpart to the landing `#pricing`
 * band (`components/marketing/pricing-section.tsx`). Both render the same three
 * MANUAL tiers from `MANUAL_TIERS` + the shared `landing.pricing.*` copy, so the
 * page and the band tell ONE story. Billing is manual (no payment gateway):
 * there are no self-serve prices; every CTA routes to /register, where the
 * learner signs up and (for tutors/schools) requests team activation.
 */
export function Pricing() {
  const t = useTranslations('landing');

  return (
    <section id="pricing" className="bg-brand-radial px-6 py-24 sm:py-28">
      <div className="mx-auto max-w-6xl">
        {/* Heading */}
        <div className="mx-auto max-w-2xl text-center">
          <div className="font-label text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {t('pricing.eyebrow')}
          </div>
          <h1 className="mt-2.5 text-balance font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {t('pricing.title')}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-base text-muted-foreground">
            {t('pricing.subtitle')}
          </p>
        </div>

        {/* Tiers */}
        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 items-stretch gap-4 md:grid-cols-3">
          {MANUAL_TIERS.map((tier) => {
            const base = `pricing.plans.${tier.key}`;
            const bullets = Array.from({ length: tier.bullets }, (_, i) => i);

            return (
              <div
                key={tier.key}
                className={`relative flex flex-col rounded-2xl p-6 sm:p-7 ${
                  tier.highlighted
                    ? 'border-2 border-primary bg-card shadow-elevated'
                    : 'border border-border bg-background'
                }`}
              >
                {tier.highlighted && (
                  <span className="absolute -top-3 left-6 inline-flex items-center rounded-full bg-accent-secondary px-3 py-1 font-label text-[10px] font-bold uppercase tracking-[0.1em] text-accent-secondary-foreground shadow-soft">
                    {t(`${base}.badge`)}
                  </span>
                )}

                <div
                  className={`font-label text-[11px] font-semibold uppercase tracking-[0.12em] ${
                    tier.highlighted ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {t(`${base}.name`)}
                </div>

                <div className="mt-2 font-display text-4xl font-semibold tracking-tight text-foreground">
                  {t(`${base}.price`)}
                  {tier.hasSuffix && (
                    <span className="font-display text-base font-normal italic text-muted-foreground">
                      {' '}
                      {t(`${base}.priceSuffix`)}
                    </span>
                  )}
                </div>

                <p className="mb-5 mt-1.5 text-sm text-muted-foreground">{t(`${base}.desc`)}</p>

                <ul className="flex flex-col gap-2.5 text-sm text-foreground">
                  {bullets.map((i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check
                        aria-hidden
                        className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                        strokeWidth={2.5}
                      />
                      <span>{t(`${base}.bullets.${i}`)}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-6">
                  <Link
                    href="/register"
                    className={`flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      tier.highlighted
                        ? 'bg-primary text-primary-foreground shadow-sm hover:-translate-y-px hover:shadow-glow'
                        : 'border border-border bg-card text-foreground hover:bg-secondary'
                    }`}
                  >
                    {t(`${base}.cta`)}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Manual-activation footnote */}
        <p className="mx-auto mt-8 max-w-xl text-pretty text-center text-xs text-muted-foreground">
          {t('pricing.note')}
        </p>
      </div>
    </section>
  );
}
