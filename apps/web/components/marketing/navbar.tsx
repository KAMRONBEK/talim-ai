'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ThemeToggle } from '@/components/theme-toggle';

export function Navbar() {
  const t = useTranslations('landing');

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-sm text-primary-foreground">
            T
          </span>
          Talim AI
        </Link>
        <ul className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          <li>
            <a href="#features" className="hover:text-foreground">
              {t('nav.features')}
            </a>
          </li>
          <li>
            <a href="#how" className="hover:text-foreground">
              {t('nav.how')}
            </a>
          </li>
          <li>
            <a href="#for-tutors" className="hover:text-foreground">
              {t('nav.forTutors')}
            </a>
          </li>
          <li>
            <a href="#preview" className="hover:text-foreground">
              {t('nav.preview')}
            </a>
          </li>
        </ul>
        <div className="flex items-center gap-3">
          <ThemeToggle compact />
          <Link
            href="/login"
            className="hidden rounded-[10px] border px-5 py-2.5 text-sm font-semibold hover:bg-secondary sm:inline-flex"
          >
            {t('nav.signIn')}
          </Link>
          <Link
            href="/register"
            className="inline-flex rounded-[10px] bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            {t('nav.getStarted')}
          </Link>
        </div>
      </div>
    </nav>
  );
}
