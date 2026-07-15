'use client';

import { useTranslations } from 'next-intl';
import { PricingTiers } from '@/components/marketing/pricing-tiers';

/**
 * Public `/pricing` route — the full-page counterpart to the landing `#pricing`
 * band (`components/marketing/pricing-section.tsx`). Both render the same four
 * real-price tiers via the shared `PricingTiers` grid, so the page and the band
 * tell ONE story. Billing is manual (no payment gateway): every CTA routes to
 * /register, where the learner signs up and requests activation.
 */
export function Pricing() {
  const t = useTranslations('landing');

  return (
    <section id="pricing" className="bg-brand-radial px-6 py-24 sm:py-28">
      <div className="mx-auto max-w-6xl">
        {/* Heading */}
        <div className="mx-auto mb-12 max-w-2xl text-center">
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

        <PricingTiers />
      </div>
    </section>
  );
}
