'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Menu, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@talim/ui';
import { Link } from '@/i18n/navigation';
import { LogoMark } from '@/components/brand/logo';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeToggle } from '@/components/theme-toggle';

export function Navbar() {
  const t = useTranslations('landing');
  const tCommon = useTranslations('common');
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = () => setMobileOpen(false);

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
            Talim<span className="text-primary">&nbsp;AI</span>
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

          {/* Hamburger — opens the mobile menu (nav links + Log in are hidden below lg) */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label={tCommon('menu')}
            aria-expanded={mobileOpen}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
          >
            <Menu aria-hidden className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="right"
          className="flex h-dvh w-[min(100%,20rem)] flex-col gap-0 p-0 lg:hidden"
        >
          <SheetHeader className="flex flex-row items-center justify-between gap-3 border-b border-border p-4">
            <SheetTitle className="font-display text-lg font-semibold tracking-tight text-foreground">
              Talim<span className="text-primary">&nbsp;AI</span>
            </SheetTitle>
            <button
              type="button"
              onClick={closeMobile}
              aria-label={tCommon('close')}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X aria-hidden className="h-4 w-4" />
            </button>
          </SheetHeader>

          <nav className="flex flex-col gap-1 p-4 text-sm font-medium">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={closeMobile}
                className="rounded-lg px-3 py-2.5 text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="mt-auto flex flex-col gap-3 border-t border-border p-4">
            <LanguageSwitcher />
            <Link
              href="/login"
              onClick={closeMobile}
              className="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {t('nav.logIn')}
            </Link>
            <Link
              href="/register"
              onClick={closeMobile}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-px hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {t('nav.getStarted')}
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
