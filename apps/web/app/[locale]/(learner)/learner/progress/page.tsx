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
        <h1 className="text-2xl font-bold">My progress</h1>
        <p className="text-muted-foreground">Your activity and assigned materials.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Assigned materials</p>
          <p className="text-2xl font-semibold">{summary?.assignedCount ?? contents.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Learning streak</p>
          <p className="text-2xl font-semibold">{summary?.streakDays ?? 0} days</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Average quiz</p>
          <p className="text-2xl font-semibold">
            {summary?.avgQuizScore != null ? `${Math.round(summary.avgQuizScore)}%` : '—'}
          </p>
        </div>
      </div>
      <div className="space-y-3">
        {summary?.continueContent && (
          <div className="rounded-xl border bg-card p-4">
            <div className="flex justify-between gap-3">
              <p className="font-medium">{summary.continueContent.title}</p>
              <span className="text-sm">{Math.round(summary.continueContent.overallCoverage)}%</span>
            </div>
            <div className="mt-3">
              <ProgressBar value={summary.continueContent.overallCoverage} />
            </div>
          </div>
        )}
        {!summary?.continueContent && (
          <p className="rounded-xl border bg-card p-6 text-center text-muted-foreground">
            Open an assigned material to start tracking progress.
          </p>
        )}
      </div>
    </div>
  );
}
