'use client';

import { Link, useRouter } from '@/i18n/navigation';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Play } from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  Button,
} from '@talim/ui';
import { useAuthStore } from '@/store/useAuthStore';
import { useContents } from '@/hooks/useContent';

export function DashboardSidebar() {
  const t = useTranslations('sidebar');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { user, logout } = useAuthStore();
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

  return (
    <aside className="flex w-[var(--sidebar-width)] shrink-0 flex-col border-r bg-card">
      <div className="flex items-center gap-2 border-b px-4 py-4">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-2 font-bold tracking-tight">
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

      <div className="border-t p-3">
        <div className="flex items-center gap-2 rounded-lg px-2 py-2">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="avatar-gradient text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{displayName}</p>
            {user?.email && (
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-1 w-full justify-start text-muted-foreground"
          onClick={() => {
            logout();
            router.push('/login');
          }}
        >
          {tCommon('logout')}
        </Button>
      </div>
    </aside>
  );
}
