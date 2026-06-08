'use client';

import { AuthGuard } from '@/components/auth-guard';
import { AdminSidebar } from '@/components/admin-sidebar';

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </AuthGuard>
  );
}
