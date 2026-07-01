'use client';

import { useTranslations } from 'next-intl';
import { AlertTriangle } from 'lucide-react';
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
        <p className="font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">{t('nav.billing')}</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">{t('billing.title')}</h1>
      </div>
      {!sub || sub.status !== 'ACTIVE' ? (
        <div className="flex items-start gap-4 rounded-2xl border border-accent-secondary/40 bg-accent-secondary/10 p-6 shadow-soft">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent-secondary/15 text-accent-secondary">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display font-semibold">{t('subscriptionRequired')}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t('billing.adminHint')}</p>
          </div>
        </div>
      ) : (
        <>
          <p className="-mt-2 text-sm text-muted-foreground">{t('billing.manualNote')}</p>
          <div className="relative overflow-hidden rounded-2xl border border-primary bg-gradient-to-br from-primary to-primary/90 p-6 text-primary-foreground shadow-soft">
            <div className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-primary-foreground/10 blur-2xl" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="font-label text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground/70">
                  {t('billing.plan')}
                </p>
                <p className="mt-1.5 font-display text-2xl font-bold tracking-tight">
                  {planKey ? tCommon(planKey) : sub.planName}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-foreground/25 bg-primary-foreground/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                {sub.status}
              </span>
            </div>
            {usage?.students && (
              <div className="relative mt-5">
                <div className="mb-2 flex items-center justify-between text-sm text-primary-foreground/80">
                  <span>{t('billing.seatsUsed')}</span>
                  <span className="font-semibold tabular-nums text-primary-foreground">
                    {usage.students.used}
                    {usage.students.limit != null ? ` / ${usage.students.limit}` : ''}
                  </span>
                </div>
                {usage.students.limit != null && usage.students.limit > 0 && (
                  <div className="h-2.5 overflow-hidden rounded-full bg-primary-foreground/20">
                    <div
                      className="h-full rounded-full bg-accent-secondary"
                      style={{
                        width: `${Math.min(100, Math.round((usage.students.used / usage.students.limit) * 100))}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
          {usage && (usage.contentItems || usage.generations) && (
            <div className="grid gap-4 sm:grid-cols-2">
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
