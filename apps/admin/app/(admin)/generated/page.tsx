'use client';

import { useState } from 'react';
import { Button } from '@talim/ui';
import type { MediaReviewStatus } from '@talim/types';
import { useAdminGenerated, useReviewGenerated } from '@/hooks/useAdmin';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

const tabs = [
  { id: 'all', label: 'All' },
  { id: 'podcast', label: 'Podcasts' },
  { id: 'quiz', label: 'Quizzes' },
  { id: 'slideshow', label: 'Slideshows' },
  { id: 'summary', label: 'Summaries' },
] as const;

function reviewPillClass(status: MediaReviewStatus): string {
  if (status === 'APPROVED') return 'bg-success-muted text-success';
  if (status === 'FLAGGED') return 'bg-destructive/10 text-destructive';
  return 'bg-warning-muted text-warning';
}

function statusPillClass(status: string): string {
  const s = status.toUpperCase();
  if (s.includes('INACTIVE')) return 'bg-muted text-muted-foreground';
  if (/FAIL|REJECT|CANCEL|ERROR|EXPIR/.test(s)) return 'bg-destructive/10 text-destructive';
  if (/PAST.?DUE|OVERDUE|PAUSE|WARN|PENDING|QUEUE|RENDER/.test(s)) return 'bg-warning-muted text-warning';
  if (/ACTIVE|READY|DONE|APPROV|COMPLETE|SUCCESS/.test(s)) return 'bg-success-muted text-success';
  return 'bg-muted text-muted-foreground';
}

export default function GeneratedPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]['id']>('all');
  const { data, isLoading, isError } = useAdminGenerated(tab);
  const reviewGenerated = useReviewGenerated();
  const qc = useQueryClient();

  const handleReview = async (
    kind: string,
    mediaId: string,
    status: 'APPROVED' | 'FLAGGED',
  ) => {
    try {
      await reviewGenerated.mutateAsync({ kind, mediaId, status });
    } catch (err) {
      const res = (err as { response?: { data?: { message?: string } } })?.response;
      alert(res?.data?.message ?? 'Failed to save the review. Please try again.');
    }
  };

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
        <p className="font-label text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Admin
        </p>
        <h1 className="font-display text-2xl font-semibold">Generated media</h1>
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
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-4 py-3 text-left font-label text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Kind
              </th>
              <th className="px-4 py-3 text-left font-label text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Content
              </th>
              <th className="px-4 py-3 text-left font-label text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Owner
              </th>
              <th className="px-4 py-3 text-left font-label text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-left font-label text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Review
              </th>
              <th className="px-4 py-3 text-right font-label text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Actions
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
                  Couldn&apos;t load generated media. Please try again.
                </td>
              </tr>
            )}
            {data?.map((item) => (
              <tr
                key={`${item.kind}-${item.id}`}
                className="border-t border-border/60 hover:bg-secondary/40"
              >
                <td className="px-4 py-3 font-medium capitalize">{item.kind}</td>
                <td className="px-4 py-3">{item.contentTitle}</td>
                <td className="px-4 py-3 text-muted-foreground">{item.userEmail}</td>
                <td className="px-4 py-3">
                  {item.status ? (
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusPillClass(item.status)}`}
                    >
                      {item.status}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-3">
                  {(() => {
                    const pending =
                      reviewGenerated.isPending &&
                      reviewGenerated.variables?.kind === item.kind &&
                      reviewGenerated.variables?.mediaId === item.id;
                    return (
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${reviewPillClass(item.reviewStatus)}`}
                        >
                          {item.reviewStatus}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pending || item.reviewStatus === 'APPROVED'}
                          className="border-success/30 text-success hover:bg-success/10"
                          onClick={() => handleReview(item.kind, item.id, 'APPROVED')}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pending || item.reviewStatus === 'FLAGGED'}
                          className="border-destructive/30 text-destructive hover:bg-destructive/10"
                          onClick={() => handleReview(item.kind, item.id, 'FLAGGED')}
                        >
                          Flag
                        </Button>
                      </div>
                    );
                  })()}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-destructive/30 text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(item.id, item.kind)}
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
