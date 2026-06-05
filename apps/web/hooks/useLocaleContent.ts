'use client';

import { useEffect, useRef } from 'react';
import { useLocale } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import type { AppLocale } from '@talim/types';
import { setApiLocale } from '@/lib/locale-api';
import { api } from '@/lib/api';
import { useGenerateSummary } from '@/hooks/useQuiz';
import { useCreatePodcast } from '@/hooks/usePodcast';
import { useChatStore } from '@/store/useChatStore';

export function useLocaleSync() {
  const locale = useLocale() as AppLocale;

  useEffect(() => {
    setApiLocale(locale);
  }, [locale]);

  return locale;
}

export function useAutoGenerateOnLocaleChange(contentId: string, sectionId?: string) {
  const locale = useLocaleSync();
  const prevLocale = useRef(locale);
  const queryClient = useQueryClient();
  const generateSummary = useGenerateSummary();
  const createPodcast = useCreatePodcast();
  const resetChat = useChatStore((s) => s.reset);

  useEffect(() => {
    if (prevLocale.current === locale) return;
    prevLocale.current = locale;

    resetChat();

    void queryClient.invalidateQueries({ queryKey: ['summary', contentId] });
    void queryClient.invalidateQueries({ queryKey: ['podcast', contentId] });
    void queryClient.invalidateQueries({ queryKey: ['quiz-history', contentId] });
    void queryClient.invalidateQueries({ queryKey: ['learning-history', contentId] });
    void queryClient.invalidateQueries({ queryKey: ['sections', contentId] });
    void queryClient.invalidateQueries({ queryKey: ['section', contentId] });

    void (async () => {
      try {
        await api.get(`/summary/${contentId}`, {
          params: { locale, ...(sectionId ? { sectionId } : {}) },
        });
      } catch (err: unknown) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          void generateSummary.mutateAsync({
            contentId,
            ...(sectionId ? { sectionId } : {}),
          });
        }
      }

      const { data } = await api.get<{ podcast: { status: string } | null }>(
        `/content/${contentId}/podcast`,
        { params: { locale } },
      );
      if (!data.podcast || data.podcast.status === 'FAILED') {
        void createPodcast.mutateAsync({ contentId });
      }
    })();
  }, [locale, contentId, sectionId, queryClient, generateSummary, createPodcast, resetChat]);
}
