import type { User } from '@talim/types';

export function getUserInitials(user: Pick<User, 'name' | 'email'> | null | undefined): string {
  if (!user) return '?';
  if (user.name) {
    return user.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
  return user.email?.slice(0, 2).toUpperCase() ?? '?';
}

export function getUserDisplayName(
  user: Pick<User, 'name' | 'email'> | null | undefined,
  fallback = 'User',
): string {
  if (!user) return fallback;
  return user.name ?? user.email?.split('@')[0] ?? fallback;
}
