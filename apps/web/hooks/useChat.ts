import { useQuery } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import type { AppLocale, ChatSessionResponse } from '@talim/types';
import { api } from '@/lib/api';

export function useChatSession(contentId: string) {
  const locale = useLocale() as AppLocale;

  return useQuery({
    queryKey: ['chat-session', contentId, locale],
    queryFn: async () => {
      const { data } = await api.get<ChatSessionResponse>(`/chat/content/${contentId}/messages`);
      return data;
    },
    enabled: !!contentId,
  });
}

/** @deprecated Use useChatSession(contentId) instead */
function useChatMessages(sessionId: string | null) {
  return useQuery({
    queryKey: ['chat-messages', sessionId],
    queryFn: async () => {
      const { data } = await api.get<{ messages: ChatSessionResponse['messages'] }>(
        `/chat/sessions/${sessionId}/messages`,
      );
      return data.messages;
    },
    enabled: !!sessionId,
  });
}
