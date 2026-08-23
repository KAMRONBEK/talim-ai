'use client';

import { useEffect, useState } from 'react';
import { Button, Card, CardContent, CardHeader } from '@talim/ui';
import { PlugZap, RefreshCw, ShieldAlert, ShieldCheck, ShieldX, Wrench, Zap } from 'lucide-react';
import { HEALTH_GROUP_LABELS, HEALTH_GROUP_ORDER } from '@talim/types';
import type { HealthGroup, SystemHealthReport } from '@talim/types';
import {
  useDeepHealthCheck,
  useReconcileStuckJobs,
  useRefreshHealth,
  useSystemHealth,
} from '@/hooks/useAdmin';
import { HealthCheckRow } from '@/components/health-check-row';

const VERDICT = {
  go: {
    icon: ShieldCheck,
    tone: 'text-success',
    title: 'ALL SYSTEMS GO',
  },
  issues: {
    icon: ShieldAlert,
    tone: 'text-warning',
    title: 'NEEDS ATTENTION',
  },
  critical: {
    icon: ShieldX,
    tone: 'text-destructive',
    title: 'SOMETHING IS BROKEN',
  },
} as const;

function relativeTime(iso: string, now: number): string {
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`;
  return `${Math.round(seconds / 3600)}h ago`;
}

/**
 * Shown INSTEAD of the verdict when the poll itself is failing. Without this the
 * page keeps rendering the last cached report — so a backend that died after the
 * first load would still read "ALL SYSTEMS GO", the exact false sense of safety
 * this page exists to prevent.
 */
function UnreachableBanner({ report, now }: { report: SystemHealthReport | undefined; now: number }) {
  return (
    <Card className="rounded-2xl border-destructive/50 shadow-soft">
      <CardContent className="flex items-start gap-4 p-5">
        <PlugZap className="h-10 w-10 shrink-0 text-destructive" />
        <div>
          <p className="font-display text-3xl font-semibold leading-none text-destructive">
            CAN&apos;T REACH THE API
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {report
              ? `The backend stopped responding. Everything below is a stale snapshot from ${relativeTime(report.generatedAt, now)} and may no longer be true.`
              : 'The backend is not responding at all.'}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Check{' '}
            <code className="rounded bg-muted px-1 py-0.5 font-mono">docker compose ps api</code> and{' '}
            <code className="rounded bg-muted px-1 py-0.5 font-mono">
              docker compose logs api --tail 50
            </code>
            . Locally, confirm the API is running on port 4000.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function VerdictBanner({ report, now }: { report: SystemHealthReport; now: number }) {
  const { icon: Icon, tone, title } = VERDICT[report.verdict];
  const pulse = report.checks.find((c) => c.id === 'ai-usage-pulse');
  // Name the failures right here. "2 ISSUES" on its own sends the operator hunting
  // through seven cards to find which two — worst-case reading a card below the fold
  // while deciding whether it is safe to start a demo.
  const failing = report.checks.filter((c) => c.status === 'down' || c.status === 'degraded');

  return (
    <Card className="rounded-2xl shadow-soft">
      <CardContent className="flex flex-wrap items-start justify-between gap-4 p-5">
        <div className="flex items-start gap-4">
          <Icon className={`h-10 w-10 shrink-0 ${tone}`} />
          <div>
            <p className={`font-display text-3xl font-semibold leading-none ${tone}`}>
              {report.verdict === 'go'
                ? title
                : `${report.issueCount} ISSUE${report.issueCount === 1 ? '' : 'S'}`}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {report.okCount} checks passed
              {report.downCount > 0 && ` · ${report.downCount} critical`}
              {report.skippedCount > 0 && ` · ${report.skippedCount} not set up`}
              {' · checked '}
              {relativeTime(report.generatedAt, now)}
            </p>
            {pulse && <p className="mt-1 text-xs text-muted-foreground">{pulse.message}</p>}

            {failing.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {failing.map((check) => (
                  <li key={check.id} className="flex flex-wrap items-baseline gap-x-2 text-sm">
                    <span
                      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 font-label text-[10px] font-semibold tracking-wide ${
                        check.status === 'down'
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-warning-muted text-warning'
                      }`}
                    >
                      {check.status === 'down' ? 'DOWN' : 'DEGRADED'}
                    </span>
                    <span className="font-medium text-foreground">{check.label}</span>
                    <span className="text-xs text-muted-foreground">
                      in {HEALTH_GROUP_LABELS[check.group]}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="text-right">
          <p className="text-xs text-muted-foreground">
            {report.mode === 'deep' ? 'Deep pass' : 'Fast pass'} · {report.durationMs}ms
            {report.cached && ' · cached'}
          </p>
          {!report.includesDeep && (
            <p className="mt-1 max-w-[16rem] text-xs text-muted-foreground">
              Run a deep check before presenting — it makes real AI calls, the only way to catch an
              account that has run out of credit.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Feature-level rollup. The 32 low-level checks answer "what is broken"; this
 * answers the question actually being asked before a demo: "can I show this?"
 */
function ReadinessCard({ report }: { report: SystemHealthReport }) {
  const readiness = report.readiness ?? [];
  if (readiness.length === 0) return null;
  const blocked = readiness.filter((f) => f.status === 'down').length;
  const reduced = readiness.filter((f) => f.status === 'degraded').length;

  return (
    <Card className="rounded-2xl shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <div>
          <h2 className="font-display text-base font-semibold">Demo readiness</h2>
          <p className="text-xs text-muted-foreground">
            What a live audience would actually experience, feature by feature
          </p>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {blocked > 0
            ? `${blocked} would fail`
            : reduced > 0
              ? `${reduced} reduced`
              : 'all features ready'}
        </span>
      </CardHeader>
      <CardContent className="grid gap-x-6 gap-y-3 pt-1 sm:grid-cols-2">
        {readiness.map((feature) => {
          const tone =
            feature.status === 'down'
              ? 'bg-destructive/10 text-destructive'
              : feature.status === 'degraded'
                ? 'bg-warning-muted text-warning'
                : 'bg-success-muted text-success';
          const label =
            feature.status === 'down' ? 'WILL FAIL' : feature.status === 'degraded' ? 'REDUCED' : 'READY';

          return (
            <div key={feature.id} className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 font-label text-[10px] font-semibold tracking-wide ${tone}`}
                >
                  {label}
                </span>
                <span className="truncate text-sm font-medium text-foreground">{feature.label}</span>
              </div>
              {feature.status !== 'ok' && (
                <p className="mt-1 break-words text-xs leading-relaxed text-muted-foreground">
                  {feature.summary}
                </p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function GroupGrid({
  report,
  busy,
  reconciling,
  onReconcile,
  now,
}: {
  report: SystemHealthReport;
  busy: boolean;
  reconciling?: boolean;
  onReconcile: () => void;
  now: number;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {HEALTH_GROUP_ORDER.map((group: HealthGroup) => {
        const checks = report.checks.filter((c) => c.group === group);
        if (checks.length === 0) return null;
        const down = checks.filter((c) => c.status === 'down').length;
        const degraded = checks.filter((c) => c.status === 'degraded').length;

        return (
          <Card key={group} className="rounded-2xl shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <h2 className="font-display text-base font-semibold">{HEALTH_GROUP_LABELS[group]}</h2>
              <div className="flex items-center gap-1.5">
                {down > 0 && (
                  <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 font-label text-[10px] font-semibold text-destructive">
                    {down} down
                  </span>
                )}
                {degraded > 0 && (
                  <span className="inline-flex items-center rounded-full bg-warning-muted px-2 py-0.5 font-label text-[10px] font-semibold text-warning">
                    {degraded} degraded
                  </span>
                )}
                {down === 0 && degraded === 0 && (
                  <span className="inline-flex items-center rounded-full bg-success-muted px-2 py-0.5 font-label text-[10px] font-semibold text-success">
                    healthy
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-1">
              {checks.map((check) => (
                <HealthCheckRow
                  key={check.id}
                  check={check}
                  // Deep results are carried forward onto later fast reports, so they
                  // can be minutes older than the banner's timestamp — show their own age.
                  age={check.deep ? relativeTime(check.checkedAt, now) : undefined}
                  action={
                    // The one failure on this page with a one-click repair.
                    check.id === 'stuck-media-claims' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={onReconcile}
                        className="gap-1.5"
                      >
                        <Wrench className="h-4 w-4" />
                        {reconciling ? 'Reconciling…' : 'Reconcile stuck jobs'}
                      </Button>
                    ) : undefined
                  }
                />
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function AdminHealthPage() {
  const health = useSystemHealth();
  const refresh = useRefreshHealth();
  const deepCheck = useDeepHealthCheck();
  const reconcile = useReconcileStuckJobs();
  const [confirmDeep, setConfirmDeep] = useState(false);

  // Drives the "checked Xs ago" label without re-fetching.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(timer);
  }, []);

  const report = health.data;
  const busy = refresh.isPending || deepCheck.isPending || reconcile.isPending;
  // The poll and the manual refresh are the same signal: if either is failing, the
  // report on screen cannot be trusted as current.
  const unreachable = health.isError || refresh.isError;
  // Mutations only define onSuccess, and there is no global toast handler — without
  // this the operator clicks "Run deep check", nothing happens, and they assume it passed.
  const actionError = deepCheck.isError ? 'deep check' : reconcile.isError ? 'stuck-job reconcile' : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-label text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Platform
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">System health</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every dependency on one screen — databases, AI providers, retrieval, queues and config.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => refresh.mutate()}
            className="gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${refresh.isPending ? 'animate-spin' : ''}`} />
            {refresh.isPending ? 'Checking…' : 'Re-check now'}
          </Button>
          <Button
            size="sm"
            disabled={busy}
            onClick={() => setConfirmDeep(true)}
            className="gap-1.5"
          >
            <Zap className="h-4 w-4" />
            {deepCheck.isPending ? 'Running deep check…' : 'Run deep check'}
          </Button>
        </div>
      </div>

      {confirmDeep && (
        <Card className="rounded-2xl border-accent-secondary/40 shadow-soft">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <p className="text-sm font-medium text-foreground">Run the deep check?</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Makes one real 1-token call to every configured AI provider and synthesizes one word
                of speech. Costs well under a cent and takes up to ~20 seconds. This is the only
                check that detects an account that has run out of credit.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setConfirmDeep(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={deepCheck.isPending}
                onClick={() => {
                  setConfirmDeep(false);
                  deepCheck.mutate();
                }}
              >
                Run it
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {actionError && (
        <Card className="rounded-2xl border-destructive/50 shadow-soft">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">
              The {actionError} failed to run. Nothing was verified — the report below is from the
              last successful pass.
            </p>
          </CardContent>
        </Card>
      )}

      {health.isLoading && !report ? (
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
          Running health checks…
        </div>
      ) : unreachable ? (
        <>
          <UnreachableBanner report={report} now={now} />
          {report && (
            <GroupGrid
              report={report}
              busy={busy}
              reconciling={reconcile.isPending}
              onReconcile={() => reconcile.mutate()}
              now={now}
            />
          )}
        </>
      ) : report ? (
        <>
          <VerdictBanner report={report} now={now} />
          <ReadinessCard report={report} />
          <GroupGrid
            report={report}
            busy={busy}
            reconciling={reconcile.isPending}
            onReconcile={() => reconcile.mutate()}
            now={now}
          />
        </>
      ) : null}
    </div>
  );
}
