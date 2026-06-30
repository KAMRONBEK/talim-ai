'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { FileText, Headphones, Clapperboard, Layers, ListChecks, Zap } from 'lucide-react';
import type { QuestionStyle } from '@talim/types';

const QUIZ_STYLES: QuestionStyle[] = ['mixed', 'multipleChoice', 'trueFalse', 'written', 'numeric'];

export interface ContentGenerationsBlockProps {
  contentId: string;
  onSummary: () => void;
  onQuiz: (style?: QuestionStyle) => void;
  onQuickCheck: (style?: QuestionStyle) => void;
  summaryPending?: boolean;
  quizPending?: boolean;
  quickCheckPending?: boolean;
  quizCount?: number;
  /** False when the content has no active section to anchor a quiz to. */
  canQuiz?: boolean;
  hideGenerateActions?: boolean;
  onAction?: () => void;
}

/**
 * The "Resurslar" generations block: Summary PDF / AI Podcast / AI Video / Flashcards plus
 * the question-style picker and Practice/Quick quiz launchers. Extracted so it can live in
 * the left content sidebar (its primary home) as well as the mobile Learn drawer.
 */
export function ContentGenerationsBlock({
  contentId,
  onSummary,
  onQuiz,
  onQuickCheck,
  summaryPending,
  quizPending,
  quickCheckPending,
  quizCount = 0,
  canQuiz = true,
  hideGenerateActions = false,
  onAction,
}: ContentGenerationsBlockProps) {
  const t = useTranslations('content');
  const [quizStyle, setQuizStyle] = useState<QuestionStyle>('mixed');

  const wrapAction = (fn: () => void) => () => {
    fn();
    onAction?.();
  };

  return (
    <div className="border-b border-border p-5">
      <h3 className="mb-3 font-label text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {t('resources')}
      </h3>
      <div className="space-y-2">
        {!hideGenerateActions && (
          <button
            type="button"
            onClick={wrapAction(onSummary)}
            disabled={summaryPending}
            className="flex w-full items-center gap-2.5 rounded-xl bg-muted/50 p-2.5 text-left text-sm transition-colors hover:bg-muted"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
              <FileText className="h-4 w-4" />
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
          className="flex items-center gap-2.5 rounded-xl bg-muted/50 p-2.5 text-sm transition-colors hover:bg-muted"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent-secondary/10 text-accent-secondary">
            <Headphones className="h-4 w-4" />
          </span>
          <div>
            <div className="font-medium">{t('aiPodcast')}</div>
            <div className="text-[11px] text-muted-foreground">{t('listenAction')}</div>
          </div>
        </Link>
        <Link
          href={`/content/${contentId}/video`}
          onClick={onAction}
          className="flex items-center gap-2.5 rounded-xl bg-muted/50 p-2.5 text-sm transition-colors hover:bg-muted"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
            <Clapperboard className="h-4 w-4" />
          </span>
          <div>
            <div className="font-medium">{t('aiVideo')}</div>
            <div className="text-[11px] text-muted-foreground">{t('watchAction')}</div>
          </div>
        </Link>
        <Link
          href={`/content/${contentId}/flashcards`}
          onClick={onAction}
          className="flex items-center gap-2.5 rounded-xl bg-muted/50 p-2.5 text-sm transition-colors hover:bg-muted"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent-secondary/10 text-accent-secondary">
            <Layers className="h-4 w-4" />
          </span>
          <div>
            <div className="font-medium">{t('flashcards')}</div>
            <div className="text-[11px] text-muted-foreground">{t('flashcardsAction')}</div>
          </div>
        </Link>
        {!hideGenerateActions && (
          <>
            <div className="rounded-xl bg-muted/30 p-2.5">
              <label
                htmlFor="quiz-style"
                className="mb-1.5 block font-label text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
              >
                {t('quizStyleLabel')}
              </label>
              <select
                id="quiz-style"
                value={quizStyle}
                onChange={(event) => setQuizStyle(event.target.value as QuestionStyle)}
                aria-label={t('quizStyleLabel')}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
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
              className="flex w-full items-center gap-2.5 rounded-xl bg-muted/50 p-2.5 text-left text-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                <ListChecks className="h-4 w-4" />
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
              className="flex w-full items-center gap-2.5 rounded-xl bg-muted/50 p-2.5 text-left text-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent-secondary/10 text-accent-secondary">
                <Zap className="h-4 w-4" />
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
  );
}
