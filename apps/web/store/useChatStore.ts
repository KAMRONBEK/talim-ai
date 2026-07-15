import { create } from 'zustand';
import type { ChatMessage, DesmosGraphPayload, MessageRole, VisualBlock } from '@talim/types';
import { serializeGraphBlock, serializeVisualBlock } from '@talim/types';
import { getApiBaseUrl } from '@/lib/api';
import { getApiLocale } from '@/lib/locale-api';
import { useAuthStore } from './useAuthStore';

interface LocalChatMessage {
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
  /**
   * A prompt queued from a text selection ("Ask AI about selection") in the
   * readable content. The tutor and the reader live in different subtrees (the
   * chat only mounts on the Chat tab), so this store is the cross-component
   * channel: the reader sets it, ChatWindow consumes it to prefill + focus the
   * composer. Kept independent of reset()/hydrate() so a seed set just before
   * the Chat tab opens survives the mount.
   */
  seededPrompt: string | null;
  seedPrompt: (prompt: string) => void;
  clearSeededPrompt: () => void;
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
  seededPrompt: null,
  seedPrompt: (prompt) => set({ seededPrompt: prompt }),
  clearSeededPrompt: () => set({ seededPrompt: null }),
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
        {
          id: userMsgId,
          role: 'USER',
          text: message,
          excerpt: selectedExcerpt,
          excerptImage: selectedImage,
        },
        { id: assistantMsgId, role: 'ASSISTANT', text: '', streaming: true },
      ],
    }));

    try {
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
        // Surface limit errors (402 TUTOR_MESSAGE quota etc.) as an axios-shaped
        // error so the caller can classify it and open the promotion modal. The
        // catch below clears the optimistic bubbles + unlocks the composer.
        let data: unknown;
        try {
          data = await response.json();
        } catch {
          /* non-JSON error body */
        }
        throw Object.assign(new Error('chat_stream_failed'), {
          response: { status: response.status, data },
        });
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';
      let streamFailed = false;

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
              // Mid-stream server error: flag it and let the outer catch remove the
              // optimistic bubbles + surface a localized message via ChatWindow — don't
              // render the raw English server string (it also wouldn't persist → ghost).
              streamFailed = true;
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

      if (streamFailed) throw new Error('chat_stream_failed');

      set((state) => ({
        isStreaming: false,
        messages: state.messages.map((m) =>
          m.id === assistantMsgId ? { ...m, text: fullText, streaming: false } : m,
        ),
      }));
    } catch (err) {
      // Any failure — non-OK response, network reject, or a mid-stream read error —
      // unlocks the composer and removes the optimistic user + assistant bubbles so
      // nothing is left half-sent. The caller (ChatWindow) restores the input text
      // and surfaces the error / opens the upgrade modal.
      set((state) => ({
        isStreaming: false,
        messages: state.messages.filter((m) => m.id !== userMsgId && m.id !== assistantMsgId),
      }));
      throw err;
    }
  },
}));
