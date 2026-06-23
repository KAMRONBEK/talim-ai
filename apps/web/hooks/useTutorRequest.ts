import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { TutorRequest } from '@talim/types';

export function useMyTutorRequest() {
  return useQuery({
    queryKey: ['tutor-request'],
    queryFn: async () => {
      const { data } = await api.get<{ request: TutorRequest | null }>('/auth/tutor-request');
      return data.request;
    },
  });
}

export function useRequestTutor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { orgName: string; note?: string }) => {
      const { data } = await api.post<{ request: TutorRequest }>('/auth/upgrade-to-tenant', body);
      return data.request;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tutor-request'] }),
  });
}
