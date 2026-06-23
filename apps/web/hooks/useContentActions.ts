import { useEffect, useState } from 'react';
import type { QuizKind } from '@talim/types';
import { useRouter } from '@/i18n/navigation';
import { useRetryContent } from '@/hooks/useContent';
import { useCreateQuiz, useGenerateSummary, useSavedSummary } from '@/hooks/useQuiz';

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

  const [summary, setSummary] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (savedSummary) setSummary(savedSummary);
  }, [savedSummary]);

  const handleCreateQuiz = async (kind: QuizKind) => {
    if (!activeSectionId) return;
    const quiz = await createQuiz.mutateAsync({
      contentId: id,
      sectionId: activeSectionId,
      kind,
    });
    router.push(`/quiz/${quiz.id}`);
  };

  const handleSummary = async () => {
    if (savedSummary) {
      setSummary(savedSummary);
      setSummaryOpen(true);
      return;
    }
    const text = await generateSummary.mutateAsync({
      contentId: id,
      sectionId: activeSectionId,
    });
    setSummary(text);
    setSummaryOpen(true);
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
    // handlers
    handleCreateQuiz,
    handleSummary,
    handleOpenSummary,
  };
}
