'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { makeQueryClient } from '@/lib/queryClient';
import { ThemeProvider } from '@/components/theme-provider';
import { LocaleSync } from '@/components/locale-sync';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => makeQueryClient());
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <LocaleSync />
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
