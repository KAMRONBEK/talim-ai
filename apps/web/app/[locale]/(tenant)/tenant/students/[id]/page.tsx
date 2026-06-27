'use client';

import { use } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Flame } from 'lucide-react';
import { Button } from '@talim/ui';
import { useAssignContent, useStudentProgress } from '@/hooks/useTenant';
import { useTenantContents } from '@/hooks/useTenantContent';
import { ActivityHeatmap, ProgressBar } from '@/components/tenant/activity-heatmap';

export default function TenantStudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations('tenant');
  const { data, isLoading } = useStudentProgress(id);
  const { data: contents } = useTenantContents();
  const assign = useAssignContent();

  if (isLoading || !data) {
    return <p className="text-muted-foreground">{t('loading')}</p>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Link
          href="/tenant/students"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('students.back')}
        </Link>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">{data.student.name ?? data.student.email}</h1>
        <p className="mt-1 text-muted-foreground">
          {t('students.streak', { days: data.streakDays })}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">{t('students.streak', { days: data.streakDays })}</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-secondary/15 text-accent-secondary">
              <Flame className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-4 font-display text-4xl font-bold tracking-tight tabular-nums">{data.streakDays}</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft md:col-span-2">
          <h2 className="font-display text-lg font-semibold">{t('students.activity')}</h2>
          <div className="mt-3">
            {data.activityDays.length > 0 ? (
              <ActivityHeatmap days={data.activityDays} />
            ) : (
              <p className="text-sm text-muted-foreground">{t('students.noActivity')}</p>
            )}
          </div>
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
                  <span className="font-display text-sm font-bold tabular-nums text-primary">{Math.round(row.overallCoverage)}%</span>
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
