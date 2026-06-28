'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@talim/ui';
import type { LearningHistory, QuestionStyle } from '@talim/types';
import { LearningHistoryPanel } from '@/components/learning/learning-history-panel';

const QUIZ_STYLES: QuestionStyle[] = ['mixed', 'multipleChoice', 'trueFalse', 'written', 'numeric'];

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
}: ContentRightPanelBodyProps) {
  const t = useTranslations('content');
  const [quizStyle, setQuizStyle] = useState<QuestionStyle>('mixed');
  const circumference = 2 * Math.PI * 52;
  const progress = Math.min(1, Math.max(0, sectionCoverage / 100));
  const offset = circumference * (1 - progress);
  const displayPercent = Math.round(sectionCoverage);

  const wrapAction = (fn: () => void) => () => {
    fn();
    onAction?.();
  };

  return (
    <>
      <div className="border-b p-5 text-center">
        <h3 className="text-sm font-semibold">{t('yourProgress')}</h3>
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

      <div className="border-b p-5">
        <h3 className="mb-3 text-sm font-semibold">{t('resources')}</h3>
        <div className="space-y-2">
          {!hideGenerateActions && (
          <button
            type="button"
            onClick={wrapAction(onSummary)}
            disabled={summaryPending}
            className="flex w-full items-center gap-2.5 rounded-lg bg-muted/50 p-2.5 text-left text-sm transition-colors hover:bg-muted"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success-muted text-sm">
              📝
            </span>
            <div>
              <div className="font-medium">{t('summaryPdf')}</div>
              <div className="text-[11px] text-muted-foreground">{t('savedSummary')}</div>
            </div>
          </button>
          )}
          <Link
            href={`/content/${contentId}/podcast`}
            onClick={onAction}
            className="flex items-center gap-2.5 rounded-lg bg-muted/50 p-2.5 text-sm transition-colors hover:bg-muted"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-info-muted text-sm">
              🎧
            </span>
            <div>
              <div className="font-medium">{t('aiPodcast')}</div>
              <div className="text-[11px] text-muted-foreground">{t('listenAction')}</div>
            </div>
          </Link>
          <Link
            href={`/content/${contentId}/video`}
            onClick={onAction}
            className="flex items-center gap-2.5 rounded-lg bg-muted/50 p-2.5 text-sm transition-colors hover:bg-muted"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-info-muted text-sm">
              🎬
            </span>
            <div>
              <div className="font-medium">{t('aiVideo')}</div>
              <div className="text-[11px] text-muted-foreground">{t('watchAction')}</div>
            </div>
          </Link>
          <Link
            href={`/content/${contentId}/flashcards`}
            onClick={onAction}
            className="flex items-center gap-2.5 rounded-lg bg-muted/50 p-2.5 text-sm transition-colors hover:bg-muted"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-secondary/15 text-sm">
              🃏
            </span>
            <div>
              <div className="font-medium">{t('flashcards')}</div>
              <div className="text-[11px] text-muted-foreground">{t('flashcardsAction')}</div>
            </div>
          </Link>
          {!hideGenerateActions && (
            <>
              <div className="rounded-lg bg-muted/30 p-2.5">
                <label
                  htmlFor="quiz-style"
                  className="mb-1.5 block text-[11px] font-medium text-muted-foreground"
                >
                  {t('quizStyleLabel')}
                </label>
                <select
                  id="quiz-style"
                  value={quizStyle}
                  onChange={(event) => setQuizStyle(event.target.value as QuestionStyle)}
                  aria-label={t('quizStyleLabel')}
                  className="w-full rounded-md border border-border/70 bg-background px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {QUIZ_STYLES.map((style) => (
                    <option key={style} value={style}>
                      {t(`quizStyle_${style}`)}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={wrapAction(() => onQuiz(quizStyle))}
                disabled={quizPending || !canQuiz}
                className="flex w-full items-center gap-2.5 rounded-lg bg-muted/50 p-2.5 text-left text-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success-muted text-sm">
                  ❓
                </span>
                <div>
                  <div className="font-medium">{t('practiceQuiz')}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {!canQuiz
                      ? t('selectSectionForQuiz')
                      : quizCount > 0
                        ? t('quizCount', { count: quizCount })
                        : t('fiveQuestions')}
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={wrapAction(() => onQuickCheck(quizStyle))}
                disabled={quickCheckPending || !canQuiz}
                className="flex w-full items-center gap-2.5 rounded-lg bg-muted/50 p-2.5 text-left text-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warning-muted text-sm">
                  ⚡
                </span>
                <div>
                  <div className="font-medium">{t('quickQuiz')}</div>
                  <div className="text-[11px] text-muted-foreground">{t('twoQuestions')}</div>
                </div>
              </button>
            </>
          )}
        </div>
      </div>

      <LearningHistoryPanel
        contentId={contentId}
        history={history}
        onOpenSummary={(text) => {
          onOpenSummary(text);
          onAction?.();
        }}
      />

      <div className="p-5">
        <h3 className="mb-3 text-sm font-semibold">{t('learningStreak')}</h3>
        <div className="flex items-center gap-3 rounded-xl bg-accent-secondary/10 p-3.5">
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
