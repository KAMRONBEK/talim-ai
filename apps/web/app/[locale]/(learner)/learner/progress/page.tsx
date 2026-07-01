'use client';

import { useTranslations } from 'next-intl';
import { Flame, GraduationCap, School, TrendingUp } from 'lucide-react';
import { useContents } from '@/hooks/useContent';
import { useLearnerSummary } from '@/hooks/useTenant';
import { ProgressBar } from '@/components/tenant/activity-heatmap';

export default function LearnerProgressPage() {
  const t = useTranslations('learner');
  const tp = useTranslations('learner.progress');
  const { data: summary } = useLearnerSummary();
  const { data: contents = [] } = useContents();

  const mastery = summary?.avgQuizScore != null ? Math.round(summary.avgQuizScore) : null;
  const ringCirc = 2 * Math.PI * 52;
  const ringDash = mastery != null ? (Math.max(0, Math.min(100, mastery)) / 100) * ringCirc : 0;
  const ringLow = mastery != null && mastery < 50;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="font-label text-xs font-medium uppercase tracking-[0.2em] text-primary">{tp('eyebrow')}</p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight">{tp('title')}</h1>
        <p className="mt-1 text-muted-foreground">{tp('desc')}</p>
      </div>

      {/* Your class — identity card mirroring the design's sidebar chip. */}
      <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-soft">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <School className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="font-label text-xs font-medium uppercase tracking-wide text-primary/80">
            {tp('yourClass')}
          </p>
          <p className="mt-0.5 truncate font-display font-semibold">
            {summary?.tenantName ?? t('schoolFallback')}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {/* Overall mastery ring */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border/70 bg-card p-5 text-center shadow-soft">
          <div className="relative h-28 w-28">
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
              <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--border))" strokeWidth="10" />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke={ringLow ? 'hsl(var(--accent-secondary))' : 'hsl(var(--primary))'}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={ringCirc}
                strokeDashoffset={ringCirc - ringDash}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-display text-3xl font-bold tabular-nums">
                {mastery != null ? `${mastery}%` : '—'}
              </span>
            </div>
          </div>
          <p className="mt-3 font-label text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {tp('overallMastery')}
          </p>
        </div>

        {/* Learning streak */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border/70 bg-card p-5 text-center shadow-soft">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-secondary/15 text-accent-secondary">
            <Flame className="h-6 w-6" />
          </span>
          <p className="mt-3 font-display text-4xl font-bold tabular-nums tracking-tight">
            {summary?.streakDays ?? 0}
          </p>
          <p className="mt-1 font-label text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t('statStreak')}
          </p>
        </div>

        {/* Assigned materials */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border/70 bg-card p-5 text-center shadow-soft">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <GraduationCap className="h-6 w-6" />
          </span>
          <p className="mt-3 font-display text-4xl font-bold tabular-nums tracking-tight">
            {summary?.assignedCount ?? contents.length}
          </p>
          <p className="mt-1 font-label text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t('assignedMaterials')}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {summary?.continueContent && (
          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
            <div className="flex justify-between gap-3">
              <p className="font-display font-semibold">{summary.continueContent.title}</p>
              <span className="font-display text-sm font-semibold tabular-nums">
                {Math.round(summary.continueContent.overallCoverage)}%
              </span>
            </div>
            <div className="mt-3">
              <ProgressBar value={summary.continueContent.overallCoverage} />
            </div>
          </div>
        )}
        {!summary?.continueContent && (
          <div className="rounded-2xl border border-border/70 bg-card p-12 text-center shadow-soft">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <TrendingUp className="h-7 w-7" />
            </div>
            <p className="mt-4 text-muted-foreground">{tp('emptyDesc')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
