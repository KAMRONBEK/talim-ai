import { useQuery } from '@tanstack/react-query';
import type { ContentTranscriptResponse } from '@talim/types';
import { api } from '@/lib/api';

export function useTranscript(contentId: string, enabled = true) {
  return useQuery({
    queryKey: ['content-transcript', contentId],
    queryFn: async () => {
      const { data } = await api.get<ContentTranscriptResponse>(`/content/${contentId}/transcript`);
      return data.transcript;
    },
    enabled: enabled && !!contentId,
  });
}
