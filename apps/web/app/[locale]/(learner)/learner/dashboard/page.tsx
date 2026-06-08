'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/useAuthStore';
import { useContents } from '@/hooks/useContent';
import { RecentContentGrid } from '@/components/dashboard/recent-content-grid';

export default function LearnerDashboardPage() {
  const t = useTranslations('learner');
  const user = useAuthStore((s) => s.user);
  const { data: contents, isLoading } = useContents();

  const assigned = useMemo(() => contents ?? [], [contents]);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{t('welcome', { name: user?.name ?? user?.email ?? '' })}</h1>
        <p className="mt-1 text-muted-foreground">{t('dashboardDesc')}</p>
      </div>
      <div className="w-full">
        <h2 className="mb-4 text-lg font-semibold">{t('assignedMaterials')}</h2>
        {isLoading ? (
          <p className="text-muted-foreground">{t('loading')}</p>
        ) : assigned.length === 0 ? (
          <p className="text-center text-muted-foreground">{t('noAssigned')}</p>
        ) : (
          <RecentContentGrid contents={assigned} showDelete={false} />
        )}
      </div>
    </div>
  );
}
