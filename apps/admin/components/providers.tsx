'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { makeQueryClient } from '@/lib/queryClient';
import { ThemeProvider } from '@/components/theme-provider';
import { AUTH_STORAGE_KEY, useAuthStore } from '@/store/useAuthStore';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => makeQueryClient());

  useEffect(() => {
    void useAuthStore.persist.rehydrate();
  }, []);

  // Follow sign-out (and sign-in) that happened in another tab. zustand's `persist` reads
  // localStorage once, at hydration, so an admin who signed out in one window kept a fully
  // working privileged session in every other one until it was reloaded or hit a 401. The
  // `storage` event fires only in OTHER tabs, so this cannot loop back on itself.
  useEffect(() => {
    function onStorage(event: StorageEvent): void {
      // `key` is null when another tab called localStorage.clear(); treat that as a sign-out.
      if (event.key !== null && event.key !== AUTH_STORAGE_KEY) return;
      if (event.newValue === null) {
        // Nothing to rehydrate FROM — rehydrate() would find no stored value and leave the
        // tab signed in.
        useAuthStore.setState({ user: null, token: null });
        return;
      }
      void useAuthStore.persist.rehydrate();
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ThemeProvider>
  );
}
