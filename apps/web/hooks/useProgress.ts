import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import type { AppLocale, ContentProgressResponse, LearningHistory } from '@talim/types';
import { api } from '@/lib/api';

export function useContentProgress(contentId: string) {
  return useQuery({
    queryKey: ['progress', contentId],
    queryFn: async () => {
      const { data } = await api.get<ContentProgressResponse>(`/content/${contentId}/progress`);
      return data;
    },
    enabled: !!contentId,
  });
}

export function useMarkSectionViewed(contentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sectionId: string) => {
      const { data } = await api.patch(`/content/${contentId}/progress`, { sectionId });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['progress', contentId] });
    },
  });
}

export function useLearningHistory(contentId: string) {
  const locale = useLocale() as AppLocale;

  return useQuery({
    queryKey: ['learning-history', contentId, locale],
    queryFn: async () => {
      const { data } = await api.get<LearningHistory>(`/content/${contentId}/learning-history`, {
        params: { locale },
      });
      return data;
    },
    enabled: !!contentId,
  });
}

export function usePodcastProgress(contentId: string) {
  const locale = useLocale() as AppLocale;

  return useQuery({
    queryKey: ['podcast-progress', contentId, locale],
    queryFn: async () => {
      const { data } = await api.get<{
        progress: { episodeId: string; listenedSec: number; completed: boolean }[];
      }>(`/content/${contentId}/podcast/progress`, { params: { locale } });
      return data.progress;
    },
    enabled: !!contentId,
  });
}

export function useUpdatePodcastProgress(contentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      episodeId,
      listenedSec,
      completed,
    }: {
      episodeId: string;
      listenedSec: number;
      completed?: boolean;
    }) => {
      const { data } = await api.patch(
        `/content/${contentId}/podcast/episodes/${episodeId}/progress`,
        { listenedSec, completed },
      );
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['podcast-progress', contentId] });
    },
  });
}
