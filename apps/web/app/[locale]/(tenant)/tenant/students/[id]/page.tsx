'use client';

import { use } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, BookOpen, Flame } from 'lucide-react';
import { Button } from '@talim/ui';
import { useAssignContent, useStudentProgress } from '@/hooks/useTenant';
import { useTenantContents } from '@/hooks/useTenantContent';
import { ActivityHeatmap, ProgressBar } from '@/components/tenant/activity-heatmap';

function profileInitials(name?: string | null, email?: string | null): string {
  const base = (name ?? email ?? '?').trim();
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]!.charAt(0)}${parts[1]!.charAt(0)}`.toUpperCase();
  return base.slice(0, 2).toUpperCase();
}

export default function TenantStudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations('tenant');
  const tc = useTranslations('common');
  const { data, isLoading, isError } = useStudentProgress(id);
  const { data: contents } = useTenantContents();
  const assign = useAssignContent();

  if (isError) {
    return <p className="text-sm text-destructive">{tc('loadError')}</p>;
  }
  if (isLoading || !data) {
    return <p className="text-muted-foreground">{t('loading')}</p>;
  }

  const masteryPct = data.contentProgress.length
    ? Math.round(
        data.contentProgress.reduce((sum, r) => sum + r.overallCoverage, 0) / data.contentProgress.length,
      )
    : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link
        href="/tenant/students"
        className="inline-flex items-center gap-1.5 font-label text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('students.back')}
      </Link>

      <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-brand font-display text-2xl font-bold text-primary-foreground">
            {profileInitials(data.student.name, data.student.email)}
          </span>
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-bold tracking-tight">{data.student.name ?? data.student.email}</h1>
            <p className="mt-1 text-muted-foreground">
              {t('students.streak', { days: data.streakDays })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-primary bg-secondary p-5 shadow-soft">
          <p className="font-label text-xs font-semibold uppercase tracking-wider text-primary">{t('avgCoverage')}</p>
          <p className="mt-3 font-display text-4xl font-bold tracking-tight tabular-nums text-primary">{masteryPct}%</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="font-label text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('students.activity')}</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-secondary/15 text-accent-secondary">
              <Flame className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 font-display text-4xl font-bold tracking-tight tabular-nums">{data.streakDays}</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="font-label text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('nav.materials')}</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <BookOpen className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 font-display text-4xl font-bold tracking-tight tabular-nums">{data.contentProgress.length}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
        <h2 className="font-display text-lg font-semibold">{t('students.activity')}</h2>
        <div className="mt-3">
          {data.activityDays.length > 0 ? (
            <ActivityHeatmap days={data.activityDays} />
          ) : (
            <p className="text-sm text-muted-foreground">{t('students.noActivity')}</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-3">
          <h2 className="font-display text-lg font-semibold">{t('students.progress')}</h2>
          {data.contentProgress.length === 0 ? (
            <p className="text-muted-foreground">{t('students.noProgress')}</p>
          ) : (
            data.contentProgress.map((row) => (
              <div key={row.contentId} className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{row.contentTitle}</p>
                  <span
                    className={`font-display text-base font-bold tabular-nums ${
                      row.overallCoverage < 50 ? 'text-accent-secondary' : 'text-primary'
                    }`}
                  >
                    {Math.round(row.overallCoverage)}%
                  </span>
                </div>
                <div className="mt-3">
                  <ProgressBar value={row.overallCoverage} />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t('students.quizAttempts', { count: row.quizAttempts })}
                  {row.avgQuizScore != null &&
                    ` · ${t('students.avgQuizValue', { value: Math.round(row.avgQuizScore) })}`}
                </p>
              </div>
            ))
          )}
        </div>
        <aside className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <h2 className="font-display text-lg font-semibold">{t('assignMaterial')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('assignMaterialDesc')}</p>
          <div className="mt-4 space-y-2">
            {(contents ?? []).map((content) => (
              <div key={content.id} className="flex items-center justify-between gap-2 rounded-xl border border-border/70 p-2.5 text-sm transition-colors hover:bg-secondary/40">
                <span className="truncate font-medium">{content.title}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={assign.isPending}
                  onClick={() => assign.mutate({ contentId: content.id, learnerId: id })}
                >
                  {t('assignAction')}
                </Button>
              </div>
            ))}
            {(contents ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">{t('assign.noStudents')}</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
