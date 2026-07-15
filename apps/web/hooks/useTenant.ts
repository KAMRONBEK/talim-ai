import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ClassMastery,
  ContentAssignment,
  CreateLearnerReplyResponse,
  CreateTenantStudentResponse,
  LearnerMaterial,
  LearnerMessage,
  LearnerProgress,
  LearnerSummary,
  LearnerUnreadCountResponse,
  MarkMessageReadResponse,
  RespondToReplyResponse,
  SendTenantMessageInput,
  SendTenantMessageResponse,
  StudentImportResponse,
  StudentProgressSummary,
  Tenant,
  TenantProgressSummary,
  TenantSentMessage,
  TenantSentMessagesResponse,
  TenantStudent,
  TenantUnreadReplyCountResponse,
} from '@talim/types';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

export function useTenant() {
  return useQuery({
    queryKey: ['tenant'],
    queryFn: async () => {
      const { data } = await api.get<{ tenant: Tenant }>('/tenant');
      return data.tenant;
    },
  });
}

export function usePatchTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string }) => {
      const { data } = await api.patch<{ tenant: Tenant }>('/tenant', input);
      return data.tenant;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenant'] }),
  });
}

export function useTenantStudents() {
  return useQuery({
    queryKey: ['tenant', 'students'],
    queryFn: async () => {
      const { data } = await api.get<{ students: TenantStudent[] }>('/tenant/students');
      return data.students;
    },
  });
}

export function useCreateTenantStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name?: string;
      email?: string;
      username?: string;
      password?: string;
    }) => {
      const { data } = await api.post<CreateTenantStudentResponse>('/tenant/students', input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant', 'students'] });
      // The tenant dashboard reads its roster/totals from the progress summary.
      queryClient.invalidateQueries({ queryKey: ['tenant', 'progress'] });
      // Refresh seat usage + the at-cap gate, which read from the billing query.
      queryClient.invalidateQueries({ queryKey: ['billing', 'me'] });
    },
  });
}

/**
 * Bulk-import students from a pasted CSV string (`{ csv }`) or a parsed rows array.
 * The backend does a partial import (seat-limited rows are reported, not fatal) and
 * returns a per-row report. Refreshes the roster + seat/billing gate like a create.
 */
export function useImportStudents() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: { csv: string } | { rows: Array<{ name?: string; email?: string; username?: string }> },
    ) => {
      const { data } = await api.post<StudentImportResponse>('/tenant/students/import', input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant', 'students'] });
      queryClient.invalidateQueries({ queryKey: ['tenant', 'progress'] });
      // Imported students consume seats — refresh the seat usage + at-cap gate.
      queryClient.invalidateQueries({ queryKey: ['billing', 'me'] });
    },
  });
}

/** Tutor→student message to a set of selected active learners (starts a two-way thread). */
export function useSendTenantMessage() {
  return useMutation<TenantSentMessage, unknown, SendTenantMessageInput>({
    mutationFn: async (input) => {
      const { data } = await api.post<SendTenantMessageResponse>('/tenant/messages', input);
      return data.message;
    },
  });
}

/**
 * The tutor's sent message threads (each root broadcast grouped with its student replies).
 * Newest root first. The inbox bell defers fetching until its panel opens (pass `enabled`);
 * the tenant dashboard fetches eagerly for its recent-threads card — same queryKey, so
 * the bell reuses the cached list.
 */
export function useTenantMessages(enabled = true) {
  return useQuery({
    queryKey: ['tenant', 'messages'],
    queryFn: async () => {
      const { data } = await api.get<TenantSentMessagesResponse>('/tenant/messages');
      return data.messages;
    },
    enabled,
  });
}

/**
 * Unread student-reply count for the tutor's badge. Polled every 60s and gated to
 * TENANT_OWNER (the endpoint is owner-scoped) so it never fires for learners/B2C users
 * sharing the same header shell.
 */
export function useTenantUnreadCount() {
  const role = useAuthStore((s) => s.user?.role);
  return useQuery({
    queryKey: ['tenant', 'messages', 'unread-count'],
    queryFn: async () => {
      const { data } = await api.get<TenantUnreadReplyCountResponse>(
        '/tenant/messages/unread-count',
      );
      return data.count;
    },
    enabled: role === 'TENANT_OWNER',
    refetchInterval: 60_000,
  });
}

/**
 * Tutor's in-thread response to a specific student reply (`id` = that student's reply id). The
 * response targets only that student (a per-student sub-conversation inside the broadcast thread).
 * Refreshes the thread list + unread badge so the new response appears in the thread.
 */
export function useRespondToReply() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: string }) => {
      const { data } = await api.post<RespondToReplyResponse>(
        `/tenant/messages/${id}/respond`,
        { body },
      );
      return data.reply;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant', 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['tenant', 'messages', 'unread-count'] });
    },
  });
}

/** Mark one student reply read (`:id` = a reply id); refreshes thread list + unread badge. */
export function useMarkTenantMessageRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<MarkMessageReadResponse>(`/tenant/messages/${id}/read`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant', 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['tenant', 'messages', 'unread-count'] });
    },
  });
}

export function useRegenerateJoinCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ tenant: Tenant }>('/tenant/join-code/regenerate');
      return data.tenant;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenant'] }),
  });
}

export function usePatchTenantStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...body
    }: {
      id: string;
      name?: string;
      active?: boolean;
    }) => {
      const { data } = await api.patch<{ student: TenantStudent }>(`/tenant/students/${id}`, body);
      return data.student;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant', 'students'] });
      queryClient.invalidateQueries({ queryKey: ['tenant', 'progress'] });
      // Activating/deactivating a student changes seat usage (billing query).
      queryClient.invalidateQueries({ queryKey: ['billing', 'me'] });
    },
  });
}

export function useResetTenantStudentPassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (studentId: string) => {
      const { data } = await api.post<CreateTenantStudentResponse>(
        `/tenant/students/${studentId}/reset-password`,
      );
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenant', 'students'] }),
  });
}

export function useTenantProgress() {
  return useQuery({
    queryKey: ['tenant', 'progress'],
    queryFn: async () => {
      const { data } = await api.get<TenantProgressSummary>('/tenant/progress');
      return data;
    },
  });
}

export function useLearnerSummary() {
  return useQuery({
    queryKey: ['learner', 'summary'],
    queryFn: async () => {
      const { data } = await api.get<{ summary: LearnerSummary }>('/learner/summary');
      return data.summary;
    },
  });
}

export function useLearnerMaterials() {
  return useQuery({
    queryKey: ['learner', 'materials'],
    queryFn: async () => {
      const { data } = await api.get<{ materials: LearnerMaterial[] }>('/learner/materials');
      return data.materials;
    },
  });
}

export function useLearnerProgress() {
  return useQuery({
    queryKey: ['learner', 'progress'],
    queryFn: async () => {
      const { data } = await api.get<LearnerProgress>('/learner/progress');
      return data;
    },
  });
}

/**
 * Unread tutor→student message count for the badge. Polled every 60s. Gated to
 * TENANT_LEARNER (the endpoint is learner-scoped) so it never fires for B2C users
 * sharing the same header shell.
 */
export function useLearnerUnreadCount() {
  const role = useAuthStore((s) => s.user?.role);
  return useQuery({
    queryKey: ['learner', 'messages', 'unread-count'],
    queryFn: async () => {
      const { data } = await api.get<LearnerUnreadCountResponse>('/learner/messages/unread-count');
      return data.count;
    },
    enabled: role === 'TENANT_LEARNER',
    refetchInterval: 60_000,
  });
}

/** Received tutor→student messages. Fetched lazily (only while the panel is open). */
export function useLearnerMessages(enabled = true) {
  return useQuery({
    queryKey: ['learner', 'messages'],
    queryFn: async () => {
      const { data } = await api.get<{ messages: LearnerMessage[] }>('/learner/messages');
      return data.messages;
    },
    enabled,
  });
}

/** Mark one received message read (idempotent); refreshes list + unread badge. */
export function useMarkMessageRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<MarkMessageReadResponse>(`/learner/messages/${id}/read`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learner', 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['learner', 'messages', 'unread-count'] });
    },
  });
}

/**
 * Student's reply to a tutor message (`:id` = the received message id). Refreshes the
 * thread list + unread badge so the new reply appears and the tutor sees it as unread.
 */
export function useReplyToLearnerMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: string }) => {
      const { data } = await api.post<CreateLearnerReplyResponse>(
        `/learner/messages/${id}/reply`,
        { body },
      );
      return data.reply;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learner', 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['learner', 'messages', 'unread-count'] });
    },
  });
}

export function useTenantProgressTopics() {
  return useQuery({
    queryKey: ['tenant', 'progress', 'topics'],
    queryFn: async () => {
      const { data } = await api.get<ClassMastery>('/tenant/progress/topics');
      return data;
    },
  });
}

export function useStudentProgress(studentId: string) {
  return useQuery({
    queryKey: ['tenant', 'students', studentId, 'progress'],
    queryFn: async () => {
      const { data } = await api.get<StudentProgressSummary>(`/tenant/students/${studentId}/progress`);
      return data;
    },
    enabled: !!studentId,
  });
}

export function useContentAssignments(contentId: string) {
  return useQuery({
    queryKey: ['tenant', 'assignments', contentId],
    queryFn: async () => {
      const { data } = await api.get<{ assignments: ContentAssignment[] }>(
        `/tenant/content/${contentId}/assignments`,
      );
      return data.assignments;
    },
    enabled: !!contentId,
  });
}

export function useAssignContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { contentId: string; learnerId: string }) => {
      const { data } = await api.post<{ assignment: ContentAssignment }>(
        '/tenant/assignments',
        input,
      );
      return data.assignment;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['tenant', 'assignments', vars.contentId] });
      queryClient.invalidateQueries({ queryKey: ['tenant', 'students'] });
      queryClient.invalidateQueries({ queryKey: ['tenant', 'progress'] });
      queryClient.invalidateQueries({ queryKey: ['contents'] });
    },
  });
}

export function useUnassignContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { contentId: string; learnerId: string }) => {
      await api.delete('/tenant/assignments', { data: input });
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['tenant', 'assignments', vars.contentId] });
      queryClient.invalidateQueries({ queryKey: ['tenant', 'students'] });
      queryClient.invalidateQueries({ queryKey: ['tenant', 'progress'] });
    },
  });
}
