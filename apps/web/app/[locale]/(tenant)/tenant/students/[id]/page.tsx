'use client';

import { use } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useStudentProgress } from '@/hooks/useTenant';

export default function TenantStudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations('tenant');
  const { data, isLoading } = useStudentProgress(id);

  if (isLoading || !data) {
    return <p className="text-muted-foreground">{t('loading')}</p>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link href="/tenant/students" className="text-sm text-muted-foreground hover:underline">
          {t('students.back')}
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{data.student.name ?? data.student.email}</h1>
        <p className="text-muted-foreground">
          {t('students.streak', { days: data.streakDays })}
        </p>
      </div>

      <div className="rounded-xl border p-4">
        <h2 className="font-semibold">{t('students.activity')}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {data.activityDays.length > 0
            ? data.activityDays.slice(0, 14).join(', ')
            : t('students.noActivity')}
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold">{t('students.progress')}</h2>
        {data.contentProgress.length === 0 ? (
          <p className="text-muted-foreground">{t('students.noProgress')}</p>
        ) : (
          data.contentProgress.map((row) => (
            <div key={row.contentId} className="rounded-xl border p-4">
              <p className="font-medium">{row.contentTitle}</p>
              <p className="text-sm text-muted-foreground">
                {t('students.coverage', { value: Math.round(row.overallCoverage) })}
                {' · '}
                {t('students.quizAttempts', { count: row.quizAttempts })}
                {row.avgQuizScore != null &&
                  ` · ${t('students.avgQuizValue', { value: Math.round(row.avgQuizScore) })}`}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
