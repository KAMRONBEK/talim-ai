'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@talim/ui';
import { useBilling } from '@/hooks/useBilling';
import { useAuthStore } from '@/store/useAuthStore';
import { planMessageKey } from '@/lib/plan';
import { UpgradeDialog } from '@/components/account/upgrade-dialog';
import type { TenantBillingUsageVsLimits } from '@talim/types';

function UsageMeter({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number | null;
}) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">
        {used}
        {limit != null ? ` / ${limit}` : ''}
      </p>
    </div>
  );
}

export function BillingSummaryCard() {
  const t = useTranslations('account.billing');
  const tCommon = useTranslations('common');
  const tTenant = useTranslations('tenant');
  const role = useAuthStore((s) => s.user?.role);
  const { data: billing, isLoading } = useBilling();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  if (role === 'TENANT_LEARNER' || role === 'ADMIN') return null;

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <p className="text-sm text-muted-foreground">{tCommon('loading')}</p>
      </div>
    );
  }

  const sub = billing?.subscription;
  const planKey = sub ? planMessageKey(sub.effectivePlanCode) : null;
  const usage = billing?.usage;
  const tenantUsage = usage as TenantBillingUsageVsLimits | undefined;

  return (
    <div className="space-y-4 rounded-xl border bg-card p-6">
      <div>
        <h2 className="font-semibold">{t('title')}</h2>
        <p className="text-sm text-muted-foreground">{t('desc')}</p>
      </div>

      {!sub || sub.status !== 'ACTIVE' ? (
        <div className="rounded-lg border border-warning/40 bg-warning-muted/30 p-4">
          <p className="font-medium">{tTenant('subscriptionRequired')}</p>
          {role === 'TENANT_OWNER' && (
            <p className="mt-1 text-sm text-muted-foreground">{tTenant('billing.adminHint')}</p>
          )}
        </div>
      ) : (
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">{t('plan')}</p>
          <p className="text-lg font-semibold">{planKey ? tCommon(planKey) : sub.planName}</p>
        </div>
      )}

      {usage && (
        <div className="grid gap-3 sm:grid-cols-2">
          {role === 'INDIVIDUAL' && (
            <>
              <UsageMeter label={t('uploads')} used={usage.uploads.used} limit={usage.uploads.limit} />
              <UsageMeter
                label={t('generations')}
                used={usage.generations.used}
                limit={usage.generations.limit}
              />
              <UsageMeter
                label={t('tutorMessages')}
                used={usage.tutorMessages.used}
                limit={usage.tutorMessages.limit}
              />
              {usage.videos && (
                <UsageMeter label={t('videos')} used={usage.videos.used} limit={usage.videos.limit} />
              )}
              {usage.podcasts && (
                <UsageMeter label={t('podcasts')} used={usage.podcasts.used} limit={usage.podcasts.limit} />
              )}
            </>
          )}
          {role === 'TENANT_OWNER' && tenantUsage && (
            <>
              {tenantUsage.students && (
                <UsageMeter
                  label={tTenant('billing.students')}
                  used={tenantUsage.students.used}
                  limit={tenantUsage.students.limit}
                />
              )}
              {tenantUsage.contentItems && (
                <UsageMeter
                  label={tTenant('billing.materials')}
                  used={tenantUsage.contentItems.used}
                  limit={tenantUsage.contentItems.limit}
                />
              )}
              {tenantUsage.generations && (
                <UsageMeter
                  label={tTenant('billing.generations')}
                  used={tenantUsage.generations.used}
                  limit={tenantUsage.generations.limit}
                />
              )}
            </>
          )}
        </div>
      )}

      {role === 'INDIVIDUAL' && usage && (
        <p className="text-xs text-muted-foreground">{t('dailyNote')}</p>
      )}

      {role === 'INDIVIDUAL' && sub?.effectivePlanCode === 'FREE' && (
        <Button variant="gradient" size="sm" onClick={() => setUpgradeOpen(true)}>
          <Sparkles className="h-4 w-4" />
          {t('upgrade.cta')}
        </Button>
      )}

      {role === 'TENANT_OWNER' && (
        <Link href="/tenant/billing">
          <Button variant="outline" size="sm">
            {t('viewBilling')}
          </Button>
        </Link>
      )}

      <UpgradeDialog open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </div>
  );
}
