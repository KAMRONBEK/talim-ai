'use client';

import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';
import { LogoMark } from '@/components/brand/logo';

/**
 * Split-screen auth shell ("Scholar" system): a pine brand panel (reversed
 * cream LogoMark, an auth-specific serif headline with a warm-accent italic
 * emphasis word, three checkmark value-props and a copyright line, all over a
 * faint cream girih texture) beside the cream form panel. The form panel carries
 * a Log in / Sign up segmented toggle above the page's card/form, and collapses
 * to a single centered column on small screens.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  const l = useTranslations('landing');
  const t = useTranslations('auth');
  const pathname = usePathname();
  const isRegister = pathname?.startsWith('/register') ?? false;

  const points = [t('benefitFree'), t('benefitLangs'), t('benefitJoin')];

  const segment = (active: boolean) =>
    `flex-1 rounded-lg px-3 py-2.5 text-center text-sm font-semibold transition-colors ${
      active
        ? 'bg-primary text-primary-foreground shadow-sm'
        : 'text-muted-foreground hover:text-foreground'
    }`;

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-transparent to-black/20"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-girih opacity-50 mix-blend-overlay"
        />

        <Link
          href="/"
          className="relative flex items-center gap-3 font-display text-2xl font-semibold"
        >
          <LogoMark mono className="h-9 w-9 text-primary-foreground" />
          Talim AI
        </Link>

        <div className="relative">
          <h2 className="max-w-md text-balance font-display text-4xl font-semibold leading-[1.15] text-primary-foreground/90">
            {t.rich('heroTitle', {
              em: (chunks) => (
                <span className="font-display italic text-accent-secondary">{chunks}</span>
              ),
            })}
          </h2>
          <p className="mt-4 max-w-sm text-primary-foreground/70">{t('heroSubtitle')}</p>
          <ul className="mt-8 space-y-3.5">
            {points.map((p) => (
              <li key={p} className="flex items-center gap-3 text-sm text-primary-foreground/90">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-primary-foreground/60">
          {l('footer.copyright', { year: new Date().getFullYear() })}
        </p>
      </aside>

      {/* Form panel */}
      <main className="relative flex flex-col items-center justify-center overflow-hidden bg-card p-6">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-girih opacity-50 lg:hidden" />
        <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
          <LanguageSwitcher compact />
          <ThemeToggle compact />
        </div>
        <Link
          href="/"
          className="relative z-10 mb-8 flex items-center gap-2.5 font-display text-xl font-bold lg:hidden"
        >
          <LogoMark className="h-10 w-10 shadow-glow" />
          Talim AI
        </Link>
        <div className="relative z-10 w-full max-w-md">
          {/* Log in / Sign up segmented toggle */}
          <div className="mb-6 flex rounded-xl bg-muted p-1">
            <Link
              href="/login"
              aria-current={isRegister ? undefined : 'page'}
              className={segment(!isRegister)}
            >
              {t('signIn')}
            </Link>
            <Link
              href="/register"
              aria-current={isRegister ? 'page' : undefined}
              className={segment(isRegister)}
            >
              {t('register')}
            </Link>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
