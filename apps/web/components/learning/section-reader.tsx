'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { FileText, Lock, RefreshCw, Sparkles, Wand2 } from 'lucide-react';
import { cn } from '@talim/ui';
import { useSlides, useGenerateSlides } from '@/hooks/useSlides';
import { classifyGenerationError } from '@/lib/generation-error';
import { DeckPlayer } from '@/components/deck/DeckPlayer';
import { SelectionAsk } from '@/components/learning/selection-ask';

type Mode = 'slides' | 'text';

/**
 * The per-section learning experience. Defaults to an engaging, auto-generated
 * slide deck (cached per section); falls back to the raw text via a toggle, and
 * for learners when their tutor hasn't generated slides yet.
 */
export function SectionReader({
  contentId,
  sectionId,
  body,
  isLearner,
  sectionLoading = false,
  entryEdge = 'start',
  onAdvance,
  onRetreat,
}: {
  contentId: string;
  sectionId: string | undefined;
  body: string | undefined;
  isLearner: boolean;
  /** The section body is still loading (kept mounted across sections for smooth flow). */
  sectionLoading?: boolean;
  /** Where to open this section's deck: 'start' (default) or 'end' (arrived via "prev"). */
  entryEdge?: 'start' | 'end';
  /** Advance to the next section (undefined when this is the last section). */
  onAdvance?: () => void;
  /** Go back to the previous section (undefined when this is the first section). */
  onRetreat?: () => void;
}) {
  const t = useTranslations('slides');
  const tContent = useTranslations('content');
  const { data: deckRow, isLoading } = useSlides(contentId, sectionId);
  const generate = useGenerateSlides(contentId, sectionId);
  const [mode, setMode] = useState<Mode>('slides');
  const attempted = useRef<Set<string>>(new Set());
  const generateRef = useRef(generate);
  generateRef.current = generate;
  // Once a plan/quota limit is hit, stop auto-generating for other sections too,
  // and remember the message so it persists when the per-section mutation resets.
  const limitBlocked = useRef(false);
  const lastLimit = useRef<ReturnType<typeof classifyGenerationError> | null>(null);

  const deck = deckRow?.deck ?? null;
  // Generation is a 202+background-job flow: the row's GENERATING/FAILED status
  // (refreshed by the slides.status SSE event) drives the UI, not just the brief
  // enqueue mutation. A learner can't generate, so a GENERATING row (their tutor is
  // regenerating) must not hide their text fallback.
  const serverGenerating = deckRow?.status === 'GENERATING';
  const serverFailed = deckRow?.status === 'FAILED';
  const showGenerating = generate.isPending || (serverGenerating && !isLearner);
  const hasBody = !!body && body.trim().length > 0;
  const errorInfo = classifyGenerationError(generate.error);
  if (generate.isError && errorInfo.kind !== 'error') {
    limitBlocked.current = true;
    lastLimit.current = errorInfo;
  }
  const limited = limitBlocked.current;
  const limitMessage =
    lastLimit.current?.kind === 'quota'
      ? t('limitReached', { used: lastLimit.current.used ?? 0, limit: lastLimit.current.limit ?? 0 })
      : t('limitReachedGeneric');

  // Auto-generate the deck once per section for users who can generate. A deck that is
  // already GENERATING (enqueued elsewhere / another tab) or FAILED (explicit retry
  // instead) must not trigger another enqueue.
  useEffect(() => {
    if (mode !== 'slides' || !sectionId || isLearner || limitBlocked.current) return;
    if (deck || isLoading || serverGenerating || serverFailed) return;
    if (generateRef.current.isPending || generateRef.current.isError) return;
    if (!hasBody) return;
    if (attempted.current.has(sectionId)) return;
    attempted.current.add(sectionId);
    generateRef.current.mutate({});
  }, [mode, sectionId, isLearner, deck, isLoading, serverGenerating, serverFailed, hasBody]);

  const TextView = (
    <SelectionAsk>
      <article className="prose prose-sm max-w-3xl whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">
        {body ?? tContent('selectSection')}
      </article>
    </SelectionAsk>
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-end gap-2">
        <div className="inline-flex rounded-xl bg-muted p-1">
          <button
            type="button"
            onClick={() => setMode('slides')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors',
              mode === 'slides'
                ? 'bg-primary text-primary-foreground shadow-soft'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Sparkles className="h-4 w-4" />
            {tContent('viewSlides')}
          </button>
          <button
            type="button"
            onClick={() => setMode('text')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors',
              mode === 'text'
                ? 'bg-primary text-primary-foreground shadow-soft'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <FileText className="h-4 w-4" />
            {tContent('viewText')}
          </button>
        </div>
        {mode === 'slides' && deck && !isLearner && !limited && (
          <div className="flex items-center gap-3">
            {/* A regenerate that FAILED in the background job keeps rendering the old
                deck, so the CenteredCard error branch below is unreachable — surface
                the failure inline next to the retry button instead. */}
            {serverFailed && (
              <span className="max-w-[14rem] truncate text-sm text-destructive" title={t('error')}>
                {t('error')}
              </span>
            )}
            <button
              type="button"
              onClick={() => generate.mutate({ regenerate: true })}
              disabled={showGenerating}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
            >
              <RefreshCw className={showGenerating ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
              {t('regenerate')}
            </button>
          </div>
        )}
      </div>

      {mode === 'text' ? (
        TextView
      ) : deck ? (
        <div className="h-[clamp(440px,62vh,680px)] w-full overflow-hidden rounded-2xl border bg-card shadow-sm">
          <DeckPlayer
            key={sectionId}
            deck={deck}
            initialIndex={entryEdge === 'end' ? 'last' : 0}
            onPastEnd={onAdvance}
            onBeforeStart={onRetreat}
          />
        </div>
      ) : isLoading || sectionLoading ? (
        <CenteredCard>
          <p className="text-sm text-muted-foreground">{tContent('sectionLoading')}</p>
        </CenteredCard>
      ) : showGenerating ? (
        <CenteredCard>
          <div className="relative flex h-14 w-14 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
            <Sparkles className="h-7 w-7 animate-pulse text-primary" />
          </div>
          <p className="font-display text-base font-semibold">{t('generating')}</p>
          <p className="max-w-sm text-sm text-muted-foreground">{t('generatingHint')}</p>
        </CenteredCard>
      ) : isLearner ? (
        // Learner with no tutor-generated deck yet — show the text instead.
        TextView
      ) : limited ? (
        // Plan/quota limit reached — explain it; offer the text instead of a futile retry.
        <CenteredCard>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-warning-muted text-warning">
            <Lock className="h-6 w-6" />
          </div>
          <p className="max-w-md text-sm text-muted-foreground">{limitMessage}</p>
          <button
            type="button"
            onClick={() => setMode('text')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            <FileText className="h-4 w-4" />
            {tContent('viewText')}
          </button>
        </CenteredCard>
      ) : generate.isError || serverFailed ? (
        <CenteredCard>
          <p className="text-sm text-destructive">{t('error')}</p>
          <button
            type="button"
            onClick={() => generate.mutate({})}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Wand2 className="h-4 w-4" />
            {t('generate')}
          </button>
          <button type="button" onClick={() => setMode('text')} className="text-sm text-muted-foreground underline">
            {tContent('viewText')}
          </button>
        </CenteredCard>
      ) : !isLearner && hasBody ? (
        // About to auto-generate this section's deck.
        <CenteredCard>
          <div className="relative flex h-14 w-14 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
            <Sparkles className="h-7 w-7 animate-pulse text-primary" />
          </div>
          <p className="font-display text-base font-semibold">{t('generating')}</p>
          <p className="max-w-sm text-sm text-muted-foreground">{t('generatingHint')}</p>
        </CenteredCard>
      ) : (
        // No body to build slides from — fall back to text.
        TextView
      )}
    </div>
  );
}

function CenteredCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[clamp(440px,62vh,680px)] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card text-center shadow-soft">
      {children}
    </div>
  );
}
