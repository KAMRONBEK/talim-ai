import { useMutation, useQuery } from '@tanstack/react-query';
import type { Quiz, QuizAttempt } from '@talim/types';
import { api } from '@/lib/api';

export function useQuiz(id: string, pollInterval?: number) {
  return useQuery({
    queryKey: ['quiz', id],
    queryFn: async () => {
      const { data } = await api.get<{ quiz: Quiz }>(`/quiz/${id}`);
      return data.quiz;
    },
    enabled: !!id,
    refetchInterval: pollInterval,
  });
}

export function useCreateQuiz() {
  return useMutation({
    mutationFn: async (contentId: string) => {
      const { data } = await api.post<{ quiz: Quiz }>(`/quiz/content/${contentId}`);
      return data.quiz;
    },
  });
}

export function useSubmitQuiz() {
  return useMutation({
    mutationFn: async ({
      quizId,
      answers,
    }: {
      quizId: string;
      answers: Record<string, string>;
    }) => {
      const { data } = await api.post<{
        attempt: QuizAttempt;
        correct: number;
        total: number;
      }>(`/quiz/${quizId}/submit`, { answers });
      return data;
    },
  });
}

export function useGenerateSummary() {
  return useMutation({
    mutationFn: async (contentId: string) => {
      const { data } = await api.post<{ summary: string; contentId: string }>(
        `/summary/${contentId}`,
      );
      return data.summary;
    },
  });
}
