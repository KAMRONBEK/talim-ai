import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AssessmentAssignment,
  BankQuestion,
  LearnerAssessment,
  QuestionBank,
  TenantAssessment,
} from '@talim/types';
import { api } from '@/lib/api';

export function useQuestionBanks() {
  return useQuery({
    queryKey: ['tenant', 'question-banks'],
    queryFn: async () => {
      const { data } = await api.get<{ banks: QuestionBank[] }>('/tenant/question-banks');
      return data.banks;
    },
  });
}

export function useCreateQuestionBank() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title: string; topic?: string }) => {
      const { data } = await api.post<{ bank: QuestionBank }>('/tenant/question-banks', input);
      return data.bank;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenant', 'question-banks'] }),
  });
}

export function useBankQuestions(bankId: string | null) {
  return useQuery({
    queryKey: ['tenant', 'question-banks', bankId, 'questions'],
    queryFn: async () => {
      const { data } = await api.get<{ questions: BankQuestion[] }>(
        `/tenant/question-banks/${bankId}/questions`,
      );
      return data.questions;
    },
    enabled: Boolean(bankId),
  });
}

export function useGenerateBankQuestions(bankId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      topic?: string;
      contentId?: string;
      sectionId?: string;
      count?: number;
    }) => {
      const { data } = await api.post<{ questions: BankQuestion[] }>(
        `/tenant/question-banks/${bankId}/generate`,
        input,
      );
      return data.questions;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['tenant', 'question-banks', bankId, 'questions'] }),
  });
}

export function usePatchBankQuestion(bankId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: Partial<BankQuestion> & { id: string }) => {
      const { data } = await api.patch<{ question: BankQuestion }>(
        `/tenant/question-banks/${bankId}/questions/${id}`,
        body,
      );
      return data.question;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['tenant', 'question-banks', bankId, 'questions'] }),
  });
}

export function useTenantAssessments() {
  return useQuery({
    queryKey: ['tenant', 'assessments'],
    queryFn: async () => {
      const { data } = await api.get<{ assessments: TenantAssessment[] }>('/tenant/assessments');
      return data.assessments;
    },
  });
}

export function useCreateAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      bankId?: string;
      title: string;
      instructions?: string;
      maxAttempts?: number;
      questionIds: string[];
      publish?: boolean;
    }) => {
      const { data } = await api.post<{ assessment: TenantAssessment }>('/tenant/assessments', input);
      return data.assessment;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenant', 'assessments'] }),
  });
}

export function useAssignAssessment() {
  return useMutation({
    mutationFn: async ({
      assessmentId,
      ...input
    }: {
      assessmentId: string;
      learnerIds?: string[];
      contentId?: string;
      sectionId?: string;
    }) => {
      const { data } = await api.post<{ assignments: AssessmentAssignment[] }>(
        `/tenant/assessments/${assessmentId}/assign`,
        input,
      );
      return data.assignments;
    },
  });
}

export function useLearnerAssessments() {
  return useQuery({
    queryKey: ['learner', 'assessments'],
    queryFn: async () => {
      const { data } = await api.get<{ assessments: LearnerAssessment[] }>('/learner/assessments');
      return data.assessments;
    },
  });
}

export function useSubmitLearnerAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      assessmentId,
      answers,
    }: {
      assessmentId: string;
      answers: Record<string, string>;
    }) => {
      const { data } = await api.post<{
        attempt: { id: string; score: number; status: string; submittedAt: string };
        correct: number;
        total: number;
      }>(`/learner/assessments/${assessmentId}/attempts`, { answers });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['learner', 'assessments'] }),
  });
}
