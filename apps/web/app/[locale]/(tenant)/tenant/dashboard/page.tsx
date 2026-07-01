'use client';

import { useMemo } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import {
  AlertTriangle,
  BookOpen,
  ClipboardCheck,
  FileCheck2,
  GraduationCap,
  TrendingUp,
  Users,
  UserX,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@talim/ui';
import { useAuthStore } from '@/store/useAuthStore';
import { useTenantContents } from '@/hooks/useTenantContent';
import { useTenantStudents } from '@/hooks/useTenant';
import { useTenantAssessments } from '@/hooks/useAssessments';
import { useTenantSearch } from '@/contexts/tenant-shell';
import { RecentContentGrid } from '@/components/dashboard/recent-content-grid';
import { OnboardingChecklist } from '@/components/tenant/onboarding-checklist';

function StatCard({
  href,
  label,
  value,
  icon: Icon,
  tone,
  valueClassName,
}: {
  href: string;
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone: 'pine' | 'clay';
  valueClassName?: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-border/70 bg-card p-5 shadow-soft hover-lift"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            tone === 'pine'
              ? 'bg-primary/10 text-primary'
              : 'bg-accent-secondary/15 text-accent-secondary'
          }`}
        >
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
      <p
        className={`mt-4 font-display text-4xl font-semibold tabular-nums${
          valueClassName ? ` ${valueClassName}` : ''
        }`}
      >
        {value}
      </p>
    </Link>
  );
}

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

  const readyMaterials = contents?.filter((c) => c.status === 'READY').length ?? 0;
  const activeStudents = students?.filter((s) => s.active).length ?? 0;
  const scoredStudents = students?.filter((s) => s.avgQuizScore != null) ?? [];
  const avgMastery = scoredStudents.length
    ? Math.round(
        scoredStudents.reduce((sum, s) => sum + (s.avgQuizScore ?? 0), 0) / scoredStudents.length,
      )
    : null;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      {!user?.name?.trim() && (
        <section className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
          <p className="text-sm text-muted-foreground">
            {t('settings.accountTitle')}:{' '}
            <Link href="/tenant/settings#account" className="font-medium text-primary hover:underline">
              {t('nav.settings')}
            </Link>
          </p>
        </section>
      )}
      <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card p-7 shadow-soft sm:p-8">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-girih opacity-50 [mask-image:radial-gradient(ellipse_70%_80%_at_80%_0%,black,transparent)]" />
        <div className="relative">
          <p className="font-label text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            {user?.tenantName ?? t('organization')}
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {t('welcome', { name: user?.name ?? user?.email ?? '' })}
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">{t('dashboardDesc')}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/tenant/materials">
              <Button variant="gradient">{t('addMaterial')}</Button>
            </Link>
            <Link href="/tenant/students">
              <Button variant="outline">{t('students.add')}</Button>
            </Link>
            <Link href="/tenant/assessments">
              <Button variant="outline">{t('nav.assessments')}</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          href="/tenant/materials"
          label={t('stats.materials')}
          value={contents?.length ?? 0}
          icon={BookOpen}
          tone="pine"
        />
        <StatCard
          href="/tenant/students"
          label={t('stats.students')}
          value={activeStudents}
          icon={Users}
          tone="clay"
        />
        <StatCard
          href="/tenant/progress"
          label={t('stats.avgMastery')}
          value={avgMastery == null ? '—' : `${avgMastery}%`}
          icon={TrendingUp}
          tone="pine"
          valueClassName={avgMastery == null ? undefined : 'text-primary'}
        />
        <StatCard
          href="/tenant/students"
          label={t('stats.totalStudents')}
          value={students?.length ?? 0}
          icon={GraduationCap}
          tone="clay"
        />
        <StatCard
          href="/tenant/assessments"
          label={t('stats.assessments')}
          value={assessments?.length ?? 0}
          icon={ClipboardCheck}
          tone="pine"
        />
        <StatCard
          href="/tenant/materials"
          label={t('stats.readyMaterials')}
          value={readyMaterials}
          icon={FileCheck2}
          tone="clay"
        />
      </div>

      <OnboardingChecklist
        contents={contents}
        students={students}
        hasAssessments={(assessments?.length ?? 0) > 0}
      />

      {(failedMaterials.length > 0 || inactiveStudents.length > 0) && (
        <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <h2 className="font-display text-lg font-semibold">{t('needsAttention')}</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {failedMaterials.length > 0 && (
              <Link
                href="/tenant/materials"
                className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm transition-colors hover:bg-destructive/10"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                  <AlertTriangle className="h-[18px] w-[18px]" />
                </span>
                <span className="font-medium">{t('materialsFailed', { count: failedMaterials.length })}</span>
              </Link>
            )}
            {inactiveStudents.length > 0 && (
              <Link
                href="/tenant/students"
                className="flex items-center gap-3 rounded-xl border border-border/70 p-4 text-sm transition-colors hover:bg-secondary/60"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning">
                  <UserX className="h-[18px] w-[18px]" />
                </span>
                <span className="font-medium">{t('inactiveStudentsCount', { count: inactiveStudents.length })}</span>
              </Link>
            )}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 font-display text-lg font-semibold">{t('recentMaterials')}</h2>
        {isLoading ? (
          <p className="text-muted-foreground">{t('loading')}</p>
        ) : (
          <RecentContentGrid contents={filtered} />
        )}
      </section>
    </div>
  );
}
