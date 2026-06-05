'use client';

import { use, useEffect, useState, useRef, Suspense, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@talim/ui';
import { useContent } from '@/hooks/useContent';
import { useSections, useSection } from '@/hooks/useSections';
import { useGenerateSummary } from '@/hooks/useQuiz';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { fetchAuthenticatedBlob } from '@/lib/authenticatedBlob';
import { SummaryText } from '@/components/learning/summary-text';
import { PdfViewer } from '@/components/learning/PdfViewerLazy';
import { SelectionToolbar } from '@/components/learning/SelectionToolbar';
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
  const [summary, setSummary] = useState<string | null>(null);
  const [floatPos, setFloatPos] = useState<{ top: number; left: number } | null>(null);
  const [inputSeed, setInputSeed] = useState<string | null>(null);
  const [selectionHint, setSelectionHint] = useState<string | null>(null);
  const bookRef = useRef<HTMLDivElement>(null);

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

  const setExcerptFromRect = useCallback((excerpt: string, anchorRect: DOMRect) => {
    if (!bookRef.current) return;
    const panelRect = bookRef.current.getBoundingClientRect();
    setSelectedExcerpt(excerpt);
    setSelectionHint(null);
    const left = anchorRect.left - panelRect.left + anchorRect.width / 2 - 90;
    const belowSelection = anchorRect.top - panelRect.top + anchorRect.height + 8;
    const aboveSelection = anchorRect.top - panelRect.top - 40;
    const top =
      belowSelection + 36 < panelRect.height ? belowSelection : Math.max(8, aboveSelection);
    setFloatPos({ left, top });
  }, []);

  const handlePdfExcerptSelected = useCallback(
    (payload: PdfExcerptPayload) => {
      const pagePrefix = payload.page ? `[Page ${payload.page}] ` : '';
      if (payload.mode === 'area' && payload.imageDataUrl) {
        setSelectedExcerptImage(payload.imageDataUrl);
        const label = payload.excerpt.trim()
          ? `${pagePrefix}${payload.excerpt}`
          : `${pagePrefix}${t('selectedArea')}`;
        setExcerptFromRect(label, payload.anchorRect);
        setInputSeed(tChat('areaImagePrompt'));
        return;
      }
      setSelectedExcerptImage(null);
      const excerpt = `${pagePrefix}${payload.excerpt}`;
      setExcerptFromRect(excerpt, payload.anchorRect);
    },
    [setExcerptFromRect, t, tChat],
  );

  const handleBookSelection = () => {
    const sel = window.getSelection();
    const text = sel?.toString().trim() ?? '';
    if (text.length < 10 || !bookRef.current || !sel?.rangeCount) {
      setFloatPos(null);
      if (text.length < 10) setSelectedExcerpt('');
      return;
    }
    const range = sel.getRangeAt(0);
    const rangeRect = range.getBoundingClientRect();
    setExcerptFromRect(text, rangeRect);
  };

  const handleAskFloat = () => {
    if (!selectedExcerpt && !selectedExcerptImage) return;
    if (selectedExcerptImage) {
      setInputSeed(tChat('areaImagePrompt'));
    } else {
      const snippet =
        selectedExcerpt.length > 120 ? `${selectedExcerpt.slice(0, 120)}...` : selectedExcerpt;
      setInputSeed(tChat('excerptPrompt', { snippet }));
    }
    setFloatPos(null);
    window.getSelection()?.removeAllRanges();
  };

  const clearSelection = useCallback(() => {
    setSelectedExcerpt('');
    setSelectedExcerptImage(null);
    setFloatPos(null);
    setSelectionHint(null);
  }, []);

  const handleEmptyPdfSelection = useCallback(() => {
    setSelectionHint(t('pdfNoTextInSelection'));
  }, [t]);

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
      <div className="shrink-0 border-b px-5 py-4">
        <h3 className="text-sm font-semibold">{content.title}</h3>
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
      <div
        ref={bookRef}
        className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-muted/20"
        onMouseUp={activeTab === 'content' && content.type !== 'PDF' ? handleBookSelection : undefined}
      >
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
        ) : sectionData?.body ? (
          <div className="min-h-0 flex-1 select-text overflow-y-auto p-6 text-sm leading-relaxed">
            {sectionData.body}
          </div>
        ) : content.type === 'YOUTUBE' && content.url ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center text-sm text-muted-foreground">
            <a href={content.url} target="_blank" rel="noreferrer" className="text-primary underline">
              {t('openVideo')}
            </a>
            <p>{t('selectTextToAsk')}</p>
          </div>
        ) : (
          <p className="p-4 text-sm text-muted-foreground">{t('viewerNotAvailable')}</p>
        )}
        {selectionHint && activeTab === 'content' && content.type === 'PDF' && (
          <p className="pointer-events-none absolute bottom-2 left-2 right-2 z-10 rounded-md bg-warning-muted px-2 py-1 text-center text-[10px] text-warning">
            {selectionHint}
          </p>
        )}
        <SelectionToolbar
          position={activeTab === 'content' ? floatPos : null}
          label={tChat('askAboutExcerpt')}
          onAsk={handleAskFloat}
        />
      </div>
    </div>
  );

  const chatPanel = (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
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

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <ResizableSplit left={materialPanel} right={chatPanel} defaultLeftPercent={58} />
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
