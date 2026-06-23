import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import type { AppLocale, ContentSlideDeck, DeckAudience } from '@talim/types';
import { api } from '@/lib/api';
import { contentEndpoints } from '@/lib/api/endpoints';
import { useAuthStore } from '@/store/useAuthStore';

function slidesKey(contentId: string, sectionId: string | undefined, locale: string) {
  return ['slides', contentId, sectionId ?? 'full', locale] as const;
}

export function useSlides(contentId: string, sectionId?: string) {
  const locale = useLocale() as AppLocale;
  const role = useAuthStore((s) => s.user?.role);
  const isTenantOwner = role === 'TENANT_OWNER';
  const isLearner = role === 'TENANT_LEARNER';

  return useQuery({
    queryKey: slidesKey(contentId, sectionId, locale),
    queryFn: async () => {
      const { data } = await api.get<{ slides: ContentSlideDeck | null }>(
        contentEndpoints.slides(contentId, isTenantOwner),
        { params: { locale, ...(sectionId ? { sectionId } : {}) } },
      );
      return data.slides;
    },
    enabled: !!contentId,
    // A learner can't trigger generation; the deck may still be rendering from
    // ingest right after upload. Poll briefly so it appears without a manual
    // refresh, then give up (the section falls back to text).
    refetchInterval: (query) => {
      if (!isLearner) return false;
      const deck = query.state.data as ContentSlideDeck | null | undefined;
      if (deck?.deck) return false;
      // Stop after ~6 empty polls (deck never arrived) or a persistent fetch error,
      // so a missing deck or a 403/404 doesn't poll forever.
      if (query.state.dataUpdateCount >= 6 || query.state.fetchFailureCount >= 3) return false;
      return 5000;
    },
  });
}

export function useGenerateSlides(contentId: string, sectionId?: string) {
  const locale = useLocale() as AppLocale;
  const isTenantOwner = useAuthStore((s) => s.user?.role === 'TENANT_OWNER');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input?: { audience?: DeckAudience }) => {
      const { data } = await api.post<{ slides: ContentSlideDeck }>(
        contentEndpoints.slides(contentId, isTenantOwner),
        { locale, ...(sectionId ? { sectionId } : {}), ...(input?.audience ? { audience: input.audience } : {}) },
      );
      return data.slides;
    },
    onSuccess: (deck) => {
      queryClient.setQueryData(slidesKey(contentId, sectionId, locale), deck);
    },
  });
}
