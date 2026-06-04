'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { AppTopbar } from '@/components/layout/app-topbar';

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
        <div className="flex min-h-screen flex-col">
          <AppTopbar searchQuery={search} onSearchChange={setSearch} />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">{children}</main>
        </div>
      </DashboardSearchContext.Provider>
    </AuthGuard>
  );
}
