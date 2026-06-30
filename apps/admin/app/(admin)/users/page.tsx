'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Input } from '@talim/ui';
import { useAdminUsers, useDeleteUser, useResetUserPassword } from '@/hooks/useAdmin';
import { planLabel } from '@/lib/plan';

function roleBadge(role: string): string {
  if (role === 'ADMIN') return 'bg-accent-secondary/15 text-accent-secondary';
  if (role === 'TENANT_OWNER') return 'bg-secondary text-primary';
  return 'bg-muted text-muted-foreground';
}

function subStatusBadge(status: string): string {
  if (status === 'ACTIVE') return 'bg-success-muted text-success';
  if (status === 'PAST_DUE' || status === 'TRIALING') return 'bg-warning-muted text-warning';
  if (status === 'CANCELED' || status === 'CANCELLED' || status === 'INACTIVE')
    return 'bg-destructive/10 text-destructive';
  return 'bg-muted text-muted-foreground';
}

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useAdminUsers({ page, search: search || undefined });
  const deleteUser = useDeleteUser();
  const resetPassword = useResetUserPassword();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-label text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Admin
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">All platform accounts</p>
        </div>
        <Input
          placeholder="Search email or name…"
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
            <tr className="font-label text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Password</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Plan</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Content</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            )}
            {isError && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-destructive">
                  Couldn&apos;t load users. Please try again.
                </td>
              </tr>
            )}
            {data?.items.map((user) => (
              <tr key={user.id} className="border-t border-border/60 hover:bg-secondary/40">
                <td className="px-4 py-3">
                  <Link href={`/users/${user.id}`} className="font-medium text-primary hover:underline">
                    {user.email}
                  </Link>
                </td>
                <td className="px-4 py-3">{user.name ?? '—'}</td>
                <td className="px-4 py-3">
                  {user.adminPasswordNote ? (
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        {user.adminPasswordNote}
                      </code>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => navigator.clipboard?.writeText(user.adminPasswordNote!)}
                      >
                        Copy
                      </Button>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Not recorded</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${roleBadge(user.role)}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3">{planLabel(user.planCode)}</td>
                <td className="px-4 py-3">
                  {user.subscriptionStatus ? (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${subStatusBadge(user.subscriptionStatus)}`}
                    >
                      {user.subscriptionStatus}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-3">{user.contentCount}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={resetPassword.isPending}
                      onClick={async () => {
                        if (
                          !confirm(
                            `Generate a new password for ${user.email}? The previous password will stop working.`,
                          )
                        ) {
                          return;
                        }
                        try {
                          await resetPassword.mutateAsync({ userId: user.id, generate: true });
                        } catch (err) {
                          const res = (err as { response?: { data?: { message?: string } } })?.response;
                          alert(res?.data?.message ?? 'Failed to reset password. Please try again.');
                        }
                      }}
                    >
                      Reset
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-destructive/30 text-destructive hover:bg-destructive/10"
                      disabled={deleteUser.isPending}
                      onClick={async () => {
                        if (!confirm(`Delete ${user.email}?`)) return;
                        try {
                          await deleteUser.mutateAsync({ id: user.id });
                        } catch (err) {
                          const res = (err as { response?: { status?: number; data?: { message?: string } } })
                            ?.response;
                          if (res?.status === 409) {
                            if (
                              confirm(
                                `${res.data?.message ?? 'This will destroy the organization.'}\n\nProceed anyway?`,
                              )
                            ) {
                              await deleteUser.mutateAsync({ id: user.id, confirmCascade: true });
                            }
                          } else {
                            alert(res?.data?.message ?? 'Failed to delete user');
                          }
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
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
