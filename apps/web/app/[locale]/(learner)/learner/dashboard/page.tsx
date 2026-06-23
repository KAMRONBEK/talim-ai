'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/useAuthStore';
import { useContents } from '@/hooks/useContent';
import { useLearnerSummary } from '@/hooks/useTenant';
import { useLearnerAssessments } from '@/hooks/useAssessments';
import { Link } from '@/i18n/navigation';
import { Button } from '@talim/ui';
import { RecentContentGrid } from '@/components/dashboard/recent-content-grid';
import { StudentWelcomeBanner } from '@/components/learner/student-welcome-banner';

export default function LearnerDashboardPage() {
  const t = useTranslations('learner');
  const user = useAuthStore((s) => s.user);
  const { data: contents, isLoading } = useContents();
  const { data: summary } = useLearnerSummary();
  const { data: assessments } = useLearnerAssessments();

  const assigned = useMemo(() => contents ?? [], [contents]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <StudentWelcomeBanner />
      <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card p-8 text-center shadow-soft bg-girih">
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            {summary?.tenantName ?? user?.tenantName ?? 'Your school'}
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {t('welcome', { name: user?.name ?? user?.email ?? '' })}
          </h1>
          <p className="mt-2 text-muted-foreground">{t('dashboardDesc')}</p>
          {summary?.continueContent && (
            <div className="mx-auto mt-6 max-w-lg rounded-2xl border border-border/70 bg-background p-5 text-left shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Continue where you left off
              </p>
              <p className="mt-1 font-display text-lg font-semibold">{summary.continueContent.title}</p>
              <p className="text-sm text-muted-foreground">
                {Math.round(summary.continueContent.overallCoverage)}% complete
              </p>
              <Link
                href={`/content/${summary.continueContent.contentId}${
                  summary.continueContent.lastSectionId
                    ? `?section=${summary.continueContent.lastSectionId}`
                    : ''
                }`}
              >
                <Button variant="gradient" className="mt-4">Continue learning</Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-muted-foreground">Assigned</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-lg">📚</span>
          </div>
          <p className="mt-3 font-display text-4xl font-bold tabular-nums tracking-tight">
            {summary?.assignedCount ?? assigned.length}
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-muted-foreground">Streak</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-secondary/15 text-lg">🔥</span>
          </div>
          <p className="mt-3 font-display text-4xl font-bold tabular-nums tracking-tight">{summary?.streakDays ?? 0} days</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-muted-foreground">Avg quiz</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-success/10 text-lg">🎯</span>
          </div>
          <p className="mt-3 font-display text-4xl font-bold tabular-nums tracking-tight">
            {summary?.avgQuizScore != null ? `${Math.round(summary.avgQuizScore)}%` : '—'}
          </p>
        </div>
      </div>

      <div className="w-full">
        <h2 className="mb-4 font-display text-lg font-semibold">{t('assignedMaterials')}</h2>
        {isLoading ? (
          <p className="text-muted-foreground">{t('loading')}</p>
        ) : assigned.length === 0 ? (
          <div className="rounded-2xl border border-border/70 bg-card p-12 text-center shadow-soft">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-2xl">📚</div>
            <p className="mt-4 font-display font-semibold">{t('noAssigned')}</p>
            <p className="mt-1 text-sm text-muted-foreground">Your teacher will assign materials here.</p>
          </div>
        ) : (
          <RecentContentGrid contents={assigned} showDelete={false} />
        )}
      </div>

      {(assessments?.length ?? 0) > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Written tasks</h2>
            <Link href="/learner/assessments" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {assessments?.slice(0, 2).map((assessment) => (
              <Link
                key={assessment.id}
                href="/learner/assessments"
                className="hover-lift rounded-2xl border border-border/70 bg-card p-4 shadow-soft"
              >
                <p className="font-medium">{assessment.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {assessment.questions.length} questions · {assessment.attemptCount}/{assessment.maxAttempts} attempts
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
