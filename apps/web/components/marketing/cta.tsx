'use client';

import { useTranslations } from 'next-intl';
import { ArrowRight, GraduationCap } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export function Cta() {
  const t = useTranslations('landing');

  return (
    <section
      id="cta"
      aria-labelledby="cta-heading"
      className="relative isolate overflow-hidden bg-primary px-6 py-20 text-center sm:py-24"
    >
      {/* Girih star lattice — cream stroke on pine, decorative only. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='72' height='72' viewBox='0 0 72 72'%3E%3Cg fill='none' stroke='%23F7F2E8' stroke-opacity='0.06' stroke-width='1'%3E%3Crect x='18' y='18' width='36' height='36'/%3E%3Crect x='18' y='18' width='36' height='36' transform='rotate(45 36 36)'/%3E%3C/g%3E%3C/svg%3E\")",
          backgroundSize: '72px 72px',
        }}
      />
      {/* Soft clay glow + deepening pine wash for editorial depth. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent-secondary/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(135deg, transparent 0%, rgba(0,0,0,0.18) 100%)',
        }}
      />

      <div className="relative mx-auto max-w-2xl">
        <h2
          id="cta-heading"
          className="text-balance font-display text-3xl font-semibold tracking-tight text-primary-foreground sm:text-4xl lg:text-[2.5rem]"
        >
          {t('cta.title')}
        </h2>
        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-primary-foreground/80 sm:text-lg">
          {t('cta.subtitle')}
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-primary-foreground px-7 py-3.5 text-sm font-semibold text-primary shadow-sm transition hover:-translate-y-px hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
          >
            {t('cta.primaryCta')}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl border border-primary-foreground/30 px-6 py-3.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
          >
            <GraduationCap className="h-4 w-4" aria-hidden />
            {t('cta.secondaryCta')}
          </Link>
        </div>
      </div>
    </section>
  );
}
