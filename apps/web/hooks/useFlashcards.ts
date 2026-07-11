import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AppLocale,
  FlashcardDeck,
  FlashcardGrade,
  FlashcardReviewState,
  MasteryDelta,
} from '@talim/types';
import { useLocale } from 'next-intl';
import { api } from '@/lib/api';
import { useContentBase } from '@/hooks/useContentBase';
import { useJobStreamStore } from '@/store/useJobStreamStore';

export function useFlashcards(contentId: string, sectionId?: string) {
  const locale = useLocale() as AppLocale;
  const base = useContentBase();
  const connected = useJobStreamStore((s) => s.connected);

  return useQuery({
    queryKey: ['flashcards', contentId, sectionId ?? 'full', locale],
    queryFn: async () => {
      const { data } = await api.get<{ deck: FlashcardDeck | null }>(
        `${base}/${contentId}/flashcards`,
        { params: { locale, ...(sectionId ? { sectionId } : {}) } },
      );
      return data.deck;
    },
    enabled: !!contentId,
    // SSE-primary (generateFlashcards publishes flashcards.status); slow safety-net poll only
    // while a deck is still generating and the stream is disconnected.
    refetchInterval: (query) => {
      const status = (query.state.data as FlashcardDeck | null | undefined)?.status;
      if (status !== 'GENERATING' && status !== 'PENDING') return false;
      return connected ? 30_000 : 4000;
    },
  });
}

export function useGenerateFlashcards(contentId: string, sectionId?: string) {
  const locale = useLocale() as AppLocale;
  const base = useContentBase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input?: { regenerate?: boolean; count?: number }) => {
      const { data } = await api.post<{ deck: FlashcardDeck }>(`${base}/${contentId}/flashcards`, {
        locale,
        ...(sectionId ? { sectionId } : {}),
        ...(input?.regenerate ? { regenerate: true } : {}),
        ...(input?.count ? { count: input.count } : {}),
      });
      return data.deck;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['flashcards', contentId] }),
  });
}

export function useReviewFlashcard(contentId: string) {
  const base = useContentBase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cardId, grade }: { cardId: string; grade: FlashcardGrade }) => {
      const { data } = await api.post<{
        review: FlashcardReviewState;
        masteryDeltas?: MasteryDelta[];
      }>(`${base}/${contentId}/flashcards/${cardId}/review`, { grade });
      return data;
    },
    // Refresh due state / dueCount after grading; reviews also feed the mastery engine,
    // so refresh the Learn-panel mastery list whenever the server reports movement.
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['flashcards', contentId] });
      if (data.masteryDeltas?.length) {
        void queryClient.invalidateQueries({ queryKey: ['mastery', contentId] });
      }
    },
  });
}
