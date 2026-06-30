'use client';

import { useTranslations } from 'next-intl';

const STAT_INDEXES = ['0', '1', '2', '3'] as const;

export function Stats() {
  const t = useTranslations('landing');

  return (
    <section id="stats" className="border-y border-border/60 bg-card">
      <div className="mx-auto max-w-6xl px-6 py-12 sm:py-14">
        <div className="grid grid-cols-2 gap-y-10 gap-x-4 text-center md:grid-cols-4 md:gap-6">
          {STAT_INDEXES.map((i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="font-display text-4xl font-semibold leading-none text-primary sm:text-[2.5rem]">
                {t(`stats.items.${i}.value`)}
              </div>
              <div className="mt-2 text-[13px] text-muted-foreground">
                {t(`stats.items.${i}.label`)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
