import { useQuery } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import { api } from '@/lib/api';
import { useContentBase } from '@/hooks/useContentBase';

export interface LocaleGenerations {
  locale: string;
  quizzes: number;
  podcasts: number;
  videos: number;
  flashcards: number;
  slides: number;
  summaries: number;
  total: number;
}

/**
 * Generated material this content has in OTHER languages.
 *
 * Artifacts are locale-scoped by design, so switching the app language empties the list — which
 * reads as "my materials were deleted" and invites the user to regenerate, spending quota to
 * recreate something that already exists. This is what lets the UI say so instead.
 */
export function useOtherLocales(contentId: string, enabled = true) {
  const base = useContentBase();
  const locale = useLocale();
  return useQuery({
    queryKey: ['content-other-locales', contentId, locale],
    queryFn: async () => {
      const { data } = await api.get<{ locales: LocaleGenerations[] }>(
        `${base}/${contentId}/other-locales`,
      );
      return data.locales;
    },
    enabled: enabled && !!contentId,
    staleTime: 60_000,
  });
}
