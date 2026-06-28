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
  const isTenantOwner = useAuthStore((s) => s.user?.role === 'TENANT_OWNER');

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
    // The deck may still be rendering from the ingest auto-generation right after
    // upload (any role — not just learners). Poll briefly so it appears without a
    // manual refresh, then give up (the section falls back to text / Generate).
    refetchInterval: (query) => {
      const deck = query.state.data as ContentSlideDeck | null | undefined;
      if (deck?.deck) return false;
      // Stop after ~8 empty polls or a persistent fetch error so a missing deck or
      // a 403/404 doesn't poll forever.
      if (query.state.dataUpdateCount >= 8 || query.state.fetchFailureCount >= 3) return false;
      return 5000;
    },
  });
}

export function useGenerateSlides(contentId: string, sectionId?: string) {
  const locale = useLocale() as AppLocale;
  const isTenantOwner = useAuthStore((s) => s.user?.role === 'TENANT_OWNER');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input?: { audience?: DeckAudience; regenerate?: boolean }) => {
      const { data } = await api.post<{ slides: ContentSlideDeck }>(
        contentEndpoints.slides(contentId, isTenantOwner),
        {
          locale,
          ...(sectionId ? { sectionId } : {}),
          ...(input?.audience ? { audience: input.audience } : {}),
          ...(input?.regenerate ? { regenerate: true } : {}),
        },
      );
      return data.slides;
    },
    onSuccess: (deck) => {
      queryClient.setQueryData(slidesKey(contentId, sectionId, locale), deck);
    },
  });
}
