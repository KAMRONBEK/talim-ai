'use client';

import { useTranslations } from 'next-intl';
import { AlertTriangle } from 'lucide-react';
import { Badge } from '@talim/ui';
import { useBilling } from '@/hooks/useBilling';
import { planMessageKey } from '@/lib/plan';

export default function TenantBillingPage() {
  const t = useTranslations('tenant');
  const tCommon = useTranslations('common');
  const { data: billing, isLoading } = useBilling();

  if (isLoading) return <p className="text-muted-foreground">{t('loading')}</p>;

  const sub = billing?.subscription;
  const planKey = sub ? planMessageKey(sub.effectivePlanCode) : null;
  const usage = billing?.usage as {
    students?: { used: number; limit: number | null };
    contentItems?: { used: number; limit: number | null };
    generations?: { used: number; limit: number | null };
  } | undefined;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{t('nav.billing')}</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">{t('billing.title')}</h1>
      </div>
      {!sub || sub.status !== 'ACTIVE' ? (
        <div className="flex items-start gap-4 rounded-2xl border border-warning/40 bg-warning-muted/30 p-6 shadow-soft">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-warning/15 text-warning">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display font-semibold">{t('subscriptionRequired')}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t('billing.adminHint')}</p>
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
            <p className="text-sm font-medium text-muted-foreground">{t('billing.plan')}</p>
            <div className="mt-2 flex items-center gap-3">
              <p className="font-display text-xl font-bold tracking-tight">{planKey ? tCommon(planKey) : sub.planName}</p>
              <Badge variant="success">{sub.status}</Badge>
            </div>
          </div>
          {usage && (
            <div className="grid gap-4 sm:grid-cols-2">
              {usage.students && (
                <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
                  <p className="text-sm font-medium text-muted-foreground">{t('billing.students')}</p>
                  <p className="mt-2 font-display text-3xl font-bold tracking-tight tabular-nums">
                    {usage.students.used}
                    {usage.students.limit != null ? ` / ${usage.students.limit}` : ''}
                  </p>
                </div>
              )}
              {usage.contentItems && (
                <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
                  <p className="text-sm font-medium text-muted-foreground">{t('billing.materials')}</p>
                  <p className="mt-2 font-display text-3xl font-bold tracking-tight tabular-nums">
                    {usage.contentItems.used}
                    {usage.contentItems.limit != null ? ` / ${usage.contentItems.limit}` : ''}
                  </p>
                </div>
              )}
              {usage.generations && (
                <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
                  <p className="text-sm font-medium text-muted-foreground">{t('billing.generations')}</p>
                  <p className="mt-2 font-display text-3xl font-bold tracking-tight tabular-nums">
                    {usage.generations.used}
                    {usage.generations.limit != null ? ` / ${usage.generations.limit}` : ''}
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
