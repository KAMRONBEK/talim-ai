'use client';

import { Badge } from '@talim/ui';
import { ThemeToggle } from '@/components/theme-toggle';

export function DashboardHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-end gap-3 border-b bg-background/80 px-6 backdrop-blur-sm">
      <ThemeToggle />
      <Badge variant="secondary" className="font-normal">
        Bepul reja
      </Badge>
    </header>
  );
}
