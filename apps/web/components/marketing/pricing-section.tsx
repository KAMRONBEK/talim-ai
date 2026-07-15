'use client';

import { useTranslations } from 'next-intl';
import { PricingTiers } from '@/components/marketing/pricing-tiers';

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

        <PricingTiers />
      </div>
    </section>
  );
}
