'use client';

import type { HealthCheckResult, HealthStatus } from '@talim/types';

const STATUS_BADGE: Record<HealthStatus, { label: string; className: string }> = {
  ok: { label: 'OK', className: 'bg-success-muted text-success' },
  degraded: { label: 'DEGRADED', className: 'bg-warning-muted text-warning' },
  down: { label: 'DOWN', className: 'bg-destructive/10 text-destructive' },
  skipped: { label: 'NOT SET UP', className: 'bg-muted text-muted-foreground' },
};

function StatusBadge({ status }: { status: HealthStatus }) {
  const { label, className } = STATUS_BADGE[status];
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 font-label text-[10px] font-semibold tracking-wide ${className}`}
    >
      {label}
    </span>
  );
}

/** Render the scalar detail bag as compact `key value` chips. */
function DetailChips({ detail }: { detail: HealthCheckResult['detail'] }) {
  const entries = Object.entries(detail ?? {}).filter(
    ([, value]) => value !== null && value !== undefined && value !== '',
  );
  if (entries.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {entries.map(([key, value]) => (
        <span
          key={key}
          className="inline-flex min-w-0 max-w-full items-center gap-1 rounded-md bg-muted/60 px-1.5 py-0.5 text-[11px] text-muted-foreground"
        >
          <span className="shrink-0 font-label uppercase tracking-wide opacity-70">{key}</span>
          {/* break-all: provider error tokens and job ids have no spaces to wrap on. */}
          <span className="break-all font-mono text-foreground">{String(value)}</span>
        </span>
      ))}
    </div>
  );
}

export function HealthCheckRow({
  check,
  action,
  age,
}: {
  check: HealthCheckResult;
  /** Optional inline repair control rendered inside the remediation callout. */
  action?: React.ReactNode;
  /** Shown for deep results, which can be older than the report they ride along with. */
  age?: string;
}) {
  const needsFix = check.status === 'degraded' || check.status === 'down';
  const isDown = check.status === 'down';

  return (
    <div className="border-t border-border/60 py-3 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <StatusBadge status={check.status} />
        <span className="text-sm font-medium text-foreground">{check.label}</span>
        {check.deep && (
          <span className="rounded bg-accent-secondary/15 px-1.5 py-0.5 font-label text-[9px] font-semibold uppercase tracking-wide text-accent-secondary">
            {age ? `deep · ${age}` : 'deep'}
          </span>
        )}
        <span className="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">
          {check.latencyMs}ms
        </span>
      </div>

      <p className="mt-1 break-words text-xs leading-relaxed text-muted-foreground">
        {check.message}
      </p>
      <DetailChips detail={check.detail} />

      {needsFix && check.remediation && (
        <div
          className={`mt-2 rounded-xl border p-3 ${
            isDown ? 'border-destructive/40 bg-destructive/5' : 'border-warning/40 bg-warning-muted/40'
          }`}
        >
          <p
            className={`font-label text-[10px] font-semibold uppercase tracking-wider ${
              isDown ? 'text-destructive' : 'text-warning'
            }`}
          >
            How to fix
          </p>
          <p className="mt-1 break-words text-xs leading-relaxed text-foreground">
            {check.remediation}
          </p>
          {action && <div className="mt-2">{action}</div>}
        </div>
      )}
    </div>
  );
}
