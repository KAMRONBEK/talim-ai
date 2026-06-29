'use client';

import { useState } from 'react';
import { Button, Card, CardContent, Input } from '@talim/ui';
import {
  useAdminTutorRequests,
  useApproveTutorRequest,
  useRejectTutorRequest,
} from '@/hooks/useAdmin';

const STATUS_FILTERS = ['PENDING', 'APPROVED', 'REJECTED', ''] as const;

function errorMessage(err: unknown, fallback: string): string {
  return (
    (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback
  );
}

export default function TutorRequestsPage() {
  const [status, setStatus] = useState<string>('PENDING');
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useAdminTutorRequests({ status: status || undefined, page });
  const approve = useApproveTutorRequest();
  const reject = useRejectTutorRequest();
  const [seatById, setSeatById] = useState<Record<string, string>>({});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tutor requests</h1>
        <p className="text-sm text-muted-foreground">
          Approve learners who asked to become tutors. Approving creates their organization with an
          active subscription; set a seat limit to cap their students.
        </p>
      </div>

      <div className="flex gap-2">
        {STATUS_FILTERS.map((s) => (
          <Button
            key={s || 'all'}
            variant={status === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
          >
            {s || 'All'}
          </Button>
        ))}
      </div>

      {isError ? (
        <p className="text-sm text-destructive">Couldn&apos;t load tutor requests. Please try again.</p>
      ) : isLoading || !data ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : data.items.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No {status ? status.toLowerCase() : ''} requests.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.items.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold">{r.orgName}</p>
                  <p className="text-sm text-muted-foreground">
                    {r.userEmail}
                    {r.userName ? ` · ${r.userName}` : ''}
                  </p>
                  {r.note && <p className="mt-1 text-sm">{r.note}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(r.createdAt).toLocaleString()} ·{' '}
                    <span className="uppercase">{r.status}</span>
                  </p>
                </div>
                {r.status === 'PENDING' && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      placeholder="Seat limit"
                      className="w-28"
                      value={seatById[r.id] ?? ''}
                      onChange={(e) => setSeatById((m) => ({ ...m, [r.id]: e.target.value }))}
                    />
                    <Button
                      size="sm"
                      disabled={approve.isPending}
                      onClick={async () => {
                        const raw = seatById[r.id];
                        const seatLimit = raw && raw.trim() !== '' ? Number(raw) : undefined;
                        try {
                          await approve.mutateAsync({ id: r.id, seatLimit });
                        } catch (err) {
                          alert(errorMessage(err, 'Failed to approve'));
                        }
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={reject.isPending}
                      onClick={async () => {
                        if (!confirm(`Reject ${r.userEmail}'s request?`)) return;
                        try {
                          await reject.mutateAsync({ id: r.id });
                        } catch (err) {
                          alert(errorMessage(err, 'Failed to reject'));
                        }
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
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
