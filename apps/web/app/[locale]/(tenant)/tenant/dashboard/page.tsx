'use client';

import { useMemo } from 'react';
import { Link } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpen,
  ClipboardCheck,
  Gamepad2,
  Layers,
  MessageSquare,
  TrendingUp,
  Trophy,
  Users,
  UserX,
} from 'lucide-react';
import { Button } from '@talim/ui';
import type { AppLocale, TenantAssessment } from '@talim/types';
import { useAuthStore } from '@/store/useAuthStore';
import { useTenantContents } from '@/hooks/useTenantContent';
import { useTenantMessages, useTenantProgress, useTenantUnreadCount } from '@/hooks/useTenant';
import { useAssessmentResultsMany, useTenantAssessments } from '@/hooks/useAssessments';
import { useTenantSearch } from '@/contexts/tenant-shell';
import { RecentContentGrid } from '@/components/dashboard/recent-content-grid';
import { StatCard } from '@/components/dashboard/stat-card';
import { OnboardingChecklist } from '@/components/tenant/onboarding-checklist';
import { formatRelativeTime } from '@/lib/format-relative-time';
import { isRecentlyActive, masteryTone } from '@/lib/mastery-tone';

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Layers;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" aria-hidden />
        <h3 className="font-display text-base font-semibold tracking-tight">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function EmptyNote({ text }: { text: string }) {
  return (
    <p className="rounded-xl bg-muted/50 px-4 py-6 text-center text-sm text-muted-foreground">
      {text}
    </p>
  );
}

export default function TenantDashboardPage() {
  const t = useTranslations('tenant');
  const locale = useLocale() as AppLocale;
  const user = useAuthStore((s) => s.user);
  const { data: contents, isLoading } = useTenantContents();
  const { data: progress } = useTenantProgress();
  const { data: assessments } = useTenantAssessments();
  const { data: threads } = useTenantMessages();
  const { data: unreadReplies = 0 } = useTenantUnreadCount();
  const { search } = useTenantSearch();

  const students = progress?.students;

  const filtered = useMemo(() => {
    if (!contents) return [];
    const q = search.toLowerCase().trim();
    if (!q) return contents;
    return contents.filter((c) => c.title.toLowerCase().includes(q));
  }, [contents, search]);
  const failedMaterials = contents?.filter((c) => c.status === 'FAILED') ?? [];
  const inactiveStudents = students?.filter((s) => !s.active) ?? [];

  const readyMaterials = contents?.filter((c) => c.status === 'READY').length ?? 0;
  const activeStudents = progress?.totals.activeStudents ?? 0;
  const atRisk = progress?.totals.atRisk ?? 0;

  // Class mastery = mean of active students' per-student mastery (the same figure the
  // roster shows), not totals.avgCoverage, which also counts the owner's own reading.
  const masteredStudents = (students ?? []).filter((s) => s.active && s.mastery != null);
  const avgMastery = masteredStudents.length
    ? Math.round(
        masteredStudents.reduce((sum, s) => sum + (s.mastery ?? 0), 0) / masteredStudents.length,
      )
    : null;

  const activeThisWeek = (students ?? []).filter(
    (s) => s.active && isRecentlyActive(s.lastActivityAt),
  ).length;

  const liveCount = assessments?.filter((a) => a.isLive).length ?? 0;
  const scheduledCount =
    assessments?.filter(
      (a) => !a.isLive && a.scheduledAt != null && new Date(a.scheduledAt).getTime() > Date.now(),
    ).length ?? 0;
  const draftCount = assessments?.filter((a) => a.status === 'DRAFT').length ?? 0;
  const assessmentsHint =
    [
      liveCount > 0 ? t('dashboard.liveCount', { count: liveCount }) : null,
      scheduledCount > 0 ? t('dashboard.scheduledCount', { count: scheduledCount }) : null,
      draftCount > 0 ? t('dashboard.draftCount', { count: draftCount }) : null,
    ]
      .filter(Boolean)
      .join(' · ') || undefined;

  // Assessment pulse: live sessions first, then upcoming scheduled, then newest.
  const pulse = useMemo(() => {
    const now = Date.now();
    const rank = (a: TenantAssessment) =>
      a.isLive ? 0 : a.scheduledAt && new Date(a.scheduledAt).getTime() > now ? 1 : 2;
    return (assessments ?? [])
      .filter((a) => a.status === 'PUBLISHED')
      .sort(
        (x, y) =>
          rank(x) - rank(y) || new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime(),
      )
      .slice(0, 4);
  }, [assessments]);
  const pulseResults = useAssessmentResultsMany(pulse.map((a) => a.id));
  const resultsById = new Map(
    pulseResults.flatMap((q) => (q.data ? [[q.data.assessmentId, q.data] as const] : [])),
  );

  // Weakest topics: classMastery.byTopic is sorted by coverage desc, so the tail holds
  // the topics the class struggles with most.
  const weakestTopics = (progress?.classMastery.byTopic ?? [])
    .filter((topic) => topic.coverage < 70)
    .slice(-4)
    .reverse();

  const dist = progress?.classMastery.distribution ?? { lt50: 0, b50_69: 0, b70_84: 0, gte85: 0 };
  const distTotal = dist.lt50 + dist.b50_69 + dist.b70_84 + dist.gte85;
  const distBuckets = [
    { key: 'gte85', label: t('distGte85'), count: dist.gte85, bar: 'bg-primary' },
    { key: 'b70_84', label: t('distB70'), count: dist.b70_84, bar: 'bg-primary/55' },
    { key: 'b50_69', label: t('distB50'), count: dist.b50_69, bar: 'bg-accent-secondary' },
    { key: 'lt50', label: t('distLt50'), count: dist.lt50, bar: 'bg-destructive' },
  ];

  const topOfClass = (students ?? [])
    .filter((s) => s.active && s.mastery != null)
    .sort((a, b) => (b.mastery ?? 0) - (a.mastery ?? 0))
    .slice(0, 3);

  const recentlyActiveStudents = (students ?? [])
    .filter((s) => s.active && s.lastActivityAt != null)
    .sort(
      (a, b) => new Date(b.lastActivityAt!).getTime() - new Date(a.lastActivityAt!).getTime(),
    )
    .slice(0, 5);

  const recentThreads = (threads ?? []).slice(0, 3);
  const hasClassData = (students?.length ?? 0) > 0;

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
          hint={t('dashboard.readyHint', { count: readyMaterials })}
        />
        <StatCard
          href="/tenant/students"
          label={t('stats.students')}
          value={activeStudents}
          icon={Users}
          tone="clay"
          hint={t('dashboard.totalHint', { count: students?.length ?? 0 })}
        />
        <StatCard
          href="/tenant/progress"
          label={t('stats.avgMastery')}
          value={avgMastery == null ? '—' : `${avgMastery}%`}
          icon={TrendingUp}
          tone="pine"
          hint={t('dashboard.avgMasteryHint')}
          valueClassName={avgMastery == null ? undefined : 'text-primary'}
        />
        <StatCard
          href="/tenant/progress"
          label={t('atRisk')}
          value={atRisk}
          icon={AlertTriangle}
          tone="warning"
          hint={t('dashboard.atRiskHint')}
          valueClassName={atRisk > 0 ? 'text-destructive' : undefined}
        />
        <StatCard
          href="/tenant/assessments"
          label={t('stats.assessments')}
          value={assessments?.length ?? 0}
          icon={ClipboardCheck}
          tone="pine"
          hint={assessmentsHint}
        />
        <StatCard
          href="/tenant/progress"
          label={t('activeThisWeek')}
          value={activeThisWeek}
          icon={Activity}
          tone="success"
          hint={t('dashboard.activeWeekHint', { count: activeStudents })}
        />
      </div>

      <OnboardingChecklist
        contents={contents}
        students={students}
        hasAssessments={(assessments?.length ?? 0) > 0}
      />

      {(failedMaterials.length > 0 || inactiveStudents.length > 0 || atRisk > 0) && (
        <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <h2 className="font-display text-lg font-semibold">{t('needsAttention')}</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
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
            {atRisk > 0 && (
              <Link
                href="/tenant/progress"
                className="flex items-center gap-3 rounded-xl border border-warning/40 bg-warning/5 p-4 text-sm transition-colors hover:bg-warning/10"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning">
                  <TrendingUp className="h-[18px] w-[18px]" />
                </span>
                <span className="font-medium">{t('dashboard.atRiskStudents', { count: atRisk })}</span>
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

      {hasClassData && (
        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold">{t('dashboard.classSnapshot')}</h2>
            <Link href="/tenant/progress" className="text-sm font-medium text-primary hover:underline">
              {t('nav.progress')}
            </Link>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <SectionCard icon={BarChart3} title={t('distribution')}>
              {distTotal === 0 ? (
                <EmptyNote text={t('distributionEmpty')} />
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
                  <ul className="mt-4 flex flex-col gap-2">
                    {distBuckets.map((bucket) => (
                      <li key={bucket.key} className="flex items-center gap-2 text-sm">
                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${bucket.bar}`} aria-hidden />
                        <span className="text-muted-foreground">{bucket.label}</span>
                        <span className="ml-auto font-semibold tabular-nums text-foreground">{bucket.count}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </SectionCard>

            <SectionCard icon={Layers} title={t('dashboard.focusTopics')}>
              {weakestTopics.length === 0 ? (
                <EmptyNote text={t('masteryByTopicEmpty')} />
              ) : (
                <div className="flex flex-col gap-3.5">
                  {weakestTopics.map((topic) => {
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
            </SectionCard>

            <SectionCard icon={Trophy} title={t('topOfClass')}>
              {topOfClass.length === 0 ? (
                <EmptyNote text={t('topOfClassEmpty')} />
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
                          {student.name ?? student.username ?? student.email}
                        </Link>
                        <span className={`shrink-0 font-display text-sm font-semibold tabular-nums ${tone.text}`}>
                          {student.mastery != null ? `${Math.round(student.mastery)}%` : '—'}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </SectionCard>
          </div>
        </section>
      )}

      {(hasClassData || pulse.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard icon={Gamepad2} title={t('dashboard.assessmentPulse')}>
            {pulse.length === 0 ? (
              <EmptyNote text={t('dashboard.noAssessments')} />
            ) : (
              <div className="flex flex-col gap-2">
                {pulse.map((assessment) => {
                  const results = resultsById.get(assessment.id);
                  const submitted = results?.learners.filter((l) => l.submitted).length ?? null;
                  const upcoming =
                    !assessment.isLive &&
                    assessment.scheduledAt != null &&
                    new Date(assessment.scheduledAt).getTime() > Date.now();
                  return (
                    <Link
                      key={assessment.id}
                      href="/tenant/assessments"
                      className="rounded-xl border border-border/50 bg-secondary/20 px-3 py-2.5 transition-colors hover:bg-secondary/50"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="min-w-0 truncate font-medium text-foreground">{assessment.title}</p>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 font-label text-[10px] font-bold uppercase tracking-wide ${
                            assessment.mode === 'GAME'
                              ? 'bg-accent-secondary/15 text-accent-secondary'
                              : 'bg-primary/10 text-primary'
                          }`}
                        >
                          {assessment.mode === 'GAME' ? t('assessments.modeGame') : t('assessments.modeWritten')}
                        </span>
                      </div>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                        {assessment.isLive && (
                          <span className="font-semibold text-accent-secondary">{t('assessments.live.liveNow')}</span>
                        )}
                        {upcoming && assessment.scheduledAt && (
                          <span>
                            {t('assessments.live.scheduledFor', {
                              time: formatRelativeTime(assessment.scheduledAt, locale),
                            })}
                          </span>
                        )}
                        <span>{t('dashboard.questionsShort', { count: assessment.questionCount })}</span>
                        {submitted != null && results != null && (
                          <span className="font-medium text-foreground">
                            {t('dashboard.submittedShort', {
                              submitted,
                              total: results.learners.length,
                            })}
                          </span>
                        )}
                      </p>
                    </Link>
                  );
                })}
              </div>
          )}
        </SectionCard>

        <SectionCard icon={Activity} title={t('dashboard.recentActivity')}>
          {recentlyActiveStudents.length === 0 ? (
            <EmptyNote text={t('dashboard.noRecentActivity')} />
          ) : (
            <ul className="flex flex-col gap-2">
              {recentlyActiveStudents.map((student) => {
                const tone = masteryTone(student.mastery);
                return (
                  <li
                    key={student.id}
                    className="flex items-center gap-3 rounded-xl border border-border/50 bg-secondary/20 px-3 py-2.5"
                  >
                    <Link
                      href={`/tenant/students/${student.id}`}
                      className="min-w-0 flex-1 truncate font-medium text-foreground hover:text-primary hover:underline"
                    >
                      {student.name ?? student.username ?? student.email}
                    </Link>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatRelativeTime(student.lastActivityAt!, locale)}
                    </span>
                    <span className={`w-10 shrink-0 text-right font-display text-sm font-semibold tabular-nums ${tone.text}`}>
                      {student.mastery != null ? `${Math.round(student.mastery)}%` : '—'}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>
      </div>
      )}

      {recentThreads.length > 0 && (
        <SectionCard icon={MessageSquare} title={t('messages.title')}>
          <div className="flex flex-col gap-2">
            {recentThreads.map((thread) => (
              <div
                key={thread.id}
                className="rounded-xl border border-border/50 bg-secondary/20 px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="min-w-0 truncate text-sm text-foreground">{thread.body}</p>
                  {thread.unreadReplyCount > 0 && (
                    <span className="shrink-0 rounded-full bg-accent-secondary px-2 py-0.5 font-label text-[10px] font-bold uppercase tracking-wide text-accent-secondary-foreground">
                      {thread.unreadReplyCount} {t('messages.new')}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatRelativeTime(thread.createdAt, locale)} ·{' '}
                  {t('messages.readStat', { count: thread.readCount })} ·{' '}
                  {t('messages.replies', { count: thread.replyCount })}
                </p>
              </div>
            ))}
            {unreadReplies > 0 && (
              <p className="text-xs text-muted-foreground">{t('dashboard.messagesHint')}</p>
            )}
          </div>
        </SectionCard>
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
