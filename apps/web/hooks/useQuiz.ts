import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useLocale } from 'next-intl';
import type { Quiz, QuizAttempt, QuizKind, QuizWithLatestAttempt, AppLocale } from '@talim/types';
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
  const locale = useLocale() as AppLocale;

  return useQuery({
    queryKey: ['quiz-history', contentId, locale],
    queryFn: async () => {
      const { data } = await api.get<{ quizzes: QuizWithLatestAttempt[] }>(
        `/quiz/content/${contentId}`,
        { params: { locale } },
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
  const locale = useLocale() as AppLocale;

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
        locale,
      });
      return data.quiz;
    },
    onSuccess: (_quiz, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['quiz-history', vars.contentId, locale] });
      void queryClient.invalidateQueries({ queryKey: ['learning-history', vars.contentId, locale] });
    },
  });
}

export function useSubmitQuiz() {
  const queryClient = useQueryClient();
  const locale = useLocale() as AppLocale;

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
        void queryClient.invalidateQueries({ queryKey: ['quiz-history', vars.contentId, locale] });
        void queryClient.invalidateQueries({ queryKey: ['learning-history', vars.contentId, locale] });
      }
    },
  });
}

export function useGenerateSummary() {
  const queryClient = useQueryClient();
  const locale = useLocale() as AppLocale;

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
        { ...(sectionId ? { sectionId } : {}), locale },
      );
      return data.summary.summary;
    },
    onSuccess: (_text, vars) => {
      void queryClient.invalidateQueries({
        queryKey: ['summary', vars.contentId, vars.sectionId ?? 'full', locale],
      });
      void queryClient.invalidateQueries({
        queryKey: ['learning-history', vars.contentId, locale],
      });
    },
  });
}

export function useSavedSummary(contentId: string, sectionId?: string) {
  const locale = useLocale() as AppLocale;
  const scope = sectionId ?? 'full';

  return useQuery({
    queryKey: ['summary', contentId, scope, locale],
    queryFn: async () => {
      try {
        const params = { locale, ...(sectionId ? { sectionId } : {}) };
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
