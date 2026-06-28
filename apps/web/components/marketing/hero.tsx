'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export function Hero() {
  const t = useTranslations('landing');

  const cardRows = [
    { icon: '📝', text: t('hero.cardSummary'), tint: 'bg-success-muted' },
    { icon: '🎧', text: t('hero.cardPodcast'), tint: 'bg-info-muted' },
    { icon: '❓', text: t('hero.cardQuiz'), tint: 'bg-accent-secondary/15' },
  ];

  return (
    <section className="relative overflow-hidden px-6 pb-24 pt-20 sm:pt-28">
      {/* Layered signature backdrop: brand wash + faint girih lattice. */}
      <div className="pointer-events-none absolute inset-0 bg-brand-radial" />
      <div className="pointer-events-none absolute inset-0 bg-girih opacity-70 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3.5 py-1.5 text-xs font-semibold text-muted-foreground shadow-soft backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            {t('hero.badge')}
          </span>

          <h1 className="mt-6 text-balance text-[2rem] font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-[4rem] lg:leading-[1.05]">
            {t('hero.titleLead')}{' '}
            <span className="marker-highlight">{t('hero.titleEmphasis')}</span>
          </h1>

          <p className="mt-6 max-w-lg text-pretty text-lg leading-relaxed text-muted-foreground">
            {t('hero.subtitle')}
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="inline-flex items-center rounded-xl bg-gradient-brand px-7 py-3.5 text-base font-semibold text-white shadow-glow transition-all hover:-translate-y-0.5 hover:opacity-95"
            >
              {t('hero.primaryCta')}
            </Link>
            <a
              href="#features"
              className="inline-flex items-center rounded-xl border border-border bg-card/60 px-7 py-3.5 text-base font-semibold backdrop-blur transition-colors hover:bg-secondary"
            >
              {t('hero.secondaryCta')}
            </a>
          </div>

          <div className="mt-9 flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex -space-x-2.5">
              {['📄', '🎬', '📊'].map((a) => (
                <span
                  key={a}
                  className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-background bg-gradient-to-br from-primary to-accent-secondary text-[13px] text-white shadow-soft"
                >
                  {a}
                </span>
              ))}
            </div>
            <span>{t('hero.trust')}</span>
          </div>
        </div>

        {/* Floating product card — tilts subtly upright, marigold "live" accent. */}
        <div className="relative">
          <div className="absolute -inset-4 rounded-[2rem] bg-gradient-brand-soft blur-2xl" />
          <div className="relative rounded-3xl border border-border/70 bg-card/95 p-6 shadow-elevated backdrop-blur">
            <div className="mb-4 flex items-center gap-3 border-b border-border/70 pb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent-secondary text-xl text-white shadow-soft">
                🧬
              </div>
              <div className="min-w-0">
                <p className="truncate font-display font-semibold">{t('hero.cardTitle')}</p>
                <p className="truncate text-sm text-muted-foreground">{t('hero.cardSubtitle')}</p>
              </div>
              <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-success-muted px-2.5 py-1 text-[11px] font-semibold text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                AI
              </span>
            </div>
            <div className="space-y-2 text-sm">
              {cardRows.map((row) => (
                <div
                  key={row.text}
                  className="flex items-center gap-3 rounded-xl bg-muted/60 px-3 py-2.5 transition-colors hover:bg-muted"
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm ${row.tint}`}
                  >
                    {row.icon}
                  </span>
                  {row.text}
                </div>
              ))}
            </div>
            <div className="mt-5">
              <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                <span>{t('hero.cardProgressLabel')}</span>
                <span className="font-display font-semibold text-foreground">72%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-border">
                <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-primary to-accent-secondary" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
