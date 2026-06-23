'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export function Hero() {
  const t = useTranslations('landing');

  const cardRows = [
    { icon: '📝', text: t('hero.cardSummary') },
    { icon: '🎧', text: t('hero.cardPodcast'), purple: true },
    { icon: '❓', text: t('hero.cardQuiz') },
  ];

  return (
    <section className="relative overflow-hidden px-6 pb-20 pt-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,hsl(var(--accent)/0.5),transparent),radial-gradient(ellipse_60%_50%_at_80%_50%,hsl(var(--accent-secondary)/0.12),transparent)]" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
            <span className="h-2 w-2 rounded-full bg-primary" />
            {t('hero.badge')}
          </span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
            {t('hero.titleLead')}{' '}
            <em className="text-primary not-italic">{t('hero.titleEmphasis')}</em>
          </h1>
          <p className="mt-6 max-w-lg text-lg text-muted-foreground">{t('hero.subtitle')}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="inline-flex items-center rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              {t('hero.primaryCta')}
            </Link>
            <a
              href="#features"
              className="inline-flex items-center rounded-xl border px-6 py-3.5 text-base font-semibold hover:bg-secondary"
            >
              {t('hero.secondaryCta')}
            </a>
          </div>
          <div className="mt-8 flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex -space-x-2">
              {['📄', '🎬', '📊'].map((a) => (
                <span
                  key={a}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-gradient-to-br from-primary to-accent-secondary text-[12px] text-white"
                >
                  {a}
                </span>
              ))}
            </div>
            <span>{t('hero.trust')}</span>
          </div>
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-xl">
          <div className="mb-4 flex items-center gap-3 border-b pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent-secondary text-xl text-white">
              🧬
            </div>
            <div>
              <p className="font-semibold">{t('hero.cardTitle')}</p>
              <p className="text-sm text-muted-foreground">{t('hero.cardSubtitle')}</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            {cardRows.map((row) => (
              <div
                key={row.text}
                className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2.5"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm ${
                    row.purple ? 'bg-info-muted' : 'bg-success-muted'
                  }`}
                >
                  {row.icon}
                </span>
                {row.text}
              </div>
            ))}
          </div>
          <div className="mt-4">
            <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
              <span>{t('hero.cardProgressLabel')}</span>
              <span>72%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-border">
              <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-primary to-accent-secondary" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
