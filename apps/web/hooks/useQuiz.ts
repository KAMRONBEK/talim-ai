import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import type { Quiz, QuizAttempt, QuizKind, QuizWithLatestAttempt } from '@talim/types';
import { api } from '@/lib/api';

export function useQuiz(id: string, pollInterval?: number) {
  return useQuery({
    queryKey: ['quiz', id],
    queryFn: async () => {
      const { data } = await api.get<{ quiz: Quiz }>(`/quiz/${id}`);
      return data.quiz;
    },
    enabled: !!id,
    refetchInterval: (query) => {
      const quiz = query.state.data as Quiz | undefined;
      return quiz?.questions?.length ? false : pollInterval;
    },
  });
}

export function useQuizHistory(contentId: string) {
  return useQuery({
    queryKey: ['quiz-history', contentId],
    queryFn: async () => {
      const { data } = await api.get<{ quizzes: QuizWithLatestAttempt[] }>(
        `/quiz/content/${contentId}`,
      );
      return data.quizzes;
    },
    enabled: !!contentId,
  });
}

export function useLatestQuizAttempt(quizId: string) {
  return useQuery({
    queryKey: ['quiz-attempt-latest', quizId],
    queryFn: async () => {
      const { data } = await api.get<{
        attempt: QuizAttempt | null;
        correct?: number;
        total?: number;
      }>(`/quiz/${quizId}/attempts/latest`);
      return data;
    },
    enabled: !!quizId,
  });
}

export function useCreateQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      contentId,
      sectionId,
      kind = 'FULL' as QuizKind,
    }: {
      contentId: string;
      sectionId: string;
      kind?: QuizKind;
    }) => {
      const { data } = await api.post<{ quiz: Quiz }>(`/quiz/content/${contentId}`, {
        sectionId,
        kind,
      });
      return data.quiz;
    },
    onSuccess: (_quiz, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['quiz-history', vars.contentId] });
      void queryClient.invalidateQueries({ queryKey: ['learning-history', vars.contentId] });
    },
  });
}

export function useSubmitQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      quizId,
      answers,
      contentId,
    }: {
      quizId: string;
      answers: Record<string, string>;
      contentId?: string;
    }) => {
      const { data } = await api.post<{
        attempt: QuizAttempt;
        correct: number;
        total: number;
      }>(`/quiz/${quizId}/submit`, { answers });
      return data;
    },
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['quiz-attempt-latest', vars.quizId] });
      if (vars.contentId) {
        void queryClient.invalidateQueries({ queryKey: ['progress', vars.contentId] });
        void queryClient.invalidateQueries({ queryKey: ['quiz-history', vars.contentId] });
        void queryClient.invalidateQueries({ queryKey: ['learning-history', vars.contentId] });
      }
    },
  });
}

export function useGenerateSummary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      contentId,
      sectionId,
    }: {
      contentId: string;
      sectionId?: string;
    }) => {
      const { data } = await api.post<{ summary: { summary: string }; cached: boolean }>(
        `/summary/${contentId}`,
        sectionId ? { sectionId } : {},
      );
      return data.summary.summary;
    },
    onSuccess: (_text, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['learning-history', vars.contentId] });
    },
  });
}

export function useSavedSummary(contentId: string, sectionId?: string) {
  return useQuery({
    queryKey: ['summary', contentId, sectionId ?? 'full'],
    queryFn: async () => {
      try {
        const params = sectionId ? { sectionId } : {};
        const { data } = await api.get<{ summary: { summary: string } }>(`/summary/${contentId}`, {
          params,
        });
        return data.summary.summary;
      } catch (err: unknown) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          return null;
        }
        throw err;
      }
    },
    enabled: !!contentId,
    retry: false,
  });
}
