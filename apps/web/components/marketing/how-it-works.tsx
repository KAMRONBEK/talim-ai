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
    <section id="how" className="border-t px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('how.title')}</h2>
          <p className="mt-3 text-muted-foreground">{t('how.subtitle')}</p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.n} className="relative text-center">
              <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-[14px] border-2 border-primary bg-card text-xl font-bold text-primary">
                {step.n}
              </div>
              <h3 className="text-xl font-semibold">{step.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
