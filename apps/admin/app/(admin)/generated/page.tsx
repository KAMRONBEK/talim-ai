'use client';

import { useState } from 'react';
import { Button } from '@talim/ui';
import { useAdminGenerated } from '@/hooks/useAdmin';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

const tabs = [
  { id: 'all', label: 'All' },
  { id: 'podcast', label: 'Podcasts' },
  { id: 'quiz', label: 'Quizzes' },
  { id: 'slideshow', label: 'Slideshows' },
  { id: 'summary', label: 'Summaries' },
] as const;

export default function GeneratedPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]['id']>('all');
  const { data, isLoading } = useAdminGenerated(tab);
  const qc = useQueryClient();

  const handleDelete = async (id: string, kind: string) => {
    if (!confirm('Delete this generated item?')) return;
    try {
      await api.delete(`/admin/generated/${id}`, { params: { kind } });
      qc.invalidateQueries({ queryKey: ['admin', 'generated'] });
    } catch (err) {
      const res = (err as { response?: { data?: { message?: string } } })?.response;
      alert(res?.data?.message ?? 'Failed to delete this item. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Generated media</h1>
        <p className="text-sm text-muted-foreground">Podcasts, quizzes, slideshows, summaries</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Button
            key={t.id}
            variant={tab === t.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </Button>
        ))}
      </div>
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Kind</th>
              <th className="px-4 py-3 text-left font-medium">Content</th>
              <th className="px-4 py-3 text-left font-medium">Owner</th>
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
            {data?.map((item) => (
              <tr key={`${item.kind}-${item.id}`} className="border-t">
                <td className="px-4 py-3 capitalize">{item.kind}</td>
                <td className="px-4 py-3">{item.contentTitle}</td>
                <td className="px-4 py-3">{item.userEmail}</td>
                <td className="px-4 py-3">{item.status ?? '—'}</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="outline" size="sm" onClick={() => handleDelete(item.id, item.kind)}>
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
