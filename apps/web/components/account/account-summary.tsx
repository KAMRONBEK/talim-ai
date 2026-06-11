'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@talim/ui';
import { useAuthStore } from '@/store/useAuthStore';
import type { UserRole } from '@talim/types';

const roleKey: Record<UserRole, string> = {
  INDIVIDUAL: 'roleIndividual',
  TENANT_OWNER: 'roleOwner',
  TENANT_LEARNER: 'roleLearner',
  ADMIN: 'roleAdmin',
};

export function AccountSummary({ tenantName }: { tenantName?: string | null }) {
  const t = useTranslations('account.summary');
  const user = useAuthStore((s) => s.user);

  if (!user) return null;

  const orgName = tenantName ?? user.tenantName;

  return (
    <div className="space-y-4 rounded-xl border bg-card p-6">
      <div>
        <h2 className="font-semibold">{t('title')}</h2>
        <p className="text-sm text-muted-foreground">{t('desc')}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">{t('role')}</span>
        <Badge variant="secondary">{t(roleKey[user.role])}</Badge>
      </div>
      {orgName && (
        <div className="space-y-1">
          <p className="text-sm font-medium">{t('organization')}</p>
          <p className="text-sm text-muted-foreground">{orgName}</p>
        </div>
      )}
    </div>
  );
}
