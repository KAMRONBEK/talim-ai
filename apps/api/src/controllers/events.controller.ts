import type { Response } from 'express';
import type { SeqJobEvent } from '@talim/types';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { AppError } from '../middleware/error.middleware.js';
import { jobEvents } from '../services/events/jobEvents.service.js';

/**
 * `GET /events` — one SSE stream per authenticated tab. Pushes async-job completion
 * events (id-only) so the web app invalidates the matching react-query keys instead of
 * polling. Mirrors the chat SSE headers, adds `X-Accel-Buffering: no` (defence in depth
 * over nginx's `proxy_buffering off`), a 20s heartbeat, and Last-Event-ID replay.
 */
export async function streamEvents(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const userId = req.user.userId;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();
  res.write('retry: 5000\n\n');

  let unsubscribe: () => void = () => {};
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  const cleanup = () => {
    if (heartbeat) clearInterval(heartbeat);
    unsubscribe();
  };

  // A write to a closed/destroyed socket throws; swallow it and clean up so the failure
  // never propagates back into the publisher (which runs on the job thread).
  const send = ({ seq, event }: SeqJobEvent) => {
    try {
      res.write(`id: ${seq}\n`);
      res.write('event: job\n');
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    } catch {
      cleanup();
    }
  };

  // Last-Event-ID replay (header set by the browser/our reader, or ?lastEventId=).
  const lastIdRaw = req.header('Last-Event-ID') ?? (req.query.lastEventId as string | undefined);
  const lastId = lastIdRaw ? Number.parseInt(lastIdRaw, 10) : NaN;
  if (Number.isFinite(lastId)) {
    const missed = jobEvents.replay(userId, lastId);
    if (missed === null) {
      res.write('event: resync\ndata: {"reason":"gap"}\n\n'); // client does a full invalidation
    } else {
      missed.forEach(send);
    }
  }

  unsubscribe = jobEvents.subscribe(userId, send);
  heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      cleanup();
    }
  }, 20_000);
  req.on('close', cleanup);
}
