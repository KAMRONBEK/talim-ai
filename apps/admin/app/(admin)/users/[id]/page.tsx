'use client';

import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { Button, Card, CardContent, CardHeader, Input, Label } from '@talim/ui';
import type {
  AdminTenantUsageVsLimits,
  AdminUsageVsLimits,
  PlanCode,
  SubscriptionStatus,
  UserRole,
} from '@talim/types';
import {
  useAdminTenants,
  useAdminTenant,
  useAdminUser,
  usePatchUser,
  useResetUserPassword,
  useUpdateUserSubscription,
} from '@/hooks/useAdmin';
import { planLabel } from '@/lib/plan';

const INDIVIDUAL_PLANS: PlanCode[] = ['FREE', 'INDIVIDUAL_PRO'];
const STATUS_OPTIONS: SubscriptionStatus[] = ['ACTIVE', 'PAST_DUE', 'CANCELED', 'TRIALING'];
const ROLE_OPTIONS: UserRole[] = ['INDIVIDUAL', 'TENANT_OWNER', 'TENANT_LEARNER', 'ADMIN'];

function formatLimit(used: number, limit: number | null): string {
  if (limit === null) return `${used} / ∞`;
  return `${used} / ${limit}`;
}

function isTenantUsage(
  usage: AdminUsageVsLimits | AdminTenantUsageVsLimits,
): usage is AdminTenantUsageVsLimits {
  return 'students' in usage;
}

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading, isError } = useAdminUser(id);
  const updateSubscription = useUpdateUserSubscription();
  const patchUser = usePatchUser();
  const resetPassword = useResetUserPassword();
  const { data: tenantsData } = useAdminTenants({ page: 1, pageSize: 100 });

  const [planCode, setPlanCode] = useState<PlanCode | ''>('');
  const [status, setStatus] = useState<SubscriptionStatus | ''>('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');
  const [orgName, setOrgName] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [newOwnerId, setNewOwnerId] = useState('');
  const [passwordNote, setPasswordNote] = useState('');
  const [customPassword, setCustomPassword] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);

  const ownedTenantId = data?.user.ownedTenant?.id ?? '';
  const { data: ownedTenantData } = useAdminTenant(ownedTenantId);

  useEffect(() => {
    if (data?.user) {
      setPasswordNote(data.user.adminPasswordNote ?? '');
    }
  }, [data?.user.id, data?.user.adminPasswordNote]);

  if (isError) {
    return <p className="text-sm text-destructive">Couldn&apos;t load this user. Please try again.</p>;
  }
  if (isLoading || !data) {
    return <p className="text-muted-foreground">Loading user…</p>;
  }

  const { user, subscription, usageVsLimits, contents } = data;
  const isTenantOwner = user.role === 'TENANT_OWNER';
  const isTenantLearner = user.role === 'TENANT_LEARNER';
  const targetRole = role || user.role;
  const needsOrgName =
    targetRole === 'TENANT_OWNER' && !user.ownedTenant && role !== '' && role !== user.role;
  const needsTenantId =
    targetRole === 'TENANT_LEARNER' ||
    (targetRole === 'TENANT_OWNER' && role !== '' && role !== user.role && !orgName.trim());
  const needsNewOwner =
    Boolean(user.ownedTenant) &&
    user.role === 'TENANT_OWNER' &&
    role === 'INDIVIDUAL';
  const transferCandidates =
    ownedTenantData?.tenant.members.filter((member) => member.userId !== user.id) ?? [];

  const currentPlan = planCode || subscription?.planCode || 'FREE';
  const currentStatus = status || subscription?.status || 'ACTIVE';
  const currentPeriodEnd =
    periodEnd ||
    (subscription?.currentPeriodEnd ? subscription.currentPeriodEnd.slice(0, 10) : '');

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
          <h2 className="font-semibold">Credentials</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Last known password for support lookups. Updating the note alone does not change the login
            password unless you use Set password or Generate new password.
          </p>
          {passwordNote ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Recorded password</p>
              <div className="flex flex-wrap items-center gap-2">
                <code className="rounded-lg bg-muted px-3 py-2 font-mono text-sm">{passwordNote}</code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigator.clipboard?.writeText(passwordNote)}
                >
                  Copy
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Not recorded</p>
          )}
          {generatedPassword && (
            <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-4">
              <p className="text-sm font-medium">New password (save it now)</p>
              <code className="block rounded-lg bg-muted px-3 py-2 font-mono text-sm">
                {generatedPassword}
              </code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard?.writeText(generatedPassword)}
              >
                Copy
              </Button>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="passwordNote">Password note (backfill)</Label>
              <Input
                id="passwordNote"
                placeholder="Record a known password without changing login"
                // Prevent the browser from silently autofilling the operator's own
                // saved credentials into this field (clicking Save/Set would then
                // overwrite the target user's note/password with the admin's).
                autoComplete="off"
                value={passwordNote}
                onChange={(e) => setPasswordNote(e.target.value)}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="customPassword">Set new password</Label>
              <Input
                id="customPassword"
                type="password"
                // "new-password" reliably stops Chrome from silently filling the
                // operator's saved login password into this set-password field.
                autoComplete="new-password"
                placeholder="Minimum 8 characters"
                value={customPassword}
                onChange={(e) => setCustomPassword(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={patchUser.isPending}
              onClick={() => {
                if (passwordNote === (user.adminPasswordNote ?? '')) return;
                patchUser.mutate({ userId: id, adminPasswordNote: passwordNote || null });
              }}
            >
              {patchUser.isPending ? 'Saving…' : 'Save note'}
            </Button>
            <Button
              variant="outline"
              disabled={resetPassword.isPending || customPassword.length < 8}
              onClick={async () => {
                const temporaryPassword = await resetPassword.mutateAsync({
                  userId: id,
                  password: customPassword,
                });
                setGeneratedPassword(temporaryPassword);
                setCustomPassword('');
                setPasswordNote(temporaryPassword);
              }}
            >
              {resetPassword.isPending ? 'Saving…' : 'Set password'}
            </Button>
            <Button
              disabled={resetPassword.isPending}
              onClick={async () => {
                if (
                  !confirm(
                    `Generate a new password for ${user.email}? The previous password will stop working.`,
                  )
                ) {
                  return;
                }
                const temporaryPassword = await resetPassword.mutateAsync({
                  userId: id,
                  generate: true,
                });
                setGeneratedPassword(temporaryPassword);
                setPasswordNote(temporaryPassword);
              }}
            >
              {resetPassword.isPending ? 'Generating…' : 'Generate new password'}
            </Button>
          </div>
          {resetPassword.isError && (
            <p className="text-sm text-destructive">
              {(resetPassword.error as { response?: { data?: { message?: string } } })?.response?.data
                ?.message ?? 'Failed to reset password'}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Role & organization</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {user.ownedTenant && (
            <p className="text-sm text-muted-foreground">
              Owns organization:{' '}
              <Link href={`/tenants/${user.ownedTenant.id}`} className="text-primary hover:underline">
                {user.ownedTenant.name}
              </Link>
            </p>
          )}
          {user.learnerTenant && (
            <p className="text-sm text-muted-foreground">
              Learner in:{' '}
              <Link href={`/tenants/${user.learnerTenant.id}`} className="text-primary hover:underline">
                {user.learnerTenant.name}
              </Link>
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                value={targetRole}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            {needsOrgName && (
              <div className="space-y-1">
                <Label htmlFor="orgName">New organization name</Label>
                <Input
                  id="orgName"
                  placeholder="Acme School"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                />
              </div>
            )}
            {needsTenantId && (
              <div className="space-y-1">
                <Label htmlFor="tenantId">Organization</Label>
                <select
                  id="tenantId"
                  value={tenantId || user.learnerTenant?.id || user.ownedTenant?.id || ''}
                  onChange={(e) => setTenantId(e.target.value)}
                  className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="">Select organization…</option>
                  {tenantsData?.items.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.slug})
                    </option>
                  ))}
                </select>
              </div>
            )}
            {needsNewOwner && (
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="newOwnerId">Transfer ownership to</Label>
                <select
                  id="newOwnerId"
                  value={newOwnerId}
                  onChange={(e) => setNewOwnerId(e.target.value)}
                  className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="">Select new owner…</option>
                  {transferCandidates.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.name ?? member.email} ({member.email})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Required before demoting an organization owner to individual.
                </p>
              </div>
            )}
          </div>
          <Button
            disabled={patchUser.isPending || (needsNewOwner && !newOwnerId)}
            onClick={() => {
              if (role && role === user.role) return;
              const body: {
                role?: UserRole;
                orgName?: string;
                tenantId?: string;
                newOwnerId?: string;
              } = {};
              if (role && role !== user.role) body.role = role;
              if (orgName.trim()) body.orgName = orgName.trim();
              if (needsNewOwner && newOwnerId) body.newOwnerId = newOwnerId;
              const selectedTenant =
                tenantId || user.learnerTenant?.id || user.ownedTenant?.id || undefined;
              if (selectedTenant && (targetRole === 'TENANT_LEARNER' || targetRole === 'TENANT_OWNER')) {
                body.tenantId = selectedTenant;
              }
              if (!body.role) return;
              patchUser.mutate({ userId: id, ...body });
            }}
          >
            {patchUser.isPending ? 'Saving…' : 'Save role'}
          </Button>
          {patchUser.isError && (
            <p className="text-sm text-destructive">
              {(patchUser.error as { response?: { data?: { message?: string } } })?.response?.data
                ?.message ?? 'Failed to update role'}
            </p>
          )}
        </CardContent>
      </Card>

      {isTenantOwner ? (
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Subscription</h2>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              Tenant owners are billed via the organization subscription, not a personal plan.
            </p>
            {user.ownedTenant ? (
              <Link
                href={`/tenants/${user.ownedTenant.id}`}
                className="inline-block text-primary hover:underline"
              >
                Manage {user.ownedTenant.name} subscription →
              </Link>
            ) : (
              <p className="text-muted-foreground">No organization linked yet.</p>
            )}
            {subscription && (
              <div className="pt-2">
                <p className="text-xs text-muted-foreground">Current org plan</p>
                <p className="font-medium">
                  {planLabel(subscription.effectivePlanCode)} · {subscription.status}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Subscription</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {isTenantLearner && (
              <p className="text-sm text-muted-foreground">
                Learners use the organization subscription. No personal plan applies.
              </p>
            )}
            {subscription ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Effective plan</p>
                    <p className="font-medium">{planLabel(subscription.effectivePlanCode)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Stored plan</p>
                    <p className="font-medium">{planLabel(subscription.planCode)}</p>
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
                {!isTenantLearner && (
                  <>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-1">
                        <Label htmlFor="plan">Plan</Label>
                        <select
                          id="plan"
                          value={currentPlan}
                          onChange={(e) => setPlanCode(e.target.value as PlanCode)}
                          className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                        >
                          {INDIVIDUAL_PLANS.map((p) => (
                            <option key={p} value={p}>
                              {planLabel(p)}
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
                        const body: {
                          planCode?: PlanCode;
                          status?: SubscriptionStatus;
                          currentPeriodEnd?: string | null;
                        } = {};
                        if (planCode && planCode !== subscription.planCode) body.planCode = planCode;
                        if (status && status !== subscription.status) body.status = status;
                        if (periodEnd !== (subscription.currentPeriodEnd?.slice(0, 10) ?? '')) {
                          body.currentPeriodEnd = periodEnd
                            ? new Date(periodEnd).toISOString()
                            : null;
                        }
                        if (Object.keys(body).length === 0) return;
                        updateSubscription.mutate({ userId: id, ...body });
                      }}
                    >
                      {updateSubscription.isPending ? 'Saving…' : 'Save subscription'}
                    </Button>
                  </>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No subscription on file.</p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Usage vs limits (this month)</h2>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 text-sm">
            {isTenantUsage(usageVsLimits) && (
              <>
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
              </>
            )}
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
