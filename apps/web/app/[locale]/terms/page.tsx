'use client';

import { useTranslations } from 'next-intl';
import { Navbar } from '@/components/marketing/navbar';
import { Footer } from '@/components/marketing/footer';

/**
 * Public `/terms` route — a real Terms of Service page composed like the
 * `/pricing` route (marketing `Navbar` + a Scholar-style content band +
 * `Footer`). Every section body lives in the `terms.*` messages so the copy
 * ships in uz/en/ru. The register page links here from its terms checkbox.
 */
const SECTIONS = [
  'acceptance',
  'accounts',
  'use',
  'content',
  'orgs',
  'disclaimers',
  'changes',
  'contact',
] as const;

export default function TermsPage() {
  const t = useTranslations('terms');

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar />
      <section className="bg-brand-radial px-6 py-24 sm:py-28">
        <div className="mx-auto max-w-3xl">
          {/* Heading */}
          <div className="font-label text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {t('eyebrow')}
          </div>
          <h1 className="mt-2.5 text-balance font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {t('title')}
          </h1>
          <p className="mt-4 text-pretty text-base text-muted-foreground">{t('intro')}</p>
          <p className="mt-3 font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {t('updated')}
          </p>

          {/* Sections */}
          <div className="mt-12 space-y-10">
            {SECTIONS.map((key, i) => (
              <div key={key}>
                <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
                  {i + 1}. {t(`sections.${key}.title`)}
                </h2>
                <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">
                  {t(`sections.${key}.body`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
