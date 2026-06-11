import type { UserRole } from '@talim/types';

export function getPostLoginPath(role: UserRole): string {
  switch (role) {
    case 'TENANT_OWNER':
      return '/tenant/dashboard';
    case 'TENANT_LEARNER':
      return '/learner/dashboard';
    default:
      return '/dashboard';
  }
}

export function getHomePathForRole(role: UserRole | undefined): string {
  if (!role) return '/dashboard';
  return getPostLoginPath(role);
}

export function getSettingsPathForRole(role: UserRole | undefined): string {
  switch (role) {
    case 'TENANT_OWNER':
      return '/tenant/settings';
    case 'TENANT_LEARNER':
      return '/learner/settings';
    default:
      return '/dashboard/settings';
  }
}
