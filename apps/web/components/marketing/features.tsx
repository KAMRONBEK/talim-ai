'use client';

import { useTranslations } from 'next-intl';
import { AlignLeft, Mic, HelpCircle, Bot, LineChart, Gauge, type LucideIcon } from 'lucide-react';

// Iterate features.items (numbered keys 0–5). Icon + tint are presentational only;
// the design alternates a sage-on-pine and a clay tint per card.
const FEATURES: { icon: LucideIcon; tint: 'pine' | 'clay' }[] = [
  { icon: AlignLeft, tint: 'pine' },
  { icon: Mic, tint: 'clay' },
  { icon: HelpCircle, tint: 'pine' },
  { icon: Bot, tint: 'clay' },
  { icon: LineChart, tint: 'pine' },
  { icon: Gauge, tint: 'clay' },
];

export function Features() {
  const t = useTranslations('landing');

  return (
    <section id="features" className="border-t border-border/60 px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 max-w-xl">
          <p className="font-label text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {t('features.eyebrow')}
          </p>
          <h2 className="mt-2.5 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-[2rem]">
            {t('features.title')}
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, tint }, i) => (
            <div
              key={i}
              className="hover-lift rounded-[15px] border border-border bg-card p-[22px]"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-[11px] ${
                  tint === 'pine'
                    ? 'bg-secondary text-primary'
                    : 'bg-accent-secondary/10 text-accent-secondary'
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" strokeWidth={2} />
              </div>
              <h3 className="mt-3.5 font-display text-lg font-semibold text-foreground">
                {t(`features.items.${i}.title`)}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {t(`features.items.${i}.desc`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
