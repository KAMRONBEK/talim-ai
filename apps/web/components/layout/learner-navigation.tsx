'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { BarChart3, BookOpen, Home, Settings } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { UserSidebarFooter } from '@/components/layout/user-sidebar-footer';
import { cn } from '@/lib/utils';

const learnerNavKeys = [
  { href: '/learner/dashboard', key: 'materials' as const, icon: Home },
  { href: '/learner/progress', key: 'progress' as const, icon: BarChart3 },
  { href: '/learner/assessments', key: 'tasks' as const, icon: BookOpen },
  { href: '/learner/settings', key: 'settings' as const, icon: Settings },
];

export function LearnerSidebar() {
  const pathname = usePathname();
  const t = useTranslations('learner');
  const user = useAuthStore((s) => s.user);

  return (
    <aside className="hidden h-dvh w-[var(--sidebar-width)] shrink-0 border-r bg-card md:flex md:flex-col">
      <div className="border-b px-4 py-4">
        <Link href="/learner/dashboard" className="flex items-center gap-2 font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm text-primary-foreground">
            T
          </span>
          <span className="min-w-0">
            <span className="block">Talim AI</span>
            <span className="block truncate text-xs font-normal text-muted-foreground">
              {user?.tenantName ?? t('settings.schoolTitle')}
            </span>
          </span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {learnerNavKeys.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
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
      <UserSidebarFooter showEmail />
    </aside>
  );
}

export function LearnerBottomNav() {
  const pathname = usePathname();
  const t = useTranslations('learner');

  return (
    <nav className="grid grid-cols-4 border-t bg-background/95 backdrop-blur md:hidden">
      {learnerNavKeys.map((item) => {
        const Icon = item.icon;
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center gap-1 px-2 py-2 text-[11px]',
              active ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
            {t(`nav.${item.key}`)}
          </Link>
        );
      })}
    </nav>
  );
}
