'use client';

import { type ReactNode, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useLearnerSummary } from '@/hooks/useTenant';
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

/**
 * Learners keep full access when their organization's subscription lapses (#13) — a
 * child should not lose their homework because an adult's paperwork is late, and
 * activation is manual here, so a lapse is usually administrative. But silence left
 * them with no idea their class was in an unpaid state, so state it and point at the
 * person who can act. This never gates anything.
 */
function InactiveSubscriptionNotice() {
  const t = useTranslations('learner');
  const { data: summary } = useLearnerSummary();
  if (!summary || summary.orgSubscriptionActive) return null;
  return (
    <div className="border-b border-accent-secondary/40 bg-accent-secondary/10 px-4 py-3 text-sm text-foreground md:px-6">
      {t('inactiveSubscriptionBanner')}
    </div>
  );
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
              <InactiveSubscriptionNotice />
              <main className="min-h-0 flex-1 overflow-y-auto bg-background px-4 py-8 md:px-6">{children}</main>
              <LearnerBottomNav />
            </div>
          </div>
        </MustChangePasswordGate>
      </AuthGuard>
    </RoleGuard>
  );
}
