'use client';

import Link from 'next/link';
import { use, useState } from 'react';
import { Button, Card, CardContent, CardHeader, Label } from '@talim/ui';
import type { PlanCode, SubscriptionStatus } from '@talim/types';
import { useAdminUser, useUpdateUserSubscription } from '@/hooks/useAdmin';

const PLAN_OPTIONS: PlanCode[] = ['FREE', 'INDIVIDUAL_PRO'];
const STATUS_OPTIONS: SubscriptionStatus[] = ['ACTIVE', 'PAST_DUE', 'CANCELED', 'TRIALING'];

function formatLimit(used: number, limit: number | null): string {
  if (limit === null) return `${used} / ∞`;
  return `${used} / ${limit}`;
}

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading } = useAdminUser(id);
  const updateSubscription = useUpdateUserSubscription();

  const [planCode, setPlanCode] = useState<PlanCode | ''>('');
  const [status, setStatus] = useState<SubscriptionStatus | ''>('');
  const [periodEnd, setPeriodEnd] = useState('');

  if (isLoading || !data) {
    return <p className="text-muted-foreground">Loading user…</p>;
  }

  const { user, subscription, usageVsLimits, contents } = data;
  const currentPlan = planCode || subscription.planCode;
  const currentStatus = status || subscription.status;
  const currentPeriodEnd =
    periodEnd ||
    (subscription.currentPeriodEnd
      ? subscription.currentPeriodEnd.slice(0, 10)
      : '');

  return (
    <div className="space-y-6">
      <div>
        <Link href="/users" className="text-sm text-primary hover:underline">
          ← Back to users
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{user.email}</h1>
        <p className="text-sm text-muted-foreground">{user.name ?? 'No name'}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Role</p>
            <p className="font-semibold">{user.role}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Content items</p>
            <p className="font-semibold">{user.contentCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Quizzes</p>
            <p className="font-semibold">{user.quizCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">API cost (30d)</p>
            <p className="font-semibold">${user.usageLast30Days.toFixed(4)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Subscription</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Effective plan</p>
              <p className="font-medium">{subscription.effectivePlanCode}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Stored plan</p>
              <p className="font-medium">{subscription.planCode}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Source</p>
              <p className="font-medium">{subscription.source}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">External ID</p>
              <p className="font-medium">{subscription.externalSubscriptionId ?? '—'}</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="plan">Plan</Label>
              <select
                id="plan"
                value={currentPlan}
                onChange={(e) => setPlanCode(e.target.value as PlanCode)}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              >
                {PLAN_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={currentStatus}
                onChange={(e) => setStatus(e.target.value as SubscriptionStatus)}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="periodEnd">Period end (optional)</Label>
              <input
                id="periodEnd"
                type="date"
                value={currentPeriodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              />
            </div>
          </div>
          <Button
            disabled={updateSubscription.isPending}
            onClick={() => {
              const body: { planCode?: PlanCode; status?: SubscriptionStatus; currentPeriodEnd?: string | null } =
                {};
              if (planCode && planCode !== subscription.planCode) body.planCode = planCode;
              if (status && status !== subscription.status) body.status = status;
              if (periodEnd !== (subscription.currentPeriodEnd?.slice(0, 10) ?? '')) {
                body.currentPeriodEnd = periodEnd ? new Date(periodEnd).toISOString() : null;
              }
              if (Object.keys(body).length === 0) return;
              updateSubscription.mutate({ userId: id, ...body });
            }}
          >
            {updateSubscription.isPending ? 'Saving…' : 'Save subscription'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Usage vs limits (this month)</h2>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Uploads</p>
              <p className="font-medium">
                {formatLimit(usageVsLimits.uploads.used, usageVsLimits.uploads.limit)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Generations</p>
              <p className="font-medium">
                {formatLimit(usageVsLimits.generations.used, usageVsLimits.generations.limit)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tutor messages</p>
              <p className="font-medium">
                {formatLimit(usageVsLimits.tutorMessages.used, usageVsLimits.tutorMessages.limit)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">API cost (MTD)</p>
              <p className="font-medium">${usageVsLimits.apiCostUsd.toFixed(4)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Recent content</h2>
        </CardHeader>
        <CardContent>
          {contents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No content yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {contents.map((c) => (
                <li key={c.id} className="flex justify-between border-b pb-2 last:border-0">
                  <span>{c.title}</span>
                  <span className="text-muted-foreground">
                    {c.type} · {c.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
