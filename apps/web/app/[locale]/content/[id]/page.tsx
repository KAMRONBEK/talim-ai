'use client';

import { use, Suspense, useEffect } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Button,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@talim/ui';
import { useContent, useRetryContent } from '@/hooks/useContent';
import { useSections, useSection } from '@/hooks/useSections';
import {
  useCreateQuiz,
  useGenerateSummary,
  useSavedSummary,
} from '@/hooks/useQuiz';
import { useContentProgress, useLearningHistory } from '@/hooks/useProgress';
import { ContentRightPanel, ContentRightPanelSheet } from '@/components/layout/content-right-panel';
import { DeleteContentDialog } from '@/components/content/delete-content-dialog';
import { useState } from 'react';
import { SummaryText } from '@/components/learning/summary-text';

function ContentPageLoading() {
  const t = useTranslations('common');
  return <>{t('loading')}</>;
}

function ContentDetailInner({ id }: { id: string }) {
  const t = useTranslations('content');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const searchParams = useSearchParams();
  const sectionId = searchParams.get('section') ?? undefined;
  const { data: content } = useContent(id);
  const { data: sections = [] } = useSections(id);
  const { data: progressData } = useContentProgress(id);
  const sectionIds = new Set(sections.map((s) => s.id));
  const storedLastSectionId = progressData?.contentProgress?.lastSectionId;
  const validLastSectionId =
    storedLastSectionId && sectionIds.has(storedLastSectionId)
      ? storedLastSectionId
      : undefined;
  const activeSectionId = sectionId ?? validLastSectionId ?? sections[0]?.id;
  const activeIndex = sections.findIndex((s) => s.id === activeSectionId);
  const { data: sectionData, isLoading: sectionLoading } = useSection(id, activeSectionId);
  const { data: history } = useLearningHistory(id);
  const createQuiz = useCreateQuiz();
  const generateSummary = useGenerateSummary();
  const { data: savedSummary } = useSavedSummary(id, activeSectionId);
  const retryContent = useRetryContent();
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);

  useEffect(() => {
    if (savedSummary) setSummary(savedSummary);
  }, [savedSummary]);

  const sectionProgress = activeSectionId
    ? progressData?.sections[activeSectionId]
    : undefined;

  const handleCreateQuiz = async (kind: 'FULL' | 'QUICK') => {
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

  if (!content) {
    return <p className="p-8 text-muted-foreground">{tCommon('loading')}</p>;
  }

  if (content.status === 'FAILED') {
    return (
      <>
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="max-w-md rounded-xl border bg-card p-8 text-center">
            <h2 className="text-lg font-semibold">{t('failed')}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t('failedDesc')}</p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button
                disabled={retryContent.isPending}
                onClick={() => retryContent.mutate(id)}
              >
                {retryContent.isPending ? t('retrying') : t('retry')}
              </Button>
              <Button variant="outline" type="button" onClick={() => setDeleteOpen(true)}>
                {tCommon('delete')}
              </Button>
              <Link href="/dashboard">
                <Button variant="outline" type="button">
                  {t('backToLibrary')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <DeleteContentDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          content={{ id: content.id, title: content.title }}
          onDeleted={() => router.push('/dashboard')}
        />
      </>
    );
  }

  if (content.status !== 'READY') {
    return (
      <>
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="max-w-md rounded-xl border bg-card p-8 text-center">
            <h2 className="text-lg font-semibold">{t('processing')}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('processingDesc', { status: content.status })}
            </p>
            <div className="mt-6">
              <Button variant="outline" type="button" onClick={() => setDeleteOpen(true)}>
                {tCommon('delete')}
              </Button>
            </div>
          </div>
        </div>
        <DeleteContentDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          content={{ id: content.id, title: content.title }}
          onDeleted={() => router.push('/dashboard')}
        />
      </>
    );
  }

  const sectionTitle = sectionData?.section.title ?? content.title;
  const chapterLabel = activeIndex >= 0 ? t('chapter', { n: activeIndex + 1 }) : '';

  const rightPanelProps = {
    contentId: id,
    onSummary: handleSummary,
    onQuiz: () => handleCreateQuiz('FULL'),
    onQuickCheck: () => handleCreateQuiz('QUICK'),
    summaryPending: generateSummary.isPending,
    quizPending: createQuiz.isPending,
    quickCheckPending: createQuiz.isPending,
    overallCoverage: progressData?.contentProgress?.overallCoverage ?? 0,
    sectionCoverage: sectionProgress?.coverageScore ?? 0,
    streakDays: history?.streakDays ?? 0,
    quizCount: history?.quizzes.length ?? 0,
    history,
    onOpenSummary: handleOpenSummary,
  };

  return (
    <div className="relative flex flex-1 overflow-hidden">
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-4 py-8 md:px-12">
          <nav className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Link href="/dashboard" className="hover:text-foreground">
              {tCommon('home')}
            </Link>
            <span>/</span>
            <span className="text-foreground">{content.title}</span>
            {chapterLabel && (
              <>
                <span>/</span>
                <span className="text-foreground">{chapterLabel}</span>
              </>
            )}
          </nav>

          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{sectionTitle}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {chapterLabel && <Badge variant="secondary">{chapterLabel}</Badge>}
            {sectionData?.section.readMinutes != null && (
              <span>{t('readMinutes', { n: sectionData.section.readMinutes })}</span>
            )}
            {sectionProgress != null && sectionProgress.coverageScore > 0 && (
              <Badge variant="outline">
                {t('coverage', { n: Math.round(sectionProgress.coverageScore) })}
              </Badge>
            )}
          </div>

          {sectionProgress?.aiFeedback && (
            <p className="mt-3 text-sm text-muted-foreground">{sectionProgress.aiFeedback}</p>
          )}

          <div className="mt-8 max-w-3xl">
            {sectionLoading ? (
              <p className="text-muted-foreground">{t('sectionLoading')}</p>
            ) : (
              <article className="prose prose-sm max-w-none whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">
                {sectionData?.body ?? t('selectSection')}
              </article>
            )}

            {summary && (
              <div className="od-info-box mt-8">
                <div className="od-info-box-title">💡 {t('keyConcept')}</div>
                <SummaryText text={summary} />
              </div>
            )}
          </div>

          <div className="mt-10 flex flex-wrap gap-2.5 border-t pt-8">
            <Button
              className="w-full touch-manipulation sm:w-auto"
              onClick={() => handleCreateQuiz('FULL')}
              disabled={createQuiz.isPending || !activeSectionId}
            >
              ❓ {createQuiz.isPending ? t('creating') : t('quiz')}
            </Button>
            <Button
              variant="outline"
              className="w-full touch-manipulation sm:w-auto"
              onClick={() => handleCreateQuiz('QUICK')}
              disabled={createQuiz.isPending || !activeSectionId}
            >
              ⚡ {createQuiz.isPending ? t('creating') : t('quickQuiz')}
            </Button>
            <Button
              variant="outline"
              className="w-full touch-manipulation sm:w-auto"
              onClick={() => router.push(`/content/${id}/podcast`)}
            >
              🎧 {t('listen')}
            </Button>
            <Button
              variant="outline"
              className="w-full touch-manipulation sm:w-auto"
              onClick={() => router.push(`/content/${id}/chat`)}
            >
              💬 {t('askTutor')}
            </Button>
            <Button
              variant="outline"
              className="w-full touch-manipulation sm:w-auto"
              disabled
              title={tCommon('videoComingSoon')}
            >
              🎬 {tCommon('videoComingSoon')}
            </Button>
            <Button
              variant="outline"
              type="button"
              className="w-full touch-manipulation sm:w-auto"
              onClick={() => setDeleteOpen(true)}
            >
              {tCommon('delete')}
            </Button>
          </div>
        </div>
      </div>

      <ContentRightPanel {...rightPanelProps} />
      <ContentRightPanelSheet
        open={progressOpen}
        onOpenChange={setProgressOpen}
        {...rightPanelProps}
      />
      <div className="fixed bottom-4 right-4 z-40 md:hidden">
        <Button
          type="button"
          size="sm"
          className="touch-manipulation shadow-lg"
          onClick={() => setProgressOpen(true)}
        >
          📊 {t('yourProgress')}
        </Button>
      </div>

      <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('summaryTitle')}</DialogTitle>
          </DialogHeader>
          <SummaryText text={summary ?? ''} />
        </DialogContent>
      </Dialog>

      <DeleteContentDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        content={{ id: content.id, title: content.title }}
        onDeleted={() => router.push('/dashboard')}
      />
    </div>
  );
}

export default function ContentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={<p className="p-8"><ContentPageLoading /></p>}>
      <ContentDetailInner id={id} />
    </Suspense>
  );
}
