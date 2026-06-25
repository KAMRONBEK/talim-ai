'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@talim/ui';
import type { Content } from '@talim/types';
import { useGenerateSummary } from '@/hooks/useQuiz';
import { fetchAuthenticatedBlob } from '@/lib/authenticatedBlob';
import { SummaryText } from '@/components/learning/summary-text';
import { SectionReader } from '@/components/learning/section-reader';
import { PdfViewer } from '@/components/learning/PdfViewerLazy';
import { VideoTutorialViewer } from '@/components/learning/VideoTutorialViewer';
import type { TranscriptExcerptPayload } from '@/components/learning/TranscriptPanel';
import type { PdfExcerptPayload } from '@/components/learning/PdfViewer';

export interface StageExcerpt {
  excerpt: string;
  imageDataUrl?: string | null;
  inputSeed?: string | null;
}

interface ContentStageProps {
  contentId: string;
  content: Content;
  activeSectionId?: string;
  sectionBody?: string;
  sectionLoading?: boolean;
  isLearner?: boolean;
  entryEdge?: 'start' | 'end';
  onAdvance?: () => void;
  onRetreat?: () => void;
  /** Bubble a transcript/PDF selection up so the Learn panel's Chat tab can use it. */
  onExcerptSelected?: (payload: StageExcerpt) => void;
  onSelectionCleared?: () => void;
}

/**
 * The center pane of the learning workspace: the SOURCE material itself, branching
 * on content type (YouTube video + transcript / PDF / processed section text), with
 * a Material/Summary toggle. Selections bubble up to seed the AI tutor.
 */
export function ContentStage({
  contentId,
  content,
  activeSectionId,
  sectionBody,
  sectionLoading,
  isLearner,
  entryEdge = 'start',
  onAdvance,
  onRetreat,
  onExcerptSelected,
  onSelectionCleared,
}: ContentStageProps) {
  const t = useTranslations('content');
  const tChat = useTranslations('chat');
  const generateSummary = useGenerateSummary();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [view, setView] = useState<'material' | 'summary'>('material');
  const [summary, setSummary] = useState<string | null>(null);
  const [selectionHint, setSelectionHint] = useState<string | null>(null);

  const isPdf = content.type === 'PDF' || content.type === 'SLIDE';

  useEffect(() => {
    if (!isPdf || !content.storagePath) return;
    let revoked: string | null = null;
    fetchAuthenticatedBlob(`/content/${contentId}/file`)
      .then((url) => {
        revoked = url;
        setPdfUrl(url);
      })
      .catch(() => setPdfUrl(null));
    return () => {
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [isPdf, content.storagePath, contentId]);

  const loadSummary = useCallback(async () => {
    if (summary || generateSummary.isPending) return;
    try {
      const text = await generateSummary.mutateAsync({ contentId });
      setSummary(text);
    } catch {
      /* surfaced by the not-available copy below */
    }
  }, [summary, generateSummary, contentId]);

  useEffect(() => {
    if (view === 'summary') void loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per switch to summary
  }, [view]);

  const handlePdfExcerpt = useCallback(
    (payload: PdfExcerptPayload) => {
      const pagePrefix = payload.page ? `[Page ${payload.page}] ` : '';
      const label = payload.excerpt.trim()
        ? `${pagePrefix}${payload.excerpt}`
        : `${pagePrefix}${t('selectedArea')}`;
      setSelectionHint(null);
      onExcerptSelected?.({
        excerpt: label,
        imageDataUrl: payload.imageDataUrl ?? null,
        inputSeed: tChat('areaImagePrompt'),
      });
    },
    [t, tChat, onExcerptSelected],
  );

  const handleTranscriptExcerpt = useCallback(
    (payload: TranscriptExcerptPayload & { label: string }) => {
      setSelectionHint(null);
      onExcerptSelected?.({
        excerpt: payload.label,
        imageDataUrl: null,
        inputSeed: tChat('excerptPrompt', { snippet: payload.label }),
      });
    },
    [tChat, onExcerptSelected],
  );

  const clearSelection = useCallback(() => {
    setSelectionHint(null);
    onSelectionCleared?.();
  }, [onSelectionCleared]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-card">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/70 px-4 py-2.5">
        <h3 className="truncate font-display text-sm font-semibold">{content.title}</h3>
        <div className="flex shrink-0 items-center gap-1 rounded-lg bg-muted/60 p-0.5">
          {(['material', 'summary'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={cn(
                'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                view === v
                  ? 'bg-card text-primary shadow-soft'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {v === 'material' ? t('materialTab') : t('summary')}
            </button>
          ))}
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        {view === 'summary' ? (
          <div className="min-h-0 flex-1 overflow-y-auto p-6 text-sm leading-relaxed">
            {generateSummary.isPending ? (
              <p className="text-muted-foreground">{t('summaryGenerating')}</p>
            ) : summary ? (
              <SummaryText text={summary} />
            ) : (
              <p className="text-muted-foreground">{t('summaryNotAvailable')}</p>
            )}
          </div>
        ) : content.type === 'YOUTUBE' && content.url ? (
          <div className="min-h-0 flex-1">
            <VideoTutorialViewer
              contentId={contentId}
              url={content.url}
              onExcerptSelected={handleTranscriptExcerpt}
              onSelectionCleared={clearSelection}
            />
          </div>
        ) : isPdf && pdfUrl ? (
          <div className="min-h-0 flex-1">
            <PdfViewer
              url={pdfUrl}
              onExcerptSelected={handlePdfExcerpt}
              onSelectionCleared={clearSelection}
              onEmptySelection={() => setSelectionHint(t('pdfNoTextInSelection'))}
            />
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 md:px-8">
            <SectionReader
              contentId={contentId}
              sectionId={activeSectionId}
              body={sectionBody}
              isLearner={isLearner ?? false}
              sectionLoading={sectionLoading}
              entryEdge={entryEdge}
              onAdvance={onAdvance}
              onRetreat={onRetreat}
            />
          </div>
        )}
        {selectionHint && (
          <p className="pointer-events-none absolute bottom-2 left-2 right-2 z-10 rounded-md bg-warning-muted px-2 py-1 text-center text-[10px] text-warning">
            {selectionHint}
          </p>
        )}
      </div>
    </div>
  );
}
