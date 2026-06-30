'use client';

import { useTranslations } from 'next-intl';

const ITEM_KEYS = ['0', '1', '2'] as const;

// The middle card is the featured/emphasised one in the design.
const FEATURED_INDEX = '1';

export function Testimonials() {
  const t = useTranslations('landing');

  return (
    <section
      id="testimonials"
      className="border-t border-border/60 py-20 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-label text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {t('testimonials.eyebrow')}
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {t('testimonials.title')}
          </h2>
        </div>

        <div className="mt-12 grid gap-4 sm:gap-5 md:grid-cols-3">
          {ITEM_KEYS.map((key) => {
            const featured = key === FEATURED_INDEX;
            return (
              <figure
                key={key}
                className={[
                  'flex flex-col rounded-2xl p-6 transition',
                  featured
                    ? 'border-[1.5px] border-primary bg-card shadow-glow'
                    : 'border border-border bg-card hover-lift',
                ].join(' ')}
              >
                <blockquote className="flex-1 font-display text-lg italic leading-relaxed text-foreground">
                  &ldquo;{t(`testimonials.items.${key}.quote`)}&rdquo;
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <span
                    aria-hidden
                    className={[
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold',
                      featured
                        ? 'bg-accent-secondary/10 text-accent-secondary'
                        : 'bg-secondary text-primary',
                    ].join(' ')}
                  >
                    {t(`testimonials.items.${key}.initials`)}
                  </span>
                  <span className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">
                      {t(`testimonials.items.${key}.name`)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t(`testimonials.items.${key}.role`)}
                    </span>
                  </span>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Testimonials;
