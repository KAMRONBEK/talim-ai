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
        <h1 className="text-2xl font-bold">{t('nav.progress')}</h1>
        <p className="text-muted-foreground">Track learning activity across your organization.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">{t('stats.students')}</p>
          <p className="text-2xl font-semibold">{data.totals.activeStudents}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">{t('stats.materials')}</p>
          <p className="text-2xl font-semibold">{data.totals.materials}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Avg coverage</p>
          <p className="text-2xl font-semibold">{Math.round(data.totals.avgCoverage)}%</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">{t('students.avgQuiz')}</p>
          <p className="text-2xl font-semibold">
            {data.totals.avgQuizScore != null ? `${Math.round(data.totals.avgQuizScore)}%` : '—'}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left">{t('students.name')}</th>
              <th className="px-4 py-3 text-left">{t('students.assigned')}</th>
              <th className="px-4 py-3 text-left">{t('students.lastActive')}</th>
              <th className="px-4 py-3 text-left">{t('students.avgQuiz')}</th>
              <th className="px-4 py-3 text-left">Activity</th>
            </tr>
          </thead>
          <tbody>
            {data.students.map((student) => (
              <tr key={student.id} className="border-t">
                <td className="px-4 py-3">
                  <Link href={`/tenant/students/${student.id}`} className="font-medium hover:underline">
                    {student.name ?? student.email}
                  </Link>
                  <p className="text-xs text-muted-foreground">{student.email}</p>
                </td>
                <td className="px-4 py-3">{student.assignedCount}</td>
                <td className="px-4 py-3">
                  {student.lastActivityAt ? new Date(student.lastActivityAt).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3">
                  {student.avgQuizScore != null ? `${Math.round(student.avgQuizScore)}%` : '—'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      isRecentlyActive(student.lastActivityAt)
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    }
                  >
                    {isRecentlyActive(student.lastActivityAt) ? 'Active this week' : 'Inactive'}
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
