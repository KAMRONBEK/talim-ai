'use client';

import Link from 'next/link';
import type { LearningHistory } from '@talim/types';
import { formatRelativeTime } from '@/lib/format-relative-time';

interface LearningHistoryPanelProps {
  contentId: string;
  history: LearningHistory | undefined;
  onOpenSummary: (summary: string) => void;
}

export function LearningHistoryPanel({
  contentId,
  history,
  onOpenSummary,
}: LearningHistoryPanelProps) {
  if (!history) return null;

  const quizzes = history.quizzes.slice(0, 5);
  const summaries = history.summaries.slice(0, 3);

  return (
    <div className="border-b p-5">
      <h3 className="mb-3 text-sm font-semibold">O&apos;rganish tarixi</h3>
      <div className="space-y-3">
        {quizzes.length > 0 && (
          <div>
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Testlar
            </p>
            <ul className="space-y-1">
              {quizzes.map((q) => (
                <li key={q.id}>
                  <Link
                    href={`/quiz/${q.id}`}
                    className="flex items-center justify-between rounded-lg bg-muted/50 px-2.5 py-2 text-xs transition-colors hover:bg-muted"
                  >
                    <span>
                      {q.kind === 'QUICK' ? 'Tez savol' : 'Mashq testi'}
                      {q.latestAttempt != null && (
                        <span className="ml-1 text-muted-foreground">
                          · {Math.round(q.latestAttempt.score)}%
                        </span>
                      )}
                    </span>
                    <span className="text-muted-foreground">
                      {formatRelativeTime(q.createdAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {summaries.length > 0 && (
          <div>
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Xulosalar
            </p>
            <ul className="space-y-1">
              {summaries.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => onOpenSummary(s.summary)}
                    className="flex w-full items-center justify-between rounded-lg bg-muted/50 px-2.5 py-2 text-left text-xs transition-colors hover:bg-muted"
                  >
                    <span>{s.sectionId ? 'Bob xulosasi' : "To'liq xulosa"}</span>
                    <span className="text-muted-foreground">
                      {formatRelativeTime(s.createdAt)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {history.podcastStatus === 'READY' && (
          <Link
            href={`/content/${contentId}/podcast`}
            className="flex items-center gap-2 rounded-lg bg-muted/50 px-2.5 py-2 text-xs transition-colors hover:bg-muted"
          >
            <span>🎧</span>
            <span>Podkast mavjud — tinglash</span>
          </Link>
        )}

        {quizzes.length === 0 && summaries.length === 0 && history.podcastStatus !== 'READY' && (
          <p className="text-xs text-muted-foreground">
            Hali test yoki xulosa yo&apos;q. Test ishlang yoki xulosa yarating.
          </p>
        )}
      </div>
    </div>
  );
}
