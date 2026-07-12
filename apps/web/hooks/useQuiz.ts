import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useLocale } from 'next-intl';
import type {
  Quiz,
  QuizAttempt,
  QuestionDepth,
  QuestionType,
  QuizWithLatestAttempt,
  AppLocale,
  MasteryDelta,
  WrittenCheckResult,
} from '@talim/types';
import { api } from '@/lib/api';
import { useJobStreamStore } from '@/store/useJobStreamStore';

/** Quiz generation runs ~10-30s. The Quiz has no persisted status (F59), so a quiz that
 *  still has 0 questions well past this window almost certainly failed (or returned no
 *  questions) — surface a failed state instead of spinning forever. Generous so a slow
 *  generation is never falsely flagged; self-corrects the moment questions arrive. */
export const QUIZ_GENERATION_TIMEOUT_MS = 120_000;

export function isQuizGenerationStale(quiz: Pick<Quiz, 'createdAt' | 'questions'>): boolean {
  if ((quiz.questions?.length ?? 0) > 0) return false;
  return Date.now() - new Date(quiz.createdAt).getTime() >= QUIZ_GENERATION_TIMEOUT_MS;
}

export function useQuiz(id: string, pollInterval?: number) {
  const connected = useJobStreamStore((s) => s.connected);
  return useQuery({
    queryKey: ['quiz', id],
    queryFn: async () => {
      const { data } = await api.get<{ quiz: Quiz }>(`/quiz/${id}`);
      return data.quiz;
    },
    enabled: !!id,
    // SSE-primary (generateQuiz publishes quiz.status READY/FAILED); when connected, poll
    // slowly as a safety net only for callers that asked to poll during generation.
    refetchInterval: (query) => {
      const quiz = query.state.data as Quiz | undefined;
      if (quiz?.questions?.length || pollInterval == null) return false;
      return connected ? 30_000 : pollInterval;
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
    // QUICK is retired server-side — always FULL. Omitting sectionId scopes the quiz to
    // the whole material; `types`/`depth`/`count` drive the unified Practice generator.
    mutationFn: async ({
      contentId,
      sectionId,
      types,
      depth,
      count,
    }: {
      contentId: string;
      sectionId?: string;
      types?: QuestionType[];
      depth?: QuestionDepth;
      count?: number;
    }) => {
      const { data } = await api.post<{ quiz: Quiz }>(`/quiz/content/${contentId}`, {
        ...(sectionId ? { sectionId } : {}),
        kind: 'FULL',
        ...(types && types.length > 0 ? { types } : {}),
        ...(depth ? { depth } : {}),
        ...(count ? { count } : {}),
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
      /** Structured per-type shapes (arrays / per-blank arrays / matching maps) — must match server grading. */
      answers: Record<string, string | string[] | Record<string, string>>;
      contentId?: string;
    }) => {
      const { data } = await api.post<{
        attempt: QuizAttempt;
        correct: number;
        total: number;
        masteryDeltas: MasteryDelta[];
      }>(`/quiz/${quizId}/submit`, { answers });
      return data;
    },
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['quiz-attempt-latest', vars.quizId] });
      if (vars.contentId) {
        void queryClient.invalidateQueries({ queryKey: ['progress', vars.contentId] });
        void queryClient.invalidateQueries({ queryKey: ['quiz-history', vars.contentId, locale] });
        void queryClient.invalidateQueries({ queryKey: ['learning-history', vars.contentId, locale] });
        void queryClient.invalidateQueries({ queryKey: ['mastery', vars.contentId] });
      }
    },
  });
}

/**
 * Server check for one written answer (the quiz player's Check button). Deterministic
 * grading first; a rejected SHORT_ANSWER is judged semantically by AI, so grammar or
 * spelling slips don't mark a right answer wrong. The verdict is cached server-side —
 * the final submit grades the same answer identically.
 */
export function useCheckQuizAnswer() {
  return useMutation({
    mutationFn: async ({
      quizId,
      questionId,
      answer,
    }: {
      quizId: string;
      questionId: string;
      answer: string;
    }) => {
      const { data } = await api.post<WrittenCheckResult>(`/quiz/${quizId}/check-answer`, {
        questionId,
        answer,
      });
      return data;
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
