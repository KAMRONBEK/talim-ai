'use client';

import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';

const ITEMS = [0, 1, 2, 3] as const;

export function Faq() {
  const t = useTranslations('landing');

  return (
    <section id="faq" className="border-t border-border/60 bg-card px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="font-label text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {t('faq.eyebrow')}
          </p>
          <h2 className="mt-2.5 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {t('faq.title')}
          </h2>
        </div>

        <div className="grid gap-3.5 md:grid-cols-2">
          {ITEMS.map((i) => (
            <details
              key={i}
              className="group rounded-2xl border border-border bg-background p-5 transition hover:border-border/60 hover:shadow-sm open:shadow-sm"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [&::-webkit-details-marker]:hidden">
                <span className="font-display text-[17px] font-semibold leading-snug text-foreground">
                  {t(`faq.items.${i}.q`)}
                </span>
                <ChevronDown
                  aria-hidden
                  className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
                />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {t(`faq.items.${i}.a`)}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
