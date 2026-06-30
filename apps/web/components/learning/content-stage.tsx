'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@talim/ui';
import type { Content } from '@talim/types';
import { useGenerateSummary } from '@/hooks/useQuiz';
import { fetchAuthenticatedBlob } from '@/lib/authenticatedBlob';
import { useAuthStore } from '@/store/useAuthStore';
import { contentEndpoints } from '@/lib/api/endpoints';
import { SummaryText } from '@/components/learning/summary-text';
import { SectionReader } from '@/components/learning/section-reader';
import { PdfViewer } from '@/components/learning/PdfViewerLazy';
import { VideoTutorialViewer } from '@/components/learning/VideoTutorialViewer';
import type { TranscriptExcerptPayload } from '@/components/learning/TranscriptPanel';
import type { PdfExcerptPayload } from '@/components/learning/PdfViewer';

/** Transient-failure retries for the (potentially large) PDF blob fetch before giving up. */
const MAX_PDF_RETRIES = 2;

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
  /** 0–1 document position of the active section, to scroll the PDF when it changes. */
  scrollToFraction?: number;
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
  scrollToFraction,
}: ContentStageProps) {
  const t = useTranslations('content');
  const tChat = useTranslations('chat');
  const generateSummary = useGenerateSummary();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState(false);
  const [pdfReload, setPdfReload] = useState(0);
  const [view, setView] = useState<'material' | 'summary'>('material');
  const [summary, setSummary] = useState<string | null>(null);
  const [selectionHint, setSelectionHint] = useState<string | null>(null);

  const isPdf = content.type === 'PDF' || content.type === 'SLIDE';
  const isTenantOwner = useAuthStore((s) => s.user?.role) === 'TENANT_OWNER';

  // The PDF is fetched as one authenticated blob (the file endpoint needs a Bearer
  // token), which for a large scan can be slow or stall mid-download on a flaky
  // connection without ever erroring. Track loading/error explicitly so the reader
  // shows a spinner — not the slide deck — while it loads, and a Retry on failure.
  // The fetch opts into a stall timeout (abort if no bytes arrive for a while) and is
  // aborted on unmount; transient failures auto-retry, permanent ones (4xx) don't.
  useEffect(() => {
    if (!isPdf || !content.storagePath) return;
    let revoked: string | null = null;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let activeController: AbortController | null = null;
    let attempts = 0;
    setPdfUrl(null);
    setPdfError(false);

    const load = () => {
      const controller = new AbortController();
      activeController = controller;
      fetchAuthenticatedBlob(contentEndpoints.file(contentId, isTenantOwner), {
        signal: controller.signal,
        stallTimeoutMs: 30_000,
      })
        .then((url) => {
          if (cancelled) {
            URL.revokeObjectURL(url);
            return;
          }
          revoked = url;
          setPdfUrl(url);
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          // Don't retry permanent failures (4xx) — they will never succeed.
          const status = (err as { status?: number } | null)?.status;
          const permanent = typeof status === 'number' && status >= 400 && status < 500;
          attempts += 1;
          if (!permanent && attempts <= MAX_PDF_RETRIES) {
            timer = setTimeout(load, 800 * attempts);
          } else {
            setPdfError(true);
          }
        });
    };
    load();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      activeController?.abort();
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [isPdf, content.storagePath, contentId, isTenantOwner, pdfReload]);

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
        <div className="flex shrink-0 items-center gap-1 rounded-xl bg-muted p-1">
          {(['material', 'summary'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={cn(
                'rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors',
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
        ) : isPdf && content.storagePath ? (
          pdfUrl ? (
            <div className="min-h-0 flex-1">
              <PdfViewer
                url={pdfUrl}
                scrollToFraction={scrollToFraction}
                onExcerptSelected={handlePdfExcerpt}
                onSelectionCleared={clearSelection}
                onEmptySelection={() => setSelectionHint(t('pdfNoTextInSelection'))}
              />
            </div>
          ) : pdfError ? (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
              <p className="text-sm text-muted-foreground">{t('pdfLoadError')}</p>
              <button
                type="button"
                onClick={() => setPdfReload((k) => k + 1)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-sm font-semibold transition-colors hover:-translate-y-px hover:bg-secondary"
              >
                <RefreshCw className="h-4 w-4" />
                {t('pdfRetry')}
              </button>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm">{t('pdfLoading')}</p>
            </div>
          )
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
