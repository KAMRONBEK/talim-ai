'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { RoleGuard } from '@/components/role-guard';
import { DashboardSidebar, DashboardSidebarSheet } from '@/components/layout/dashboard-sidebar';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { useSidebarSheet } from '@/hooks/useSidebarSheet';

const DashboardSearchContext = createContext({
  search: '',
  setSearch: (_q: string) => {},
});

export function useDashboardSearch() {
  return useContext(DashboardSearchContext);
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const [search, setSearch] = useState('');
  const { open: sidebarOpen, setOpen: setSidebarOpen } = useSidebarSheet();

  // The B2C dashboard (personal uploads/learning) is for solo learners only;
  // tutors use /tenant and students use /learner.
  return (
    <RoleGuard allowedRoles={['INDIVIDUAL']}>
      <DashboardSearchContext.Provider value={{ search, setSearch }}>
        <div className="flex h-dvh overflow-hidden">
          <DashboardSidebar />
          <DashboardSidebarSheet open={sidebarOpen} onOpenChange={setSidebarOpen} />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
            <main className="min-h-0 flex-1 overflow-y-auto px-4 py-8 md:px-6">{children}</main>
          </div>
        </div>
      </DashboardSearchContext.Provider>
    </RoleGuard>
  );
}
