'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { FileText, RefreshCw, Sparkles, Wand2 } from 'lucide-react';
import { cn } from '@talim/ui';
import { useSlides, useGenerateSlides } from '@/hooks/useSlides';
import { DeckPlayer } from '@/components/deck/DeckPlayer';

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

  const deck = deckRow?.deck ?? null;
  const hasBody = !!body && body.trim().length > 0;

  // Auto-generate the deck once per section for users who can generate.
  useEffect(() => {
    if (mode !== 'slides' || !sectionId || isLearner) return;
    if (deck || isLoading || generateRef.current.isPending || generateRef.current.isError) return;
    if (!hasBody) return;
    if (attempted.current.has(sectionId)) return;
    attempted.current.add(sectionId);
    generateRef.current.mutate({});
  }, [mode, sectionId, isLearner, deck, isLoading, hasBody]);

  const TextView = (
    <article className="prose prose-sm max-w-3xl whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">
      {body ?? tContent('selectSection')}
    </article>
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-end gap-2">
        <div className="inline-flex rounded-lg border bg-card p-0.5">
          <button
            type="button"
            onClick={() => setMode('slides')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              mode === 'slides' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Sparkles className="h-4 w-4" />
            {tContent('viewSlides')}
          </button>
          <button
            type="button"
            onClick={() => setMode('text')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              mode === 'text' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <FileText className="h-4 w-4" />
            {tContent('viewText')}
          </button>
        </div>
        {mode === 'slides' && deck && !isLearner && (
          <button
            type="button"
            onClick={() => generate.mutate({})}
            disabled={generate.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className={generate.isPending ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            {t('regenerate')}
          </button>
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
      ) : generate.isPending || (!isLearner && hasBody && !generate.isError) ? (
        <CenteredCard>
          <div className="relative flex h-14 w-14 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
            <Sparkles className="h-7 w-7 animate-pulse text-primary" />
          </div>
          <p className="text-base font-semibold">{t('generating')}</p>
          <p className="max-w-sm text-sm text-muted-foreground">{t('generatingHint')}</p>
        </CenteredCard>
      ) : isLearner ? (
        // Learner with no tutor-generated deck yet — show the text instead.
        TextView
      ) : generate.isError ? (
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
      ) : (
        // No body to build slides from — fall back to text.
        TextView
      )}
    </div>
  );
}

function CenteredCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[clamp(440px,62vh,680px)] w-full flex-col items-center justify-center gap-3 rounded-2xl border bg-card text-center shadow-sm">
      {children}
    </div>
  );
}
