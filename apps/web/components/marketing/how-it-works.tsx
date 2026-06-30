'use client';

import { useTranslations } from 'next-intl';
import { Upload, Sparkles, Bot, type LucideIcon } from 'lucide-react';

type Step = {
  key: '0' | '1' | '2';
  Icon: LucideIcon;
  accent: boolean;
};

const STEPS: Step[] = [
  { key: '0', Icon: Upload, accent: false },
  { key: '1', Icon: Sparkles, accent: true },
  { key: '2', Icon: Bot, accent: false },
];

export function HowItWorks() {
  const t = useTranslations('landing');

  return (
    <section id="how" className="border-t border-border/60 bg-card py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <div className="font-label text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {t('how.eyebrow')}
          </div>
          <h2 className="mt-2.5 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {t('how.title')}
          </h2>
        </div>

        <div className="mt-10 grid gap-5 sm:mt-12 md:grid-cols-3">
          {STEPS.map(({ key, Icon, accent }) => (
            <div
              key={key}
              className="hover-lift rounded-2xl border border-border bg-background p-6"
            >
              <div className="font-display text-base font-semibold text-primary">
                {t(`how.steps.${key}.num`)}
              </div>
              <div
                className={`mt-3 flex h-12 w-12 items-center justify-center rounded-xl ${
                  accent
                    ? 'bg-accent-secondary/10 text-accent-secondary'
                    : 'bg-secondary text-primary'
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" strokeWidth={2} />
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold text-foreground">
                {t(`how.steps.${key}.title`)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t(`how.steps.${key}.desc`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
