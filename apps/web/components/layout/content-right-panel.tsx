'use client';

import { useTranslations } from 'next-intl';
import { cn, Sheet, SheetContent, SheetHeader, SheetTitle } from '@talim/ui';
import type { LearningHistory, MasteryBand } from '@talim/types';
import { LearningHistoryPanel } from '@/components/learning/learning-history-panel';
import { ContentGenerationsBlock } from '@/components/layout/content-generations';
import { useContentMastery } from '@/hooks/useMastery';
import { useSections } from '@/hooks/useSections';

/** Band → bar color: neutral until evidence, warm while learning, pine when earned. */
const BAND_BAR: Record<MasteryBand, string> = {
  none: 'bg-border',
  attempted: 'bg-muted-foreground/50',
  familiar: 'bg-accent-secondary',
  proficient: 'bg-primary/70',
  mastered: 'bg-primary',
};

export interface ContentRightPanelBodyProps {
  contentId: string;
  onSummary: () => void;
  summaryPending?: boolean;
  overallCoverage?: number;
  sectionCoverage?: number;
  streakDays?: number;
  quizCount?: number;
  history?: LearningHistory;
  onOpenSummary: (summary: string) => void;
  onAction?: () => void;
  hideGenerateActions?: boolean;
  /** Anchors the Practice generator's "current section" scope. */
  activeSectionId?: string;
  /**
   * Render the generations block (default true). The reader hides it on desktop because
   * generations now live in the left content sidebar; the mobile drawer keeps it.
   */
  showGenerations?: boolean;
}

export function ContentRightPanelBody({
  contentId,
  onSummary,
  summaryPending,
  overallCoverage = 0,
  sectionCoverage = 0,
  streakDays = 0,
  quizCount = 0,
  history,
  onOpenSummary,
  onAction,
  hideGenerateActions = false,
  activeSectionId,
  showGenerations = true,
}: ContentRightPanelBodyProps) {
  const t = useTranslations('content');
  const circumference = 2 * Math.PI * 52;
  const progress = Math.min(1, Math.max(0, sectionCoverage / 100));
  const offset = circumference * (1 - progress);
  const displayPercent = Math.round(sectionCoverage);

  // Both queries dedupe with the reader page's own calls (same query keys) — no extra fetches.
  const { data: mastery } = useContentMastery(contentId);
  const { data: sections } = useSections(contentId);
  const sectionTitles = new Map((sections ?? []).map((s) => [s.id, s.title]));
  const masteryRows = mastery?.sections ?? [];

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

      {masteryRows.length > 0 && (
        <div className="border-b border-border/70 p-5">
          <h3 className="mb-3 font-label text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {t('mastery.title')}
          </h3>
          <ul className="space-y-3">
            {masteryRows.map((row) => {
              const title = row.sectionId
                ? (sectionTitles.get(row.sectionId) ?? '—')
                : t('mastery.wholeMaterial');
              const width = Math.min(100, Math.max(0, row.score));
              return (
                <li key={row.scopeKey}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-xs font-medium">{title}</span>
                    <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                      {Math.round(row.score)}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn('h-full rounded-full transition-all', BAND_BAR[row.band])}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {t(`mastery.band_${row.band}`)}
                    </span>
                    {row.needsReview && (
                      <span className="text-[10px] font-medium text-accent-secondary">
                        {t('mastery.needsReview')}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            {t('mastery.helper')}
          </p>
        </div>
      )}

      {showGenerations && (
        <ContentGenerationsBlock
          contentId={contentId}
          onSummary={onSummary}
          summaryPending={summaryPending}
          quizCount={quizCount}
          activeSectionId={activeSectionId}
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
