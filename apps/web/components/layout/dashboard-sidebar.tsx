'use client';

import { Link, useRouter } from '@/i18n/navigation';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Play } from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@talim/ui';
import { useAuthStore } from '@/store/useAuthStore';
import { useBilling } from '@/hooks/useBilling';
import { useContents } from '@/hooks/useContent';
import { planMessageKey } from '@/lib/plan';

export interface DashboardSidebarBodyProps {
  onNavigate?: () => void;
}

export function DashboardSidebarBody({ onNavigate }: DashboardSidebarBodyProps) {
  const t = useTranslations('sidebar');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { data: billing } = useBilling();
  const { data: contents } = useContents();

  const recents = useMemo(() => (contents ?? []).slice(0, 5), [contents]);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? '?';

  const displayName = user?.name ?? user?.email?.split('@')[0] ?? tCommon('user');
  const planKey = billing?.subscription
    ? planMessageKey(billing.subscription.effectivePlanCode)
    : null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b px-4 py-4">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex min-w-0 items-center gap-2 font-bold tracking-tight"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm text-primary-foreground">
            T
          </span>
          <span className="truncate">Talim AI</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('recents')}
        </p>
        {recents.length === 0 ? (
          <p className="px-2 text-sm text-muted-foreground">{t('noMaterials')}</p>
        ) : (
          <ul className="space-y-0.5">
            {recents.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/content/${item.id}`}
                  onClick={onNavigate}
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <Play className="h-3.5 w-3.5 shrink-0 opacity-60" />
                  <span className="truncate">{item.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="shrink-0 border-t p-3">
        <div className="flex items-center gap-2 rounded-lg px-2 py-2">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="avatar-gradient text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{displayName}</p>
            {user?.email && (
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            )}
            {planKey && (
              <p className="truncate text-xs text-muted-foreground">{tCommon(planKey)}</p>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-1 w-full justify-start text-muted-foreground"
          onClick={() => {
            onNavigate?.();
            logout();
            router.push('/login');
          }}
        >
          {tCommon('logout')}
        </Button>
      </div>
    </div>
  );
}

export function DashboardSidebar() {
  return (
    <aside className="hidden h-dvh w-[var(--sidebar-width)] shrink-0 flex-col overflow-hidden border-r bg-card md:flex">
      <DashboardSidebarBody />
    </aside>
  );
}

interface DashboardSidebarSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DashboardSidebarSheet({ open, onOpenChange }: DashboardSidebarSheetProps) {
  const t = useTranslations('common');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="flex h-dvh w-[min(100%,16rem)] flex-col overflow-hidden p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>{t('menu')}</SheetTitle>
        </SheetHeader>
        <DashboardSidebarBody onNavigate={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  );
}
