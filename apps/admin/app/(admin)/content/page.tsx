'use client';

import { useState } from 'react';
import { Button, Input } from '@talim/ui';
import { useAdminContents, useDeleteContent, useRetryContent } from '@/hooks/useAdmin';

function errorMessage(err: unknown, fallback: string): string {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;
}

function statusPillClass(status: string): string {
  const s = status.toUpperCase();
  if (s.includes('INACTIVE')) return 'bg-muted text-muted-foreground';
  if (/FAIL|REJECT|CANCEL|ERROR|EXPIR/.test(s)) return 'bg-destructive/10 text-destructive';
  if (/PAST.?DUE|OVERDUE|PAUSE|WARN|PENDING|QUEUE/.test(s)) return 'bg-warning-muted text-warning';
  if (/ACTIVE|READY|DONE|APPROV|COMPLETE|SUCCESS/.test(s)) return 'bg-success-muted text-success';
  return 'bg-muted text-muted-foreground';
}

export default function ContentPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useAdminContents({ page, search: search || undefined });
  const deleteContent = useDeleteContent();
  const retryContent = useRetryContent();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-label text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Admin
          </p>
          <h1 className="font-display text-2xl font-semibold">Content</h1>
          <p className="text-sm text-muted-foreground">All uploads across the platform</p>
        </div>
        <Input
          placeholder="Search title…"
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
                Title
              </th>
              <th className="px-4 py-3 text-left font-label text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Owner
              </th>
              <th className="px-4 py-3 text-left font-label text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Type
              </th>
              <th className="px-4 py-3 text-left font-label text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-right font-label text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Actions
              </th>
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
            {isError && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-destructive">
                  Couldn&apos;t load content. Please try again.
                </td>
              </tr>
            )}
            {data?.items.map((item) => (
              <tr key={item.id} className="border-t border-border/60 hover:bg-secondary/40">
                <td className="px-4 py-3 font-medium">{item.title}</td>
                <td className="px-4 py-3 text-muted-foreground">{item.userEmail}</td>
                <td className="px-4 py-3 text-muted-foreground">{item.type}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusPillClass(item.status)}`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  {item.status === 'FAILED' && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={retryContent.isPending}
                      onClick={async () => {
                        try {
                          await retryContent.mutateAsync(item.id);
                        } catch (err) {
                          alert(errorMessage(err, 'Failed to retry this job. Please try again.'));
                        }
                      }}
                    >
                      Retry
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-destructive/30 text-destructive hover:bg-destructive/10"
                    disabled={deleteContent.isPending}
                    onClick={async () => {
                      if (!confirm(`Delete "${item.title}"?`)) return;
                      try {
                        await deleteContent.mutateAsync(item.id);
                      } catch (err) {
                        alert(errorMessage(err, 'Failed to delete this content. Please try again.'));
                      }
                    }}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
