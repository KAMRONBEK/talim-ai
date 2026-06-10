import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useChangePassword() {
  return useMutation({
    mutationFn: async (input: { currentPassword: string; newPassword: string }) => {
      const { data } = await api.patch<{ ok: true }>('/auth/me/password', input);
      return data;
    },
  });
}
