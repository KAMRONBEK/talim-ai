'use client';

import { useTranslations } from 'next-intl';
import { School, TrendingUp } from 'lucide-react';
import { useContents } from '@/hooks/useContent';
import { useLearnerProgress, useLearnerSummary } from '@/hooks/useTenant';
import { ProgressBar } from '@/components/tenant/activity-heatmap';

/** Achievement codes → localized label keys under the `learner` namespace. */
const BADGE_LABEL_KEYS: Record<string, string> = {
  STREAK_5: 'badges.STREAK_5',
  FIRST_PERFECT: 'badges.FIRST_PERFECT',
  TEN_QUIZZES: 'badges.TEN_QUIZZES',
};

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex flex-col justify-center rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
      <p className="font-label text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={`mt-2 font-display text-3xl font-bold tabular-nums tracking-tight ${
          accent ? 'text-primary' : ''
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default function LearnerProgressPage() {
  const t = useTranslations('learner');
  const tp = useTranslations('learner.progress');
  const { data: summary } = useLearnerSummary();
  const { data: contents = [] } = useContents();
  const { data: progress } = useLearnerProgress();

  // Overall-mastery ring is now driven by the consolidated progress hook.
  const mastery = progress?.overallMastery != null ? Math.round(progress.overallMastery) : null;
  const ringCirc = 2 * Math.PI * 52;
  const ringDash = mastery != null ? (Math.max(0, Math.min(100, mastery)) / 100) * ringCirc : 0;
  const ringLow = mastery != null && mastery < 50;

  const masteryByTopic = progress?.masteryByTopic ?? [];
  const badges = progress?.badges ?? [];
  const materialsDone = progress?.materialsDone ?? 0;
  const quizzesTaken = progress?.quizzesTaken ?? 0;
  const avgAccuracy = progress?.avgAccuracy ?? null;

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

      {/* Overall-mastery ring + KPI strip (overallMastery / streak / assigned / materialsDone / quizzes / avgAccuracy) */}
      <div className="grid gap-4 lg:grid-cols-[15rem_1fr]">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border/70 bg-card p-6 text-center shadow-soft">
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

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard label={t('statStreak')} value={String(summary?.streakDays ?? 0)} />
          <StatCard label={t('assignedMaterials')} value={String(summary?.assignedCount ?? contents.length)} />
          <StatCard label={tp('materialsDone')} value={String(materialsDone)} />
          <StatCard label={tp('quizzes')} value={String(quizzesTaken)} />
          <StatCard
            label={tp('avgAccuracy')}
            value={avgAccuracy != null ? `${Math.round(avgAccuracy)}%` : '—'}
            accent
          />
        </div>
      </div>

      {/* Mastery by topic + Achievements — the enriched progress sections. */}
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <h2 className="font-display text-lg font-semibold">{tp('masteryByTopic')}</h2>
          {masteryByTopic.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-border/70 p-6 text-center">
              <p className="text-sm text-muted-foreground">{tp('masteryEmpty')}</p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {masteryByTopic.map((topic) => {
                const pct = Math.max(0, Math.min(100, Math.round(topic.coverage)));
                const low = pct < 50;
                return (
                  <div key={topic.sectionId}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate">{topic.title}</span>
                      <span
                        className={`font-display font-bold tabular-nums ${
                          low ? 'text-accent-secondary' : 'text-primary'
                        }`}
                      >
                        {pct}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${low ? 'bg-accent-secondary' : 'bg-primary'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <h2 className="font-display text-lg font-semibold">{tp('achievements')}</h2>
          {badges.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-border/70 p-6 text-center">
              <p className="text-sm text-muted-foreground">{tp('badgesEmpty')}</p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {badges.map((badge) => {
                const earned = badge.earned;
                const pct = Math.round(Math.max(0, Math.min(1, badge.progress ?? 0)) * 100);
                const labelKey = BADGE_LABEL_KEYS[badge.code];
                const label = labelKey ? t(labelKey) : badge.code;
                return (
                  <div key={badge.code} className={`flex items-center gap-3 ${earned ? '' : 'opacity-60'}`}>
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${
                        earned ? 'bg-accent-secondary/15' : 'bg-muted'
                      }`}
                      aria-hidden="true"
                    >
                      {badge.emoji}
                    </span>
                    <div className="min-w-0">
                      <p className={`truncate text-sm font-semibold ${earned ? '' : 'text-muted-foreground'}`}>
                        {label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {earned ? tp('badgeEarned') : tp('badgeProgress', { percent: pct })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Continue where you left off — existing activity section. */}
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
