'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { RoleGuard } from '@/components/role-guard';
import { TenantSidebar, TenantSidebarSheet } from '@/components/layout/tenant-sidebar';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { useSidebarSheet } from '@/hooks/useSidebarSheet';
import { useBilling } from '@/hooks/useBilling';

const TenantSearchContext = createContext({
  search: '',
  setSearch: (_q: string) => {},
});

export function useTenantSearch() {
  return useContext(TenantSearchContext);
}

export function TenantShell({ children }: { children: ReactNode }) {
  const [search, setSearch] = useState('');
  const { open: sidebarOpen, setOpen: setSidebarOpen } = useSidebarSheet();
  const { data: billing } = useBilling();
  const t = useTranslations('tenant');
  // An org with NO subscription row is the worst state — every action 402s — so it
  // must warn too. The old `billing?.subscription &&` was falsy for exactly that case,
  // giving the least explanation where it was needed most.
  const inactive = billing ? !billing.subscription || billing.subscription.status !== 'ACTIVE' : false;

  return (
    <RoleGuard allowedRoles={['TENANT_OWNER']}>
      <TenantSearchContext.Provider value={{ search, setSearch }}>
        <div className="flex h-dvh overflow-hidden">
          <TenantSidebar />
          <TenantSidebarSheet open={sidebarOpen} onOpenChange={setSidebarOpen} />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
            {inactive && (
              <div className="border-b border-accent-secondary/40 bg-accent-secondary/10 px-4 py-3 text-sm text-foreground md:px-6">
                {t('inactiveSubscriptionBanner')}
              </div>
            )}
            <main className="min-h-0 flex-1 overflow-y-auto px-4 py-8 md:px-6">{children}</main>
          </div>
        </div>
      </TenantSearchContext.Provider>
    </RoleGuard>
  );
}
