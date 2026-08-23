// System health / self-diagnostic report shared by apps/api (producer) and
// apps/admin (consumer). The admin "Health" page renders one screen that answers
// "is anything broken right now, and what do I do about it" without the operator
// having to manually exercise every feature.

/**
 * `skipped` means "not configured" — an intentional absence (e.g. no ElevenLabs
 * key while TTS_PROVIDER is azure). It is NOT a failure and never counts as an issue.
 */
export type HealthStatus = 'ok' | 'degraded' | 'down' | 'skipped';

export type HealthGroup =
  | 'infrastructure'
  | 'ai-providers'
  | 'rag'
  | 'jobs'
  | 'media'
  | 'config'
  | 'data-integrity';

/**
 * Scalar-only so a report can never smuggle an object graph (or a secret) into the
 * UI. `undefined` is permitted so probes can build detail objects conditionally —
 * JSON serialization drops those keys, so the wire format stays scalar-only.
 */
export type HealthDetail = Record<string, string | number | boolean | null | undefined>;

export interface HealthCheckResult {
  /** Stable kebab-case id, e.g. `openai-auth`. Safe to key UI state on. */
  id: string;
  group: HealthGroup;
  label: string;
  status: HealthStatus;
  latencyMs: number;
  /** Human-readable and sanitized — never contains secret values. */
  message: string;
  /** Operator instruction, shown when the check is degraded or down. */
  remediation: string | null;
  detail?: HealthDetail;
  /** True when produced by the on-demand deep pass (which spends money). */
  deep: boolean;
  checkedAt: string;
}

export interface HealthGroupSummary {
  group: HealthGroup;
  ok: number;
  degraded: number;
  down: number;
  skipped: number;
}

/** `go` = nothing wrong; `issues` = degraded only; `critical` = at least one down. */
export type HealthVerdict = 'go' | 'issues' | 'critical';

/**
 * Whether a user-facing FEATURE will work, derived from the low-level checks.
 *
 * This exists because "not configured" reads as harmless in a check list, but is
 * not harmless if you are about to demo the feature that depends on it. Rolling
 * the checks up to "Podcasts: degraded" is the signal an operator can act on in
 * the ten minutes before a presentation.
 */
export interface FeatureReadiness {
  id: string;
  label: string;
  /** `down` = will visibly fail; `degraded` = works but worse; `ok` = good to demo. */
  status: Exclude<HealthStatus, 'skipped'>;
  /** Plain-language consequence, e.g. "non-native Uzbek voice". */
  summary: string;
  /** Ids of the checks that decided this, so the operator knows where to look. */
  blockedBy: string[];
}

export interface SystemHealthReport {
  verdict: HealthVerdict;
  /** degraded + down. */
  issueCount: number;
  downCount: number;
  okCount: number;
  skippedCount: number;
  generatedAt: string;
  durationMs: number;
  mode: 'fast' | 'deep';
  /** True when served from the in-memory cache rather than freshly probed. */
  cached: boolean;
  /** True when this report includes results from the metered deep probes. */
  includesDeep: boolean;
  checks: HealthCheckResult[];
  groups: HealthGroupSummary[];
  /** Feature-level rollup for the pre-demo glance. */
  readiness: FeatureReadiness[];
}

/** Response of POST /admin/health/reconcile-stuck. */
export interface HealthReconcileResponse {
  reconciled: true;
  report: SystemHealthReport;
}

export const HEALTH_GROUP_LABELS: Record<HealthGroup, string> = {
  infrastructure: 'Infrastructure',
  'ai-providers': 'AI Providers',
  rag: 'RAG Pipeline',
  jobs: 'Background Jobs',
  media: 'Media Toolchain',
  config: 'Configuration',
  'data-integrity': 'Data Integrity',
};

/** Fixed render order for the admin page — most demo-critical first. */
export const HEALTH_GROUP_ORDER: HealthGroup[] = [
  'infrastructure',
  'ai-providers',
  'rag',
  'jobs',
  'media',
  'config',
  'data-integrity',
];
