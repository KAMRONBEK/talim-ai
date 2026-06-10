import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ContentAssignment,
  CreateTenantStudentResponse,
  LearnerSummary,
  StudentProgressSummary,
  Tenant,
  TenantProgressSummary,
  TenantStudent,
} from '@talim/types';
import { api } from '@/lib/api';

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
    mutationFn: async (input: { email: string; name?: string }) => {
      const { data } = await api.post<CreateTenantStudentResponse>('/tenant/students', input);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenant', 'students'] }),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenant', 'students'] }),
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
    },
  });
}
