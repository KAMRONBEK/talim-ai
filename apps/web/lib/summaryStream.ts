import { getApiBaseUrl } from '@/lib/api';
import { getApiLocale } from '@/lib/locale-api';
import { useAuthStore } from '@/store/useAuthStore';

/** Shape of the persisted summary the server emits in its final SSE frame. */
export interface StreamedSummary {
  id: string;
  contentId: string;
  sectionId: string | null;
  scopeKey: string;
  locale: string;
  summary: string;
  createdAt: string;
}

export interface SummaryStreamOptions {
  contentId: string;
  sectionId?: string;
  /** Called with the ACCUMULATED text after every token frame. */
  onText?: (fullText: string) => void;
  signal?: AbortSignal;
}

/**
 * Streams POST /summary/:contentId/stream token-by-token (same SSE transport as
 * the AI tutor — see useChatStore.streamMessage) and resolves with the persisted
 * summary from the final `data: {"summary": ...}` frame. Non-OK responses are
 * rethrown axios-shaped ({ response: { status, data } }) so classifyLimitError /
 * useLimitErrorHandler can route quota errors to the upgrade modal.
 */
export async function streamSummaryGeneration(
  options: SummaryStreamOptions,
): Promise<StreamedSummary> {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${getApiBaseUrl()}/summary/${options.contentId}/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'Accept-Language': getApiLocale(),
    },
    body: JSON.stringify({
      ...(options.sectionId ? { sectionId: options.sectionId } : {}),
      locale: getApiLocale(),
    }),
    signal: options.signal,
  });

  if (!response.ok || !response.body) {
    // Access/quota/context errors are raised before the SSE headers flush, so
    // they arrive as plain JSON — surface them axios-shaped for the limit handler.
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      /* non-JSON error body */
    }
    throw Object.assign(new Error('summary_stream_failed'), {
      response: { status: response.status, data },
    });
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';
  let finalSummary: StreamedSummary | null = null;
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
          summary?: StreamedSummary;
          error?: string;
        };
        if (parsed.error) {
          // Mid-stream server failure — flag it; the missing [DONE]/summary frame
          // makes the whole call reject below (chat's pattern).
          streamFailed = true;
        }
        if (parsed.text) {
          fullText += parsed.text;
          options.onText?.(fullText);
        }
        if (parsed.summary) {
          finalSummary = parsed.summary;
        }
      } catch {
        // skip malformed chunks
      }
    }
  }

  if (streamFailed || !finalSummary) {
    throw new Error('summary_stream_failed');
  }

  return finalSummary;
}
