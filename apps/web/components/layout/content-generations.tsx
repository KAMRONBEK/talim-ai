'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { FileText, Headphones, Clapperboard, Layers, ListChecks } from 'lucide-react';
import { PracticeGenerator } from '@/components/practice/practice-generator';

export interface ContentGenerationsBlockProps {
  contentId: string;
  onSummary: () => void;
  summaryPending?: boolean;
  quizCount?: number;
  /** Anchors the Practice generator's "current section" scope; omit for whole-material only. */
  activeSectionId?: string;
  hideGenerateActions?: boolean;
  onAction?: () => void;
}

/**
 * The "Resurslar" generations block: Summary PDF / AI Podcast / AI Video / Flashcards plus
 * the unified Practice launcher (count / types / depth / scope dialog). Extracted so it can
 * live in the left content sidebar (its primary home) as well as the mobile Learn drawer.
 */
export function ContentGenerationsBlock({
  contentId,
  onSummary,
  summaryPending,
  quizCount = 0,
  activeSectionId,
  hideGenerateActions = false,
  onAction,
}: ContentGenerationsBlockProps) {
  const t = useTranslations('content');
  const [practiceOpen, setPracticeOpen] = useState(false);

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
            {/* Opening the dialog must NOT fire onAction — on mobile that would close the
                drawer hosting this block before the learner can configure anything. The
                dialog's onGenerated closes it once generation has started + navigated. */}
            <button
              type="button"
              onClick={() => setPracticeOpen(true)}
              className="flex w-full items-center gap-2.5 rounded-xl bg-muted/50 p-2.5 text-left text-sm transition-colors hover:bg-muted"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                <ListChecks className="h-4 w-4" />
              </span>
              <div>
                <div className="font-medium">{t('practice.launcher')}</div>
                <div className="text-[11px] text-muted-foreground">
                  {quizCount > 0 ? t('quizCount', { count: quizCount }) : t('practice.launcherHint')}
                </div>
              </div>
            </button>
            <PracticeGenerator
              contentId={contentId}
              activeSectionId={activeSectionId}
              open={practiceOpen}
              onOpenChange={setPracticeOpen}
              onGenerated={onAction}
            />
          </>
        )}
      </div>
    </div>
  );
}
