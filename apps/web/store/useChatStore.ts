import { create } from 'zustand';
import type { MessageRole } from '@talim/types';
import { getApiBaseUrl } from '@/lib/api';
import { useAuthStore } from './useAuthStore';

export interface LocalChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  streaming?: boolean;
}

interface ChatState {
  sessionId: string | null;
  messages: LocalChatMessage[];
  isStreaming: boolean;
  setSessionId: (id: string | null) => void;
  setMessages: (messages: LocalChatMessage[]) => void;
  addMessage: (message: LocalChatMessage) => void;
  updateStreamingMessage: (id: string, text: string) => void;
  streamMessage: (contentId: string, message: string) => Promise<void>;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessionId: null,
  messages: [],
  isStreaming: false,
  setSessionId: (id) => set({ sessionId: id }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  updateStreamingMessage: (id, text) =>
    set((state) => ({
      messages: state.messages.map((m) => (m.id === id ? { ...m, text, streaming: true } : m)),
    })),
  reset: () => set({ sessionId: null, messages: [], isStreaming: false }),
  streamMessage: async (contentId, message) => {
    const token = useAuthStore.getState().token;
    if (!token) throw new Error('Not authenticated');

    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `assistant-${Date.now()}`;

    set((state) => ({
      isStreaming: true,
      messages: [
        ...state.messages,
        { id: userMsgId, role: 'USER', text: message },
        { id: assistantMsgId, role: 'ASSISTANT', text: '', streaming: true },
      ],
    }));

    const response = await fetch(`${getApiBaseUrl()}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        contentId,
        message,
        sessionId: get().sessionId ?? undefined,
      }),
    });

    if (!response.ok || !response.body) {
      set({ isStreaming: false });
      throw new Error('Failed to stream chat response');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data) as { text?: string; sessionId?: string; error?: string };
          if (parsed.sessionId) {
            set({ sessionId: parsed.sessionId });
          }
          if (parsed.text) {
            fullText += parsed.text;
            get().updateStreamingMessage(assistantMsgId, fullText);
          }
        } catch {
          // skip malformed chunks
        }
      }
    }

    set((state) => ({
      isStreaming: false,
      messages: state.messages.map((m) =>
        m.id === assistantMsgId ? { ...m, text: fullText, streaming: false } : m,
      ),
    }));
  },
}));
