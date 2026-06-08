'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Input } from '@talim/ui';
import { useAdminSubscriptions } from '@/hooks/useAdmin';

const STATUS_OPTIONS = ['', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'TRIALING'] as const;
const PLAN_OPTIONS = ['', 'FREE', 'INDIVIDUAL_PRO'] as const;

export default function SubscriptionsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [plan, setPlan] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminSubscriptions({
    page,
    search: search || undefined,
    status: status || undefined,
    plan: plan || undefined,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Subscriptions</h1>
          <p className="text-sm text-muted-foreground">Manual plan and status management</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search email…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="max-w-xs"
          />
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-md border bg-background px-3 text-sm"
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
            className="h-9 rounded-md border bg-background px-3 text-sm"
          >
            {PLAN_OPTIONS.map((p) => (
              <option key={p || 'all'} value={p}>
                {p || 'All plans'}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">User</th>
              <th className="px-4 py-3 text-left font-medium">Plan</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Source</th>
              <th className="px-4 py-3 text-left font-medium">Period end</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            )}
            {data?.items.map((sub) => (
              <tr key={sub.id} className="border-t">
                <td className="px-4 py-3">
                  <Link href={`/users/${sub.userId}`} className="font-medium text-primary hover:underline">
                    {sub.userEmail}
                  </Link>
                  {sub.userName && (
                    <p className="text-xs text-muted-foreground">{sub.userName}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium">{sub.effectivePlanCode}</span>
                  {sub.planCode !== sub.effectivePlanCode && (
                    <span className="ml-1 text-xs text-muted-foreground">({sub.planCode})</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{sub.status}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{sub.source}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {sub.currentPeriodEnd
                    ? new Date(sub.currentPeriodEnd).toLocaleDateString()
                    : '—'}
                </td>
              </tr>
            ))}
            {!isLoading && data?.items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
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
    </div>
  );
}
