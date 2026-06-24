import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Podcast } from '@talim/types';
import { useLocale } from 'next-intl';
import type { AppLocale } from '@talim/types';
import { api } from '@/lib/api';
import { useContentBase } from '@/hooks/useContentBase';

export function usePodcast(contentId: string, pollMs?: number) {
  const locale = useLocale() as AppLocale;
  const base = useContentBase();

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
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'GENERATING' || status === 'PENDING') return pollMs ?? 3000;
      return false;
    },
  });
}

export function useCreatePodcast() {
  const queryClient = useQueryClient();
  const locale = useLocale() as AppLocale;
  const base = useContentBase();

  return useMutation({
    mutationFn: async ({ contentId }: { contentId: string }) => {
      const { data } = await api.post<{ podcast: { id: string; status: string } }>(
        `${base}/${contentId}/podcast`,
        { locale },
      );
      return data.podcast;
    },
    onSuccess: (_, { contentId }) => {
      queryClient.invalidateQueries({ queryKey: ['podcast', contentId, locale] });
    },
  });
}
