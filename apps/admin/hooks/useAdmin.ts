import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  AdminAnalyticsSummary,
  AdminContentByTypeResponse,
  AdminContentDetail,
  AdminContentItem,
  AdminFunnelResponse,
  AdminGeneratedItem,
  AdminGeneratedReview,
  AdminImpersonateResponse,
  AdminMrrResponse,
  AdminPatchUserInput,
  AdminPlatformStats,
  AdminSpendByModelResponse,
  AdminSubscriptionListItem,
  AdminTenantDetail,
  AdminTenantListItem,
  AdminTopOrgsResponse,
  AdminAuditLogItem,
  AdminTenantUsageVsLimits,
  AdminTutorRequest,
  AdminUpdateSubscriptionInput,
  AdminUsageSummaryRow,
  AdminUsageVsLimits,
  AdminUserDetail,
  AdminUserGrowthResponse,
  AdminUserListItem,
  AdminUsersByRoleResponse,
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

export function useResetUserPassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      ...body
    }: { userId: string; password?: string; generate?: true }) => {
      const { data } = await api.post<{ temporaryPassword: string }>(
        `/admin/users/${userId}/reset-password`,
        body,
      );
      return data.temporaryPassword;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'users', vars.userId] });
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, confirmCascade }: { id: string; confirmCascade?: boolean }) => {
      await api.delete(
        `/admin/users/${id}`,
        confirmCascade ? { data: { confirmCascade: true } } : undefined,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      qc.invalidateQueries({ queryKey: ['admin', 'tenants'] });
    },
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

export function useAdminAuditLogs(params: { page?: number; action?: string; targetType?: string }) {
  return useQuery({
    queryKey: ['admin', 'audit-logs', params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<AdminAuditLogItem>>('/admin/audit-logs', {
        params,
      });
      return data;
    },
  });
}

export function useAdminTutorRequests(params: { status?: string; page?: number }) {
  return useQuery({
    queryKey: ['admin', 'tutor-requests', params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<AdminTutorRequest>>('/admin/tutor-requests', {
        params,
      });
      return data;
    },
  });
}

export function useApproveTutorRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, seatLimit }: { id: string; seatLimit?: number | null }) => {
      const { data } = await api.post(
        `/admin/tutor-requests/${id}/approve`,
        seatLimit != null ? { seatLimit } : {},
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'tutor-requests'] });
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      qc.invalidateQueries({ queryKey: ['admin', 'tenants'] });
    },
  });
}

export function useRejectTutorRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, note }: { id: string; note?: string }) => {
      await api.post(`/admin/tutor-requests/${id}/reject`, note ? { note } : {});
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'tutor-requests'] }),
  });
}

// --- Wave 3 · analytics dashboard (read-only) ------------------------------

export function useAdminAnalyticsSummary() {
  return useQuery({
    queryKey: ['admin', 'analytics', 'summary'],
    queryFn: async () => {
      const { data } = await api.get<AdminAnalyticsSummary>('/admin/analytics/summary');
      return data;
    },
  });
}

export function useAdminAnalyticsMrr() {
  return useQuery({
    queryKey: ['admin', 'analytics', 'mrr'],
    queryFn: async () => {
      const { data } = await api.get<AdminMrrResponse>('/admin/analytics/mrr');
      return data;
    },
  });
}

export function useAdminAnalyticsUserGrowth() {
  return useQuery({
    queryKey: ['admin', 'analytics', 'user-growth'],
    queryFn: async () => {
      const { data } = await api.get<AdminUserGrowthResponse>('/admin/analytics/user-growth');
      return data;
    },
  });
}

export function useAdminAnalyticsByRole() {
  return useQuery({
    queryKey: ['admin', 'analytics', 'by-role'],
    queryFn: async () => {
      const { data } = await api.get<AdminUsersByRoleResponse>('/admin/analytics/by-role');
      return data;
    },
  });
}

export function useAdminAnalyticsFunnel() {
  return useQuery({
    queryKey: ['admin', 'analytics', 'funnel'],
    queryFn: async () => {
      const { data } = await api.get<AdminFunnelResponse>('/admin/analytics/funnel');
      return data;
    },
  });
}

export function useAdminAnalyticsContentByType() {
  return useQuery({
    queryKey: ['admin', 'analytics', 'content-by-type'],
    queryFn: async () => {
      const { data } = await api.get<AdminContentByTypeResponse>('/admin/analytics/content-by-type');
      return data;
    },
  });
}

export function useAdminAnalyticsTopOrgs() {
  return useQuery({
    queryKey: ['admin', 'analytics', 'top-orgs'],
    queryFn: async () => {
      const { data } = await api.get<AdminTopOrgsResponse>('/admin/analytics/top-orgs');
      return data;
    },
  });
}

export function useAdminAnalyticsSpendByModel() {
  return useQuery({
    queryKey: ['admin', 'analytics', 'spend-by-model'],
    queryFn: async () => {
      const { data } = await api.get<AdminSpendByModelResponse>('/admin/analytics/spend-by-model');
      return data;
    },
  });
}

// --- Wave 3 · generated-media review ---------------------------------------

export function useReviewGenerated() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      kind,
      mediaId,
      status,
      note,
    }: {
      kind: string;
      mediaId: string;
      status: 'APPROVED' | 'FLAGGED';
      note?: string;
    }): Promise<AdminGeneratedReview> => {
      const { data } = await api.post<{ review: AdminGeneratedReview }>(
        `/admin/generated/${kind}/${mediaId}/review`,
        note ? { status, note } : { status },
      );
      return data.review;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'generated'] }),
  });
}

// --- Wave 3 · impersonation -------------------------------------------------

export function useImpersonateUser() {
  return useMutation({
    mutationFn: async (userId: string): Promise<string> => {
      const { data } = await api.post<AdminImpersonateResponse>(
        `/admin/users/${userId}/impersonate`,
      );
      return data.token;
    },
  });
}

// --- Wave 3 · content-control detail (read-only inspector) -----------------

export function useAdminContentDetail(id: string) {
  return useQuery({
    queryKey: ['admin', 'content', id, 'detail'],
    queryFn: async () => {
      const { data } = await api.get<AdminContentDetail>(`/admin/content/${id}/detail`);
      return data;
    },
    enabled: Boolean(id),
  });
}
