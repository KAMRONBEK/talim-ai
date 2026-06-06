import { create } from 'zustand';
import type { ChatMessage, DesmosGraphPayload, MessageRole, VisualBlock } from '@talim/types';
import { serializeGraphBlock, serializeVisualBlock } from '@talim/types';
import { getApiBaseUrl } from '@/lib/api';
import { getApiLocale } from '@/lib/locale-api';
import { useAuthStore } from './useAuthStore';

export interface LocalChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  streaming?: boolean;
  excerpt?: string;
  excerptImage?: string;
}

interface ChatState {
  sessionId: string | null;
  messages: LocalChatMessage[];
  isStreaming: boolean;
  setSessionId: (id: string | null) => void;
  setMessages: (messages: LocalChatMessage[]) => void;
  addMessage: (message: LocalChatMessage) => void;
  updateStreamingMessage: (id: string, text: string) => void;
  streamMessage: (
    contentId: string,
    message: string,
    selectedExcerpt?: string,
    selectedImage?: string,
  ) => Promise<void>;
  hydrate: (sessionId: string | null, messages: ChatMessage[]) => void;
  reset: () => void;
}

function appendVisualToText(fullText: string, block: VisualBlock): string {
  return fullText + serializeVisualBlock(block);
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
  hydrate: (sessionId, messages) =>
    set({
      sessionId,
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        text: m.text,
        excerpt: m.excerpt ?? undefined,
        excerptImage: m.excerptImage ?? undefined,
      })),
      isStreaming: false,
    }),
  streamMessage: async (contentId, message, selectedExcerpt, selectedImage) => {
    const token = useAuthStore.getState().token;
    if (!token) throw new Error('Not authenticated');

    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `assistant-${Date.now()}`;

    set((state) => ({
      isStreaming: true,
      messages: [
        ...state.messages,
        { id: userMsgId, role: 'USER', text: message, excerpt: selectedExcerpt, excerptImage: selectedImage },
        { id: assistantMsgId, role: 'ASSISTANT', text: '', streaming: true },
      ],
    }));

    const response = await fetch(`${getApiBaseUrl()}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'Accept-Language': getApiLocale(),
      },
      body: JSON.stringify({
        contentId,
        message,
        sessionId: get().sessionId ?? undefined,
        selectedExcerpt,
        selectedImage,
        locale: getApiLocale(),
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
          const parsed = JSON.parse(data) as {
            text?: string;
            visual?: VisualBlock;
            graph?: DesmosGraphPayload;
            sessionId?: string;
            error?: string;
          };
          if (parsed.sessionId) {
            set({ sessionId: parsed.sessionId });
          }
          if (parsed.error) {
            fullText += fullText
              ? `\n\n${parsed.error}`
              : parsed.error;
            get().updateStreamingMessage(assistantMsgId, fullText);
          }
          if (parsed.visual) {
            fullText = appendVisualToText(fullText, parsed.visual);
            get().updateStreamingMessage(assistantMsgId, fullText);
          } else if (parsed.graph) {
            fullText += serializeGraphBlock(parsed.graph);
            get().updateStreamingMessage(assistantMsgId, fullText);
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
