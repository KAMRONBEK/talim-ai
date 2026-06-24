'use client';

import { Link } from '@/i18n/navigation';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Play } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@talim/ui';
import { useContents } from '@/hooks/useContent';
import { UserSidebarFooter } from '@/components/layout/user-sidebar-footer';
import { LogoMark } from '@/components/brand/logo';

export interface DashboardSidebarBodyProps {
  onNavigate?: () => void;
}

export function DashboardSidebarBody({ onNavigate }: DashboardSidebarBodyProps) {
  const t = useTranslations('sidebar');
  const { data: contents } = useContents();

  const recents = useMemo(() => (contents ?? []).slice(0, 5), [contents]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b px-4 py-4">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex min-w-0 items-center gap-2.5 font-display font-bold tracking-tight"
        >
          <LogoMark className="h-8 w-8 shadow-soft" />
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

      <UserSidebarFooter onNavigate={onNavigate} showEmail showSettingsIcon />
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
