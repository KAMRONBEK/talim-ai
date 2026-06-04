import { useQuery } from '@tanstack/react-query';
import type { ContentSection } from '@talim/types';
import { api } from '@/lib/api';

export function useSections(contentId: string) {
  return useQuery({
    queryKey: ['sections', contentId],
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
  return useQuery({
    queryKey: ['section', contentId, sectionId],
    queryFn: async () => {
      const { data } = await api.get<{ section: ContentSection; body: string }>(
        `/content/${contentId}/sections/${sectionId}`,
      );
      return data;
    },
    enabled: !!contentId && !!sectionId,
  });
}
