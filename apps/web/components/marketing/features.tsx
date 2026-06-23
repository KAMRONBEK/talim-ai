'use client';

import { useTranslations } from 'next-intl';

export function Features() {
  const t = useTranslations('landing');

  const features = [
    { icon: '📝', title: t('features.summaryTitle'), description: t('features.summaryDesc'), color: 'bg-success-muted' },
    { icon: '🎧', title: t('features.podcastTitle'), description: t('features.podcastDesc'), color: 'bg-info-muted' },
    { icon: '📊', title: t('features.quizTitle'), description: t('features.quizDesc'), color: 'bg-warning-muted' },
    { icon: '💬', title: t('features.tutorTitle'), description: t('features.tutorDesc'), color: 'bg-destructive/10' },
  ];

  return (
    <section id="features" className="border-t bg-card px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('features.title')}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">{t('features.subtitle')}</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border bg-background p-8 transition-shadow hover:shadow-md"
            >
              <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-xl ${f.color}`}>
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
