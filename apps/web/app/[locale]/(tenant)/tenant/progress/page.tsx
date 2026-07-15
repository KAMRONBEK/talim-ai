'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { AlertTriangle, BarChart3, Layers, Trophy } from 'lucide-react';
import { useTenantProgress, useTenantProgressTopics } from '@/hooks/useTenant';
import { isRecentlyActive, masteryTone } from '@/lib/mastery-tone';
import type { ClassMastery } from '@talim/types';

export default function TenantProgressPage() {
  const t = useTranslations('tenant');
  const tc = useTranslations('common');
  const { data, isLoading, isError } = useTenantProgress();
  // New query: the same ClassMastery, fetched independently. Falls back to the summary's
  // embedded copy so the topic/distribution panels render even while this query resolves.
  const { data: topics } = useTenantProgressTopics();

  if (isError) return <p className="text-sm text-destructive">{tc('loadError')}</p>;
  if (isLoading || !data) return <p className="text-muted-foreground">{t('loading')}</p>;

  const classMastery: ClassMastery = topics ?? data.classMastery;
  const byTopic = classMastery?.byTopic ?? [];
  const dist = classMastery?.distribution ?? { lt50: 0, b50_69: 0, b70_84: 0, gte85: 0 };
  const distTotal = dist.lt50 + dist.b50_69 + dist.b70_84 + dist.gte85;

  const distBuckets = [
    { key: 'gte85', label: t('distGte85'), count: dist.gte85, bar: 'bg-primary', dot: 'bg-primary' },
    { key: 'b70_84', label: t('distB70'), count: dist.b70_84, bar: 'bg-primary/55', dot: 'bg-primary/55' },
    {
      key: 'b50_69',
      label: t('distB50'),
      count: dist.b50_69,
      bar: 'bg-accent-secondary',
      dot: 'bg-accent-secondary',
    },
    { key: 'lt50', label: t('distLt50'), count: dist.lt50, bar: 'bg-destructive', dot: 'bg-destructive' },
  ];

  const topOfClass = data.students
    .filter((s) => s.mastery != null)
    .sort((a, b) => (b.mastery ?? 0) - (a.mastery ?? 0))
    .slice(0, 5);

  const atRisk = data.totals.atRisk;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">{t('nav.progress')}</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">{t('nav.progress')}</h1>
          <p className="mt-1 text-muted-foreground">{t('progressDesc')}</p>
        </div>
        <span
          className={
            atRisk > 0
              ? 'inline-flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 px-3.5 py-1.5 font-label text-[11px] font-semibold uppercase tracking-[0.08em] text-destructive'
              : 'inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted px-3.5 py-1.5 font-label text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground'
          }
        >
          <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
          {t('atRisk')}
          <span className="tabular-nums">{atRisk}</span>
        </span>
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

      {/* Class mastery: topic bars + score distribution (design "Tutor enriched"). */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" aria-hidden />
            <h2 className="font-display text-lg font-semibold tracking-tight">{t('masteryByTopic')}</h2>
          </div>
          {byTopic.length === 0 ? (
            <p className="rounded-xl bg-muted/50 px-4 py-8 text-center text-sm text-muted-foreground">
              {t('masteryByTopicEmpty')}
            </p>
          ) : (
            <div className="flex flex-col gap-3.5">
              {byTopic.map((topic) => {
                const value = Math.round(Math.max(0, Math.min(100, topic.coverage)));
                const tone = masteryTone(topic.coverage);
                return (
                  <div key={topic.sectionId}>
                    <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                      <span className="truncate text-foreground">{topic.title}</span>
                      <span className={`shrink-0 font-semibold tabular-nums ${tone.text}`}>{value}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${value}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" aria-hidden />
            <h2 className="font-display text-lg font-semibold tracking-tight">{t('distribution')}</h2>
          </div>
          {distTotal === 0 ? (
            <p className="rounded-xl bg-muted/50 px-4 py-8 text-center text-sm text-muted-foreground">
              {t('distributionEmpty')}
            </p>
          ) : (
            <>
              <div className="flex h-3 overflow-hidden rounded-full bg-muted">
                {distBuckets.map((bucket) =>
                  bucket.count > 0 ? (
                    <div
                      key={bucket.key}
                      className={`h-full ${bucket.bar}`}
                      style={{ width: `${(bucket.count / distTotal) * 100}%` }}
                      title={`${bucket.label} · ${bucket.count}`}
                    />
                  ) : null,
                )}
              </div>
              <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5">
                {distBuckets.map((bucket) => (
                  <li key={bucket.key} className="flex items-center gap-2 text-sm">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${bucket.dot}`} aria-hidden />
                    <span className="text-muted-foreground">{bucket.label}</span>
                    <span className="ml-auto font-semibold tabular-nums text-foreground">{bucket.count}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      {/* Top of the class — students ranked by mastery. */}
      <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
        <div className="mb-4 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" aria-hidden />
          <h2 className="font-display text-lg font-semibold tracking-tight">{t('topOfClass')}</h2>
        </div>
        {topOfClass.length === 0 ? (
          <p className="rounded-xl bg-muted/50 px-4 py-8 text-center text-sm text-muted-foreground">
            {t('topOfClassEmpty')}
          </p>
        ) : (
          <ol className="flex flex-col gap-2">
            {topOfClass.map((student, index) => {
              const tone = masteryTone(student.mastery);
              return (
                <li
                  key={student.id}
                  className="flex items-center gap-3 rounded-xl border border-border/50 bg-secondary/20 px-3 py-2.5"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-semibold tabular-nums text-primary">
                    {index + 1}
                  </span>
                  <Link
                    href={`/tenant/students/${student.id}`}
                    className="min-w-0 flex-1 truncate font-medium text-foreground hover:text-primary hover:underline"
                  >
                    {student.name ?? student.email}
                  </Link>
                  <span className={`shrink-0 font-display text-sm font-semibold tabular-nums ${tone.text}`}>
                    {student.mastery != null ? `${Math.round(student.mastery)}%` : '—'}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead className="border-b border-border/70 bg-muted/50">
            <tr className="font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <th className="px-4 py-3 text-left">{t('students.name')}</th>
              <th className="px-4 py-3 text-left">{t('students.mastery')}</th>
              <th className="px-4 py-3 text-left">{t('students.assigned')}</th>
              <th className="px-4 py-3 text-left">{t('students.lastActive')}</th>
              <th className="px-4 py-3 text-left">{t('students.avgQuiz')}</th>
              <th className="px-4 py-3 text-left">{t('progressActivity')}</th>
            </tr>
          </thead>
          <tbody>
            {data.students.map((student) => {
              const tone = masteryTone(student.mastery);
              return (
                <tr key={student.id} className="border-t border-border/60 transition-colors hover:bg-secondary/40">
                  <td className="px-4 py-3">
                    <Link href={`/tenant/students/${student.id}`} className="font-medium text-foreground hover:text-primary hover:underline">
                      {student.name ?? student.email}
                    </Link>
                    <p className="text-xs text-muted-foreground">{student.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${tone.bar}`}
                          style={{ width: `${student.mastery != null ? Math.max(0, Math.min(100, student.mastery)) : 0}%` }}
                        />
                      </div>
                      <span className={`font-medium tabular-nums ${tone.text}`}>
                        {student.mastery != null ? `${Math.round(student.mastery)}%` : '—'}
                      </span>
                    </div>
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
                          ? 'inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 font-label text-[11px] font-semibold uppercase tracking-[0.08em] text-primary'
                          : 'inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 font-label text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground'
                      }
                    >
                      {isRecentlyActive(student.lastActivityAt) ? t('activeThisWeek') : t('inactiveLabel')}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
