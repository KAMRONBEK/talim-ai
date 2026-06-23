'use client';

import { useContents } from '@/hooks/useContent';
import { useLearnerSummary } from '@/hooks/useTenant';
import { ProgressBar } from '@/components/tenant/activity-heatmap';

export default function LearnerProgressPage() {
  const { data: summary } = useLearnerSummary();
  const { data: contents = [] } = useContents();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Progress</p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight">My progress</h1>
        <p className="mt-1 text-muted-foreground">Your activity and assigned materials.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-muted-foreground">Assigned materials</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-lg">📚</span>
          </div>
          <p className="mt-3 font-display text-4xl font-bold tabular-nums tracking-tight">{summary?.assignedCount ?? contents.length}</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-muted-foreground">Learning streak</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-secondary/15 text-lg">🔥</span>
          </div>
          <p className="mt-3 font-display text-4xl font-bold tabular-nums tracking-tight">{summary?.streakDays ?? 0} days</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-muted-foreground">Average quiz</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-success/10 text-lg">🎯</span>
          </div>
          <p className="mt-3 font-display text-4xl font-bold tabular-nums tracking-tight">
            {summary?.avgQuizScore != null ? `${Math.round(summary.avgQuizScore)}%` : '—'}
          </p>
        </div>
      </div>
      <div className="space-y-3">
        {summary?.continueContent && (
          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
            <div className="flex justify-between gap-3">
              <p className="font-medium">{summary.continueContent.title}</p>
              <span className="font-display text-sm font-semibold tabular-nums">{Math.round(summary.continueContent.overallCoverage)}%</span>
            </div>
            <div className="mt-3">
              <ProgressBar value={summary.continueContent.overallCoverage} />
            </div>
          </div>
        )}
        {!summary?.continueContent && (
          <div className="rounded-2xl border border-border/70 bg-card p-12 text-center shadow-soft">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-2xl">📈</div>
            <p className="mt-4 text-muted-foreground">
              Open an assigned material to start tracking progress.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
