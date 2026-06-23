'use client';

import { useTranslations } from 'next-intl';

export function HowItWorks() {
  const t = useTranslations('landing');

  const steps = [
    { n: 1, title: t('how.step1Title'), text: t('how.step1Text') },
    { n: 2, title: t('how.step2Title'), text: t('how.step2Text') },
    { n: 3, title: t('how.step3Title'), text: t('how.step3Text') },
  ];

  return (
    <section id="how" className="border-t border-border/70 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            {t('nav.how')}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{t('how.title')}</h2>
          <p className="mt-3 text-muted-foreground">{t('how.subtitle')}</p>
        </div>
        <div className="relative grid gap-10 md:grid-cols-3">
          {/* Connecting line — the steps are a real sequence, so the track reads left→right. */}
          <div className="pointer-events-none absolute left-0 right-0 top-7 hidden border-t-2 border-dashed border-border md:block" />
          {steps.map((step) => (
            <div key={step.n} className="relative text-center">
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-brand font-display text-xl font-bold text-white shadow-glow ring-8 ring-background">
                {step.n}
              </div>
              <h3 className="text-xl font-semibold">{step.title}</h3>
              <p className="mx-auto mt-2.5 max-w-xs text-sm leading-relaxed text-muted-foreground">
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
