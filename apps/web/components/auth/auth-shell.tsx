'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';
import { LogoMark } from '@/components/brand/logo';

/**
 * Split-screen auth shell: a violet brand panel (with the girih signature
 * texture and reused landing value-props) beside the form. Collapses to a
 * single centered column on small screens.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  const l = useTranslations('landing');

  const points = [l('features.summaryTitle'), l('features.podcastTitle'), l('features.quizTitle')];

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-gradient-brand p-12 text-white lg:flex lg:flex-col">
        <div className="pointer-events-none absolute inset-0 bg-girih opacity-50 mix-blend-overlay" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-accent-secondary/30 blur-3xl" />
        <Link href="/" className="relative flex items-center gap-2.5 font-display text-xl font-bold">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 shadow-soft backdrop-blur">
            <LogoMark mono className="h-6 w-6" />
          </span>
          Talim AI
        </Link>

        <div className="relative mt-auto">
          <h2 className="max-w-md text-balance text-4xl font-bold leading-[1.1] text-white">
            {l('hero.titleLead')}{' '}
            <span className="text-accent-secondary">{l('hero.titleEmphasis')}</span>
          </h2>
          <p className="mt-4 max-w-sm text-white/80">{l('hero.subtitle')}</p>
          <ul className="mt-8 space-y-3">
            {points.map((p) => (
              <li key={p} className="flex items-center gap-3 text-white/90">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs">
                  ✓
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Form panel */}
      <main className="relative flex flex-col items-center justify-center overflow-hidden bg-background p-6">
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
        <div className="relative z-10 w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
