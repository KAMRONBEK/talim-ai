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
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No scores yet.</p>;
  }
  return (
    <div className="overflow-hidden rounded-xl border">
      {rows.map((r) => (
        <div
          key={r.learnerId}
          className={`flex items-center justify-between border-b px-3 py-2 text-sm last:border-0 ${
            r.learnerId === highlightId ? 'bg-primary/10 font-medium' : ''
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
          <span className="font-semibold">
            {mode === 'GAME' ? `${r.pointsTotal} pts` : `${Math.round(r.score)}%`}
          </span>
        </div>
      ))}
    </div>
  );
}
