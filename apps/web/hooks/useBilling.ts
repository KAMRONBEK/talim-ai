import { useQuery } from '@tanstack/react-query';
import type { BillingMeResponse } from '@talim/types';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

export function useBilling() {
  const token = useAuthStore((s) => s.token);

  return useQuery({
    queryKey: ['billing', 'me'],
    queryFn: async () => {
      const { data } = await api.get<BillingMeResponse>('/billing/me');
      return data;
    },
    enabled: Boolean(token),
    staleTime: 60_000,
  });
}
