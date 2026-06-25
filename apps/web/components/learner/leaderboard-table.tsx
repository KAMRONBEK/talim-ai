import { useTranslations } from 'next-intl';
import type { AssessmentLeaderboardRow, AssessmentMode } from '@talim/types';

export function LeaderboardTable({
  rows,
  mode,
  highlightId,
}: {
  rows: AssessmentLeaderboardRow[];
  mode: AssessmentMode;
  highlightId?: string;
}) {
  const t = useTranslations('learner.game');
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('noScores')}</p>;
  }
  return (
    <div className="overflow-hidden rounded-xl border border-border/70">
      {rows.map((r) => (
        <div
          key={r.learnerId}
          className={`flex items-center justify-between border-b border-border/70 px-3 py-2.5 text-sm last:border-0 ${
            r.learnerId === highlightId ? 'bg-primary/10 font-semibold text-primary' : ''
          }`}
        >
          <span className="flex items-center gap-2">
            <span
              className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                r.rank === 1
                  ? 'bg-amber-400 text-amber-950'
                  : r.rank === 2
                    ? 'bg-zinc-300 text-zinc-800'
                    : r.rank === 3
                      ? 'bg-orange-400 text-orange-950'
                      : 'bg-muted text-muted-foreground'
              }`}
            >
              {r.rank}
            </span>
            {r.learnerName}
          </span>
          <span className="font-display font-semibold tabular-nums">
            {mode === 'GAME' ? t('points', { count: r.pointsTotal }) : `${Math.round(r.score)}%`}
          </span>
        </div>
      ))}
    </div>
  );
}
