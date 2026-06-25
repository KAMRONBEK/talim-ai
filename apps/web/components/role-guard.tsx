'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import type { UserRole } from '@talim/types';
import { getPostLoginPath } from '@/lib/auth-routing';

function useAuthHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useAuthStore.persist.hasHydrated());
    return unsub;
  }, []);

  return hydrated;
}

export function RoleGuard({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}) {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const hydrated = useAuthHydrated();

  const allowed = Boolean(token && user && allowedRoles.includes(user.role));

  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      router.replace('/login');
      return;
    }
    // ADMIN has no home in the learner/tenant web app (admins use apps/admin).
    // Without this, getPostLoginPath('ADMIN') → /dashboard, which bounces them
    // right back here — an infinite redirect loop. Sign them out instead.
    if (user && user.role === 'ADMIN') {
      logout();
      router.replace('/login');
      return;
    }
    if (user && !allowedRoles.includes(user.role)) {
      router.replace(getPostLoginPath(user.role));
    }
  }, [hydrated, token, user, allowedRoles, router, logout]);

  if (allowed) return <>{children}</>;

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Loading…</p>
    </div>
  );
}
