'use client';

import { useState } from 'react';
import { Button, Card, CardContent, CardHeader, Input } from '@talim/ui';
import {
  useAdminContents,
  useAdminContentDetail,
  useDeleteContent,
  useRetryContent,
} from '@/hooks/useAdmin';

function errorMessage(err: unknown, fallback: string): string {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;
}

function BoolBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        ok ? 'bg-success-muted text-success' : 'bg-muted text-muted-foreground'
      }`}
    >
      {ok ? '✓' : '—'} {label}
    </span>
  );
}

function DetailStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background px-3 py-2">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-display text-lg font-semibold">{value}</p>
    </div>
  );
}

function ContentDetailModal({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, isLoading, isError } = useAdminContentDetail(id);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/40 p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label="Content detail"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-3xl rounded-2xl shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <p className="font-label text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Content detail
            </p>
            <h2 className="mt-1 font-display text-lg font-semibold">
              {data?.content.title ?? 'Loading…'}
            </h2>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading && <p className="text-sm text-muted-foreground">Loading detail…</p>}
          {isError && (
            <p className="text-sm text-destructive">Couldn&apos;t load this content&apos;s detail.</p>
          )}
          {data && (
            <>
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <span className="text-muted-foreground">Owner: </span>
                  <span className="font-medium">{data.content.userEmail}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Type: </span>
                  <span className="font-medium">{data.content.type}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status: </span>
                  <span className="font-medium">{data.content.status}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Created: </span>
                  <span className="font-medium">
                    {new Date(data.content.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <section className="space-y-3">
                <h3 className="font-display text-base font-semibold">Pipeline</h3>
                <div className="flex flex-wrap gap-2">
                  <BoolBadge ok={data.pipeline.textExtracted} label="Text extracted" />
                  <BoolBadge ok={data.pipeline.chunked} label="Chunked" />
                  <BoolBadge ok={data.pipeline.sectioned} label="Sectioned" />
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <DetailStat label="Chunks" value={data.pipeline.chunkCount} />
                  <DetailStat label="Embedded chunks" value={data.pipeline.embeddedChunkCount} />
                  <DetailStat label="Sections" value={data.pipeline.sectionCount} />
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="font-display text-base font-semibold">Generated media</h3>
                <div className="flex flex-wrap gap-2">
                  <BoolBadge
                    ok={data.generated.summary.present}
                    label={`Summary (${data.generated.summary.count})`}
                  />
                  <BoolBadge
                    ok={data.generated.quiz.present}
                    label={`Quiz (${data.generated.quiz.count})`}
                  />
                  <BoolBadge
                    ok={data.generated.podcast.present}
                    label={`Podcast${data.generated.podcast.status ? ` · ${data.generated.podcast.status}` : ''}`}
                  />
                  <BoolBadge
                    ok={data.generated.video.present}
                    label={`Video${data.generated.video.status ? ` · ${data.generated.video.status}` : ''}`}
                  />
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="font-display text-base font-semibold">
                  RAG chunk sample{' '}
                  <span className="text-sm font-normal text-muted-foreground">
                    ({data.chunks.length})
                  </span>
                </h3>
                {data.chunks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No chunks yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {data.chunks.map((c) => (
                      <li
                        key={c.chunkIndex}
                        className="rounded-xl border border-border/60 bg-background p-3"
                      >
                        <div className="mb-1 flex items-center justify-between">
                          <span className="font-mono text-xs text-muted-foreground">
                            #{c.chunkIndex}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              c.hasEmbedding
                                ? 'bg-success-muted text-success'
                                : 'bg-warning-muted text-warning'
                            }`}
                          >
                            {c.hasEmbedding ? 'embedded' : 'no embedding'}
                          </span>
                        </div>
                        <p className="line-clamp-3 text-sm text-muted-foreground">{c.text}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
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
  const [detailId, setDetailId] = useState<string | null>(null);
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
                  <Button variant="outline" size="sm" onClick={() => setDetailId(item.id)}>
                    Details
                  </Button>
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
      {detailId && <ContentDetailModal id={detailId} onClose={() => setDetailId(null)} />}
    </div>
  );
}
