'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/useAuthStore';
import { useContents } from '@/hooks/useContent';
import { useDashboardSearch } from '@/contexts/dashboard-search';
import { QuickActionCards } from '@/components/dashboard/quick-action-cards';
import { DashboardSearchBar } from '@/components/dashboard/dashboard-search-bar';
import { RecentContentGrid } from '@/components/dashboard/recent-content-grid';

function getFirstName(
  name: string | null | undefined,
  email: string | undefined,
  fallback: string,
): string {
  if (name?.trim()) return name.trim().split(/\s+/)[0] ?? name;
  if (email) return email.split('@')[0] ?? fallback;
  return fallback;
}

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const user = useAuthStore((s) => s.user);
  const { data: contents, isLoading } = useContents();
  const { search } = useDashboardSearch();

  const filtered = useMemo(() => {
    if (!contents) return [];
    const q = search.toLowerCase().trim();
    if (!q) return contents;
    return contents.filter((c) => c.title.toLowerCase().includes(q));
  }, [contents, search]);

  const firstName = getFirstName(user?.name, user?.email, tCommon('you'));

  return (
    <div className="mx-auto flex max-w-4xl flex-col items-center gap-10">
      <div className="relative w-full overflow-hidden rounded-3xl border border-border/70 bg-card px-6 py-10 text-center shadow-soft bg-brand-radial">
        <h1 className="relative font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {t('readyToLearn', { name: firstName })}
        </h1>
      </div>

      <QuickActionCards />

      <DashboardSearchBar />

      <section id="dashboard-recents" className="w-full">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">{t('recents')}</h2>
          {!isLoading && filtered.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {t('count', { count: filtered.length })}
            </span>
          )}
        </div>
        {isLoading ? (
          <p className="text-center text-muted-foreground">{tCommon('loading')}</p>
        ) : (
          <RecentContentGrid contents={filtered} />
        )}
      </section>
    </div>
  );
}
