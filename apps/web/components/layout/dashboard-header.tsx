'use client';

import { Badge } from '@talim/ui';

export function DashboardHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-end border-b bg-background/80 px-6 backdrop-blur-sm">
      <Badge variant="secondary" className="font-normal">
        Bepul reja
      </Badge>
    </header>
  );
}
