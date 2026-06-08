import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  AdminContentItem,
  AdminGeneratedItem,
  AdminPatchUserInput,
  AdminPlatformStats,
  AdminSubscriptionListItem,
  AdminTenantDetail,
  AdminTenantListItem,
  AdminTenantUsageVsLimits,
  AdminUpdateSubscriptionInput,
  AdminUsageSummaryRow,
  AdminUsageVsLimits,
  AdminUserDetail,
  AdminUserListItem,
  AdminUserSubscription,
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
        subscription: AdminUserSubscription | null;
        usageVsLimits: AdminUsageVsLimits | AdminTenantUsageVsLimits;
        contents: Array<{ id: string; title: string; type: string; status: string; createdAt: string }>;
      }>(`/admin/users/${id}`);
      return data;
    },
    enabled: Boolean(id),
  });
}

export function usePatchUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, ...body }: AdminPatchUserInput & { userId: string }) => {
      const { data } = await api.patch<{ user: AdminUserDetail }>(`/admin/users/${userId}`, body);
      return data.user;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'users', vars.userId] });
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      qc.invalidateQueries({ queryKey: ['admin', 'tenants'] });
      qc.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
    },
  });
}

export function useAdminTenants(params: { page?: number; pageSize?: number; search?: string }) {
  return useQuery({
    queryKey: ['admin', 'tenants', params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<AdminTenantListItem>>('/admin/tenants', {
        params,
      });
      return data;
    },
  });
}

export function useAdminTenant(id: string) {
  return useQuery({
    queryKey: ['admin', 'tenants', id],
    queryFn: async () => {
      const { data } = await api.get<{
        tenant: AdminTenantDetail;
        subscription: AdminUserSubscription | null;
        usageVsLimits: AdminTenantUsageVsLimits | null;
      }>(`/admin/tenants/${id}`);
      return data;
    },
    enabled: Boolean(id),
  });
}

export function useUpdateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tenantId,
      ...body
    }: AdminUpdateSubscriptionInput & { tenantId: string; name?: string }) => {
      const { data } = await api.patch<{
        tenant: AdminTenantDetail;
        subscription: AdminUserSubscription | null;
      }>(`/admin/tenants/${tenantId}`, body);
      return data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'tenants', vars.tenantId] });
      qc.invalidateQueries({ queryKey: ['admin', 'tenants'] });
      qc.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
    },
  });
}

export function useAdminSubscriptions(params: {
  page?: number;
  search?: string;
  status?: string;
  plan?: string;
  kind?: 'user' | 'tenant' | 'all';
}) {
  return useQuery({
    queryKey: ['admin', 'subscriptions', params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<AdminSubscriptionListItem>>(
        '/admin/subscriptions',
        { params },
      );
      return data;
    },
  });
}

export function useUpdateUserSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, ...body }: AdminUpdateSubscriptionInput & { userId: string }) => {
      const { data } = await api.patch<{ subscription: AdminUserSubscription }>(
        `/admin/users/${userId}/subscription`,
        body,
      );
      return data.subscription;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'users', vars.userId] });
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      qc.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
    },
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
