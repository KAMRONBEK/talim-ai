import type {
  HealthCheckResult,
  HealthGroup,
  HealthGroupSummary,
  HealthVerdict,
  SystemHealthReport,
} from '@talim/types';
import { HEALTH_GROUP_ORDER } from '@talim/types';
import type { ProbeDefinition } from './runner.js';
import { runProbes } from './runner.js';
import { computeReadiness } from './readiness.js';
import { infrastructureProbes } from './probes/infrastructure.probes.js';
import { aiProviderProbes } from './probes/aiProviders.probes.js';
import { ragProbes } from './probes/rag.probes.js';
import { jobProbes } from './probes/jobs.probes.js';
import { mediaProbes } from './probes/media.probes.js';
import { configProbes } from './probes/config.probes.js';
import { dataIntegrityProbes } from './probes/dataIntegrity.probes.js';

const ALL_PROBES: ProbeDefinition[] = [
  ...infrastructureProbes,
  ...aiProviderProbes,
  ...ragProbes,
  ...jobProbes,
  ...mediaProbes,
  ...configProbes,
  ...dataIntegrityProbes,
];

const FAST_PROBES = ALL_PROBES.filter((probe) => !probe.deep);
/** Canonical render order, so a merged report never reshuffles the page. */
const PROBE_ORDER = new Map(ALL_PROBES.map((probe, index) => [probe.id, index]));

/** Fast reports are cheap and re-run often; the page polls on this cadence. */
const FAST_CACHE_TTL_MS = 60_000;
/** How long deep results stay attached to subsequent fast reports. */
const DEEP_RESULT_TTL_MS = 10 * 60_000;
/** Deep probes spend money — refuse to re-run them more often than this. */
const DEEP_COOLDOWN_MS = 60_000;

export type HealthMode = 'fast' | 'deep';

interface CacheEntry {
  report: SystemHealthReport;
  expiresAt: number;
}

let cached: CacheEntry | null = null;
/**
 * Single-flight: concurrent requests await the same run instead of stampeding.
 * The mode is tracked alongside the promise because a deep request must never be
 * handed the result of an in-flight FAST sweep — it would silently contain none
 * of the metered provider checks the operator actually asked for.
 */
let inFlight: { mode: HealthMode; promise: Promise<SystemHealthReport> } | null = null;
/** Deep results kept aside so later fast reports can carry them forward. */
let lastDeep: { checks: HealthCheckResult[]; at: number } | null = null;

function orderIndex(group: HealthGroup): number {
  const index = HEALTH_GROUP_ORDER.indexOf(group);
  return index === -1 ? HEALTH_GROUP_ORDER.length : index;
}

function summarize(checks: HealthCheckResult[]): HealthGroupSummary[] {
  const byGroup = new Map<HealthGroup, HealthGroupSummary>();
  for (const check of checks) {
    const summary = byGroup.get(check.group) ?? {
      group: check.group,
      ok: 0,
      degraded: 0,
      down: 0,
      skipped: 0,
    };
    summary[check.status] += 1;
    byGroup.set(check.group, summary);
  }
  return [...byGroup.values()].sort((a, b) => orderIndex(a.group) - orderIndex(b.group));
}

function verdictOf(checks: HealthCheckResult[]): HealthVerdict {
  if (checks.some((c) => c.status === 'down')) return 'critical';
  if (checks.some((c) => c.status === 'degraded')) return 'issues';
  return 'go';
}

/** Build the wire report from a set of results. `skipped` never counts as an issue. */
function assemble(
  checks: HealthCheckResult[],
  mode: HealthMode,
  durationMs: number,
): SystemHealthReport {
  const ordered = [...checks].sort((a, b) => {
    const byGroup = orderIndex(a.group) - orderIndex(b.group);
    if (byGroup !== 0) return byGroup;
    return (PROBE_ORDER.get(a.id) ?? 0) - (PROBE_ORDER.get(b.id) ?? 0);
  });

  const downCount = ordered.filter((c) => c.status === 'down').length;
  const degradedCount = ordered.filter((c) => c.status === 'degraded').length;

  return {
    verdict: verdictOf(ordered),
    issueCount: downCount + degradedCount,
    downCount,
    okCount: ordered.filter((c) => c.status === 'ok').length,
    skippedCount: ordered.filter((c) => c.status === 'skipped').length,
    generatedAt: new Date().toISOString(),
    durationMs,
    mode,
    cached: false,
    includesDeep: ordered.some((c) => c.deep),
    checks: ordered,
    groups: summarize(ordered),
    readiness: computeReadiness(ordered),
  };
}

async function execute(mode: HealthMode): Promise<SystemHealthReport> {
  const startedAt = Date.now();
  // The fast pass is everything free or costing a rounding error; deep adds the
  // real metered provider calls on top, so a deep report is a strict superset.
  const definitions = mode === 'deep' ? ALL_PROBES : FAST_PROBES;
  const checks = await runProbes(definitions);

  if (mode === 'deep') {
    lastDeep = { checks: checks.filter((c) => c.deep), at: Date.now() };
    return assemble(checks, 'deep', Date.now() - startedAt);
  }

  // Carry recent deep results forward. Without this the page would either freeze
  // on a stale deep report or silently drop the deep findings on the next poll —
  // instead the operator keeps both: live fast checks plus their deep verification.
  const carried =
    lastDeep && Date.now() - lastDeep.at < DEEP_RESULT_TTL_MS ? lastDeep.checks : [];
  return assemble([...checks, ...carried], 'fast', Date.now() - startedAt);
}

function serveCached(): SystemHealthReport | null {
  if (cached && cached.expiresAt > Date.now()) {
    return { ...cached.report, cached: true };
  }
  return null;
}

function track(mode: HealthMode, promise: Promise<SystemHealthReport>): Promise<SystemHealthReport> {
  inFlight = { mode, promise };
  // Release the slot on settle without swallowing the rejection from the caller.
  void promise
    .catch(() => undefined)
    .finally(() => {
      if (inFlight?.promise === promise) inFlight = null;
    });
  return promise;
}

/**
 * Produce a health report.
 *
 * - `fast` is served from a 60s cache unless `refresh` is set.
 * - `deep` additionally runs the metered probes, rate-limited by a server-side
 *   cooldown so a held-down button cannot burn provider credit.
 *
 * Never throws: probe failures are contained by the runner, so an operator always
 * gets a report — including when the thing that is broken is the database itself.
 */
export async function getSystemHealth(
  mode: HealthMode = 'fast',
  options: { refresh?: boolean } = {},
): Promise<SystemHealthReport> {
  if (mode === 'deep') {
    // Loop rather than a single check: two deep requests can queue behind the same
    // in-flight FAST sweep, and if the guards were only evaluated once, both would
    // fall through and each launch a full metered run. Re-check after every await
    // so the second request joins the first one's deep run (or its cooldown).
    for (;;) {
      // Inside the cooldown, hand back the existing deep report rather than paying
      // for the metered probes again.
      if (lastDeep && Date.now() - lastDeep.at < DEEP_COOLDOWN_MS && cached?.report.includesDeep) {
        return { ...cached.report, cached: true };
      }
      if (inFlight?.mode === 'deep') return inFlight.promise;
      if (!inFlight) break;
      // A fast sweep is running: wait it out rather than hitting the DB twice at once.
      await inFlight.promise.catch(() => undefined);
    }

    return track(
      'deep',
      execute('deep').then((report) => {
        cached = { report, expiresAt: Date.now() + FAST_CACHE_TTL_MS };
        return report;
      }),
    );
  }

  if (!options.refresh) {
    const hit = serveCached();
    if (hit) return hit;
  }
  // Join whatever is already running — a deep report is a superset of a fast one.
  if (inFlight) return inFlight.promise;

  return track(
    'fast',
    execute('fast').then((report) => {
      cached = { report, expiresAt: Date.now() + FAST_CACHE_TTL_MS };
      return report;
    }),
  );
}

/** Drop the cache so the next read re-probes (used after a repair action). */
export function invalidateHealthCache(): void {
  cached = null;
}
