import { useQuery } from '@tanstack/react-query';
import type { ContentTranscriptResponse } from '@talim/types';
import { api } from '@/lib/api';
import { useContentBase } from '@/hooks/useContentBase';
import { useJobStreamStore } from '@/store/useJobStreamStore';
import { inFlightRefetchInterval } from '@/lib/pushPrimaryInterval';

export function useTranscript(contentId: string, enabled = true) {
  const base = useContentBase();
  const connected = useJobStreamStore((s) => s.connected);
  return useQuery({
    queryKey: ['content-transcript', contentId],
    queryFn: async () => {
      const { data } = await api.get<ContentTranscriptResponse>(`${base}/${contentId}/transcript`);
      return data.transcript;
    },
    enabled: enabled && !!contentId,
    // SSE-primary (the backfill job publishes transcript.status); slow safety-net
    // poll while transcribing, fast fallback only when disconnected.
    refetchInterval: (query) =>
      inFlightRefetchInterval(query.state.data?.status === 'transcribing', connected, {
        fallbackMs: 3_000,
      }),
  });
}
