'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { BarChart3, BookOpen, CreditCard, FileQuestion, GraduationCap, LayoutDashboard, Settings } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@talim/ui';
import { useAuthStore } from '@/store/useAuthStore';
import { useTenant, useTenantStudents } from '@/hooks/useTenant';
import { UserSidebarFooter } from '@/components/layout/user-sidebar-footer';
import { cn } from '@/lib/utils';
import { LogoMark } from '@/components/brand/logo';

const navItems = [
  { href: '/tenant/dashboard', key: 'dashboard' as const, icon: LayoutDashboard },
  { href: '/tenant/materials', key: 'materials' as const, icon: BookOpen },
  { href: '/tenant/students', key: 'students' as const, icon: GraduationCap },
  { href: '/tenant/progress', key: 'progress' as const, icon: BarChart3 },
  { href: '/tenant/assessments', key: 'assessments' as const, icon: FileQuestion },
  { href: '/tenant/billing', key: 'billing' as const, icon: CreditCard },
  { href: '/tenant/settings', key: 'settings' as const, icon: Settings },
];

export function TenantSidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const t = useTranslations('tenant');
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const { data: tenant } = useTenant();
  const { data: students } = useTenantStudents();
  const used = students?.length ?? null;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#211b15] text-[#b8b0a4]">
      <div className="flex shrink-0 items-center gap-2 border-b border-white/10 px-4 py-4">
        <Link href="/tenant/dashboard" onClick={onNavigate} className="flex min-w-0 items-center gap-2.5">
          <LogoMark className="h-8 w-8 shadow-soft" />
          <span className="min-w-0">
            <span className="block truncate font-display text-base font-bold text-[#f7f2e8]">Talim AI</span>
            <span className="block truncate font-label text-[10px] uppercase tracking-wider text-[#8a8076]">
              {t('organization')}
            </span>
          </span>
        </Link>
      </div>

      <div className="px-3 pt-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="truncate font-display text-sm font-semibold text-[#f7f2e8]">
            {tenant?.name ?? user?.tenantName ?? t('organization')}
          </p>
          {tenant?.seatLimit != null && (
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-primary transition-[width]"
                  style={{
                    width:
                      used != null && tenant.seatLimit > 0
                        ? `${Math.min(100, Math.round((used / tenant.seatLimit) * 100))}%`
                        : '100%',
                  }}
                />
              </div>
              <span className="font-label text-[10px] tabular-nums text-[#9dc4b8]">
                {used != null ? `${used}/${tenant.seatLimit}` : tenant.seatLimit}
              </span>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                pathname.startsWith(item.href)
                  ? 'bg-primary text-primary-foreground'
                  : 'text-[#b8b0a4] hover:bg-white/5 hover:text-[#f7f2e8]',
              )}
            >
              <Icon className="h-4 w-4" />
              {t(`nav.${item.key}`)}
            </Link>
          );
        })}
      </nav>

      <UserSidebarFooter onNavigate={onNavigate} planFallback={t('subscriptionRequired')} dark />
    </div>
  );
}

export function TenantSidebar() {
  return (
    <aside className="hidden h-dvh w-[var(--sidebar-width)] shrink-0 border-r border-white/10 bg-[#211b15] md:flex">
      <TenantSidebarBody />
    </aside>
  );
}

export function TenantSidebarSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations('common');
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="flex h-dvh w-[min(100%,16rem)] flex-col p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>{t('menu')}</SheetTitle>
        </SheetHeader>
        <TenantSidebarBody onNavigate={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  );
}
