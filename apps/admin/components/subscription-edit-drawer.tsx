'use client';

import { useState } from 'react';
import { Button, Sheet, SheetContent } from '@talim/ui';
import type {
  AdminSubscriptionListItem,
  PlanCode,
  SubscriptionStatus,
} from '@talim/types';
import { useUpdateTenant, useUpdateUserSubscription } from '@/hooks/useAdmin';
import { planLabel } from '@/lib/plan';

const STATUS_OPTIONS: SubscriptionStatus[] = ['ACTIVE', 'PAST_DUE', 'CANCELED', 'TRIALING'];
const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  ACTIVE: 'Active',
  PAST_DUE: 'Past due',
  CANCELED: 'Canceled',
  TRIALING: 'Trial',
};
const USER_PLANS: PlanCode[] = ['FREE', 'INDIVIDUAL_PRO'];
const TENANT_PLANS: PlanCode[] = ['TENANT_STARTER', 'TENANT_GROWTH'];

function initials(text: string): string {
  const parts = text.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

function formatDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString() : '—';
}

/** Section label matching the enriched-admin design (tiny uppercase caption). */
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1.5 font-label text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
      {children}
    </div>
  );
}

interface DrawerBodyProps {
  subscription: AdminSubscriptionListItem;
  onClose: () => void;
}

function DrawerBody({ subscription, onClose }: DrawerBodyProps) {
  const updateUser = useUpdateUserSubscription();
  const updateTenant = useUpdateTenant();
  const isTenant = subscription.subjectType === 'tenant';

  const title =
    subscription.subjectType === 'tenant'
      ? subscription.tenantName
      : subscription.userName || subscription.userEmail;
  const subtitle =
    subscription.subjectType === 'tenant'
      ? subscription.tenantSlug
      : subscription.userEmail;

  const basePlans = isTenant ? TENANT_PLANS : USER_PLANS;
  const planOptions = basePlans.includes(subscription.planCode as PlanCode)
    ? basePlans
    : [subscription.planCode as PlanCode, ...basePlans];

  const storedEnd = subscription.currentPeriodEnd
    ? subscription.currentPeriodEnd.slice(0, 10)
    : '';
  const seatDefault = subscription.limits?.maxStudents ?? null;

  const [planCode, setPlanCode] = useState<PlanCode>(subscription.planCode as PlanCode);
  const [status, setStatus] = useState<SubscriptionStatus>(subscription.status);
  const [periodEnd, setPeriodEnd] = useState(storedEnd);
  // null = untouched (show stored/plan-default value); '' = explicitly cleared (use plan default).
  const [seatLimit, setSeatLimit] = useState<string | null>(null);

  const mutation = isTenant ? updateTenant : updateUser;
  const pending = mutation.isPending;

  const seatDisplay =
    seatLimit === null ? (seatDefault !== null ? String(seatDefault) : '') : seatLimit;

  function stepSeat(delta: number) {
    const base = Number(seatDisplay || seatDefault || 0);
    const next = Math.max(1, base + delta);
    setSeatLimit(String(next));
  }

  function handleSave() {
    if (subscription.subjectType === 'tenant') {
      const body: {
        planCode?: PlanCode;
        status?: SubscriptionStatus;
        currentPeriodEnd?: string | null;
        seatLimit?: number | null;
      } = {};
      if (planCode !== subscription.planCode) body.planCode = planCode;
      if (status !== subscription.status) body.status = status;
      if (periodEnd !== storedEnd) {
        body.currentPeriodEnd = periodEnd ? new Date(periodEnd).toISOString() : null;
      }
      if (seatLimit !== null) {
        const parsed = seatLimit.trim() === '' ? null : Number(seatLimit);
        if (parsed !== seatDefault) body.seatLimit = parsed;
      }
      if (Object.keys(body).length === 0) {
        onClose();
        return;
      }
      updateTenant.mutate(
        { tenantId: subscription.tenantId, ...body },
        { onSuccess: onClose },
      );
    } else {
      const body: {
        planCode?: PlanCode;
        status?: SubscriptionStatus;
        currentPeriodEnd?: string | null;
      } = {};
      if (planCode !== subscription.planCode) body.planCode = planCode;
      if (status !== subscription.status) body.status = status;
      if (periodEnd !== storedEnd) {
        body.currentPeriodEnd = periodEnd ? new Date(periodEnd).toISOString() : null;
      }
      if (Object.keys(body).length === 0) {
        onClose();
        return;
      }
      updateUser.mutate(
        { userId: subscription.userId, ...body },
        { onSuccess: onClose },
      );
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border p-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-xs font-bold text-primary">
          {initials(title)}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-base font-semibold leading-tight">{title}</h2>
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
            isTenant ? 'bg-secondary text-primary' : 'bg-muted text-muted-foreground'
          }`}
        >
          {isTenant ? 'Organization' : 'Individual'}
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        {/* Plan */}
        <div>
          <FieldLabel>Plan</FieldLabel>
          <select
            aria-label="Plan"
            value={planCode}
            onChange={(e) => setPlanCode(e.target.value as PlanCode)}
            className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm focus:ring-2 focus:ring-ring"
          >
            {planOptions.map((p) => (
              <option key={p} value={p}>
                {planLabel(p)}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <FieldLabel>Status</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((s) => {
              const active = status === s;
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setStatus(s)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border text-muted-foreground hover:bg-secondary/60'
                  }`}
                >
                  {STATUS_LABELS[s]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Period dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Start date</FieldLabel>
            <div className="flex h-9 items-center rounded-xl border border-border bg-muted/40 px-3 text-sm text-muted-foreground">
              {formatDate(subscription.currentPeriodStart)}
            </div>
          </div>
          <div>
            <FieldLabel>Renews / period end</FieldLabel>
            <input
              type="date"
              aria-label="Period end"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Seat limit — tenants only (the user-subscription endpoint has no seat field) */}
        {isTenant && (
          <div>
            <FieldLabel>Seat limit</FieldLabel>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                aria-label="Seat limit"
                value={seatDisplay}
                placeholder="Plan default"
                onChange={(e) => setSeatLimit(e.target.value)}
                className="h-10 flex-1 rounded-xl border border-border bg-background px-3 font-mono text-sm focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                aria-label="Decrease seat limit"
                onClick={() => stepSeat(-1)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-lg text-muted-foreground hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                −
              </button>
              <button
                type="button"
                aria-label="Increase seat limit"
                onClick={() => stepSeat(1)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-lg text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                +
              </button>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Custom student cap for this organization. Leave blank to use the plan default.
            </p>
          </div>
        )}

        {/* Manual-billing note */}
        <div className="flex items-start gap-2 rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground">
          <svg
            className="mt-0.5 shrink-0 text-accent-secondary"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          <span>Manual billing — no payment gateway. Changes are recorded in the audit trail.</span>
        </div>

        {mutation.isError && (
          <p className="text-sm text-destructive">
            {(mutation.error as { response?: { data?: { message?: string } } })?.response?.data
              ?.message ?? 'Failed to save changes. Please try again.'}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex shrink-0 gap-2 border-t border-border p-4">
        <Button className="flex-1" disabled={pending} onClick={handleSave}>
          {pending ? 'Saving…' : 'Save'}
        </Button>
        <Button variant="outline" disabled={pending} onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

interface SubscriptionEditDrawerProps {
  subscription: AdminSubscriptionListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubscriptionEditDrawer({
  subscription,
  open,
  onOpenChange,
}: SubscriptionEditDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="p-0" aria-label="Edit subscription">
        {subscription && (
          <DrawerBody
            key={subscription.id}
            subscription={subscription}
            onClose={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
