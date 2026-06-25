import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import type { AppLocale, ContentVideo } from '@talim/types';
import { api } from '@/lib/api';
import { useContentBase } from '@/hooks/useContentBase';

function videoKey(contentId: string, sectionId: string | undefined, locale: string) {
  return ['video', contentId, sectionId ?? 'full', locale] as const;
}

export function useVideo(contentId: string, sectionId?: string) {
  const locale = useLocale() as AppLocale;
  const base = useContentBase();

  return useQuery({
    queryKey: videoKey(contentId, sectionId, locale),
    queryFn: async () => {
      const { data } = await api.get<{ video: ContentVideo | null }>(`${base}/${contentId}/video`, {
        params: { locale, ...(sectionId ? { sectionId } : {}) },
      });
      return data.video;
    },
    enabled: !!contentId,
    // Poll while the narrated slideshow is still rendering so it appears without
    // a manual refresh, then stop once it's READY/FAILED.
    refetchInterval: (query) => {
      const video = query.state.data as ContentVideo | null | undefined;
      if (video && (video.status === 'GENERATING' || video.status === 'PENDING')) return 4000;
      return false;
    },
  });
}

export function useGenerateVideo(contentId: string, sectionId?: string) {
  const locale = useLocale() as AppLocale;
  const base = useContentBase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input?: { regenerate?: boolean }) => {
      const { data } = await api.post<{ video: ContentVideo }>(`${base}/${contentId}/video`, {
        locale,
        ...(sectionId ? { sectionId } : {}),
        ...(input?.regenerate ? { regenerate: true } : {}),
      });
      return data.video;
    },
    onSuccess: (video) => {
      queryClient.setQueryData(videoKey(contentId, sectionId, locale), video);
    },
  });
}
