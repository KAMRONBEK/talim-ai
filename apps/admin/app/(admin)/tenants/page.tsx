'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Input } from '@talim/ui';
import { useAdminTenants } from '@/hooks/useAdmin';
import { planLabel } from '@/lib/plan';

function statusPillClass(status: string): string {
  const s = status.toUpperCase();
  if (s.includes('INACTIVE')) return 'bg-muted text-muted-foreground';
  if (/FAIL|REJECT|CANCEL|ERROR|EXPIR/.test(s)) return 'bg-destructive/10 text-destructive';
  if (/PAST.?DUE|OVERDUE|PAUSE|WARN/.test(s)) return 'bg-warning-muted text-warning';
  if (/ACTIVE|READY|DONE|APPROV|COMPLETE|SUCCESS/.test(s)) return 'bg-success-muted text-success';
  return 'bg-muted text-muted-foreground';
}

export default function TenantsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useAdminTenants({ page, search: search || undefined });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-label text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Admin
          </p>
          <h1 className="font-display text-2xl font-semibold">Tenants</h1>
          <p className="text-sm text-muted-foreground">Organizations and subscription management</p>
        </div>
        <Input
          placeholder="Search name or slug…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-4 py-3 text-left font-label text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Organization
              </th>
              <th className="px-4 py-3 text-left font-label text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Owner
              </th>
              <th className="px-4 py-3 text-left font-label text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Plan
              </th>
              <th className="px-4 py-3 text-left font-label text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-left font-label text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Students
              </th>
              <th className="px-4 py-3 text-left font-label text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Content
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            )}
            {isError && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-destructive">
                  Couldn&apos;t load organizations. Please try again.
                </td>
              </tr>
            )}
            {data?.items.map((tenant) => (
              <tr key={tenant.id} className="border-t border-border/60 hover:bg-secondary/40">
                <td className="px-4 py-3">
                  <Link
                    href={`/tenants/${tenant.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {tenant.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">{tenant.slug}</p>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/users/${tenant.ownerId}`} className="text-primary hover:underline">
                    {tenant.ownerEmail}
                  </Link>
                  {tenant.ownerName && (
                    <p className="text-xs text-muted-foreground">{tenant.ownerName}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Tenant owner</p>
                </td>
                <td className="px-4 py-3">{planLabel(tenant.planCode)}</td>
                <td className="px-4 py-3">
                  {tenant.subscriptionStatus ? (
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusPillClass(tenant.subscriptionStatus)}`}
                    >
                      {tenant.subscriptionStatus}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-3">
                  {tenant.studentCount}
                  <p className="text-xs text-muted-foreground">
                    {tenant.studentCount === 1 ? 'learner' : 'learners'}
                  </p>
                </td>
                <td className="px-4 py-3">{tenant.contentCount}</td>
              </tr>
            ))}
            {!isLoading && data?.items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No organizations found.
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
