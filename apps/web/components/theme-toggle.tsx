'use client';

import { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@talim/ui';
import { useTheme } from 'next-themes';

const themeValues = ['light', 'dark', 'system'] as const;
type ThemeValue = (typeof themeValues)[number];

const themeIcons = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} as const;

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('theme');
  const tCommon = useTranslations('common');
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const themes = themeValues.map((value) => ({
    value,
    label: t(value),
    icon: themeIcons[value],
  }));

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={compact ? 'h-9 w-9 rounded-md border bg-background' : 'h-9 w-[7.5rem] rounded-md border bg-background'}
        aria-hidden
      />
    );
  }

  const active = (theme ?? 'system') as ThemeValue;

  if (compact) {
    const currentIndex = themeValues.indexOf(active);
    const next = themeValues[(currentIndex + 1) % themeValues.length] ?? 'system';
    const Icon = themes.find((item) => item.value === active)?.icon ?? Monitor;

    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9 shrink-0"
        aria-label={tCommon('themeToggle')}
        title={themes.find((item) => item.value === active)?.label}
        onClick={() => setTheme(next)}
      >
        <Icon className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div
      className="inline-flex items-center rounded-lg border bg-background p-0.5"
      role="group"
      aria-label={tCommon('theme')}
    >
      {themes.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          className={`inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
            active === value
              ? 'bg-secondary text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          aria-pressed={active === value}
        >
          <Icon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
