import { useQuery } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import type { AppLocale, ChatMessage, ChatSessionResponse } from '@talim/types';
import { api } from '@/lib/api';

/** How long after an unanswered question we keep expecting an answer to arrive. */
const ANSWER_WINDOW_MS = 3 * 60_000;
/** Poll cadence while inside that window. */
const UNANSWERED_POLL_MS = 4_000;

/**
 * A conversation whose last message is the learner's own question has no answer yet: either the
 * tutor is still writing it, or generation died. Both matter to the UI — the first needs to be
 * waited for, the second needs to stop being waited for.
 */
export function isAwaitingAnswer(messages: ChatMessage[] | undefined): boolean {
  const last = messages?.[messages.length - 1];
  return last?.role === 'USER';
}

/** True while an unanswered question is recent enough that an answer could still land. */
export function isAnswerStillExpected(messages: ChatMessage[] | undefined, now: number): boolean {
  const last = messages?.[messages.length - 1];
  if (last?.role !== 'USER') return false;
  const asked = Date.parse(last.createdAt);
  return Number.isFinite(asked) && now - asked < ANSWER_WINDOW_MS;
}

export function useChatSession(contentId: string) {
  const locale = useLocale() as AppLocale;

  return useQuery({
    queryKey: ['chat-session', contentId, locale],
    queryFn: async () => {
      const { data } = await api.get<ChatSessionResponse>(`/chat/content/${contentId}/messages`);
      return data;
    },
    enabled: !!contentId,
    // The tutor stream is delivered over the request that started it, so reloading mid-answer
    // leaves the page with nothing listening. The server's `chat.message` SSE event covers an
    // answer that lands after we reconnect; this poll covers one that lands DURING the reload,
    // when there was no client to receive the event — otherwise the question sits alone until
    // the user happens to reload again.
    //
    // Bounded by ANSWER_WINDOW_MS so a generation that actually failed (nothing is ever
    // written) stops being polled for instead of hitting the API every 4s forever.
    refetchInterval: (query) =>
      isAnswerStillExpected(query.state.data?.messages, Date.now()) ? UNANSWERED_POLL_MS : false,
  });
}
