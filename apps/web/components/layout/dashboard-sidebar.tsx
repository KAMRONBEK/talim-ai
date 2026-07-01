'use client';

import { Link } from '@/i18n/navigation';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Home, Play } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@talim/ui';
import { useContents } from '@/hooks/useContent';
import { UserSidebarFooter } from '@/components/layout/user-sidebar-footer';
import { LogoMark } from '@/components/brand/logo';
import { useAuthStore } from '@/store/useAuthStore';

export interface DashboardSidebarBodyProps {
  onNavigate?: () => void;
}

export function DashboardSidebarBody({ onNavigate }: DashboardSidebarBodyProps) {
  const t = useTranslations('sidebar');
  const tCommon = useTranslations('common');
  const { data: contents } = useContents();

  const recents = useMemo(() => (contents ?? []).slice(0, 5), [contents]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-card">
      <div className="flex shrink-0 items-center gap-2.5 border-b border-border px-4 py-4">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex min-w-0 items-center gap-2.5 font-display text-lg font-semibold tracking-tight text-foreground"
        >
          <LogoMark className="h-8 w-8 shadow-soft" />
          <span className="truncate">Talim AI</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-shadow hover:shadow-glow"
        >
          <Home className="h-4 w-4 shrink-0" />
          <span className="truncate">{tCommon('home')}</span>
        </Link>

        <p className="mb-2 mt-6 px-2 font-label text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
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
                  className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <Play className="h-3.5 w-3.5 shrink-0 opacity-60" />
                  <span className="truncate">{item.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <BecomeTutorPromo onNavigate={onNavigate} />

      <UserSidebarFooter onNavigate={onNavigate} showEmail showSettingsIcon />
    </div>
  );
}

/**
 * Compact sidebar promo nudging INDIVIDUAL learners toward the become-a-tutor
 * flow (the request form lives on /dashboard/settings via BecomeTutorCard).
 * Mirrors BecomeTutorCard's own guard: nothing renders for non-INDIVIDUAL roles.
 */
function BecomeTutorPromo({ onNavigate }: { onNavigate?: () => void }) {
  const tBecome = useTranslations('becomeTutor');
  const tSidebar = useTranslations('sidebar');
  const role = useAuthStore((s) => s.user?.role);

  if (role !== 'INDIVIDUAL') return null;

  return (
    <div className="shrink-0 px-3 pb-2">
      <Link
        href="/dashboard/settings"
        onClick={onNavigate}
        className="block rounded-xl border border-border bg-secondary/50 p-3 transition-colors hover:border-accent-secondary/40 hover:bg-secondary"
      >
        <p className="font-display text-sm font-semibold text-foreground">{tBecome('title')}</p>
        <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
          {tSidebar('becomeTutorPromo')}
        </p>
      </Link>
    </div>
  );
}

export function DashboardSidebar() {
  return (
    <aside className="hidden h-dvh w-[var(--sidebar-width)] shrink-0 flex-col overflow-hidden border-r border-border bg-card md:flex">
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
