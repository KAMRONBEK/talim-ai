import { getApiBaseUrl } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

/** Carries the HTTP status so callers can distinguish permanent (4xx) from transient failures. */
export class BlobFetchError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'BlobFetchError';
    this.status = status;
  }
}

export interface FetchBlobOptions {
  /** External abort (e.g. component unmount) — cancels the in-flight transfer. */
  signal?: AbortSignal;
  /**
   * When set, the body is streamed and the request is aborted if no bytes arrive
   * within this window. This distinguishes a dead/stalled connection (which never
   * errors on its own) from a slow-but-progressing one: the timer resets on every
   * chunk, so a download that is still making progress is never aborted. Opt-in —
   * callers that omit it keep the original single-shot `response.blob()` behaviour.
   */
  stallTimeoutMs?: number;
}

export async function fetchAuthenticatedBlob(path: string, options?: FetchBlobOptions): Promise<string> {
  const token = useAuthStore.getState().token;
  if (!token) throw new BlobFetchError('Not authenticated');

  // Internal controller drives the actual fetch; an external signal (unmount) and the
  // stall timer both abort through it.
  const controller = new AbortController();
  const onExternalAbort = () => controller.abort();
  options?.signal?.addEventListener('abort', onExternalAbort);
  if (options?.signal?.aborted) controller.abort();

  const stallMs = options?.stallTimeoutMs;
  let stallTimer: ReturnType<typeof setTimeout> | null = null;
  const armStall = () => {
    if (stallMs == null) return;
    if (stallTimer) clearTimeout(stallTimer);
    stallTimer = setTimeout(() => controller.abort(), stallMs);
  };

  try {
    armStall();
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });
    if (!response.ok) throw new BlobFetchError('Failed to fetch resource', response.status);

    // Default path (no stall window, or no streaming support): single read.
    if (stallMs == null || !response.body) {
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    }

    // Streamed read so the stall timer resets on each chunk of progress.
    const reader = response.body.getReader();
    const chunks: BlobPart[] = [];
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        armStall();
      }
    }
    const type = response.headers.get('Content-Type') ?? 'application/octet-stream';
    return URL.createObjectURL(new Blob(chunks, { type }));
  } finally {
    if (stallTimer) clearTimeout(stallTimer);
    options?.signal?.removeEventListener('abort', onExternalAbort);
  }
}
