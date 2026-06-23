'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export function Footer() {
  const t = useTranslations('landing');

  return (
    <footer className="border-t border-border/70 bg-card px-6 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:gap-6">
          <Link href="/" className="flex items-center gap-2.5 font-display font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-brand text-sm font-bold text-white shadow-soft">
              T
            </span>
            {t('footer.tagline')}
          </Link>
          <p className="text-sm text-muted-foreground">
            {t('footer.rights', { year: new Date().getFullYear() })}
          </p>
        </div>
        <ul className="flex gap-6 text-sm text-muted-foreground">
          <li>
            <Link href="/dashboard" className="hover:text-foreground">
              {t('footer.app')}
            </Link>
          </li>
          <li>
            <Link href="/login" className="hover:text-foreground">
              {t('footer.signIn')}
            </Link>
          </li>
          <li>
            <a href="#" className="hover:text-foreground">
              {t('footer.privacy')}
            </a>
          </li>
          <li>
            <a href="#" className="hover:text-foreground">
              {t('footer.terms')}
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
