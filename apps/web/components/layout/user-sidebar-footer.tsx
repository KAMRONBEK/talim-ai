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
}

export function UserSidebarFooter({
  onNavigate,
  showEmail = false,
  showSettingsIcon = false,
  planFallback,
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
    <div className="shrink-0 border-t border-border p-3">
      <Link
        href={settingsPath}
        onClick={onNavigate}
        className={cn(
          'flex items-center gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-secondary',
          showSettingsIcon && 'group',
        )}
      >
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback className="avatar-gradient text-xs font-semibold">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
          {showEmail && user.email && (
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          )}
          {planLine && (
            <p className="truncate text-xs text-muted-foreground">{planLine}</p>
          )}
        </div>
        {showSettingsIcon && (
          <Settings className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        )}
      </Link>
      <Button
        variant="ghost"
        size="sm"
        className="mt-1 w-full justify-start rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground"
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
