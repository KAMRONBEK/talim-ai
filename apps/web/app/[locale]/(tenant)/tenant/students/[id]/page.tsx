'use client';

import { use } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
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
        <Link href="/tenant/students" className="text-sm text-muted-foreground hover:underline">
          {t('students.back')}
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{data.student.name ?? data.student.email}</h1>
        <p className="text-muted-foreground">
          {t('students.streak', { days: data.streakDays })}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">{t('students.streak', { days: data.streakDays })}</p>
          <p className="mt-1 text-3xl font-semibold">{data.streakDays}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 md:col-span-2">
          <h2 className="font-semibold">{t('students.activity')}</h2>
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
          <h2 className="font-semibold">{t('students.progress')}</h2>
          {data.contentProgress.length === 0 ? (
            <p className="text-muted-foreground">{t('students.noProgress')}</p>
          ) : (
            data.contentProgress.map((row) => (
              <div key={row.contentId} className="rounded-xl border bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{row.contentTitle}</p>
                  <span className="text-sm font-medium">{Math.round(row.overallCoverage)}%</span>
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
        <aside className="rounded-xl border bg-card p-4">
          <h2 className="font-semibold">Assign material</h2>
          <p className="mt-1 text-sm text-muted-foreground">Give this student access to a material.</p>
          <div className="mt-4 space-y-2">
            {(contents ?? []).map((content) => (
              <div key={content.id} className="flex items-center justify-between gap-2 rounded-lg border p-2 text-sm">
                <span className="truncate">{content.title}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={assign.isPending}
                  onClick={() => assign.mutate({ contentId: content.id, learnerId: id })}
                >
                  Assign
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
