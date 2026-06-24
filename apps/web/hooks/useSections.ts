import { useQuery } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import type { AppLocale, ContentSection } from '@talim/types';
import { api } from '@/lib/api';
import { useContentBase } from '@/hooks/useContentBase';

export function useSections(contentId: string) {
  const locale = useLocale() as AppLocale;
  const base = useContentBase();

  return useQuery({
    queryKey: ['sections', contentId, locale],
    queryFn: async () => {
      const { data } = await api.get<{ sections: ContentSection[] }>(
        `${base}/${contentId}/sections`,
      );
      return data.sections;
    },
    enabled: !!contentId,
  });
}

export function useSection(contentId: string, sectionId: string | undefined) {
  const locale = useLocale() as AppLocale;
  const base = useContentBase();

  return useQuery({
    queryKey: ['section', contentId, sectionId, locale],
    queryFn: async () => {
      const { data } = await api.get<{ section: ContentSection; body: string }>(
        `${base}/${contentId}/sections/${sectionId}`,
      );
      return data;
    },
    enabled: !!contentId && !!sectionId,
  });
}
