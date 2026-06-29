'use client';

import { useState } from 'react';
import { Button } from '@talim/ui';
import { useAdminUsage } from '@/hooks/useAdmin';

export default function UsagePage() {
  const [days, setDays] = useState(30);
  const { data, isLoading, isError } = useAdminUsage(days);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Usage & costs</h1>
          <p className="text-sm text-muted-foreground">API spend by user</p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <Button key={d} variant={days === d ? 'default' : 'outline'} size="sm" onClick={() => setDays(d)}>
              {d}d
            </Button>
          ))}
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">User</th>
              <th className="px-4 py-3 text-left font-medium">Events</th>
              <th className="px-4 py-3 text-left font-medium">Input tokens</th>
              <th className="px-4 py-3 text-left font-medium">Output tokens</th>
              <th className="px-4 py-3 text-right font-medium">Est. cost (USD)</th>
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
                  Couldn&apos;t load usage. Please try again.
                </td>
              </tr>
            )}
            {data?.rows.map((row) => (
              <tr key={row.userId} className="border-t">
                <td className="px-4 py-3">
                  <div className="font-medium">{row.userEmail}</div>
                  {row.userName && <div className="text-xs text-muted-foreground">{row.userName}</div>}
                </td>
                <td className="px-4 py-3">{row.eventCount}</td>
                <td className="px-4 py-3">{row.totalInputTokens.toLocaleString()}</td>
                <td className="px-4 py-3">{row.totalOutputTokens.toLocaleString()}</td>
                <td className="px-4 py-3 text-right font-medium">${row.estimatedCostUsd.toFixed(4)}</td>
              </tr>
            ))}
            {!isLoading && data?.rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No usage recorded in this period.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
