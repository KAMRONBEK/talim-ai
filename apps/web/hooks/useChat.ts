import { useQuery } from '@tanstack/react-query';
import type { ChatMessage } from '@talim/types';
import { api } from '@/lib/api';

export function useChatMessages(sessionId: string | null) {
  return useQuery({
    queryKey: ['chat-messages', sessionId],
    queryFn: async () => {
      const { data } = await api.get<{ messages: ChatMessage[] }>(
        `/chat/sessions/${sessionId}/messages`,
      );
      return data.messages;
    },
    enabled: !!sessionId,
  });
}
