'use client';

import { type ReactNode } from 'react';
import { RoleGuard } from '@/components/role-guard';
import { AuthGuard } from '@/components/auth-guard';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { useSidebarSheet } from '@/hooks/useSidebarSheet';

export function LearnerShell({ children }: { children: ReactNode }) {
  const { open: sidebarOpen, setOpen: setSidebarOpen } = useSidebarSheet();

  return (
    <RoleGuard allowedRoles={['TENANT_LEARNER']}>
      <AuthGuard>
        <div className="flex h-dvh flex-col overflow-hidden">
          <DashboardHeader onMenuClick={() => setSidebarOpen(sidebarOpen)} />
          <main className="min-h-0 flex-1 overflow-y-auto px-4 py-8 md:px-6">{children}</main>
        </div>
      </AuthGuard>
    </RoleGuard>
  );
}
