'use client';

import { useTranslations } from 'next-intl';
import { Trophy } from 'lucide-react';
import { Link } from '@/i18n/navigation';

// Faint cream girih lattice, drawn over the pine band (decorative, theme-neutral).
const LATTICE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='72' height='72' viewBox='0 0 72 72'%3E%3Cg fill='none' stroke='%23F7F2E8' stroke-opacity='0.06' stroke-width='1'%3E%3Crect x='18' y='18' width='36' height='36'/%3E%3Crect x='18' y='18' width='36' height='36' transform='rotate(45 36 36)'/%3E%3C/g%3E%3C/svg%3E\")";

const CARDS: { i: string; squareClass: string; icon?: typeof Trophy }[] = [
  { i: '0', squareClass: 'bg-accent-secondary text-accent-secondary-foreground text-sm' },
  { i: '1', squareClass: 'bg-secondary text-primary text-[13px]' },
  { i: '2', squareClass: 'bg-warning text-warning-foreground', icon: Trophy },
];

export function ForTutors() {
  const t = useTranslations('landing');

  return (
    <section
      id="for-tutors"
      aria-labelledby="for-tutors-heading"
      className="px-6 py-20 sm:py-24"
    >
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-primary shadow-elevated">
        {/* Decorative depth + lattice washes — same in both themes. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-transparent to-black/20"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{ backgroundImage: LATTICE, backgroundSize: '72px 72px' }}
        />

        <div className="relative grid gap-10 px-6 py-12 sm:px-10 sm:py-16 lg:grid-cols-[1fr_0.85fr] lg:items-center">
          {/* Pitch */}
          <div>
            <p className="font-label text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-foreground/70">
              {t('tutors.eyebrow')}
            </p>
            <h2
              id="for-tutors-heading"
              className="mt-3 font-display text-3xl font-semibold tracking-tight text-primary-foreground sm:text-4xl"
            >
              {t('tutors.title')}
            </h2>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-primary-foreground/80">
              {t('tutors.subtitle')}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex items-center rounded-xl bg-primary-foreground px-6 py-3 text-sm font-semibold text-primary shadow-sm transition hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
              >
                {t('tutors.primaryCta')}
              </Link>
              <a
                href="#pricing"
                className="inline-flex items-center rounded-xl border border-primary-foreground/35 px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
              >
                {t('tutors.secondaryCta')}
              </a>
            </div>
          </div>

          {/* Proof cards */}
          <div className="flex flex-col gap-2.5">
            {CARDS.map(({ i, squareClass, icon: Icon }) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-primary-foreground/15 bg-primary-foreground/[0.08] px-4 py-3.5"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-bold ${squareClass}`}
                >
                  {Icon ? (
                    <Icon className="h-[18px] w-[18px]" aria-hidden />
                  ) : (
                    t(`tutors.cards.${i}.value`)
                  )}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-primary-foreground">
                    {t(`tutors.cards.${i}.title`)}
                  </div>
                  <div className="text-xs text-primary-foreground/70">
                    {t(`tutors.cards.${i}.desc`)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
