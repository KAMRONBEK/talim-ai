'use client';

import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import { Link } from '@/i18n/navigation';

type Plan = {
  key: '0' | '1' | '2';
  bullets: number;
  highlighted?: boolean;
  hasSuffix?: boolean;
};

const PLANS: Plan[] = [
  { key: '0', bullets: 3 },
  { key: '1', bullets: 4, highlighted: true, hasSuffix: true },
  { key: '2', bullets: 3 },
];

export function PricingSection() {
  const t = useTranslations('landing');

  return (
    <section id="pricing" className="border-t border-border/60 bg-card px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <div className="font-label text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {t('pricing.eyebrow')}
          </div>
          <h2 className="mt-2.5 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {t('pricing.title')}
          </h2>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-3">
          {PLANS.map((plan) => {
            const base = `pricing.plans.${plan.key}`;
            const bullets = Array.from({ length: plan.bullets }, (_, i) => i);

            return (
              <div
                key={plan.key}
                className={`relative flex flex-col rounded-2xl p-6 sm:p-7 ${
                  plan.highlighted
                    ? 'border-2 border-primary bg-card shadow-elevated'
                    : 'border border-border bg-background'
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-6 inline-flex items-center rounded-full bg-accent-secondary px-3 py-1 font-label text-[10px] font-bold uppercase tracking-[0.1em] text-accent-secondary-foreground shadow-soft">
                    {t(`${base}.badge`)}
                  </span>
                )}

                <div
                  className={`font-label text-[11px] font-semibold uppercase tracking-[0.12em] ${
                    plan.highlighted ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {t(`${base}.name`)}
                </div>

                <div className="mt-2 font-display text-4xl font-semibold tracking-tight text-foreground">
                  {t(`${base}.price`)}
                  {plan.hasSuffix && (
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
                      plan.highlighted
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
      </div>
    </section>
  );
}
