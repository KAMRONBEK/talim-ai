import type { HealthCheckResult, HealthDetail, HealthGroup, HealthStatus } from '@talim/types';
import { env } from '../../config/env.js';

/** What a probe body returns. The runner turns this into a HealthCheckResult. */
export interface ProbeOutcome {
  status: HealthStatus;
  message: string;
  detail?: HealthDetail;
}

export interface ProbeDefinition {
  id: string;
  group: HealthGroup;
  label: string;
  /** Deep probes make real (metered) provider calls and only run on demand. */
  deep: boolean;
  timeoutMs: number;
  /** Status to report when the probe blows its budget. Most are 'degraded'; hard deps are 'down'. */
  timeoutStatus: HealthStatus;
  /** Operator instruction surfaced in the UI when this check is degraded/down. */
  remediation: string;
  run: () => Promise<ProbeOutcome>;
}

const MAX_MESSAGE_LENGTH = 300;

/**
 * Every configured secret, so `sanitize` can strip a value that leaked into a
 * provider error body or a thrown message before it reaches an HTTP response.
 * Short values are skipped — replacing a 3-char string would mangle normal prose.
 */
function secretValues(): string[] {
  return [
    env.OPENAI_API_KEY,
    env.DEEPSEEK_API_KEY,
    env.OPENROUTER_API_KEY,
    env.AZURE_SPEECH_KEY,
    env.ELEVENLABS_API_KEY,
    env.JWT_SECRET,
    env.DATABASE_URL,
    env.REDIS_URL,
  ].filter((value) => typeof value === 'string' && value.length >= 8);
}

/**
 * Redact secrets and bound the length. This runs on EVERY message before it enters
 * a report — the health endpoint is admin-only, but a key echoed back in an error
 * body still has no business being in an HTTP response or a browser cache.
 */
export function sanitize(raw: string): string {
  let message = raw;
  for (const secret of secretValues()) {
    // split/join instead of RegExp: secrets can contain regex metacharacters.
    message = message.split(secret).join('***');
  }
  // Bearer/api-key patterns that never came from OUR env (e.g. a proxy echoing a
  // different token) still get masked, keeping only a short prefix for debugging.
  message = message.replace(/\b(sk-|xoxb-|Bearer\s+)[A-Za-z0-9_\-.]{12,}/g, '$1***');
  message = message.replace(/\s+/g, ' ').trim();
  return message.length > MAX_MESSAGE_LENGTH
    ? `${message.slice(0, MAX_MESSAGE_LENGTH)}…`
    : message;
}

/** Last-4 fingerprint so an operator can tell WHICH key is loaded without exposing it. */
export function fingerprint(secret: string): string {
  if (!secret) return '(not set)';
  return secret.length <= 4 ? '····' : `····${secret.slice(-4)}`;
}

/**
 * Redact every string in a detail bag. Probes assemble these from provider bodies
 * and persisted job errors, so they need the same treatment as messages.
 */
function sanitizeDetail(detail: HealthDetail | undefined): HealthDetail | undefined {
  if (!detail) return undefined;
  const clean: HealthDetail = {};
  for (const [key, value] of Object.entries(detail)) {
    clean[key] = typeof value === 'string' ? sanitize(value) : value;
  }
  return clean;
}

/**
 * True for "the remote side never answered in time" — AbortSignal.timeout throws a
 * DOMException named TimeoutError, and the OpenAI SDK raises its own timeout class.
 * These deserve the probe's declared `timeoutStatus` (usually degraded), not `down`:
 * a slow provider is a very different situation from a revoked key.
 */
function isTimeoutError(error: unknown): boolean {
  const name = (error as { name?: unknown })?.name;
  if (name === 'TimeoutError' || name === 'AbortError' || name === 'APIConnectionTimeoutError') {
    return true;
  }
  const message = errorMessage(error).toLowerCase();
  return message.includes('timed out') || message.includes('timeout') || message.includes('aborted');
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return 'Unknown error';
  }
}

const TIMED_OUT = Symbol('probe-timeout');

/**
 * Race a probe against its own budget.
 *
 * The endpoint's total time is the SLOWEST probe, never the sum — so a wedged
 * provider cannot hold the admin page hostage. The losing promise gets a no-op
 * `.catch` so a late rejection can never surface as an unhandledRejection and
 * take the API process down (this process is also the Bull worker).
 */
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | typeof TIMED_OUT> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<typeof TIMED_OUT>((resolve) => {
    timer = setTimeout(() => resolve(TIMED_OUT), timeoutMs);
  });
  try {
    return await Promise.race([
      promise.catch((error: unknown) => {
        throw error;
      }),
      timeout,
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Run one probe with full isolation: a throw, a rejection, or a hang all become a
 * normal result. This function never rejects, which is what lets the controller
 * promise the operator a report even when everything is on fire.
 */
export async function runProbe(definition: ProbeDefinition): Promise<HealthCheckResult> {
  const startedAt = Date.now();
  const base = {
    id: definition.id,
    group: definition.group,
    label: definition.label,
    deep: definition.deep,
  };

  let outcome: ProbeOutcome;
  try {
    const settled = await withTimeout(
      // Wrapped in Promise.resolve().then so a probe that throws SYNCHRONOUSLY
      // (before its first await) is caught here too, not at the call site.
      Promise.resolve().then(() => definition.run()),
      definition.timeoutMs,
    );
    outcome =
      settled === TIMED_OUT
        ? {
            status: definition.timeoutStatus,
            message: `Timed out after ${definition.timeoutMs}ms — the dependency is unreachable or badly degraded.`,
          }
        : settled;
  } catch (error) {
    // A probe's own inner timeout (AbortSignal / SDK) usually fires just before the
    // runner's outer timer, so classifying every rejection as `down` would make a
    // merely slow provider look revoked and turn the verdict critical.
    outcome = isTimeoutError(error)
      ? { status: definition.timeoutStatus, message: `Timed out: ${errorMessage(error)}` }
      : { status: 'down', message: errorMessage(error) };
  }

  const needsFix = outcome.status === 'degraded' || outcome.status === 'down';
  return {
    ...base,
    status: outcome.status,
    latencyMs: Date.now() - startedAt,
    message: sanitize(outcome.message),
    remediation: needsFix ? definition.remediation : null,
    detail: sanitizeDetail(outcome.detail),
    checkedAt: new Date().toISOString(),
  };
}

/** Run every probe concurrently. Order of the returned array matches the input. */
export async function runProbes(definitions: ProbeDefinition[]): Promise<HealthCheckResult[]> {
  return Promise.all(definitions.map((definition) => runProbe(definition)));
}
