'use client';

import { useMemo } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { BookOpen, TrendingUp, Users } from 'lucide-react';
import { Button } from '@talim/ui';
import { useAuthStore } from '@/store/useAuthStore';
import { useTenantContents } from '@/hooks/useTenantContent';
import { useTenantStudents } from '@/hooks/useTenant';
import { useTenantAssessments } from '@/hooks/useAssessments';
import { useTenantSearch } from '@/contexts/tenant-shell';
import { RecentContentGrid } from '@/components/dashboard/recent-content-grid';
import { OnboardingChecklist } from '@/components/tenant/onboarding-checklist';

export default function TenantDashboardPage() {
  const t = useTranslations('tenant');
  const user = useAuthStore((s) => s.user);
  const { data: contents, isLoading } = useTenantContents();
  const { data: students } = useTenantStudents();
  const { data: assessments } = useTenantAssessments();
  const { search } = useTenantSearch();

  const filtered = useMemo(() => {
    if (!contents) return [];
    const q = search.toLowerCase().trim();
    if (!q) return contents;
    return contents.filter((c) => c.title.toLowerCase().includes(q));
  }, [contents, search]);
  const failedMaterials = contents?.filter((c) => c.status === 'FAILED') ?? [];
  const inactiveStudents = students?.filter((s) => !s.active) ?? [];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      {!user?.name?.trim() && (
        <section className="rounded-2xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">
            {t('settings.accountTitle')}:{' '}
            <Link href="/tenant/settings#account" className="font-medium text-primary hover:underline">
              {t('nav.settings')}
            </Link>
          </p>
        </section>
      )}
      <div className="rounded-3xl border bg-card p-6 shadow-sm">
        <p className="text-sm font-medium text-primary">{user?.tenantName ?? t('organization')}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          {t('welcome', { name: user?.name ?? user?.email ?? '' })}
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{t('dashboardDesc')}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/tenant/materials">
            <Button>{t('addMaterial')}</Button>
          </Link>
          <Link href="/tenant/students">
            <Button variant="outline">{t('students.add')}</Button>
          </Link>
          <Link href="/tenant/assessments">
            <Button variant="outline">{t('nav.assessments')}</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/tenant/materials"
          className="group rounded-2xl border bg-card p-5 shadow-soft hover-lift"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">{t('stats.materials')}</p>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BookOpen className="h-[18px] w-[18px]" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight">{contents?.length ?? 0}</p>
        </Link>
        <Link
          href="/tenant/students"
          className="group rounded-2xl border bg-card p-5 shadow-soft hover-lift"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">{t('stats.students')}</p>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(var(--accent-secondary))]/10 text-[hsl(var(--accent-secondary))]">
              <Users className="h-[18px] w-[18px]" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight">
            {students?.filter((s) => s.active).length ?? 0}
          </p>
        </Link>
        <Link
          href="/tenant/progress"
          className="group rounded-2xl border bg-card p-5 shadow-soft hover-lift"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">{t('nav.progress')}</p>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-success/10 text-success">
              <TrendingUp className="h-[18px] w-[18px]" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight">
            {students?.filter((s) => s.lastActivityAt).length ?? 0}
          </p>
        </Link>
      </div>

      <OnboardingChecklist
        contents={contents}
        students={students}
        hasAssessments={(assessments?.length ?? 0) > 0}
      />

      {(failedMaterials.length > 0 || inactiveStudents.length > 0) && (
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="font-semibold">Needs attention</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {failedMaterials.length > 0 && (
              <Link href="/tenant/materials" className="rounded-xl border border-destructive/30 p-4 text-sm">
                {failedMaterials.length} materials failed processing.
              </Link>
            )}
            {inactiveStudents.length > 0 && (
              <Link href="/tenant/students" className="rounded-xl border p-4 text-sm">
                {inactiveStudents.length} inactive students.
              </Link>
            )}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-lg font-semibold">{t('recentMaterials')}</h2>
        {isLoading ? (
          <p className="text-muted-foreground">{t('loading')}</p>
        ) : (
          <RecentContentGrid contents={filtered} />
        )}
      </section>
    </div>
  );
}
