'use client';

import { AuthGuard } from '@/components/auth-guard';
import { AdminHeader } from '@/components/admin-header';

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen">
        <AdminHeader />
        <main className="mx-auto max-w-[1320px] px-6 py-8">{children}</main>
      </div>
    </AuthGuard>
  );
}
