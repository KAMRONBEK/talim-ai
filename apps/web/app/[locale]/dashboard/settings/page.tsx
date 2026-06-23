'use client';

import { useTranslations } from 'next-intl';
import { ProfileCard } from '@/components/account/profile-card';
import { PasswordCard } from '@/components/account/password-card';
import { BillingSummaryCard } from '@/components/account/billing-summary-card';
import { BecomeTutorCard } from '@/components/account/become-tutor-card';

export default function DashboardSettingsPage() {
  const t = useTranslations('dashboard.settings');

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{t('title')}</p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="mt-1 text-muted-foreground">{t('desc')}</p>
      </div>
      <ProfileCard />
      <PasswordCard />
      <BillingSummaryCard />
      <BecomeTutorCard />
      <p className="text-sm text-muted-foreground">{t('languageHint')}</p>
    </div>
  );
}
