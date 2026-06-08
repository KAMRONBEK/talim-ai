'use client';

import Link from 'next/link';
import { use, useState } from 'react';
import { Button, Card, CardContent, CardHeader, Input, Label } from '@talim/ui';
import type { PlanCode, SubscriptionStatus } from '@talim/types';
import { useAdminTenant, useUpdateTenant } from '@/hooks/useAdmin';

const TENANT_PLANS: PlanCode[] = ['TENANT_STARTER', 'TENANT_GROWTH'];
const STATUS_OPTIONS: SubscriptionStatus[] = ['ACTIVE', 'PAST_DUE', 'CANCELED', 'TRIALING'];

function formatLimit(used: number, limit: number | null): string {
  if (limit === null) return `${used} / ∞`;
  return `${used} / ${limit}`;
}

export default function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading } = useAdminTenant(id);
  const updateTenant = useUpdateTenant();

  const [name, setName] = useState('');
  const [planCode, setPlanCode] = useState<PlanCode | ''>('');
  const [status, setStatus] = useState<SubscriptionStatus | ''>('');
  const [periodEnd, setPeriodEnd] = useState('');

  if (isLoading || !data) {
    return <p className="text-muted-foreground">Loading organization…</p>;
  }

  const { tenant, subscription, usageVsLimits } = data;
  const currentName = name || tenant.name;
  const currentPlan = planCode || subscription?.planCode || 'TENANT_STARTER';
  const currentStatus = status || subscription?.status || 'ACTIVE';
  const currentPeriodEnd =
    periodEnd ||
    (subscription?.currentPeriodEnd ? subscription.currentPeriodEnd.slice(0, 10) : '');

  return (
    <div className="space-y-6">
      <div>
        <Link href="/tenants" className="text-sm text-primary hover:underline">
          ← Back to tenants
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{tenant.name}</h1>
        <p className="text-sm text-muted-foreground">{tenant.slug}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Tenant owner</p>
            <Link href={`/users/${tenant.owner.id}`} className="font-semibold text-primary hover:underline">
              {tenant.owner.email}
            </Link>
            {tenant.owner.name && (
              <p className="text-xs text-muted-foreground">{tenant.owner.name}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Learners</p>
            <p className="font-semibold">{tenant.studentCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Content items</p>
            <p className="font-semibold">{tenant.contentCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Subscription</p>
            <p className="font-semibold">{subscription?.effectivePlanCode ?? 'None'}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Organization & subscription</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">Organization name</Label>
            <Input
              id="name"
              value={currentName}
              onChange={(e) => setName(e.target.value)}
            />
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
                {TENANT_PLANS.map((p) => (
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
            disabled={updateTenant.isPending}
            onClick={() => {
              const body: {
                name?: string;
                planCode?: PlanCode;
                status?: SubscriptionStatus;
                currentPeriodEnd?: string | null;
              } = {};
              if (name && name !== tenant.name) body.name = name;
              if (!subscription || (planCode && planCode !== subscription.planCode)) {
                body.planCode = (planCode || subscription?.planCode || 'TENANT_STARTER') as PlanCode;
              }
              if (!subscription || (status && status !== subscription.status)) {
                body.status = (status || subscription?.status || 'ACTIVE') as SubscriptionStatus;
              }
              const storedEnd = subscription?.currentPeriodEnd?.slice(0, 10) ?? '';
              if (periodEnd !== storedEnd) {
                body.currentPeriodEnd = periodEnd ? new Date(periodEnd).toISOString() : null;
              }
              if (Object.keys(body).length === 0) return;
              updateTenant.mutate({ tenantId: id, ...body });
            }}
          >
            {updateTenant.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Members</h2>
          <p className="text-sm text-muted-foreground">Tenant owner and learners in this organization</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Member role</th>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">User role</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {tenant.members.map((member) => (
                  <tr key={member.membershipId} className="border-t">
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                        {member.memberRole === 'OWNER' ? 'Tenant owner' : 'Learner'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/users/${member.userId}`}
                        className="text-primary hover:underline"
                      >
                        {member.email}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{member.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                        {member.userRole}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {member.memberRole === 'OWNER' ? (
                        '—'
                      ) : member.active ? (
                        <span className="text-emerald-600">Active</span>
                      ) : (
                        <span className="text-muted-foreground">Inactive</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {tenant.members.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No members found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {usageVsLimits && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Usage vs limits (this month)</h2>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Students</p>
                <p className="font-medium">
                  {formatLimit(usageVsLimits.students.used, usageVsLimits.students.limit)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Content items</p>
                <p className="font-medium">
                  {formatLimit(usageVsLimits.contentItems.used, usageVsLimits.contentItems.limit)}
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
      )}
    </div>
  );
}
