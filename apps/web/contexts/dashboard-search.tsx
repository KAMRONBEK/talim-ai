'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar';
import { DashboardHeader } from '@/components/layout/dashboard-header';

const DashboardSearchContext = createContext({
  search: '',
  setSearch: (_q: string) => {},
});

export function useDashboardSearch() {
  return useContext(DashboardSearchContext);
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const [search, setSearch] = useState('');

  return (
    <AuthGuard>
      <DashboardSearchContext.Provider value={{ search, setSearch }}>
        <div className="flex min-h-screen">
          <DashboardSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <DashboardHeader />
            <main className="flex-1 overflow-y-auto px-6 py-8">{children}</main>
          </div>
        </div>
      </DashboardSearchContext.Provider>
    </AuthGuard>
  );
}
