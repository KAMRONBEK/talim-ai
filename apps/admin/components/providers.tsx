'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { makeQueryClient } from '@/lib/queryClient';
import { ThemeProvider } from '@/components/theme-provider';
import { useAuthStore } from '@/store/useAuthStore';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => makeQueryClient());

  useEffect(() => {
    void useAuthStore.persist.rehydrate();
  }, []);

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ThemeProvider>
  );
}
