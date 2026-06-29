'use client';

import { useState } from 'react';
import { Button, Input } from '@talim/ui';
import { useAdminContents, useDeleteContent, useRetryContent } from '@/hooks/useAdmin';

function errorMessage(err: unknown, fallback: string): string {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;
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
          <h1 className="text-2xl font-bold">Content</h1>
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
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Title</th>
              <th className="px-4 py-3 text-left font-medium">Owner</th>
              <th className="px-4 py-3 text-left font-medium">Type</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
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
              <tr key={item.id} className="border-t">
                <td className="px-4 py-3 font-medium">{item.title}</td>
                <td className="px-4 py-3">{item.userEmail}</td>
                <td className="px-4 py-3">{item.type}</td>
                <td className="px-4 py-3">{item.status}</td>
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
