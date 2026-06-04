'use client';

import Link from 'next/link';

interface ContentRightPanelProps {
  contentId: string;
  onSummary: () => void;
  onQuiz: () => void;
  summaryPending?: boolean;
  quizPending?: boolean;
}

export function ContentRightPanel({
  contentId,
  onSummary,
  onQuiz,
  summaryPending,
  quizPending,
}: ContentRightPanelProps) {
  const circumference = 2 * Math.PI * 52;
  const progress = 0.72;
  const offset = circumference * (1 - progress);

  return (
    <aside className="hidden w-72 shrink-0 flex-col overflow-y-auto border-l bg-card lg:flex">
      <div className="border-b p-5 text-center">
        <h3 className="text-sm font-semibold">Sizning taraqqiyotingiz</h3>
        <div className="relative mx-auto my-4 h-[120px] w-[120px]">
          <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
            <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold">72%</span>
        </div>
        <p className="text-xs text-muted-foreground">Bob tugallandi</p>
      </div>

      <div className="border-b p-5">
        <h3 className="mb-3 text-sm font-semibold">Resurslar</h3>
        <div className="space-y-2">
          <button
            type="button"
            onClick={onSummary}
            disabled={summaryPending}
            className="flex w-full items-center gap-2.5 rounded-lg bg-muted/50 p-2.5 text-left text-sm transition-colors hover:bg-muted"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-sm">
              📝
            </span>
            <div>
              <div className="font-medium">Xulosa PDF</div>
              <div className="text-[11px] text-muted-foreground">3 daqiqa o&apos;qish</div>
            </div>
          </button>
          <Link
            href={`/content/${contentId}/podcast`}
            className="flex items-center gap-2.5 rounded-lg bg-muted/50 p-2.5 text-sm transition-colors hover:bg-muted"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-sm">
              🎧
            </span>
            <div>
              <div className="font-medium">AI Podkast</div>
              <div className="text-[11px] text-muted-foreground">8 daqiqa tinglash</div>
            </div>
          </Link>
          <button
            type="button"
            onClick={onQuiz}
            disabled={quizPending}
            className="flex w-full items-center gap-2.5 rounded-lg bg-muted/50 p-2.5 text-left text-sm transition-colors hover:bg-muted"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-sm">
              ❓
            </span>
            <div>
              <div className="font-medium">Mashq testi</div>
              <div className="text-[11px] text-muted-foreground">12 ta savol</div>
            </div>
          </button>
        </div>
      </div>

      <div className="p-5">
        <h3 className="mb-3 text-sm font-semibold">O&apos;rganish davomiyligi</h3>
        <div className="flex items-center gap-3 rounded-[10px] bg-muted/50 p-3.5">
          <span className="text-3xl">🔥</span>
          <div>
            <div className="text-lg font-bold">5 kun</div>
            <div className="text-xs text-muted-foreground">Davom eting!</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
