import { useAuthStore } from '@/store/useAuthStore';

/**
 * API base path for content sub-resources. Tenant owners must use `/tenant/content`
 * (the B2C `/content/*` routes are owner-blocked); everyone else uses `/content`.
 */
export function useContentBase(): string {
  return useAuthStore((s) => (s.user?.role === 'TENANT_OWNER' ? '/tenant/content' : '/content'));
}
