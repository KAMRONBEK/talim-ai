'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { BookOpen, Flame, Target } from 'lucide-react';
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

      {/* Pine-gradient welcome hero — theme-independent pine, cream text + faint girih. */}
      <div className="relative overflow-hidden rounded-3xl bg-primary p-8 text-primary-foreground shadow-soft">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-transparent to-black/20"
        />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-girih opacity-[0.18] invert" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="font-label text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground/70">
              {summary?.tenantName ?? user?.tenantName ?? t('schoolFallback')}
            </p>
            <h1 className="mt-3 font-display text-3xl font-bold italic tracking-tight sm:text-4xl">
              {t('welcome', { name: user?.name ?? user?.email ?? '' })}
            </h1>
            <p className="mt-2 not-italic text-primary-foreground/80">{t('dashboardDesc')}</p>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-white/12 px-4 py-3 backdrop-blur-sm">
            <Flame className="h-6 w-6 shrink-0 text-accent-secondary" />
            <div>
              <p className="font-display text-2xl font-bold leading-none tabular-nums">
                {t('streakDays', { count: summary?.streakDays ?? 0 })}
              </p>
              <p className="mt-1 font-label text-[0.65rem] uppercase tracking-wide text-primary-foreground/70">
                {t('statStreak')}
              </p>
            </div>
          </div>
        </div>
        {summary?.continueContent && (
          <div className="relative mt-6 max-w-lg rounded-2xl border border-white/15 bg-white/10 p-5 text-left backdrop-blur-sm">
            <p className="font-label text-xs font-medium uppercase tracking-wide text-primary-foreground/70">
              {t('continueTitle')}
            </p>
            <p className="mt-1 font-display text-lg font-semibold">{summary.continueContent.title}</p>
            <p className="text-sm text-primary-foreground/70">
              {t('percentComplete', { percent: Math.round(summary.continueContent.overallCoverage) })}
            </p>
            <Link
              href={`/content/${summary.continueContent.contentId}${
                summary.continueContent.lastSectionId
                  ? `?section=${summary.continueContent.lastSectionId}`
                  : ''
              }`}
            >
              <Button variant="gradient" className="mt-4">{t('continueLearning')}</Button>
            </Link>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <div className="flex items-start justify-between">
            <p className="font-label text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('statAssigned')}
            </p>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <BookOpen className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 font-display text-4xl font-bold tabular-nums tracking-tight">
            {summary?.assignedCount ?? assigned.length}
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <div className="flex items-start justify-between">
            <p className="font-label text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('statAvgQuiz')}
            </p>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-success/10 text-success">
              <Target className="h-5 w-5" />
            </span>
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
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <BookOpen className="h-7 w-7" />
            </div>
            <p className="mt-4 font-display font-semibold">{t('noAssigned')}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t('noAssignedDesc')}</p>
          </div>
        ) : (
          <RecentContentGrid contents={assigned} showDelete={false} />
        )}
      </div>

      {(assessments?.length ?? 0) > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">{t('tasksTitle')}</h2>
            <Link href="/learner/assessments" className="text-sm font-medium text-primary hover:underline">
              {t('viewAll')}
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {assessments?.slice(0, 2).map((assessment) => (
              <Link
                key={assessment.id}
                href="/learner/assessments"
                className="hover-lift rounded-2xl border border-border/70 border-l-4 border-l-primary bg-card p-4 shadow-soft"
              >
                <p className="font-display font-semibold">{assessment.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('taskMeta', {
                    count: assessment.questions.length,
                    used: assessment.attemptCount,
                    max: assessment.maxAttempts,
                  })}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
