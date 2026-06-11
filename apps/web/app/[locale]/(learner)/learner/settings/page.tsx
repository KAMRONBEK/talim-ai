'use client';

import { useTranslations } from 'next-intl';
import { ProfileCard } from '@/components/account/profile-card';
import { PasswordCard } from '@/components/account/password-card';
import { AccountSummary } from '@/components/account/account-summary';
import { useAuthStore } from '@/store/useAuthStore';
import { useLearnerSummary } from '@/hooks/useTenant';
import { dismissOnboarding } from '@/lib/onboarding';

export default function LearnerSettingsPage() {
  const t = useTranslations('learner.settings');
  const user = useAuthStore((s) => s.user);
  const { data: summary } = useLearnerSummary();

  const handlePasswordSuccess = () => {
    if (user?.id) dismissOnboarding(user.id);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('desc')}</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t('accountTitle')}</h2>
        <ProfileCard />
        <PasswordCard onSuccess={handlePasswordSuccess} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t('schoolTitle')}</h2>
        <AccountSummary tenantName={summary?.tenantName} />
      </section>
    </div>
  );
}
