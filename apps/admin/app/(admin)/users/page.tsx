'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Input } from '@talim/ui';
import { useAdminUsers, useDeleteUser, useResetUserPassword } from '@/hooks/useAdmin';
import { planLabel } from '@/lib/plan';

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
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm text-muted-foreground">All platform accounts</p>
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
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Password</th>
              <th className="px-4 py-3 text-left font-medium">Role</th>
              <th className="px-4 py-3 text-left font-medium">Plan</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Content</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
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
              <tr key={user.id} className="border-t">
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
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{user.role}</span>
                </td>
                <td className="px-4 py-3">{planLabel(user.planCode)}</td>
                <td className="px-4 py-3">
                  {user.subscriptionStatus ? (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
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
