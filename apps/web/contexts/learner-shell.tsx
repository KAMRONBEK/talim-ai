'use client';

import { type ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { RoleGuard } from '@/components/role-guard';
import { AuthGuard } from '@/components/auth-guard';
import { useAuthStore } from '@/store/useAuthStore';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { LearnerBottomNav, LearnerSidebar } from '@/components/layout/learner-navigation';

/**
 * Forces a student issued a temporary password (`mustChangePassword`, e.g. an email-less
 * kid or after a tutor/admin reset) onto `/learner/settings` until they change it. The
 * welcome banner alone was dismissible and didn't enforce the change. Runs inside the
 * guards so `user` is hydrated; the settings page clears the store flag on success so the
 * gate releases immediately (without a reload).
 */
function MustChangePasswordGate({ children }: { children: ReactNode }) {
  const mustChange = useAuthStore((s) => s.user?.mustChangePassword);
  const pathname = usePathname();
  const router = useRouter();
  const blocked = Boolean(mustChange) && pathname !== '/learner/settings';

  useEffect(() => {
    if (blocked) router.replace('/learner/settings');
  }, [blocked, router]);

  if (blocked) return null;
  return <>{children}</>;
}

export function LearnerShell({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allowedRoles={['TENANT_LEARNER']}>
      <AuthGuard>
        <MustChangePasswordGate>
          <div className="flex h-dvh overflow-hidden">
            <LearnerSidebar />
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              <DashboardHeader />
              <main className="min-h-0 flex-1 overflow-y-auto px-4 py-8 md:px-6">{children}</main>
              <LearnerBottomNav />
            </div>
          </div>
        </MustChangePasswordGate>
      </AuthGuard>
    </RoleGuard>
  );
}
