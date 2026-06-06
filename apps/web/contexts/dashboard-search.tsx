'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { AuthGuard } from '@/components/auth-guard';
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

  return (
    <AuthGuard>
      <DashboardSearchContext.Provider value={{ search, setSearch }}>
        <div className="flex min-h-dvh">
          <DashboardSidebar />
          <DashboardSidebarSheet open={sidebarOpen} onOpenChange={setSidebarOpen} />
          <div className="flex min-w-0 flex-1 flex-col">
            <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
            <main className="flex-1 overflow-y-auto px-4 py-8 md:px-6">{children}</main>
          </div>
        </div>
      </DashboardSearchContext.Provider>
    </AuthGuard>
  );
}
