import { getApiBaseUrl } from '@/lib/api';
import type { JobEvent } from '@talim/types';

type Listener = (e: JobEvent) => void;

/**
 * One SSE connection per tab to `GET /events`, pushing async-job completion events that
 * drive react-query invalidation (replacing 3–5s polling). Uses a fetch-based reader
 * (not `EventSource`) so the JWT goes in an `Authorization` header instead of the URL
 * (which would leak into nginx logs) — mirrors the chat stream reader. Auto-reconnects
 * with backoff + a frame watchdog, and resumes with `Last-Event-ID`.
 */
class JobStream {
  private listeners = new Set<Listener>();
  private connectedCbs = new Set<(c: boolean) => void>();
  private abort?: AbortController;
  private lastEventId = '';
  private backoff = 1000;
  private started = false;

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  onConnected(fn: (c: boolean) => void): () => void {
    this.connectedCbs.add(fn);
    return () => this.connectedCbs.delete(fn);
  }
  private setConnected(c: boolean) {
    this.connectedCbs.forEach((f) => f(c));
  }

  start(token: string): void {
    if (this.started) return;
    this.started = true;
    void this.loop(token);
  }
  stop(): void {
    this.started = false;
    this.abort?.abort();
    this.setConnected(false);
  }

  private async loop(token: string): Promise<void> {
    while (this.started) {
      this.abort = new AbortController();
      try {
        const res = await fetch(`${getApiBaseUrl()}/events`, {
          headers: {
            Authorization: `Bearer ${token}`,
            ...(this.lastEventId ? { 'Last-Event-ID': this.lastEventId } : {}),
          },
          signal: this.abort.signal,
        });
        if (!res.ok || !res.body) throw new Error(`events ${res.status}`);
        this.backoff = 1000;
        this.setConnected(true); // fires the catch-up invalidation in the hook

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let lastFrameAt = Date.now();
        const watchdog = setInterval(() => {
          // no frame (incl. heartbeat) for 45s ⇒ assume dead, abort + reconnect
          if (Date.now() - lastFrameAt > 45_000) this.abort?.abort();
        }, 10_000);

        try {
          while (this.started) {
            const { done, value } = await reader.read();
            if (done) break;
            lastFrameAt = Date.now();
            buffer += decoder.decode(value, { stream: true });
            const frames = buffer.split('\n\n');
            buffer = frames.pop() ?? '';
            for (const frame of frames) {
              let id = '';
              let data = '';
              for (const line of frame.split('\n')) {
                if (line.startsWith('id: ')) id = line.slice(4);
                else if (line.startsWith('data: ')) data = line.slice(6);
                // ': ping' comments and 'event:' lines are ignored
              }
              if (id) this.lastEventId = id;
              if (!data) continue;
              try {
                const ev = JSON.parse(data) as JobEvent;
                this.listeners.forEach((l) => l(ev));
              } catch {
                /* resync/malformed frame → ignore; reconnect catch-up covers gaps */
              }
            }
          }
        } finally {
          clearInterval(watchdog);
        }
      } catch {
        /* fall through to backoff */
      }
      this.setConnected(false);
      if (!this.started) break;
      await new Promise((r) => setTimeout(r, this.backoff + Math.random() * 500));
      this.backoff = Math.min(this.backoff * 2, 15_000);
    }
  }
}

export const jobStream = new JobStream();
