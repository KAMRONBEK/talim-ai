'use client';

import { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { Button } from '@talim/ui';
import { useTheme } from 'next-themes';

const themes = [
  { value: 'light', label: "Yorug'", icon: Sun },
  { value: 'dark', label: "Qorong'u", icon: Moon },
  { value: 'system', label: 'Tizim', icon: Monitor },
] as const;

type ThemeValue = (typeof themes)[number]['value'];

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

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
    const cycle: ThemeValue[] = ['light', 'dark', 'system'];
    const currentIndex = cycle.indexOf(active);
    const next = cycle[(currentIndex + 1) % cycle.length] ?? 'system';
    const Icon = themes.find((t) => t.value === active)?.icon ?? Monitor;

    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9 shrink-0"
        aria-label="Mavzuni almashtirish"
        title={themes.find((t) => t.value === active)?.label}
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
      aria-label="Mavzu"
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
