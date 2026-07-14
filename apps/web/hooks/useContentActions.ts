import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import type { AppLocale } from '@talim/types';
import { useRetryContent } from '@/hooks/useContent';
import { useSavedSummary } from '@/hooks/useQuiz';
import { useLimitErrorHandler } from '@/hooks/useLimitErrorHandler';
import { streamSummaryGeneration } from '@/lib/summaryStream';

/**
 * Encapsulates the summary / retry / delete interactions for a content detail
 * page, plus the summary-dialog and delete-dialog open state. Quiz generation
 * moved into the self-contained Practice generator
 * (`components/practice/practice-generator.tsx`).
 *
 * Summary generation streams token-by-token over POST /summary/:id/stream —
 * the dialog opens immediately and the markdown grows in place instead of
 * blocking behind one 8-40s request. Already-generated summaries still load
 * instantly via the GET-cached path (useSavedSummary).
 */
export function useContentActions(id: string, activeSectionId: string | undefined) {
  const queryClient = useQueryClient();
  const locale = useLocale() as AppLocale;
  const { data: savedSummary } = useSavedSummary(id, activeSectionId);
  const retryContent = useRetryContent();
  const handleLimitError = useLimitErrorHandler();
  const t = useTranslations('content');

  const [summary, setSummary] = useState<string | null>(null);
  const [summaryPending, setSummaryPending] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  // Generation quota errors open the promotion modal; this holds the inline
  // fallback message for non-upgradeable failures.
  const [actionError, setActionError] = useState<string | null>(null);
  // Don't let the saved-summary refetch stomp on text that is mid-stream.
  const streamingRef = useRef(false);

  useEffect(() => {
    if (savedSummary && !streamingRef.current) setSummary(savedSummary);
  }, [savedSummary]);

  const handleSummary = async () => {
    if (savedSummary) {
      setSummary(savedSummary);
      setSummaryOpen(true);
      return;
    }
    if (streamingRef.current) {
      setSummaryOpen(true);
      return;
    }
    setActionError(null);
    streamingRef.current = true;
    setSummaryPending(true);
    setSummary(null);
    // Open the dialog right away — the summary streams into it token-by-token.
    setSummaryOpen(true);
    try {
      const final = await streamSummaryGeneration({
        contentId: id,
        sectionId: activeSectionId,
        onText: (fullText) => setSummary(fullText),
      });
      // The persisted summary is the sanitized text — replace the raw stream with
      // it and seed the react-query cache so cached views agree without a refetch.
      setSummary(final.summary);
      queryClient.setQueryData(
        ['summary', id, activeSectionId ?? 'full', locale],
        final.summary,
      );
      void queryClient.invalidateQueries({ queryKey: ['learning-history', id, locale] });
    } catch (err) {
      setSummaryOpen(false);
      setSummary(null);
      setActionError(handleLimitError(err, t('generationFailed')));
    } finally {
      streamingRef.current = false;
      setSummaryPending(false);
    }
  };

  const handleOpenSummary = (text: string) => {
    setSummary(text);
    setSummaryOpen(true);
  };

  return {
    // mutations
    retryContent,
    // summary state
    summary,
    summaryPending,
    summaryOpen,
    setSummaryOpen,
    // delete state
    deleteOpen,
    setDeleteOpen,
    // inline error for non-upgradeable generation failures
    actionError,
    clearActionError: () => setActionError(null),
    // handlers
    handleSummary,
    handleOpenSummary,
  };
}
