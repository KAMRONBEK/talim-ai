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
import { useContent } from '@/hooks/useContent';
import { useAuthStore } from '@/store/useAuthStore';
import { getHomePathForRole } from '@/lib/auth-routing';
import { AssignStudentsPanel } from '@/components/tenant/assign-students-panel';
import { useSections, useSection } from '@/hooks/useSections';
import { useContentProgress, useLearningHistory } from '@/hooks/useProgress';
import { useContentActions } from '@/hooks/useContentActions';
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

  const [progressOpen, setProgressOpen] = useState(false);

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

          <div className="mt-10 flex flex-wrap gap-2.5 border-t pt-8">
            {!isLearner && (
              <>
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
              variant="outline"
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
