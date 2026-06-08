'use client';

import { useTranslations } from 'next-intl';
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
      <h1 className="text-2xl font-bold">{t('billing.title')}</h1>
      {!sub || sub.status !== 'ACTIVE' ? (
        <div className="rounded-xl border border-warning/40 bg-warning-muted/30 p-6">
          <p className="font-medium">{t('subscriptionRequired')}</p>
          <p className="mt-2 text-sm text-muted-foreground">{t('billing.adminHint')}</p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border p-4">
            <p className="text-sm text-muted-foreground">{t('billing.plan')}</p>
            <p className="text-lg font-semibold">{planKey ? tCommon(planKey) : sub.planName}</p>
            <p className="text-sm text-muted-foreground">{sub.status}</p>
          </div>
          {usage && (
            <div className="grid gap-4 sm:grid-cols-2">
              {usage.students && (
                <div className="rounded-xl border p-4">
                  <p className="text-sm text-muted-foreground">{t('billing.students')}</p>
                  <p className="text-xl font-semibold">
                    {usage.students.used}
                    {usage.students.limit != null ? ` / ${usage.students.limit}` : ''}
                  </p>
                </div>
              )}
              {usage.contentItems && (
                <div className="rounded-xl border p-4">
                  <p className="text-sm text-muted-foreground">{t('billing.materials')}</p>
                  <p className="text-xl font-semibold">
                    {usage.contentItems.used}
                    {usage.contentItems.limit != null ? ` / ${usage.contentItems.limit}` : ''}
                  </p>
                </div>
              )}
              {usage.generations && (
                <div className="rounded-xl border p-4">
                  <p className="text-sm text-muted-foreground">{t('billing.generations')}</p>
                  <p className="text-xl font-semibold">
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
