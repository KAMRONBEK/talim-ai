'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

function useAuthHydrated() {
  // Must start false: the lazy initializer used to call
  // useAuthStore.persist.hasHydrated() during SSR, where the persist API /
  // localStorage isn't available, throwing "Cannot read properties of
  // undefined (reading 'hasHydrated')" and 500-ing every admin page on the
  // server. Only touch persist on the client, inside the effect (matches the
  // web app's RoleGuard).
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useAuthStore.persist.hasHydrated());
    return unsub;
  }, []);

  return hydrated;
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthHydrated();

  const isAdmin = Boolean(token && user?.role === 'ADMIN');

  useEffect(() => {
    if (!hydrated) return;
    if (!isAdmin) {
      router.replace('/login');
    }
  }, [hydrated, isAdmin, router]);

  // Post-login state is already in memory — do not block on persist hydration.
  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Loading…</p>
    </div>
  );
}
