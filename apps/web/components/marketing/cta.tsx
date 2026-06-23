'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export function Cta() {
  const t = useTranslations('landing');

  return (
    <section id="cta" className="relative overflow-hidden border-t px-6 py-28 text-center">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_100%,hsl(var(--accent)/0.35),transparent)]" />
      <div className="relative mx-auto max-w-3xl">
        <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">{t('cta.title')}</h2>
        <p className="mx-auto mt-4 max-w-md text-lg text-muted-foreground">{t('cta.subtitle')}</p>
        <Link
          href="/register"
          className="mt-8 inline-flex rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          {t('cta.button')}
        </Link>
      </div>
    </section>
  );
}
