import { useMutation, useQuery } from '@tanstack/react-query';
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

/** Self-serve "upgrade to Pro" request (manual activation — no payment gateway). */
export function useRequestUpgrade() {
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ ok: boolean }>('/billing/request-upgrade');
      return data;
    },
  });
}
