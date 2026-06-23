'use client';

import { useTranslations } from 'next-intl';

export function Features() {
  const t = useTranslations('landing');

  const features = [
    {
      icon: '📝',
      title: t('features.summaryTitle'),
      description: t('features.summaryDesc'),
      tint: 'bg-success-muted',
    },
    {
      icon: '🎧',
      title: t('features.podcastTitle'),
      description: t('features.podcastDesc'),
      tint: 'bg-info-muted',
    },
    {
      icon: '📊',
      title: t('features.quizTitle'),
      description: t('features.quizDesc'),
      tint: 'bg-accent-secondary/15',
    },
    {
      icon: '💬',
      title: t('features.tutorTitle'),
      description: t('features.tutorDesc'),
      tint: 'bg-accent',
    },
  ];

  return (
    <section id="features" className="border-t border-border/70 bg-card px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            {t('nav.features')}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {t('features.title')}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">{t('features.subtitle')}</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-3xl border border-border/70 bg-background p-8 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-card"
            >
              <div
                className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl text-xl transition-transform duration-200 group-hover:scale-110 ${f.tint}`}
              >
                {f.icon}
              </div>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
