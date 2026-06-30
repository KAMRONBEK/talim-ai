'use client';

import { useTranslations } from 'next-intl';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@talim/ui';
import type { LearningHistory, QuestionStyle } from '@talim/types';
import { LearningHistoryPanel } from '@/components/learning/learning-history-panel';
import { ContentGenerationsBlock } from '@/components/layout/content-generations';

export interface ContentRightPanelBodyProps {
  contentId: string;
  onSummary: () => void;
  onQuiz: (style?: QuestionStyle) => void;
  onQuickCheck: (style?: QuestionStyle) => void;
  summaryPending?: boolean;
  quizPending?: boolean;
  quickCheckPending?: boolean;
  overallCoverage?: number;
  sectionCoverage?: number;
  streakDays?: number;
  quizCount?: number;
  history?: LearningHistory;
  onOpenSummary: (summary: string) => void;
  onAction?: () => void;
  hideGenerateActions?: boolean;
  /** False when the content has no active section to anchor a quiz to. */
  canQuiz?: boolean;
  /**
   * Render the generations block (default true). The reader hides it on desktop because
   * generations now live in the left content sidebar; the mobile drawer keeps it.
   */
  showGenerations?: boolean;
}

export function ContentRightPanelBody({
  contentId,
  onSummary,
  onQuiz,
  onQuickCheck,
  summaryPending,
  quizPending,
  quickCheckPending,
  overallCoverage = 0,
  sectionCoverage = 0,
  streakDays = 0,
  quizCount = 0,
  history,
  onOpenSummary,
  onAction,
  hideGenerateActions = false,
  canQuiz = true,
  showGenerations = true,
}: ContentRightPanelBodyProps) {
  const t = useTranslations('content');
  const circumference = 2 * Math.PI * 52;
  const progress = Math.min(1, Math.max(0, sectionCoverage / 100));
  const offset = circumference * (1 - progress);
  const displayPercent = Math.round(sectionCoverage);

  return (
    <>
      <div className="border-b border-border/70 p-5 text-center">
        <h3 className="font-label text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {t('yourProgress')}
        </h3>
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
          <span className="absolute inset-0 flex items-center justify-center font-display text-2xl font-bold tabular-nums">
            {displayPercent}%
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{t('currentSection')}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {t('overall', { n: Math.round(overallCoverage) })}
        </p>
      </div>

      {showGenerations && (
        <ContentGenerationsBlock
          contentId={contentId}
          onSummary={onSummary}
          onQuiz={onQuiz}
          onQuickCheck={onQuickCheck}
          summaryPending={summaryPending}
          quizPending={quizPending}
          quickCheckPending={quickCheckPending}
          quizCount={quizCount}
          canQuiz={canQuiz}
          hideGenerateActions={hideGenerateActions}
          onAction={onAction}
        />
      )}

      <LearningHistoryPanel
        contentId={contentId}
        history={history}
        onOpenSummary={(text) => {
          onOpenSummary(text);
          onAction?.();
        }}
      />

      <div className="p-5">
        <h3 className="mb-3 font-label text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {t('learningStreak')}
        </h3>
        <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-accent-secondary/10 p-3.5">
          <span className="text-3xl">🔥</span>
          <div>
            <div className="font-display text-lg font-bold tabular-nums">
              {streakDays} {streakDays === 1 ? t('day') : t('days')}
            </div>
            <div className="text-xs text-muted-foreground">
              {streakDays > 0 ? t('keepGoing') : t('startToday')}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

type ContentRightPanelProps = Omit<ContentRightPanelBodyProps, 'onAction'>;

export function ContentRightPanel(props: ContentRightPanelProps) {
  return (
    <aside className="hidden w-72 shrink-0 flex-col overflow-y-auto border-l bg-card md:flex">
      <ContentRightPanelBody {...props} />
    </aside>
  );
}

interface ContentRightPanelSheetProps extends ContentRightPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContentRightPanelSheet({
  open,
  onOpenChange,
  ...props
}: ContentRightPanelSheetProps) {
  const t = useTranslations('content');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full max-w-sm flex-col overflow-y-auto p-0">
        <SheetHeader className="border-b p-4">
          <SheetTitle>{t('yourProgress')}</SheetTitle>
        </SheetHeader>
        <ContentRightPanelBody {...props} onAction={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  );
}
