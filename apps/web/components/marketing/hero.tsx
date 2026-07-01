'use client';

import { useTranslations } from 'next-intl';
import { AlignLeft, ArrowRight, HelpCircle, Layers, Mic } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export function Hero() {
  const t = useTranslations('landing');

  const avatars = [
    { label: 'A', className: 'bg-secondary text-primary' },
    { label: 'M', className: 'bg-accent-secondary/15 text-accent-secondary' },
    { label: 'N', className: 'bg-foreground text-background' },
  ];

  return (
    <section id="top" className="relative overflow-hidden px-6 pb-20 pt-16 sm:pb-24 sm:pt-20">
      {/* decorative backdrop — pine/clay wash + girih lattice, faded toward the top */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 0%, black, transparent)',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 0%, black, transparent)',
        }}
      >
        <div className="absolute inset-0 bg-brand-radial" />
        <div className="absolute inset-0 bg-girih opacity-50" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* left column — headline & CTAs */}
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3.5 py-1.5 text-xs font-semibold text-muted-foreground">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-primary" />
            {t('hero.badge')}
          </span>

          <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-[3.4rem]">
            {t('hero.titleLead')}{' '}
            <span className="font-display italic text-primary">{t('hero.titleEmphasis')}</span>
            {t('hero.titleTrail')}
          </h1>

          <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t('hero.subtitle')}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-px hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {t('hero.primaryCta')}
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
            <a
              href="#for-tutors"
              className="inline-flex items-center rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition hover:-translate-y-px hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {t('hero.secondaryCta')}
            </a>
          </div>

          <div className="mt-7 flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex" aria-hidden>
              {avatars.map((a, i) => (
                <span
                  key={a.label}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-background text-[13px] font-bold ${a.className} ${
                    i > 0 ? '-ml-2.5' : ''
                  }`}
                >
                  {a.label}
                </span>
              ))}
            </div>
            {t('hero.trust')}
          </div>
        </div>

        {/* right column — floating product card */}
        <div className="relative">
          <div
            aria-hidden
            className="absolute -inset-3 rounded-[30px] blur-lg"
            style={{
              background:
                'radial-gradient(circle at 30% 20%, rgba(30,91,79,0.18), transparent 60%), radial-gradient(circle at 80% 90%, rgba(217,102,61,0.16), transparent 60%)',
            }}
          />
          <div className="relative rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6">
            {/* card header */}
            <div className="flex items-center gap-3 border-b border-border/60 pb-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-brand text-primary-foreground">
                <Layers aria-hidden className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-display text-base font-semibold text-foreground">
                  {t('hero.cardTitle')}
                </div>
                <div className="truncate text-xs text-muted-foreground">{t('hero.cardMeta')}</div>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-bold text-primary">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-primary" />
                {t('hero.cardStatus')}
              </span>
            </div>

            {/* feature rows */}
            <div className="mt-3.5 flex flex-col gap-2">
              <div className="flex items-center gap-3 rounded-xl bg-secondary px-3 py-3 text-sm font-medium text-foreground">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-card text-primary">
                  <AlignLeft aria-hidden className="h-4 w-4" />
                </span>
                {t('hero.cardSummary')}
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-accent-secondary/10 px-3 py-3 text-sm font-medium text-foreground">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-card text-accent-secondary">
                  <Mic aria-hidden className="h-4 w-4" />
                </span>
                {t('hero.cardPodcast')}
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-3 py-3 text-sm font-medium text-foreground">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <HelpCircle aria-hidden className="h-4 w-4" />
                </span>
                {t('hero.cardQuiz')}
              </div>
            </div>

            {/* mastery progress */}
            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{t('hero.cardMasteryLabel')}</span>
                <span className="font-display font-semibold text-primary">
                  {t('hero.cardMasteryValue')}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-gradient-brand" style={{ width: '72%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
