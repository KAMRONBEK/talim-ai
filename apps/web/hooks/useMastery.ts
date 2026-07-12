import { useQuery } from '@tanstack/react-query';
import type { ContentMasteryResponse } from '@talim/types';
import { api } from '@/lib/api';
import { assessmentEndpoints } from '@/lib/api/endpoints';

/**
 * Per-section mastery for the current user on one material.
 * Query key is ['mastery', contentId] — invalidated by useSubmitQuiz and
 * useReviewFlashcard whenever an attempt/review moves mastery.
 */
export function useContentMastery(contentId: string) {
  return useQuery({
    queryKey: ['mastery', contentId],
    queryFn: async () => {
      const { data } = await api.get<ContentMasteryResponse>(
        assessmentEndpoints.contentMastery(contentId),
      );
      return data;
    },
    enabled: !!contentId,
  });
}
