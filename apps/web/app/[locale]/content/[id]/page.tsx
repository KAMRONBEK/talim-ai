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
import { useChatStore } from '@/store/useChatStore';
import { getHomePathForRole } from '@/lib/auth-routing';
import { AssignStudentsPanel } from '@/components/tenant/assign-students-panel';
import { useSections, useSection } from '@/hooks/useSections';
import { useContentProgress, useLearningHistory } from '@/hooks/useProgress';
import { useContentActions } from '@/hooks/useContentActions';
import { useReparseContent } from '@/hooks/useReparseContent';
import { useLimitErrorHandler } from '@/hooks/useLimitErrorHandler';
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
    generateSummary,
    retryContent,
    summary,
    summaryOpen,
    setSummaryOpen,
    deleteOpen,
    setDeleteOpen,
    actionError,
    clearActionError,
    handleSummary,
    handleOpenSummary,
  } = useContentActions(id, activeSectionId);

  const reparse = useReparseContent(id);
  const handleLimitError = useLimitErrorHandler();
  const [rereadError, setRereadError] = useState<string | null>(null);
  const [learnTab, setLearnTab] = useState<LearnTab>(panelParam === 'chat' ? 'chat' : 'learn');
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedExcerpt, setSelectedExcerpt] = useState('');
  const [selectedExcerptImage, setSelectedExcerptImage] = useState<string | null>(null);
  const [inputSeed, setInputSeed] = useState<string | null>(null);
  // The reader's "Ask AI / Explain" tooltip (SelectionAsk) lives in the always-mounted
  // left stage and seeds the tutor composer through the chat store, but can't reach the
  // Learn/Chat tab state here. Subscribe to the seed so that flow also flips the panel to
  // the Chat tab (ChatWindow then prefills + focuses + clears it).
  const seededPrompt = useChatStore((s) => s.seededPrompt);

  // Navigating to ?panel=chat (e.g. the topbar "AI tutor" link) opens the Chat tab.
  // On mobile the Learn panel is a drawer, so also open it — otherwise the tap just
  // flips a hidden (desktop-only) tab and nothing visible happens.
  useEffect(() => {
    if (panelParam !== 'chat') return;
    setLearnTab('chat');
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
      setPanelOpen(true);
    }
  }, [panelParam]);

  // A reader text-selection seed ("Ask AI / Explain") should immediately reveal the
  // prefilled composer — flip to the Chat tab (and open the mobile drawer, like the
  // stage-excerpt and ?panel=chat paths). ChatWindow consumes + clears the seed.
  useEffect(() => {
    if (!seededPrompt) return;
    setLearnTab('chat');
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
      setPanelOpen(true);
    }
  }, [seededPrompt]);

  const handleExcerpt = useCallback((p: StageExcerpt) => {
    setSelectedExcerpt(p.excerpt);
    setSelectedExcerptImage(p.imageDataUrl ?? null);
    setInputSeed(p.inputSeed ?? null);
    setLearnTab('chat');
    // Only open the drawer on mobile — on desktop the Learn panel is already visible
    // (the ContentLearnPanelSheet is breakpoint-agnostic, so opening it on desktop
    // would render a second panel over the existing one). Mirrors the ?panel=chat effect.
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
      setPanelOpen(true);
    }
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
    // Scopes the Practice generator's "current section" option; the mastery list under the
    // progress area lives on the ['mastery', id] query key (hooks invalidate it on submits).
    activeSectionId,
    summaryPending: generateSummary.isPending,
    overallCoverage: progressData?.contentProgress?.overallCoverage ?? 0,
    sectionCoverage: sectionProgress?.coverageScore ?? 0,
    streakDays: history?.streakDays ?? 0,
    quizCount: history?.quizzes.length ?? 0,
    history,
    onOpenSummary: handleOpenSummary,
    hideGenerateActions: isLearner,
    // Generations now live in the left sidebar (content-sidebar). The right Learn panel keeps
    // only progress / history / streak (+ the AI tutor tab).
    showGenerations: false,
  };

  // Approximate the active section's position in the document (chunks are sequential; there
  // is no per-chunk page data), so clicking a chapter scrolls the PDF roughly to that section.
  const maxEndChunk = sections.reduce((max, s) => Math.max(max, s.endChunk), 1);
  const activeSection = sections.find((s) => s.id === activeSectionId);
  const pdfScrollFraction = activeSection ? activeSection.startChunk / maxEndChunk : undefined;

  const stage = (
    <ContentStage
      contentId={id}
      content={content}
      activeSectionId={activeSectionId}
      scrollToFraction={pdfScrollFraction}
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
  // old reader, surfaced in the Learn tab footer. A quota/limit error routes through
  // the shared handler (tenant owner → inline message; no individual upgrade modal).
  const learnFooter = isTenantOwner ? (
    <div className="space-y-4">
      <AssignStudentsPanel contentId={id} />
      <div className="flex flex-wrap gap-2">
        {(content.type === 'PDF' || content.type === 'SLIDE') && (
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() =>
              reparse.mutate(undefined, {
                onError: (err) => setRereadError(handleLimitError(err, t('rereadError'))),
                onSuccess: () => setRereadError(null),
              })
            }
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
      {actionError && (
        <div className="absolute left-1/2 top-4 z-50 flex -translate-x-1/2 items-center gap-3 rounded-lg border border-destructive/40 bg-card px-4 py-2.5 text-sm shadow-lg">
          <span className="text-destructive">{actionError}</span>
          <button
            type="button"
            onClick={clearActionError}
            className="text-muted-foreground hover:text-foreground"
            aria-label={tCommon('close')}
          >
            ✕
          </button>
        </div>
      )}
      {/* Desktop: resizable 2-pane workspace (stage | Learn hub). */}
      <div className="hidden min-h-0 flex-1 overflow-hidden md:flex">
        <ResizableSplit
          left={stage}
          right={<ContentLearnPanel {...learnPanelShared} />}
          defaultLeftPercent={72}
          storageKey="content-workspace-split-v2"
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
