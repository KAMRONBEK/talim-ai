'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Input } from '@talim/ui';
import type { AdminSubscriptionListItem } from '@talim/types';
import { useAdminSubscriptions } from '@/hooks/useAdmin';
import { SubscriptionEditDrawer } from '@/components/subscription-edit-drawer';
import { planLabel } from '@/lib/plan';

const STATUS_OPTIONS = ['', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'TRIALING'] as const;
const PLAN_OPTIONS = [
  '',
  'FREE',
  'INDIVIDUAL_PRO',
  'TENANT_STARTER',
  'TENANT_GROWTH',
] as const;
const KIND_OPTIONS = ['all', 'user', 'tenant'] as const;

function statusPillClass(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'bg-success-muted text-success';
    case 'PAST_DUE':
      return 'bg-warning-muted text-warning';
    case 'CANCELED':
      return 'bg-destructive/10 text-destructive';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export default function SubscriptionsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [plan, setPlan] = useState('');
  const [kind, setKind] = useState<(typeof KIND_OPTIONS)[number]>('all');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<AdminSubscriptionListItem | null>(null);
  const { data, isLoading, isError } = useAdminSubscriptions({
    page,
    search: search || undefined,
    status: status || undefined,
    plan: plan || undefined,
    kind: kind === 'all' ? undefined : kind,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-label text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Admin
          </p>
          <h1 className="font-display text-2xl font-semibold">Subscriptions</h1>
          <p className="text-sm text-muted-foreground">Individual and organization plans</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search email or org…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="max-w-xs"
          />
          <select
            value={kind}
            onChange={(e) => {
              setKind(e.target.value as (typeof KIND_OPTIONS)[number]);
              setPage(1);
            }}
            className="h-9 rounded-xl border border-border bg-background px-3 text-sm focus:ring-2 focus:ring-ring"
          >
            {KIND_OPTIONS.map((k) => (
              <option key={k} value={k}>
                {k === 'all' ? 'All types' : k === 'user' ? 'Individual' : 'Tenant'}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-xl border border-border bg-background px-3 text-sm focus:ring-2 focus:ring-ring"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s || 'all'} value={s}>
                {s || 'All statuses'}
              </option>
            ))}
          </select>
          <select
            value={plan}
            onChange={(e) => {
              setPlan(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-xl border border-border bg-background px-3 text-sm focus:ring-2 focus:ring-ring"
          >
            {PLAN_OPTIONS.map((p) => (
              <option key={p || 'all'} value={p}>
                {p ? planLabel(p) : 'All plans'}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-4 py-3 text-left font-label text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Subject</th>
              <th className="px-4 py-3 text-left font-label text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Type</th>
              <th className="px-4 py-3 text-left font-label text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Plan</th>
              <th className="px-4 py-3 text-left font-label text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-label text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Source</th>
              <th className="px-4 py-3 text-left font-label text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Period end</th>
              <th className="px-4 py-3 text-right font-label text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Edit</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            )}
            {isError && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-destructive">
                  Couldn&apos;t load subscriptions. Please try again.
                </td>
              </tr>
            )}
            {data?.items.map((sub) => (
              <tr
                key={sub.id}
                onClick={() => setEditing(sub)}
                className="cursor-pointer border-t border-border/60 hover:bg-secondary/40"
              >
                <td className="px-4 py-3">
                  {sub.subjectType === 'tenant' ? (
                    <>
                      <Link
                        href={`/tenants/${sub.tenantId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-medium text-primary hover:underline"
                      >
                        {sub.tenantName}
                      </Link>
                      <p className="text-xs text-muted-foreground">{sub.tenantSlug}</p>
                    </>
                  ) : (
                    <>
                      <Link
                        href={`/users/${sub.userId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-medium text-primary hover:underline"
                      >
                        {sub.userEmail}
                      </Link>
                      {sub.userName && (
                        <p className="text-xs text-muted-foreground">{sub.userName}</p>
                      )}
                    </>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      sub.subjectType === 'tenant'
                        ? 'bg-secondary text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {sub.subjectType === 'tenant' ? 'Organization' : 'Individual'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium">{planLabel(sub.effectivePlanCode)}</span>
                  {sub.planCode !== sub.effectivePlanCode && (
                    <span className="ml-1 text-xs text-muted-foreground">({planLabel(sub.planCode)})</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusPillClass(
                      sub.status,
                    )}`}
                  >
                    {sub.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{sub.source}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {sub.currentPeriodEnd
                    ? new Date(sub.currentPeriodEnd).toLocaleDateString()
                    : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditing(sub);
                    }}
                  >
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
            {!isLoading && data?.items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No subscriptions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {data && data.total > data.pageSize && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="flex items-center text-sm text-muted-foreground">
            Page {page} of {Math.ceil(data.total / data.pageSize)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page * data.pageSize >= data.total}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
      <SubscriptionEditDrawer
        subscription={editing}
        open={editing !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setEditing(null);
        }}
      />
    </div>
  );
}
