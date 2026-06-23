'use client';

import { use, Suspense, useState } from 'react';
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
import type { QuestionStyle } from '@talim/types';
import { useContent } from '@/hooks/useContent';
import { useAuthStore } from '@/store/useAuthStore';
import { getHomePathForRole } from '@/lib/auth-routing';
import { AssignStudentsPanel } from '@/components/tenant/assign-students-panel';
import { useSections, useSection } from '@/hooks/useSections';
import { useContentProgress, useLearningHistory } from '@/hooks/useProgress';
import { useContentActions } from '@/hooks/useContentActions';
import { useReparseContent } from '@/hooks/useReparseContent';
import { classifyGenerationError } from '@/lib/generation-error';
import { ContentRightPanel, ContentRightPanelSheet } from '@/components/layout/content-right-panel';
import { ContentStatusGate } from '@/components/content/content-status-gate';
import { DeleteContentDialog } from '@/components/content/delete-content-dialog';
import { SummaryText } from '@/components/learning/summary-text';
import { SectionReader } from '@/components/learning/section-reader';

function ContentPageLoading() {
  const t = useTranslations('common');
  return <>{t('loading')}</>;
}

function ContentDetailInner({ id }: { id: string }) {
  const t = useTranslations('content');
  const tCommon = useTranslations('common');
  const tSlides = useTranslations('slides');
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isLearner = user?.role === 'TENANT_LEARNER';
  const isTenantOwner = user?.role === 'TENANT_OWNER';
  const homePath = getHomePathForRole(user?.role);
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

  const {
    createQuiz,
    generateSummary,
    retryContent,
    summary,
    summaryOpen,
    setSummaryOpen,
    deleteOpen,
    setDeleteOpen,
    handleCreateQuiz,
    handleSummary,
    handleOpenSummary,
  } = useContentActions(id, activeSectionId);

  const reparse = useReparseContent(id);
  const [progressOpen, setProgressOpen] = useState(false);
  // Quiz generation options — mirror the tutor question styles for individuals.
  const [quizStyle, setQuizStyle] = useState<QuestionStyle>('mixed');
  const [quizCount, setQuizCount] = useState(5);
  const quizStyleOptions: { value: QuestionStyle; label: string }[] = [
    { value: 'mixed', label: t('quizStyleMixed') },
    { value: 'multipleChoice', label: t('quizStyleMultipleChoice') },
    { value: 'trueFalse', label: t('quizStyleTrueFalse') },
    { value: 'written', label: t('quizStyleWritten') },
    { value: 'numeric', label: t('quizStyleNumeric') },
  ];

  const sectionProgress = activeSectionId
    ? progressData?.sections[activeSectionId]
    : undefined;

  if (!content) {
    return <p className="p-8 text-muted-foreground">{tCommon('loading')}</p>;
  }

  if (content.status !== 'READY') {
    return (
      <ContentStatusGate
        content={content}
        isLearner={isLearner}
        homePath={homePath}
        retryContent={retryContent}
        deleteOpen={deleteOpen}
        setDeleteOpen={setDeleteOpen}
      />
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
    hideGenerateActions: isLearner,
  };

  return (
    <div className="relative flex flex-1 overflow-hidden">
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-4 py-8 md:px-12">
          <nav className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Link href={homePath} className="hover:text-foreground">
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

          <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">{sectionTitle}</h1>
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

          <div className="mt-8 max-w-5xl">
            <SectionReader
              contentId={id}
              sectionId={activeSectionId}
              body={sectionData?.body}
              isLearner={isLearner}
              sectionLoading={sectionLoading}
              entryEdge={searchParams.get('at') === 'end' ? 'end' : 'start'}
              onAdvance={
                activeIndex >= 0 && activeIndex < sections.length - 1
                  ? () => router.push(`/content/${id}?section=${sections[activeIndex + 1]!.id}`)
                  : undefined
              }
              onRetreat={
                activeIndex > 0
                  ? () => router.push(`/content/${id}?section=${sections[activeIndex - 1]!.id}&at=end`)
                  : undefined
              }
            />

            {summary && (
              <div className="od-info-box mt-8 max-w-3xl">
                <div className="od-info-box-title">💡 {t('keyConcept')}</div>
                <SummaryText text={summary} />
              </div>
            )}
          </div>

          {isTenantOwner && (
            <div className="mt-8 max-w-3xl">
              <AssignStudentsPanel contentId={id} />
            </div>
          )}

          <div className="mt-10 flex flex-wrap gap-2.5 border-t border-border/70 pt-8">
            {!isLearner && (
              <div className="flex w-full flex-wrap items-end gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t('quizStyle')}
                  </span>
                  <select
                    value={quizStyle}
                    onChange={(e) => setQuizStyle(e.target.value as QuestionStyle)}
                    className="h-10 rounded-xl border border-input bg-background px-3 text-sm text-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                  >
                    {quizStyleOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t('quizCountLabel')}
                  </span>
                  <select
                    value={quizCount}
                    onChange={(e) => setQuizCount(Number(e.target.value))}
                    className="h-10 rounded-xl border border-input bg-background px-3 text-sm text-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                  >
                    {[3, 5, 8, 10, 15].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
            {!isLearner && (
              <>
                <Button
                  className="w-full touch-manipulation sm:w-auto"
                  onClick={() => handleCreateQuiz('FULL', { style: quizStyle, count: quizCount })}
                  disabled={createQuiz.isPending || !activeSectionId}
                >
                  ❓ {createQuiz.isPending ? t('creating') : t('quiz')}
                </Button>
                <Button
                  variant="outline"
                  className="w-full touch-manipulation sm:w-auto"
                  onClick={() => handleCreateQuiz('QUICK', { style: quizStyle })}
                  disabled={createQuiz.isPending || !activeSectionId}
                >
                  ⚡ {createQuiz.isPending ? t('creating') : t('quickQuiz')}
                </Button>
              </>
            )}
            <Button
              variant="outline"
              className="w-full touch-manipulation sm:w-auto"
              onClick={() => router.push(`/content/${id}/podcast`)}
            >
              🎧 {t('listen')}
            </Button>
            <Button
              variant="gradient"
              className="w-full touch-manipulation sm:w-auto"
              onClick={() => router.push(`/content/${id}/chat`)}
            >
              💬 {t('askTutor')}
            </Button>
            <Button
              variant="outline"
              className="w-full touch-manipulation sm:w-auto"
              onClick={() => router.push(`/content/${id}/slides`)}
            >
              🎞️ {t('slides')}
            </Button>
            {!isLearner && (content.type === 'PDF' || content.type === 'SLIDE') && (
              <Button
                variant="outline"
                type="button"
                className="w-full touch-manipulation sm:w-auto"
                onClick={() => reparse.mutate()}
                disabled={reparse.isPending}
                title={t('rereadHint')}
              >
                {reparse.isPending ? `🔄 ${t('rereading')}` : `🔁 ${t('reread')}`}
              </Button>
            )}
            {!isLearner && (
              <Button
                variant="outline"
                type="button"
                className="w-full touch-manipulation sm:w-auto"
                onClick={() => setDeleteOpen(true)}
              >
                {tCommon('delete')}
              </Button>
            )}
          </div>
          {reparse.isError &&
            (() => {
              const info = classifyGenerationError(reparse.error);
              const msg =
                info.kind === 'quota'
                  ? tSlides('limitReached', { used: info.used ?? 0, limit: info.limit ?? 0 })
                  : info.kind === 'plan'
                    ? tSlides('limitReachedGeneric')
                    : t('rereadError');
              return <p className="mt-3 max-w-3xl text-sm text-destructive">{msg}</p>;
            })()}
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
        onDeleted={() => router.push(homePath)}
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
