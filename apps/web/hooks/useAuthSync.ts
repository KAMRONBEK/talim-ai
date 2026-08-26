'use client';

import { useEffect } from 'react';
import { AUTH_STORAGE_KEY, useAuthStore } from '@/store/useAuthStore';

/**
 * Keep every open tab's session in step with the others.
 *
 * The auth store persists to localStorage but zustand's `persist` only reads it once, at
 * hydration. So logging out in one tab left every other tab fully authenticated and working
 * from in-memory state — still listing content, still able to act — until it happened to be
 * reloaded or hit a 401. On a shared or school computer that is the difference between "I
 * logged out" and "I logged out of one window".
 *
 * The `storage` event fires only in OTHER tabs, so this cannot loop back on the tab that made
 * the change. It covers signing IN elsewhere too, which is the same problem in reverse: a tab
 * left on the login screen now follows the session that was just established.
 */
export function useAuthSync(): void {
  useEffect(() => {
    function onStorage(event: StorageEvent): void {
      // `key` is null when another tab called localStorage.clear(); treat that as a sign-out
      // rather than ignoring it.
      if (event.key !== null && event.key !== AUTH_STORAGE_KEY) return;

      if (event.newValue === null) {
        // The entry was removed outright, so there is nothing to rehydrate FROM — clearing
        // state directly is the only way to notice. `persist.rehydrate()` would find no
        // stored value and leave the tab signed in.
        useAuthStore.setState({ user: null, token: null });
        return;
      }

      void useAuthStore.persist.rehydrate();
    }

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
}
