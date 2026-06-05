import { useQuery } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import type { AppLocale, ContentVideo } from '@talim/types';
import { api } from '@/lib/api';

export function useVideo(contentId: string, sectionId?: string) {
  const locale = useLocale() as AppLocale;

  return useQuery({
    queryKey: ['video', contentId, sectionId ?? 'full', locale],
    queryFn: async () => {
      const { data } = await api.get<{ video: ContentVideo | null }>(`/content/${contentId}/video`, {
        params: { locale, ...(sectionId ? { sectionId } : {}) },
      });
      return data.video;
    },
    enabled: !!contentId,
  });
}
