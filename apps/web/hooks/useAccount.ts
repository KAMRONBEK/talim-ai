import { useMutation } from '@tanstack/react-query';
import type { User } from '@talim/types';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

export function useUpdateProfile() {
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: async (input: { name: string }) => {
      const { data } = await api.patch<{ user: User }>('/auth/me', input);
      return data.user;
    },
    onSuccess: (user) => {
      setUser(user);
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (input: { currentPassword: string; newPassword: string }) => {
      const { data } = await api.patch<{ ok: true }>('/auth/me/password', input);
      return data;
    },
  });
}
