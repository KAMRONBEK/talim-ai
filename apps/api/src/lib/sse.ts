import type { Response } from 'express';

/**
 * Shared Server-Sent-Events wire helpers. Every SSE-over-HTTP endpoint (AI tutor chat,
 * job-events stream, summary token stream) speaks the same framing — one place to change
 * headers/framing (heartbeats, `X-Accel-Buffering`, retry hints) instead of N hand-copies
 * that silently drift.
 */

/** Write the standard `text/event-stream` headers and flush them so the client's reader
 *  starts receiving frames immediately (before the first token). */
export function sseHeaders(res: Response): void {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();
}

/** Write one `data: <json>\n\n` frame. */
export function sseData(res: Response, payload: unknown): void {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

/** Write the terminal `data: [DONE]\n\n` frame (does not end the response). */
export function sseDone(res: Response): void {
  res.write('data: [DONE]\n\n');
}
