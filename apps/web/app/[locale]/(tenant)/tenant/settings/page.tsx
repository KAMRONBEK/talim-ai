'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Input, Label } from '@talim/ui';
import { usePatchTenant, useTenant } from '@/hooks/useTenant';

export default function TenantSettingsPage() {
  const t = useTranslations('tenant');
  const { data: tenant } = useTenant();
  const patch = usePatchTenant();
  const [name, setName] = useState('');

  useEffect(() => {
    if (tenant?.name) setName(tenant.name);
  }, [tenant?.name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await patch.mutateAsync({ name });
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border p-6">
        <div className="space-y-2">
          <Label htmlFor="orgName">{t('settings.orgName')}</Label>
          <Input id="orgName" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        {tenant?.slug && (
          <p className="text-sm text-muted-foreground">
            {t('settings.slug')}: {tenant.slug}
          </p>
        )}
        <Button type="submit" disabled={patch.isPending}>
          {t('settings.save')}
        </Button>
      </form>
    </div>
  );
}
