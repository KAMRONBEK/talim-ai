'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { LogoMark } from '@/components/brand/logo';

// In-page section anchors for the landing nav. Privacy/Contact have no route
// yet, so they render as plain labels rather than dead `#` links that would
// scroll-jump to the top of the page.
const FOOTER_LINKS = [
  { key: '0', href: '#features' },
  { key: '1', href: '#for-tutors' },
  { key: '2', href: '#pricing' },
  { key: '3', href: null },
  { key: '4', href: null },
] as const;

export function Footer() {
  const t = useTranslations('landing');

  return (
    <footer className="border-t border-border/60 bg-foreground text-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 md:flex-row md:items-center md:justify-between">
        {/* Brand + tagline */}
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-foreground"
        >
          <LogoMark className="h-[30px] w-[30px]" />
          <span className="flex flex-col leading-tight">
            <span className="font-display text-lg font-semibold text-background">
              {t('footer.brand')}
            </span>
            <span className="text-xs text-background/60">{t('footer.tagline')}</span>
          </span>
        </Link>

        {/* Link columns */}
        <nav aria-label={t('footer.brand')}>
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-background/70">
            {FOOTER_LINKS.map(({ key, href }) => (
              <li key={key}>
                {href ? (
                  <a
                    href={href}
                    className="rounded transition-colors hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-foreground"
                  >
                    {t(`footer.links.${key}.label`)}
                  </a>
                ) : (
                  <span>{t(`footer.links.${key}.label`)}</span>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Copyright */}
        <p className="text-xs text-background/60">
          {t('footer.copyright', { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  );
}
