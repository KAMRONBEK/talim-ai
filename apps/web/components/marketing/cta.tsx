'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export function Cta() {
  const t = useTranslations('landing');

  return (
    <section id="cta" className="px-6 py-24">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-gradient-brand px-6 py-20 text-center shadow-glow">
        <div className="pointer-events-none absolute inset-0 bg-girih opacity-50 mix-blend-overlay" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-accent-secondary/40 blur-3xl" />
        <div className="relative mx-auto max-w-2xl">
          <h2 className="text-balance text-4xl font-bold tracking-tight text-white sm:text-5xl">
            {t('cta.title')}
          </h2>
          <p className="mx-auto mt-4 max-w-md text-lg text-white/85">{t('cta.subtitle')}</p>
          <Link
            href="/register"
            className="mt-9 inline-flex items-center rounded-xl bg-white px-8 py-4 text-base font-semibold text-primary shadow-lg transition-all hover:-translate-y-0.5 hover:bg-white/95"
          >
            {t('cta.button')}
          </Link>
        </div>
      </div>
    </section>
  );
}
