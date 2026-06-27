import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Podcast } from '@talim/types';
import { useLocale } from 'next-intl';
import type { AppLocale } from '@talim/types';
import { api } from '@/lib/api';
import { useContentBase } from '@/hooks/useContentBase';
import { useJobStreamStore } from '@/store/useJobStreamStore';

export function usePodcast(contentId: string, pollMs?: number) {
  const locale = useLocale() as AppLocale;
  const base = useContentBase();
  const connected = useJobStreamStore((s) => s.connected);

  return useQuery({
    queryKey: ['podcast', contentId, locale],
    queryFn: async () => {
      const { data } = await api.get<{ podcast: Podcast | null }>(
        `${base}/${contentId}/podcast`,
        { params: { locale } },
      );
      return data.podcast;
    },
    enabled: !!contentId,
    // SSE-primary (generatePodcast publishes podcast.status); slow safety-net poll only
    // while disconnected.
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status !== 'GENERATING' && status !== 'PENDING') return false;
      return connected ? 30_000 : (pollMs ?? 3000);
    },
  });
}

export function useCreatePodcast() {
  const queryClient = useQueryClient();
  const locale = useLocale() as AppLocale;
  const base = useContentBase();

  return useMutation({
    mutationFn: async ({
      contentId,
      regenerate,
    }: {
      contentId: string;
      regenerate?: boolean;
    }) => {
      const { data } = await api.post<{ podcast: { id: string; status: string } }>(
        `${base}/${contentId}/podcast`,
        { locale, ...(regenerate ? { regenerate: true } : {}) },
      );
      return data.podcast;
    },
    onSuccess: (_, { contentId }) => {
      queryClient.invalidateQueries({ queryKey: ['podcast', contentId, locale] });
    },
  });
}

/** Manual per-section trigger: (re)generate a single episode. */
export function useRegenerateEpisode(contentId: string) {
  const queryClient = useQueryClient();
  const locale = useLocale() as AppLocale;
  const base = useContentBase();

  return useMutation({
    mutationFn: async ({ episodeId }: { episodeId: string }) => {
      const { data } = await api.post<{ podcast: { id: string; status: string } }>(
        `${base}/${contentId}/podcast/episodes/${episodeId}/regenerate`,
        { locale },
      );
      return data.podcast;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['podcast', contentId, locale] });
    },
  });
}
