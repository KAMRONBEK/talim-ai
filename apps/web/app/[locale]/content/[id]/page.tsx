'use client';

import { use, Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Button,
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
import { useReparseContent } from '@/hooks/useReparseContent';
import { classifyGenerationError } from '@/lib/generation-error';
import { ContentStatusGate } from '@/components/content/content-status-gate';
import { DeleteContentDialog } from '@/components/content/delete-content-dialog';
import { SummaryText } from '@/components/learning/summary-text';
import { ContentStage, type StageExcerpt } from '@/components/learning/content-stage';
import { ResizableSplit } from '@/components/layout/resizable-split';
import {
  ContentLearnPanel,
  ContentLearnPanelSheet,
  type LearnTab,
} from '@/components/layout/content-learn-panel';

function ContentPageLoading() {
  const t = useTranslations('common');
  return <>{t('loading')}</>;
}

function ContentWorkspaceInner({ id }: { id: string }) {
  const t = useTranslations('content');
  const tCommon = useTranslations('common');
  const tSlides = useTranslations('slides');
  const tLearn = useTranslations('learnHub');
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isLearner = user?.role === 'TENANT_LEARNER';
  const isTenantOwner = user?.role === 'TENANT_OWNER';
  const homePath = getHomePathForRole(user?.role);
  const searchParams = useSearchParams();
  const sectionId = searchParams.get('section') ?? undefined;
  const panelParam = searchParams.get('panel');

  const { data: content } = useContent(id);
  const { data: sections = [] } = useSections(id);
  const { data: progressData } = useContentProgress(id);
  const sectionIds = new Set(sections.map((s) => s.id));
  const storedLastSectionId = progressData?.contentProgress?.lastSectionId;
  const validLastSectionId =
    storedLastSectionId && sectionIds.has(storedLastSectionId) ? storedLastSectionId : undefined;
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
  const [learnTab, setLearnTab] = useState<LearnTab>(panelParam === 'chat' ? 'chat' : 'learn');
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedExcerpt, setSelectedExcerpt] = useState('');
  const [selectedExcerptImage, setSelectedExcerptImage] = useState<string | null>(null);
  const [inputSeed, setInputSeed] = useState<string | null>(null);

  // Navigating to ?panel=chat (e.g. the topbar "AI tutor" link) opens the Chat tab.
  useEffect(() => {
    if (panelParam === 'chat') setLearnTab('chat');
  }, [panelParam]);

  const handleExcerpt = useCallback((p: StageExcerpt) => {
    setSelectedExcerpt(p.excerpt);
    setSelectedExcerptImage(p.imageDataUrl ?? null);
    setInputSeed(p.inputSeed ?? null);
    setLearnTab('chat');
    setPanelOpen(true);
  }, []);

  const clearExcerpt = useCallback(() => {
    setSelectedExcerpt('');
    setSelectedExcerptImage(null);
  }, []);

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

  const sectionProgress = activeSectionId ? progressData?.sections[activeSectionId] : undefined;

  const panelProps = {
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

  const stage = (
    <ContentStage
      contentId={id}
      content={content}
      activeSectionId={activeSectionId}
      sectionBody={sectionData?.body}
      sectionLoading={sectionLoading}
      isLearner={isLearner}
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
      onExcerptSelected={handleExcerpt}
      onSelectionCleared={clearExcerpt}
    />
  );

  // Tutor-only material actions (assign + re-read OCR + delete) preserved from the
  // old reader, surfaced in the Learn tab footer.
  const rereadError = reparse.isError
    ? (() => {
        const info = classifyGenerationError(reparse.error);
        return info.kind === 'quota'
          ? tSlides('limitReached', { used: info.used ?? 0, limit: info.limit ?? 0 })
          : info.kind === 'plan'
            ? tSlides('limitReachedGeneric')
            : t('rereadError');
      })()
    : null;

  const learnFooter = isTenantOwner ? (
    <div className="space-y-4">
      <AssignStudentsPanel contentId={id} />
      <div className="flex flex-wrap gap-2">
        {(content.type === 'PDF' || content.type === 'SLIDE') && (
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => reparse.mutate()}
            disabled={reparse.isPending}
            title={t('rereadHint')}
          >
            {reparse.isPending ? `🔄 ${t('rereading')}` : `🔁 ${t('reread')}`}
          </Button>
        )}
        <Button variant="outline" size="sm" type="button" onClick={() => setDeleteOpen(true)}>
          {tCommon('delete')}
        </Button>
      </div>
      {rereadError && <p className="text-sm text-destructive">{rereadError}</p>}
    </div>
  ) : undefined;

  const learnPanelShared = {
    panelProps,
    contentTitle: content.title,
    activeTab: learnTab,
    onTabChange: setLearnTab,
    selectedExcerpt: selectedExcerpt || undefined,
    selectedExcerptImage: selectedExcerptImage ?? undefined,
    onClearExcerpt: clearExcerpt,
    inputSeed,
    onInputSeedConsumed: () => setInputSeed(null),
    learnFooter,
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Desktop: resizable 2-pane workspace (stage | Learn hub). */}
      <div className="hidden min-h-0 flex-1 overflow-hidden md:flex">
        <ResizableSplit
          left={stage}
          right={<ContentLearnPanel {...learnPanelShared} />}
          defaultLeftPercent={62}
          storageKey="content-workspace-split"
        />
      </div>

      {/* Mobile: stage full-width; the Learn hub opens as a drawer. */}
      <div className="flex min-h-0 flex-1 overflow-hidden md:hidden">{stage}</div>
      <ContentLearnPanelSheet open={panelOpen} onOpenChange={setPanelOpen} {...learnPanelShared} />
      <div className="fixed bottom-4 right-4 z-40 md:hidden">
        <Button
          type="button"
          size="sm"
          className="touch-manipulation shadow-lg"
          onClick={() => setPanelOpen(true)}
        >
          ✨ {tLearn('learn')}
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
      <ContentWorkspaceInner id={id} />
    </Suspense>
  );
}
