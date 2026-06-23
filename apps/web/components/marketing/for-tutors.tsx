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
    <section
      id="for-tutors"
      className="relative overflow-hidden border-t border-border/70 bg-card px-6 py-24"
    >
      <div className="pointer-events-none absolute inset-0 bg-girih opacity-60" />
      <div className="relative mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent-secondary/15 px-3.5 py-1.5 text-xs font-semibold text-warning">
            {t('tutors.badge')}
          </span>
          <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">{t('tutors.title')}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">{t('tutors.subtitle')}</p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {points.map((p) => (
            <div
              key={p.title}
              className="group rounded-3xl border border-border/70 bg-background p-8 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-card"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-xl transition-transform duration-200 group-hover:scale-110">
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
            className="inline-flex items-center rounded-xl bg-accent-secondary px-7 py-3.5 text-base font-semibold text-accent-secondary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:brightness-105 hover:shadow-md"
          >
            {t('tutors.cta')}
          </Link>
        </div>
      </div>
    </section>
  );
}
