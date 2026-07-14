const DEFAULT_LIVE_MS = 30_000;
const DEFAULT_FALLBACK_MS = 5_000;

/**
 * The shared "push-primary" refetch cadence for a react-query hook backed by an SSE job
 * event. While a background job is in flight we keep a *slow* safety-net poll when the
 * event stream is connected (in case the terminal event is dropped) and a *fast* poll
 * when it is disconnected; when nothing is in flight we don't poll on the connected path.
 * Callers layer any extra idle-fallback behavior (e.g. a bounded empty-result poll)
 * themselves.
 *
 * Centralizing this keeps the connected-gate honest across every media/status hook: a new
 * hook that forgot to read `connected` would silently hard-poll even while SSE is healthy —
 * re-introducing the exact load the event stream exists to remove.
 */
export function inFlightRefetchInterval(
  inFlight: boolean,
  connected: boolean,
  opts?: { liveMs?: number; fallbackMs?: number },
): number | false {
  if (!inFlight) return false;
  return connected ? (opts?.liveMs ?? DEFAULT_LIVE_MS) : (opts?.fallbackMs ?? DEFAULT_FALLBACK_MS);
}
