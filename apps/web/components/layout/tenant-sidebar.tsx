'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { BarChart3, BookOpen, CreditCard, FileQuestion, GraduationCap, LayoutDashboard, Settings } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@talim/ui';
import { useAuthStore } from '@/store/useAuthStore';
import { useTenant } from '@/hooks/useTenant';
import { UserSidebarFooter } from '@/components/layout/user-sidebar-footer';
import { cn } from '@/lib/utils';

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

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b px-4 py-4">
        <Link href="/tenant/dashboard" onClick={onNavigate} className="flex min-w-0 items-center gap-2 font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm text-primary-foreground">
            T
          </span>
          <span className="min-w-0">
            <span className="block truncate">Talim AI</span>
            <span className="block truncate text-xs font-normal text-muted-foreground">
              {tenant?.name ?? user?.tenantName ?? t('organization')}
            </span>
          </span>
        </Link>
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
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                pathname.startsWith(item.href)
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {t(`nav.${item.key}`)}
            </Link>
          );
        })}
      </nav>

      <UserSidebarFooter onNavigate={onNavigate} planFallback={t('subscriptionRequired')} />
    </div>
  );
}

export function TenantSidebar() {
  return (
    <aside className="hidden h-dvh w-[var(--sidebar-width)] shrink-0 border-r bg-card md:flex">
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
