'use client';

import { useMemo } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@talim/ui';
import { useAuthStore } from '@/store/useAuthStore';
import { useTenantContents } from '@/hooks/useTenantContent';
import { useTenantStudents } from '@/hooks/useTenant';
import { useTenantSearch } from '@/contexts/tenant-shell';
import { RecentContentGrid } from '@/components/dashboard/recent-content-grid';

export default function TenantDashboardPage() {
  const t = useTranslations('tenant');
  const user = useAuthStore((s) => s.user);
  const { data: contents, isLoading } = useTenantContents();
  const { data: students } = useTenantStudents();
  const { search } = useTenantSearch();

  const filtered = useMemo(() => {
    if (!contents) return [];
    const q = search.toLowerCase().trim();
    if (!q) return contents;
    return contents.filter((c) => c.title.toLowerCase().includes(q));
  }, [contents, search]);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">{t('welcome', { name: user?.name ?? user?.email ?? '' })}</h1>
        <p className="mt-1 text-muted-foreground">{t('dashboardDesc')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">{t('stats.materials')}</p>
          <p className="text-2xl font-semibold">{contents?.length ?? 0}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">{t('stats.students')}</p>
          <p className="text-2xl font-semibold">{students?.filter((s) => s.active).length ?? 0}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <Link href="/tenant/materials">
            <Button className="w-full">{t('addMaterial')}</Button>
          </Link>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">{t('recentMaterials')}</h2>
        {isLoading ? (
          <p className="text-muted-foreground">{t('loading')}</p>
        ) : (
          <RecentContentGrid contents={filtered} />
        )}
      </div>
    </div>
  );
}
