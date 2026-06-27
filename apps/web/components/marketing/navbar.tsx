'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import { LogoMark } from '@/components/brand/logo';

export function Navbar() {
  const t = useTranslations('landing');

  const links = [
    { href: '#features', label: t('nav.features') },
    { href: '#how', label: t('nav.how') },
    { href: '#for-tutors', label: t('nav.forTutors') },
    { href: '#preview', label: t('nav.preview') },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5 font-display text-lg font-bold">
          <LogoMark className="h-8 w-8 shadow-glow" />
          Talim&nbsp;AI
        </Link>
        <ul className="hidden items-center gap-1 rounded-full border border-border/70 bg-card/60 px-1.5 py-1 text-sm font-medium text-muted-foreground md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="rounded-full px-3.5 py-1.5 transition-colors hover:bg-secondary hover:text-foreground"
              >
                {l.label}
              </a>
            </li>
          ))}
          <li>
            <Link
              href="/pricing"
              className="rounded-full px-3.5 py-1.5 transition-colors hover:bg-secondary hover:text-foreground"
            >
              {t('nav.pricing')}
            </Link>
          </li>
        </ul>
        <div className="flex items-center gap-2.5">
          <ThemeToggle compact />
          <Link
            href="/login"
            className="hidden rounded-xl px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:inline-flex"
          >
            {t('nav.signIn')}
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center rounded-xl bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-px hover:shadow-glow"
          >
            {t('nav.getStarted')}
          </Link>
        </div>
      </div>
    </nav>
  );
}
