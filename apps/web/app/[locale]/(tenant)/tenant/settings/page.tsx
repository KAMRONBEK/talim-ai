'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Input, Label } from '@talim/ui';
import { ProfileCard } from '@/components/account/profile-card';
import { PasswordCard } from '@/components/account/password-card';
import { BillingSummaryCard } from '@/components/account/billing-summary-card';
import { OnboardingChecklist } from '@/components/tenant/onboarding-checklist';
import { JoinCodeCard } from '@/components/tenant/join-code-card';
import { usePatchTenant, useTenant, useTenantStudents } from '@/hooks/useTenant';
import { useTenantContents } from '@/hooks/useTenantContent';
import { useTenantAssessments } from '@/hooks/useAssessments';

export default function TenantSettingsPage() {
  const t = useTranslations('tenant');
  const { data: tenant } = useTenant();
  const patch = usePatchTenant();
  const { data: contents } = useTenantContents();
  const { data: students } = useTenantStudents();
  const { data: assessments } = useTenantAssessments();
  const [name, setName] = useState('');

  useEffect(() => {
    if (tenant?.name) setName(tenant.name);
  }, [tenant?.name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await patch.mutateAsync({ name });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <p className="font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">{t('nav.settings')}</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">{t('settings.title')}</h1>
      </div>

      <section id="account" className="space-y-4 scroll-mt-8">
        <h2 className="font-display text-lg font-semibold">{t('settings.accountTitle')}</h2>
        <ProfileCard />
        <PasswordCard />
        <BillingSummaryCard />
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-lg font-semibold">{t('settings.orgTitle')}</h2>
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
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
        <JoinCodeCard />
      </section>

      <OnboardingChecklist
        contents={contents}
        students={students}
        hasAssessments={(assessments?.length ?? 0) > 0}
      />
    </div>
  );
}
