import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  AdminContentItem,
  AdminGeneratedItem,
  AdminPlatformStats,
  AdminUsageSummaryRow,
  AdminUserDetail,
  AdminUserListItem,
  PaginatedResponse,
} from '@talim/types';

export function usePlatformStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const { data } = await api.get<AdminPlatformStats>('/admin/stats/platform');
      return data;
    },
  });
}

export function useAdminUsers(params: { page?: number; search?: string; role?: string }) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<AdminUserListItem>>('/admin/users', {
        params,
      });
      return data;
    },
  });
}

export function useAdminUser(id: string) {
  return useQuery({
    queryKey: ['admin', 'users', id],
    queryFn: async () => {
      const { data } = await api.get<{
        user: AdminUserDetail;
        contents: Array<{ id: string; title: string; type: string; status: string; createdAt: string }>;
      }>(`/admin/users/${id}`);
      return data;
    },
    enabled: Boolean(id),
  });
}

export function useAdminContents(params: { page?: number; search?: string }) {
  return useQuery({
    queryKey: ['admin', 'contents', params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<AdminContentItem>>('/admin/contents', {
        params,
      });
      return data;
    },
  });
}

export function useAdminGenerated(kind?: string) {
  return useQuery({
    queryKey: ['admin', 'generated', kind],
    queryFn: async () => {
      const { data } = await api.get<{ items: AdminGeneratedItem[] }>('/admin/generated', {
        params: kind && kind !== 'all' ? { kind } : {},
      });
      return data.items;
    },
  });
}

export function useAdminUsage(days = 30) {
  return useQuery({
    queryKey: ['admin', 'usage', days],
    queryFn: async () => {
      const { data } = await api.get<{ days: number; rows: AdminUsageSummaryRow[] }>(
        '/admin/usage/summary',
        { params: { days } },
      );
      return data;
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/users/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

export function useDeleteContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/contents/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'contents'] }),
  });
}

export function useRetryContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/admin/contents/${id}/retry-job`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'contents'] }),
  });
}
