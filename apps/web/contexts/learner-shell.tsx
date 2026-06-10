'use client';

import { type ReactNode } from 'react';
import { RoleGuard } from '@/components/role-guard';
import { AuthGuard } from '@/components/auth-guard';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { LearnerBottomNav, LearnerSidebar } from '@/components/layout/learner-navigation';

export function LearnerShell({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allowedRoles={['TENANT_LEARNER']}>
      <AuthGuard>
        <div className="flex h-dvh overflow-hidden">
          <LearnerSidebar />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <DashboardHeader />
            <main className="min-h-0 flex-1 overflow-y-auto px-4 py-8 md:px-6">{children}</main>
            <LearnerBottomNav />
          </div>
        </div>
      </AuthGuard>
    </RoleGuard>
  );
}
