import { useQuery } from '@tanstack/react-query';
import type { ContentTranscriptResponse } from '@talim/types';
import { api } from '@/lib/api';
import { useContentBase } from '@/hooks/useContentBase';

export function useTranscript(contentId: string, enabled = true) {
  const base = useContentBase();
  return useQuery({
    queryKey: ['content-transcript', contentId],
    queryFn: async () => {
      const { data } = await api.get<ContentTranscriptResponse>(`${base}/${contentId}/transcript`);
      return data.transcript;
    },
    enabled: enabled && !!contentId,
  });
}
