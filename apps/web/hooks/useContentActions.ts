import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { QuizKind, QuestionStyle } from '@talim/types';
import { useRouter } from '@/i18n/navigation';
import { useRetryContent } from '@/hooks/useContent';
import { useCreateQuiz, useGenerateSummary, useSavedSummary } from '@/hooks/useQuiz';
import { useLimitErrorHandler } from '@/hooks/useLimitErrorHandler';

/**
 * Encapsulates the quiz / summary / retry / delete interactions for a content
 * detail page, plus the summary-dialog and delete-dialog open state.
 *
 * Behaviour is intentionally identical to the inline logic previously held in
 * `app/[locale]/content/[id]/page.tsx`.
 */
export function useContentActions(id: string, activeSectionId: string | undefined) {
  const router = useRouter();
  const createQuiz = useCreateQuiz();
  const generateSummary = useGenerateSummary();
  const { data: savedSummary } = useSavedSummary(id, activeSectionId);
  const retryContent = useRetryContent();
  const handleLimitError = useLimitErrorHandler();
  const t = useTranslations('content');

  const [summary, setSummary] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  // Generation quota errors open the promotion modal; this holds the inline
  // fallback message for non-upgradeable failures.
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (savedSummary) setSummary(savedSummary);
  }, [savedSummary]);

  const handleCreateQuiz = async (
    kind: QuizKind,
    opts?: { style?: QuestionStyle; count?: number },
  ) => {
    if (!activeSectionId) {
      // No section to anchor the quiz to (e.g. a content that produced zero sections).
      // Surface a hint instead of silently doing nothing.
      setActionError(t('selectSectionForQuiz'));
      return;
    }
    setActionError(null);
    try {
      const quiz = await createQuiz.mutateAsync({
        contentId: id,
        sectionId: activeSectionId,
        kind,
        ...(opts?.style ? { style: opts.style } : {}),
        ...(opts?.count ? { count: opts.count } : {}),
      });
      router.push(`/quiz/${quiz.id}`);
    } catch (err) {
      setActionError(handleLimitError(err, t('generationFailed')));
    }
  };

  const handleSummary = async () => {
    if (savedSummary) {
      setSummary(savedSummary);
      setSummaryOpen(true);
      return;
    }
    setActionError(null);
    try {
      const text = await generateSummary.mutateAsync({
        contentId: id,
        sectionId: activeSectionId,
      });
      setSummary(text);
      setSummaryOpen(true);
    } catch (err) {
      setActionError(handleLimitError(err, t('generationFailed')));
    }
  };

  const handleOpenSummary = (text: string) => {
    setSummary(text);
    setSummaryOpen(true);
  };

  return {
    // mutations
    createQuiz,
    generateSummary,
    retryContent,
    // summary state
    summary,
    summaryOpen,
    setSummaryOpen,
    // delete state
    deleteOpen,
    setDeleteOpen,
    // inline error for non-upgradeable generation failures
    actionError,
    clearActionError: () => setActionError(null),
    // handlers
    handleCreateQuiz,
    handleSummary,
    handleOpenSummary,
  };
}
