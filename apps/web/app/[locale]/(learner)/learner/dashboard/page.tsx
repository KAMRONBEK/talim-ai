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
      <div className="rounded-3xl border bg-card p-6 text-center shadow-sm">
        <p className="text-sm font-medium text-primary">
          {summary?.tenantName ?? user?.tenantName ?? 'Your school'}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          {t('welcome', { name: user?.name ?? user?.email ?? '' })}
        </h1>
        <p className="mt-2 text-muted-foreground">{t('dashboardDesc')}</p>
        {summary?.continueContent && (
          <div className="mx-auto mt-5 max-w-lg rounded-2xl border bg-background p-4 text-left">
            <p className="text-sm text-muted-foreground">Continue where you left off</p>
            <p className="font-semibold">{summary.continueContent.title}</p>
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
              <Button className="mt-3">Continue learning</Button>
            </Link>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Assigned</p>
          <p className="text-2xl font-semibold">{summary?.assignedCount ?? assigned.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Streak</p>
          <p className="text-2xl font-semibold">{summary?.streakDays ?? 0} days</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Avg quiz</p>
          <p className="text-2xl font-semibold">
            {summary?.avgQuizScore != null ? `${Math.round(summary.avgQuizScore)}%` : '—'}
          </p>
        </div>
      </div>

      <div className="w-full">
        <h2 className="mb-4 text-lg font-semibold">{t('assignedMaterials')}</h2>
        {isLoading ? (
          <p className="text-muted-foreground">{t('loading')}</p>
        ) : assigned.length === 0 ? (
          <div className="rounded-2xl border bg-card p-10 text-center">
            <p className="text-4xl font-bold text-primary">T</p>
            <p className="mt-3 font-medium">{t('noAssigned')}</p>
            <p className="text-sm text-muted-foreground">Your teacher will assign materials here.</p>
          </div>
        ) : (
          <RecentContentGrid contents={assigned} showDelete={false} />
        )}
      </div>

      {(assessments?.length ?? 0) > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Written tasks</h2>
            <Link href="/learner/assessments" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {assessments?.slice(0, 2).map((assessment) => (
              <Link
                key={assessment.id}
                href="/learner/assessments"
                className="rounded-xl border bg-card p-4 hover:bg-secondary/40"
              >
                <p className="font-medium">{assessment.title}</p>
                <p className="text-sm text-muted-foreground">
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
