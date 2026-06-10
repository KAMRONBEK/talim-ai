'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { User } from '@talim/types';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

export function SessionSync() {
  const token = useAuthStore((s) => s.token);
  const setAuth = useAuthStore((s) => s.setAuth);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    void api
      .get<{ user: User; token?: string }>('/auth/me')
      .then(({ data }) => {
        if (cancelled) return;
        setAuth(data.user, data.token ?? token);
        queryClient.invalidateQueries({ queryKey: ['contents'] });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [token, setAuth, queryClient]);

  return null;
}
