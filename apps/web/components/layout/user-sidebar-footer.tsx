'use client';

import { Link, useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Settings } from 'lucide-react';
import { Avatar, AvatarFallback, Button } from '@talim/ui';
import { useAuthStore } from '@/store/useAuthStore';
import { useBilling } from '@/hooks/useBilling';
import { getSettingsPathForRole } from '@/lib/auth-routing';
import { getUserDisplayName, getUserInitials } from '@/lib/user-display';
import { planMessageKey } from '@/lib/plan';
import { cn } from '@/lib/utils';

export interface UserSidebarFooterProps {
  onNavigate?: () => void;
  showEmail?: boolean;
  showSettingsIcon?: boolean;
  planFallback?: string;
  /** Presentational only: render against the dark tenant-sidebar chrome. Default false keeps the light look. */
  dark?: boolean;
}

export function UserSidebarFooter({
  onNavigate,
  showEmail = false,
  showSettingsIcon = false,
  planFallback,
  dark = false,
}: UserSidebarFooterProps) {
  const tCommon = useTranslations('common');
  const tTenant = useTranslations('tenant');
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { data: billing } = useBilling();

  if (!user) return null;

  const settingsPath = getSettingsPathForRole(user.role);
  const initials = getUserInitials(user);
  const displayName = getUserDisplayName(user, tCommon('user'));
  const planKey = billing?.subscription
    ? planMessageKey(billing.subscription.effectivePlanCode)
    : null;
  const planLine = planKey
    ? tCommon(planKey)
    : planFallback ?? (user.role === 'TENANT_OWNER' ? tTenant('subscriptionRequired') : null);

  return (
    <div className={cn('shrink-0 border-t p-3', dark ? 'border-white/10' : 'border-border')}>
      <Link
        href={settingsPath}
        onClick={onNavigate}
        className={cn(
          'flex items-center gap-2.5 rounded-xl px-2 py-2 transition-colors',
          dark ? 'hover:bg-white/5' : 'hover:bg-secondary',
          showSettingsIcon && 'group',
        )}
      >
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback className="avatar-gradient text-xs font-semibold">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className={cn('truncate text-sm font-semibold', dark ? 'text-[#f7f2e8]' : 'text-foreground')}>{displayName}</p>
          {showEmail && user.email && (
            <p className={cn('truncate text-xs', dark ? 'text-[#8a8076]' : 'text-muted-foreground')}>{user.email}</p>
          )}
          {planLine && (
            <p className={cn('truncate text-xs', dark ? 'text-[#8a8076]' : 'text-muted-foreground')}>{planLine}</p>
          )}
        </div>
        {showSettingsIcon && (
          <Settings className={cn('h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100', dark ? 'text-[#8a8076]' : 'text-muted-foreground')} />
        )}
      </Link>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'mt-1 w-full justify-start rounded-xl',
          dark
            ? 'text-[#b8b0a4] hover:bg-white/5 hover:text-[#f7f2e8]'
            : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
        )}
        onClick={() => {
          onNavigate?.();
          logout();
          router.push('/login');
        }}
      >
        {tCommon('logout')}
      </Button>
    </div>
  );
}
