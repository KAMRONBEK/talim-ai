'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useTenantProgress } from '@/hooks/useTenant';
function isRecentlyActive(lastActivityAt: string | null): boolean {
  if (!lastActivityAt) return false;
  const days = (Date.now() - new Date(lastActivityAt).getTime()) / (1000 * 60 * 60 * 24);
  return days <= 7;
}

export default function TenantProgressPage() {
  const t = useTranslations('tenant');
  const { data, isLoading } = useTenantProgress();

  if (isLoading || !data) return <p className="text-muted-foreground">{t('loading')}</p>;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{t('nav.progress')}</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">{t('nav.progress')}</h1>
        <p className="mt-1 text-muted-foreground">{t('progressDesc')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <p className="text-sm font-medium text-muted-foreground">{t('stats.students')}</p>
          <p className="mt-2 font-display text-3xl font-bold tracking-tight tabular-nums">{data.totals.activeStudents}</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <p className="text-sm font-medium text-muted-foreground">{t('stats.materials')}</p>
          <p className="mt-2 font-display text-3xl font-bold tracking-tight tabular-nums">{data.totals.materials}</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <p className="text-sm font-medium text-muted-foreground">{t('avgCoverage')}</p>
          <p className="mt-2 font-display text-3xl font-bold tracking-tight tabular-nums">{Math.round(data.totals.avgCoverage)}%</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <p className="text-sm font-medium text-muted-foreground">{t('students.avgQuiz')}</p>
          <p className="mt-2 font-display text-3xl font-bold tracking-tight tabular-nums">
            {data.totals.avgQuizScore != null ? `${Math.round(data.totals.avgQuizScore)}%` : '—'}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead className="border-b border-border/70 bg-muted/50">
            <tr className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 text-left">{t('students.name')}</th>
              <th className="px-4 py-3 text-left">{t('students.assigned')}</th>
              <th className="px-4 py-3 text-left">{t('students.lastActive')}</th>
              <th className="px-4 py-3 text-left">{t('students.avgQuiz')}</th>
              <th className="px-4 py-3 text-left">{t('progressActivity')}</th>
            </tr>
          </thead>
          <tbody>
            {data.students.map((student) => (
              <tr key={student.id} className="border-t border-border/60 transition-colors hover:bg-secondary/40">
                <td className="px-4 py-3">
                  <Link href={`/tenant/students/${student.id}`} className="font-medium text-foreground hover:text-primary hover:underline">
                    {student.name ?? student.email}
                  </Link>
                  <p className="text-xs text-muted-foreground">{student.email}</p>
                </td>
                <td className="px-4 py-3 tabular-nums">{student.assignedCount}</td>
                <td className="px-4 py-3 tabular-nums text-muted-foreground">
                  {student.lastActivityAt ? new Date(student.lastActivityAt).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3 font-medium tabular-nums">
                  {student.avgQuizScore != null ? `${Math.round(student.avgQuizScore)}%` : '—'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      isRecentlyActive(student.lastActivityAt)
                        ? 'inline-flex items-center rounded-full bg-success-muted px-2.5 py-0.5 text-xs font-semibold text-success'
                        : 'inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-muted-foreground'
                    }
                  >
                    {isRecentlyActive(student.lastActivityAt) ? t('activeThisWeek') : t('inactiveLabel')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
