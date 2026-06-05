import { useQuery } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import type { AppLocale, ContentSection } from '@talim/types';
import { api } from '@/lib/api';

export function useSections(contentId: string) {
  const locale = useLocale() as AppLocale;

  return useQuery({
    queryKey: ['sections', contentId, locale],
    queryFn: async () => {
      const { data } = await api.get<{ sections: ContentSection[] }>(
        `/content/${contentId}/sections`,
      );
      return data.sections;
    },
    enabled: !!contentId,
  });
}

export function useSection(contentId: string, sectionId: string | undefined) {
  const locale = useLocale() as AppLocale;

  return useQuery({
    queryKey: ['section', contentId, sectionId, locale],
    queryFn: async () => {
      const { data } = await api.get<{ section: ContentSection; body: string }>(
        `/content/${contentId}/sections/${sectionId}`,
      );
      return data;
    },
    enabled: !!contentId && !!sectionId,
  });
}
