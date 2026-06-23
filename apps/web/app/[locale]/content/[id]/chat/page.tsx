'use client';

import { use, useEffect, useState, Suspense, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@talim/ui';
import { useContent } from '@/hooks/useContent';
import { useSections, useSection } from '@/hooks/useSections';
import { useGenerateSummary } from '@/hooks/useQuiz';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { fetchAuthenticatedBlob } from '@/lib/authenticatedBlob';
import { SummaryText } from '@/components/learning/summary-text';
import { PdfViewer } from '@/components/learning/PdfViewerLazy';
import { VideoTutorialViewer } from '@/components/learning/VideoTutorialViewer';
import type { TranscriptExcerptPayload } from '@/components/learning/TranscriptPanel';
import { ResizableSplit } from '@/components/layout/resizable-split';
import type { PdfExcerptPayload } from '@/components/learning/PdfViewer';

function ChatPageInner({ id }: { id: string }) {
  const t = useTranslations('content');
  const tChat = useTranslations('chat');
  const tCommon = useTranslations('common');
  const { data: content } = useContent(id);
  const { data: sections = [] } = useSections(id);
  const firstSectionId = sections[0]?.id;
  const { data: sectionData } = useSection(id, firstSectionId);
  const generateSummary = useGenerateSummary();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [selectedExcerpt, setSelectedExcerpt] = useState('');
  const [selectedExcerptImage, setSelectedExcerptImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'summary'>('content');
  const [mobilePanel, setMobilePanel] = useState<'material' | 'chat'>('chat');
  const [summary, setSummary] = useState<string | null>(null);
  const [inputSeed, setInputSeed] = useState<string | null>(null);
  const [selectionHint, setSelectionHint] = useState<string | null>(null);

  useEffect(() => {
    if (!content || content.type !== 'PDF' || !content.storagePath) return;
    let revoked: string | null = null;
    fetchAuthenticatedBlob(`/content/${id}/file`)
      .then((url) => {
        revoked = url;
        setPdfUrl(url);
      })
      .catch(() => setPdfUrl(null));
    return () => {
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [content, id]);

  const handlePdfExcerptSelected = useCallback(
    (payload: PdfExcerptPayload) => {
      const pagePrefix = payload.page ? `[Page ${payload.page}] ` : '';
      setSelectedExcerptImage(payload.imageDataUrl ?? null);
      const label = payload.excerpt.trim()
        ? `${pagePrefix}${payload.excerpt}`
        : `${pagePrefix}${t('selectedArea')}`;
      setSelectedExcerpt(label);
      setSelectionHint(null);
      setInputSeed(tChat('areaImagePrompt'));
    },
    [t, tChat],
  );

  const clearSelection = useCallback(() => {
    setSelectedExcerpt('');
    setSelectedExcerptImage(null);
    setSelectionHint(null);
  }, []);

  const handleEmptyPdfSelection = useCallback(() => {
    setSelectionHint(t('pdfNoTextInSelection'));
  }, [t]);

  const handleTranscriptExcerptSelected = useCallback(
    (payload: TranscriptExcerptPayload & { label: string }) => {
      setSelectedExcerptImage(null);
      setSelectedExcerpt(payload.label);
      setSelectionHint(null);
      setInputSeed(tChat('excerptPrompt', { snippet: payload.label }));
    },
    [tChat],
  );

  const loadSummary = async () => {
    if (summary) return;
    const text = await generateSummary.mutateAsync({ contentId: id });
    setSummary(text);
  };

  useEffect(() => {
    if (activeTab === 'summary' && !summary && !generateSummary.isPending) {
      void loadSummary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per tab switch
  }, [activeTab]);

  if (!content) return <p className="p-8">{tCommon('loading')}</p>;

  const materialPanel = (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-card">
      <div className="shrink-0 border-b border-border/70 px-5 py-4">
        <h3 className="font-display text-sm font-semibold">{content.title}</h3>
        <p className="text-xs text-muted-foreground">{content.type}</p>
      </div>
      <div className="flex shrink-0 border-b bg-muted/30">
        {(['content', 'summary'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            className={cn(
              'flex-1 border-b-2 py-2.5 text-xs font-medium transition-colors',
              activeTab === tab
                ? 'border-primary bg-card text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'content' ? t('contentTab') : t('summary')}
          </button>
        ))}
      </div>
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-muted/20">
        {activeTab === 'summary' ? (
          <div className="min-h-0 flex-1 overflow-y-auto p-6 text-sm leading-relaxed">
            {generateSummary.isPending ? (
              <p className="text-muted-foreground">{t('summaryGenerating')}</p>
            ) : summary ? (
              <SummaryText text={summary} />
            ) : (
              <p className="text-sm leading-relaxed">{t('summaryNotAvailable')}</p>
            )}
          </div>
        ) : content.type === 'PDF' && pdfUrl ? (
          <div className="min-h-0 flex-1">
            <PdfViewer
              url={pdfUrl}
              onExcerptSelected={handlePdfExcerptSelected}
              onSelectionCleared={clearSelection}
              onEmptySelection={handleEmptyPdfSelection}
            />
          </div>
        ) : content.type === 'YOUTUBE' && content.url ? (
          <div className="min-h-0 flex-1">
            <VideoTutorialViewer
              contentId={id}
              url={content.url}
              onExcerptSelected={handleTranscriptExcerptSelected}
              onSelectionCleared={clearSelection}
            />
          </div>
        ) : sectionData?.body ? (
          <div className="min-h-0 flex-1 overflow-y-auto p-6 text-sm leading-relaxed">
            {sectionData.body}
          </div>
        ) : (
          <p className="p-4 text-sm text-muted-foreground">{t('viewerNotAvailable')}</p>
        )}
        {selectionHint && activeTab === 'content' && content.type === 'PDF' && (
          <p className="pointer-events-none absolute bottom-2 left-2 right-2 z-10 rounded-md bg-warning-muted px-2 py-1 text-center text-[10px] text-warning">
            {selectionHint}
          </p>
        )}
      </div>
    </div>
  );

  const chatPanel = (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-2 md:p-4">
      <ChatWindow
        contentId={id}
        contentTitle={content.title}
        selectedExcerpt={selectedExcerpt || undefined}
        selectedExcerptImage={selectedExcerptImage ?? undefined}
        onClearExcerpt={clearSelection}
        inputSeed={inputSeed}
        onInputSeedConsumed={() => setInputSeed(null)}
      />
    </div>
  );

  const mobileTabs = (
    <div className="flex shrink-0 border-b bg-muted/30 md:hidden">
      {(['material', 'chat'] as const).map((panel) => (
        <button
          key={panel}
          type="button"
          className={cn(
            'flex-1 border-b-2 py-2.5 text-xs font-medium transition-colors',
            mobilePanel === panel
              ? 'border-primary bg-card text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
          onClick={() => setMobilePanel(panel)}
        >
          {panel === 'material' ? t('materialTab') : tCommon('aiTutor')}
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {mobileTabs}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:hidden">
        {mobilePanel === 'material' ? materialPanel : chatPanel}
      </div>
      <div className="hidden min-h-0 flex-1 overflow-hidden md:flex">
        <ResizableSplit
          left={materialPanel}
          right={chatPanel}
          defaultLeftPercent={58}
          storageKey="talim-chat-material-split"
        />
      </div>
    </div>
  );
}

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<ChatPageSuspenseFallback />}>
      <ChatPageWithParams params={params} />
    </Suspense>
  );
}

function ChatPageSuspenseFallback() {
  const tCommon = useTranslations('common');
  return <p className="p-8">{tCommon('loading')}</p>;
}

function ChatPageWithParams({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ChatPageInner id={id} />;
}
