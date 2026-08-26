'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { makeQueryClient } from '@/lib/queryClient';
import { ThemeProvider } from '@/components/theme-provider';
import { LocaleSync } from '@/components/locale-sync';
import { SessionSync } from '@/components/session-sync';
import { GlobalUpgradeModal } from '@/components/account/global-upgrade-modal';
import { useJobEvents } from '@/hooks/useJobEvents';
import { useAuthSync } from '@/hooks/useAuthSync';

/** Opens the SSE job-events stream once, inside the QueryClientProvider. */
function JobStream() {
  useJobEvents();
  return null;
}

/** Follows sign-in/sign-out that happened in another tab. */
function AuthSync() {
  useAuthSync();
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => makeQueryClient());
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <LocaleSync />
        <AuthSync />
        <SessionSync />
        <JobStream />
        {children}
        <GlobalUpgradeModal />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
