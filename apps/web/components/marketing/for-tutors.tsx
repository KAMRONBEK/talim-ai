'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export function ForTutors() {
  const t = useTranslations('landing');

  const points = [
    { icon: '📚', title: t('tutors.point1Title'), text: t('tutors.point1Text') },
    { icon: '🎮', title: t('tutors.point2Title'), text: t('tutors.point2Text') },
    { icon: '📈', title: t('tutors.point3Title'), text: t('tutors.point3Text') },
  ];

  return (
    <section id="for-tutors" className="border-t bg-card px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
            {t('tutors.badge')}
          </span>
          <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">{t('tutors.title')}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">{t('tutors.subtitle')}</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {points.map((p) => (
            <div key={p.title} className="rounded-2xl border bg-background p-8">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-xl">
                {p.icon}
              </div>
              <h3 className="text-lg font-semibold">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link
            href="/register"
            className="inline-flex items-center rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            {t('tutors.cta')}
          </Link>
        </div>
      </div>
    </section>
  );
}
