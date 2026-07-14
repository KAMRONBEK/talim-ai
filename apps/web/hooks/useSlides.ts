import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import type { AppLocale, ContentSlideDeck, DeckAudience } from '@talim/types';
import { api } from '@/lib/api';
import { contentEndpoints } from '@/lib/api/endpoints';
import { useAuthStore } from '@/store/useAuthStore';
import { useJobStreamStore } from '@/store/useJobStreamStore';
import { inFlightRefetchInterval } from '@/lib/pushPrimaryInterval';

function slidesKey(contentId: string, sectionId: string | undefined, locale: string) {
  return ['slides', contentId, sectionId ?? 'full', locale] as const;
}

export function useSlides(contentId: string, sectionId?: string) {
  const locale = useLocale() as AppLocale;
  const isTenantOwner = useAuthStore((s) => s.user?.role === 'TENANT_OWNER');
  const connected = useJobStreamStore((s) => s.connected);

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
    // SSE-primary: slides.status events invalidate this query, so no polling while the
    // job stream is connected. While disconnected, keep the bounded fallback poll: the
    // deck may still be rendering from the ingest auto-generation right after upload
    // (any role — not just learners) or from an enqueued manual generation.
    refetchInterval: (query) => {
      const deck = query.state.data as ContentSlideDeck | null | undefined;
      // An in-flight generation (202 flow) keeps a slow safety-net poll even while the
      // event stream is connected: the READY/FAILED publish is fire-and-forget, so a
      // lost event must not wedge the UI (same pattern as the other media hooks).
      if (deck?.status === 'GENERATING') return inFlightRefetchInterval(true, connected);
      if (connected) return false;
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
    // The POST now returns 202 with the GENERATING row (or 200 with a cached READY
    // deck). Seed the cache so the UI flips to "generating" instantly, then invalidate
    // so the query owns the state; completion arrives via the slides.status SSE event.
    onSuccess: (deck) => {
      queryClient.setQueryData(slidesKey(contentId, sectionId, locale), deck);
      queryClient.invalidateQueries({ queryKey: slidesKey(contentId, sectionId, locale) });
    },
  });
}
