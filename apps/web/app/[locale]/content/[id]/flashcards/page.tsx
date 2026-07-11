'use client';

import { use, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@talim/ui';
import { ArrowLeft, Loader2, RefreshCw, RotateCcw, Sparkles } from 'lucide-react';
import type { Flashcard, FlashcardGrade } from '@talim/types';
import { useContent } from '@/hooks/useContent';
import { useAuthStore } from '@/store/useAuthStore';
import { useFlashcards, useGenerateFlashcards, useReviewFlashcard } from '@/hooks/useFlashcards';
import { useLimitErrorHandler } from '@/hooks/useLimitErrorHandler';

// SRS grade buttons shown after a card is flipped, hardest → easiest.
const GRADES: { grade: FlashcardGrade; key: 'againBtn' | 'hardBtn' | 'goodBtn' | 'easyBtn' }[] = [
  { grade: 'again', key: 'againBtn' },
  { grade: 'hard', key: 'hardBtn' },
  { grade: 'good', key: 'goodBtn' },
  { grade: 'easy', key: 'easyBtn' },
];

function FlashcardsInner({ id }: { id: string }) {
  const t = useTranslations('content');
  // Decks are scope-keyed server-side: ?section=<id> shows/generates that section's deck
  // (the Practice generator links here after a section-scoped generation).
  const searchParams = useSearchParams();
  const sectionId = searchParams.get('section') ?? undefined;
  const { data: content } = useContent(id);
  const { data: deck } = useFlashcards(id, sectionId);
  const generate = useGenerateFlashcards(id, sectionId);
  const review = useReviewFlashcard(id);
  const handleLimitError = useLimitErrorHandler();
  const isLearner = useAuthStore((s) => s.user?.role === 'TENANT_LEARNER');

  const [error, setError] = useState<string | null>(null);
  const cards = useMemo<Flashcard[]>(() => deck?.cards ?? [], [deck]);
  const dueCount = deck?.dueCount ?? 0;

  // Study session: a local queue of card ids ("Again" re-queues to the end), the flip state, a
  // count of graded cards, whether the session covers all cards (vs. due-only), and the session
  // size for the progress readout.
  const [started, setStarted] = useState(false);
  const [reviewAll, setReviewAll] = useState(false);
  const [queue, setQueue] = useState<string[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [sessionTotal, setSessionTotal] = useState(0);

  // Initialize the session ONCE per deck. Keyed on the deck id (not the cards array), so the
  // background refetch triggered by grading a card does not reset the in-progress queue.
  const initedDeckRef = useRef<string | null>(null);
  useEffect(() => {
    if (!deck || deck.status !== 'READY') {
      initedDeckRef.current = null;
      return;
    }
    if (initedDeckRef.current === deck.id) return;
    initedDeckRef.current = deck.id;
    const due = cards.filter((c) => c.due).map((c) => c.id);
    setReviewAll(false);
    setReviewed(0);
    setFlipped(false);
    if (due.length > 0) {
      setStarted(true);
      setQueue(due);
      setSessionTotal(due.length);
    } else {
      // Nothing due — land on the "all caught up" screen.
      setStarted(false);
      setQueue([]);
      setSessionTotal(0);
    }
  }, [deck, cards]);

  const startSession = (all: boolean) => {
    const ids = (all ? cards : cards.filter((c) => c.due)).map((c) => c.id);
    setReviewAll(all);
    setStarted(true);
    setQueue(ids);
    setSessionTotal(ids.length);
    setReviewed(0);
    setFlipped(false);
    setError(null);
  };

  const onGenerate = (regenerate = false) => {
    setError(null);
    generate.mutate(
      { regenerate },
      { onError: (e) => setError(handleLimitError(e, t('generationFailed'))) },
    );
  };

  const currentId = queue[0];
  const currentCard = currentId ? cards.find((c) => c.id === currentId) : undefined;

  const onGrade = (grade: FlashcardGrade) => {
    const cardId = queue[0];
    if (!cardId) return;
    setError(null);
    review.mutate({ cardId, grade }, { onError: () => setError(t('reviewFailed')) });
    setQueue((prev) => {
      const [head, ...rest] = prev;
      // "Again" re-queues the card to the end of this session.
      return grade === 'again' && head !== undefined ? [...rest, head] : rest;
    });
    setFlipped(false);
    if (grade !== 'again') setReviewed((n) => n + 1);
  };

  const generating =
    deck?.status === 'GENERATING' || deck?.status === 'PENDING' || (generate.isPending && !deck);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link
          href={sectionId ? `/content/${id}?section=${sectionId}` : `/content/${id}`}
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
          {started && currentCard ? (
            <>
              <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>{t('cardProgress', { done: reviewed, total: sessionTotal })}</span>
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
              {flipped ? (
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {GRADES.map(({ grade, key }) => (
                    <Button
                      key={grade}
                      variant={grade === 'again' ? 'outline' : grade === 'easy' ? 'default' : 'secondary'}
                      type="button"
                      className="text-xs sm:text-sm"
                      onClick={() => onGrade(grade)}
                    >
                      {t(key)}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  {t('flipToGrade')}
                </p>
              )}
            </>
          ) : started ? (
            // Queue drained after grading — session complete.
            <div className="rounded-2xl border p-8 text-center">
              <div className="mb-3 text-4xl">🎉</div>
              <p className="mb-4 text-sm text-muted-foreground">{t('deckComplete')}</p>
              <Button type="button" onClick={() => startSession(true)}>
                <RotateCcw className="mr-2 h-4 w-4" /> {t('restartDeck')}
              </Button>
            </div>
          ) : (
            // Nothing due right now — offer to review the whole deck anyway.
            <div className="rounded-2xl border border-dashed p-8 text-center">
              <div className="mb-3 flex justify-center">
                <Sparkles className="h-9 w-9 text-primary" />
              </div>
              <p className="mb-1 font-medium">{t('allCaughtUp')}</p>
              <p className="mb-4 text-sm text-muted-foreground">{t('allCaughtUpDesc')}</p>
              <Button type="button" variant="outline" onClick={() => startSession(true)}>
                {t('reviewAll')}
              </Button>
            </div>
          )}

          {!started && dueCount > 0 && (
            <p className="mt-4 text-center text-xs text-muted-foreground">
              {t('flashcardsDue', { count: dueCount })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function FlashcardsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  // useSearchParams needs a Suspense boundary during prerender.
  return (
    <Suspense fallback={null}>
      <FlashcardsInner id={id} />
    </Suspense>
  );
}
