'use client';

import { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { Button } from '@talim/ui';
import { useTheme } from 'next-themes';

const themeValues = ['light', 'dark', 'system'] as const;
type ThemeValue = (typeof themeValues)[number];

const themeMeta: Record<ThemeValue, { icon: typeof Sun; label: string }> = {
  light: { icon: Sun, label: 'Light' },
  dark: { icon: Moon, label: 'Dark' },
  system: { icon: Monitor, label: 'System' },
};

/**
 * Compact theme cycle button (light → dark → system) for the admin panel. The admin app has
 * no i18n, so labels are plain English. next-themes persists the choice and applies the
 * `.dark` class; the admin UI is already built on semantic theme tokens, so it renders dark.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-9 w-9 shrink-0 rounded-md border bg-background" aria-hidden />;
  }

  const active = (theme ?? 'system') as ThemeValue;
  const currentIndex = themeValues.indexOf(active);
  const next = themeValues[(currentIndex + 1) % themeValues.length] ?? 'system';
  const { icon: Icon, label } = themeMeta[active];

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="h-9 w-9 shrink-0"
      aria-label={`Theme: ${label}. Click to switch theme.`}
      title={`Theme: ${label}`}
      onClick={() => setTheme(next)}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}
