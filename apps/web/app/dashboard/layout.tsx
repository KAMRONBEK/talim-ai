import { DashboardShell } from '@/contexts/dashboard-search';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
