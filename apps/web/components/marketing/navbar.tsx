'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { LogoMark } from '@/components/brand/logo';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeToggle } from '@/components/theme-toggle';

export function Navbar() {
  const t = useTranslations('landing');

  const links = [
    { href: '#features', label: t('nav.product') },
    { href: '#for-tutors', label: t('nav.forTutors') },
    { href: '#pricing', label: t('nav.pricing') },
    { href: '#how', label: t('nav.about') },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-4">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span aria-hidden="true" className="inline-flex">
            <LogoMark className="h-[30px] w-[30px]" />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight text-foreground">
            Talim&nbsp;AI
          </span>
        </Link>

        {/* Center links — desktop only */}
        <div className="ml-6 hidden items-center gap-7 text-sm font-medium text-muted-foreground lg:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-md transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher compact />

          <Link
            href="/login"
            className="hidden rounded-lg px-2 py-2 text-sm font-semibold text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:inline-flex"
          >
            {t('nav.logIn')}
          </Link>

          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-px hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t('nav.getStarted')}
          </Link>

          <ThemeToggle compact />
        </div>
      </div>
    </nav>
  );
}
