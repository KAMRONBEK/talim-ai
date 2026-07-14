'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { FileText, Loader2, Presentation, RefreshCw, Youtube } from 'lucide-react';
import { cn } from '@talim/ui';
import type { AppLocale, Content } from '@talim/types';
import { useRouter } from '@/i18n/navigation';
import { useQuizHistory, useSavedSummary } from '@/hooks/useQuiz';
import { usePodcast } from '@/hooks/usePodcast';
import { useFlashcards } from '@/hooks/useFlashcards';
import { useLimitErrorHandler } from '@/hooks/useLimitErrorHandler';
import { streamSummaryGeneration } from '@/lib/summaryStream';
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
  const router = useRouter();
  const locale = useLocale() as AppLocale;
  const queryClient = useQueryClient();
  const handleLimitError = useLimitErrorHandler();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState(false);
  const [pdfReload, setPdfReload] = useState(0);
  const [view, setView] = useState<'material' | 'summary'>('material');
  // Whole-document summary: the GET-cached copy loads instantly; a missing one is
  // streamed token-by-token into `streamedSummary` (learners never generate).
  const { data: savedSummary, isLoading: savedSummaryLoading } = useSavedSummary(contentId);
  const [streamedSummary, setStreamedSummary] = useState<string | null>(null);
  const [summaryPending, setSummaryPending] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const summary = streamedSummary ?? savedSummary ?? null;
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
    if (summary || summaryPending || savedSummaryLoading) return;
    // Learners can't generate (POST is learner-blocked server-side) — they only
    // see the owner's saved summary via the GET above.
    if (isLearner) return;
    setSummaryError(null);
    setSummaryPending(true);
    try {
      const final = await streamSummaryGeneration({
        contentId,
        onText: (fullText) => setStreamedSummary(fullText),
      });
      // Persisted summary is the sanitized text — settle on it and seed the
      // react-query cache so other summary views agree without a refetch.
      setStreamedSummary(final.summary);
      queryClient.setQueryData(['summary', contentId, 'full', locale], final.summary);
      void queryClient.invalidateQueries({ queryKey: ['learning-history', contentId, locale] });
    } catch (err) {
      setStreamedSummary(null);
      // handleLimitError returns null when it opened the upgrade modal — don't stack an
      // inline error + Retry behind the modal (matches the useContentActions pattern).
      setSummaryError(handleLimitError(err, t('summaryFailed')));
    } finally {
      setSummaryPending(false);
    }
  }, [
    summary,
    summaryPending,
    savedSummaryLoading,
    isLearner,
    contentId,
    locale,
    queryClient,
    handleLimitError,
    t,
  ]);

  useEffect(() => {
    if (view === 'summary') void loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- kick off per switch to summary (and once the saved-summary lookup settles)
  }, [view, savedSummaryLoading]);

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

  // Content-type identity for the topbar (icon badge + subtitle label). A section/page
  // count is not part of the Content payload here, so the subtitle shows the type alone.
  const typeMeta = {
    PDF: { label: t('typePdf'), Icon: FileText, badge: 'bg-primary/10 text-primary' },
    SLIDE: { label: t('typeSlide'), Icon: Presentation, badge: 'bg-primary/10 text-primary' },
    YOUTUBE: {
      label: t('typeYoutube'),
      Icon: Youtube,
      badge: 'bg-accent-secondary/10 text-accent-secondary',
    },
  } as const;
  const { label: typeLabel, Icon: TypeIcon, badge: typeBadgeClass } = typeMeta[content.type];

  // Processing state as a compact status pill. In practice this view only renders once the
  // content is READY (the status gate handles earlier states), but the mapping stays honest.
  const statusMeta = {
    READY: { label: t('statusReady'), pill: 'bg-primary/10 text-primary', dot: 'bg-primary' },
    PROCESSING: { label: t('statusProcessing'), pill: 'bg-warning-muted text-warning', dot: 'bg-warning' },
    PENDING: { label: t('statusProcessing'), pill: 'bg-warning-muted text-warning', dot: 'bg-warning' },
    FAILED: { label: t('statusFailed'), pill: 'bg-destructive/10 text-destructive', dot: 'bg-destructive' },
  } as const;
  const status = statusMeta[content.status];

  // Which generated modes already exist for this content — drives the unified topbar
  // mode toggle. Read/Summary are always present (they switch the stage in place); a
  // Podcast / Quiz / Cards segment only appears once there is something to open, so the
  // toggle never leads to an empty screen. Generation itself stays in the resources rail;
  // these segments reuse the rail's existing targets rather than re-implementing them.
  // Availability is content-level (no per-section media hints in this payload).
  const { data: podcast } = usePodcast(contentId);
  const { data: flashcardDeck } = useFlashcards(contentId);
  const { data: quizzes } = useQuizHistory(contentId);
  const latestQuizId = quizzes?.[0]?.id;

  type StageMode = { key: string; label: string; active: boolean; onSelect: () => void };
  const modes: StageMode[] = [
    {
      key: 'read',
      // YouTube source material is a video, so the "read" mode reads as "Watch" (per #study).
      label: content.type === 'YOUTUBE' ? t('modeWatch') : t('modeRead'),
      active: view === 'material',
      onSelect: () => setView('material'),
    },
    {
      key: 'summary',
      label: t('summary'),
      active: view === 'summary',
      onSelect: () => setView('summary'),
    },
    ...(podcast
      ? [
          {
            key: 'podcast',
            label: t('modePodcast'),
            active: false,
            onSelect: () => router.push(`/content/${contentId}/podcast`),
          },
        ]
      : []),
    ...(latestQuizId
      ? [
          {
            key: 'quiz',
            label: t('modeQuiz'),
            active: false,
            onSelect: () => router.push(`/quiz/${latestQuizId}`),
          },
        ]
      : []),
    ...(flashcardDeck
      ? [
          {
            key: 'cards',
            label: t('modeCards'),
            active: false,
            onSelect: () => router.push(`/content/${contentId}/flashcards`),
          },
        ]
      : []),
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-card">
      <div className="flex shrink-0 items-center gap-3 border-b border-border/70 px-4 py-2.5">
        <div
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
            typeBadgeClass,
          )}
        >
          <TypeIcon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h3 className="truncate font-display text-sm font-semibold leading-tight">{content.title}</h3>
          <p className="truncate text-[11px] leading-tight text-muted-foreground">{typeLabel}</p>
        </div>
        <div
          role="group"
          aria-label={t('modeToggleLabel')}
          className="flex shrink-0 items-center gap-1 rounded-xl bg-muted p-1"
        >
          {modes.map((mode) => (
            <button
              key={mode.key}
              type="button"
              aria-pressed={mode.active}
              onClick={mode.onSelect}
              className={cn(
                'rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors',
                mode.active
                  ? 'bg-primary text-primary-foreground shadow-soft'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {mode.label}
            </button>
          ))}
        </div>
        <span
          className={cn(
            'ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
            status.pill,
          )}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
          {status.label}
        </span>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        {view === 'summary' ? (
          <div className="min-h-0 flex-1 overflow-y-auto p-6 text-sm leading-relaxed">
            {summary ? (
              // Streams in token-by-token while generating; the final sanitized
              // text replaces it on completion.
              <SummaryText text={summary} />
            ) : summaryPending || savedSummaryLoading ? (
              <p className="text-muted-foreground">{t('summaryGenerating')}</p>
            ) : summaryError ? (
              <div className="flex flex-col items-start gap-3">
                <p className="text-destructive">{summaryError}</p>
                <button
                  type="button"
                  onClick={() => void loadSummary()}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-sm font-semibold transition-colors hover:-translate-y-px hover:bg-secondary"
                >
                  <RefreshCw className="h-4 w-4" />
                  {t('summaryRetry')}
                </button>
              </div>
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
