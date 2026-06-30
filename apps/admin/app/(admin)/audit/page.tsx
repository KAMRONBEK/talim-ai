'use client';

import { useState } from 'react';
import { Button, Card, CardContent } from '@talim/ui';
import { useAdminAuditLogs } from '@/hooks/useAdmin';

export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useAdminAuditLogs({ page });

  return (
    <div className="space-y-6">
      <div>
        <p className="font-label text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Admin
        </p>
        <h1 className="font-display text-2xl font-semibold">Audit log</h1>
        <p className="text-sm text-muted-foreground">Every admin mutation, newest first.</p>
      </div>

      {isError ? (
        <p className="text-sm text-destructive">Couldn&apos;t load the audit log. Please try again.</p>
      ) : isLoading || !data ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : data.items.length === 0 ? (
        <Card className="rounded-2xl border-border shadow-soft">
          <CardContent className="p-8 text-center text-muted-foreground">No entries yet.</CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-3 font-label text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">When</th>
                <th className="px-4 py-3 font-label text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Admin</th>
                <th className="px-4 py-3 font-label text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Action</th>
                <th className="px-4 py-3 font-label text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Target</th>
                <th className="px-4 py-3 font-label text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Details</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((log) => (
                <tr key={log.id} className="border-t border-border/60 align-top hover:bg-secondary/40">
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">{log.adminEmail}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-primary">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {log.targetType}
                    {log.targetId ? ` · ${log.targetId.slice(0, 8)}` : ''}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {log.metadata ? JSON.stringify(log.metadata) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.total > data.pageSize && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
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
