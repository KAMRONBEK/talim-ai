import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Podcast } from '@talim/types';
import { api } from '@/lib/api';

export function usePodcast(contentId: string, pollMs?: number) {
  return useQuery({
    queryKey: ['podcast', contentId],
    queryFn: async () => {
      const { data } = await api.get<{ podcast: Podcast | null }>(`/content/${contentId}/podcast`);
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
  return useMutation({
    mutationFn: async (contentId: string) => {
      const { data } = await api.post<{ podcast: { id: string; status: string } }>(
        `/content/${contentId}/podcast`,
      );
      return data.podcast;
    },
    onSuccess: (_, contentId) => {
      queryClient.invalidateQueries({ queryKey: ['podcast', contentId] });
    },
  });
}
