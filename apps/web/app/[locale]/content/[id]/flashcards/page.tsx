'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@talim/ui';
import { ArrowLeft, Loader2, RefreshCw, RotateCcw } from 'lucide-react';
import type { Flashcard } from '@talim/types';
import { useContent } from '@/hooks/useContent';
import { useAuthStore } from '@/store/useAuthStore';
import { useFlashcards, useGenerateFlashcards } from '@/hooks/useFlashcards';
import { useLimitErrorHandler } from '@/hooks/useLimitErrorHandler';

export default function FlashcardsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('content');
  const { data: content } = useContent(id);
  const { data: deck } = useFlashcards(id);
  const generate = useGenerateFlashcards(id);
  const handleLimitError = useLimitErrorHandler();
  const isLearner = useAuthStore((s) => s.user?.role === 'TENANT_LEARNER');

  const [error, setError] = useState<string | null>(null);
  const cards = useMemo<Flashcard[]>(() => deck?.cards ?? [], [deck]);
  // Study state: a queue of card indices ("Again" re-queues a card to the end), the flip
  // state, and a count of cards marked "Good".
  const [queue, setQueue] = useState<number[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState(0);

  useEffect(() => {
    setQueue(cards.map((_, i) => i));
    setFlipped(false);
    setReviewed(0);
  }, [cards]);

  const onGenerate = (regenerate = false) => {
    setError(null);
    generate.mutate(
      { regenerate },
      { onError: (e) => setError(handleLimitError(e, t('generationFailed'))) },
    );
  };

  const currentIndex = queue[0];
  const currentCard = currentIndex !== undefined ? cards[currentIndex] : undefined;

  const advance = (again: boolean) => {
    setQueue((prev) => {
      const [head, ...rest] = prev;
      return again && head !== undefined ? [...rest, head] : rest;
    });
    setFlipped(false);
    if (!again) setReviewed((n) => n + 1);
  };

  const restart = () => {
    setQueue(cards.map((_, i) => i));
    setFlipped(false);
    setReviewed(0);
  };

  const generating =
    deck?.status === 'GENERATING' || deck?.status === 'PENDING' || (generate.isPending && !deck);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link
          href={`/content/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> {t('backToContent')}
        </Link>
        {deck?.status === 'READY' && !isLearner && (
          <Button
            variant="outline"
            size="sm"
            type="button"
            disabled={generate.isPending}
            onClick={() => onGenerate(true)}
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> {t('flashcardsRegenerate')}
          </Button>
        )}
      </div>

      <h1 className="mb-1 font-display text-2xl font-bold">{t('flashcardsTitle')}</h1>
      <p className="mb-6 text-sm text-muted-foreground">{content?.title}</p>

      {error && (
        <p className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
      )}

      {generating && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border p-10 text-center">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{t('generatingFlashcards')}</p>
        </div>
      )}

      {!generating && (!deck || deck.status === 'FAILED') && (
        <div className="rounded-2xl border border-dashed p-8 text-center">
          <div className="mb-3 text-4xl">🃏</div>
          <p className="mb-4 text-sm text-muted-foreground">
            {deck?.status === 'FAILED' ? t('flashcardsFailed') : t('noFlashcards')}
          </p>
          {!isLearner && (
            <Button type="button" disabled={generate.isPending} onClick={() => onGenerate(false)}>
              {generate.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t('generateFlashcards')}
            </Button>
          )}
        </div>
      )}

      {deck?.status === 'READY' && cards.length > 0 && (
        <div>
          {currentCard ? (
            <>
              <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>{t('cardProgress', { done: reviewed, total: cards.length })}</span>
                <span>{t('cardsLeft', { count: queue.length })}</span>
              </div>
              <button
                type="button"
                onClick={() => setFlipped((f) => !f)}
                className="flex min-h-[14rem] w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 bg-card p-8 text-center shadow-soft transition-colors hover:border-primary/40"
              >
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {flipped ? t('cardBack') : t('cardFront')}
                </span>
                <span className="text-lg font-medium">
                  {flipped ? currentCard.back : currentCard.front}
                </span>
                {!flipped && (
                  <span className="mt-2 text-[11px] text-muted-foreground">{t('tapToFlip')}</span>
                )}
              </button>
              {flipped && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Button variant="outline" type="button" onClick={() => advance(true)}>
                    {t('againBtn')}
                  </Button>
                  <Button type="button" onClick={() => advance(false)}>
                    {t('goodBtn')}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-2xl border p-8 text-center">
              <div className="mb-3 text-4xl">🎉</div>
              <p className="mb-4 text-sm text-muted-foreground">{t('deckComplete')}</p>
              <Button type="button" onClick={restart}>
                <RotateCcw className="mr-2 h-4 w-4" /> {t('restartDeck')}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
