'use client';

import { useTranslations } from 'next-intl';
import { AlertCircle } from 'lucide-react';
import { ProfileCard } from '@/components/account/profile-card';
import { PasswordCard } from '@/components/account/password-card';
import { AccountSummary } from '@/components/account/account-summary';
import { useAuthStore } from '@/store/useAuthStore';
import { useLearnerSummary } from '@/hooks/useTenant';
import { dismissOnboarding } from '@/lib/onboarding';

export default function LearnerSettingsPage() {
  const t = useTranslations('learner.settings');
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const { data: summary } = useLearnerSummary();
  const orgName = summary?.tenantName ?? user?.tenantName;

  const handlePasswordSuccess = () => {
    if (user?.id) dismissOnboarding(user.id);
    // Release the forced-change gate immediately (SessionSync only refetches /auth/me
    // on a token change, so the store flag would otherwise stay stale until reload).
    if (user?.mustChangePassword) setUser({ ...user, mustChangePassword: false });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <p className="font-label text-xs font-medium uppercase tracking-[0.2em] text-primary">{t('accountTitle')}</p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="mt-1 text-muted-foreground">{t('desc')}</p>
      </div>

      {user?.mustChangePassword && (
        <div className="flex items-center gap-3 rounded-2xl border border-accent-secondary/40 bg-accent-secondary/10 px-4 py-3.5 shadow-soft">
          <AlertCircle className="h-5 w-5 shrink-0 text-accent-secondary" />
          <p className="text-sm font-medium text-foreground">{t('tempPasswordWarning')}</p>
        </div>
      )}

      <section className="space-y-4">
        <h2 className="font-display text-lg font-semibold">{t('accountTitle')}</h2>
        <ProfileCard />
        {user?.username && (
          <div className="space-y-1 rounded-xl border bg-card p-6">
            <p className="font-label text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {t('usernameLabel')}
            </p>
            <p className="text-sm text-foreground">
              {orgName ? `${user.username} · ${orgName}` : user.username}
            </p>
          </div>
        )}
        <PasswordCard onSuccess={handlePasswordSuccess} />
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-lg font-semibold">{t('schoolTitle')}</h2>
        <AccountSummary tenantName={summary?.tenantName} />
      </section>
    </div>
  );
}
