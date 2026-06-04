'use client';

import { use, useEffect, useState, useRef, Suspense } from 'react';
import { cn } from '@talim/ui';
import { useContent } from '@/hooks/useContent';
import { useSections, useSection } from '@/hooks/useSections';
import { useGenerateSummary } from '@/hooks/useQuiz';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { fetchAuthenticatedBlob } from '@/lib/authenticatedBlob';
import { formatSummaryForDisplay } from '@/lib/format-summary';

function ChatPageInner({ id }: { id: string }) {
  const { data: content } = useContent(id);
  const { data: sections = [] } = useSections(id);
  const firstSectionId = sections[0]?.id;
  const { data: sectionData } = useSection(id, firstSectionId);
  const generateSummary = useGenerateSummary();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [selectedExcerpt, setSelectedExcerpt] = useState('');
  const [activeTab, setActiveTab] = useState<'content' | 'summary'>('content');
  const [summary, setSummary] = useState<string | null>(null);
  const [floatPos, setFloatPos] = useState<{ top: number; left: number } | null>(null);
  const [inputSeed, setInputSeed] = useState<string | null>(null);
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

  const handleBookSelection = () => {
    const sel = window.getSelection();
    const text = sel?.toString().trim() ?? '';
    if (text.length < 10 || !bookRef.current || !sel?.rangeCount) {
      setFloatPos(null);
      if (text.length < 10) setSelectedExcerpt('');
      return;
    }
    const range = sel.getRangeAt(0);
    const panelRect = bookRef.current.getBoundingClientRect();
    const rect = range.getBoundingClientRect();
    setSelectedExcerpt(text);
    setFloatPos({
      left: rect.left - panelRect.left + rect.width / 2 - 90,
      top: rect.top - panelRect.top - 40,
    });
  };

  const handleAskFloat = () => {
    if (!selectedExcerpt) return;
    const snippet =
      selectedExcerpt.length > 120 ? `${selectedExcerpt.slice(0, 120)}...` : selectedExcerpt;
    setInputSeed(`"${snippet}"\n\nBu qism haqida tushuntiring:`);
    setFloatPos(null);
    window.getSelection()?.removeAllRanges();
  };

  const loadSummary = async () => {
    if (summary) return;
    const text = await generateSummary.mutateAsync(id);
    setSummary(text);
  };

  useEffect(() => {
    if (activeTab === 'summary' && !summary && !generateSummary.isPending) {
      void loadSummary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per tab switch
  }, [activeTab]);

  if (!content) return <p className="p-8">Yuklanmoqda...</p>;

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex w-[380px] shrink-0 flex-col border-r bg-card">
        <div className="border-b px-5 py-4">
          <h3 className="text-sm font-semibold">{content.title}</h3>
          <p className="text-xs text-muted-foreground">{content.type}</p>
        </div>
        <div className="flex border-b bg-muted/30">
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
              {tab === 'content' ? 'Mazmun' : 'Xulosa'}
            </button>
          ))}
        </div>
        <div
          ref={bookRef}
          className="relative flex-1 overflow-y-auto bg-muted/20"
          onMouseUp={activeTab === 'content' && content.type !== 'PDF' ? handleBookSelection : undefined}
        >
          {activeTab === 'summary' ? (
            <div className="p-6 text-sm leading-relaxed">
              {generateSummary.isPending ? (
                <p className="text-muted-foreground">Xulosa yaratilmoqda...</p>
              ) : (
                <p className="whitespace-pre-wrap leading-relaxed">
                  {summary ? formatSummaryForDisplay(summary) : 'Xulosa mavjud emas.'}
                </p>
              )}
            </div>
          ) : content.type === 'PDF' && pdfUrl ? (
            <iframe src={pdfUrl} title="PDF ko'ruvchi" className="h-full w-full border-0" />
          ) : sectionData?.body ? (
            <div className="select-text p-6 text-sm leading-relaxed">{sectionData.body}</div>
          ) : content.type === 'YOUTUBE' && content.url ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center text-sm text-muted-foreground">
              <a href={content.url} target="_blank" rel="noreferrer" className="text-primary underline">
                Videoni ochish
              </a>
              <p>Suhbatda matn tanlab savol bering.</p>
            </div>
          ) : (
            <p className="p-4 text-sm text-muted-foreground">Ushbu tur uchun ko&apos;ruvchi mavjud emas.</p>
          )}
          {floatPos && activeTab === 'content' && (
            <button
              type="button"
              className="absolute z-10 flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-lg"
              style={{ top: floatPos.top, left: Math.max(8, floatPos.left) }}
              onClick={handleAskFloat}
            >
              Bu qism haqida so&apos;rang
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <ChatWindow
          contentId={id}
          contentTitle={content.title}
          selectedExcerpt={selectedExcerpt || undefined}
          onClearExcerpt={() => {
            setSelectedExcerpt('');
            setFloatPos(null);
          }}
          inputSeed={inputSeed}
          onInputSeedConsumed={() => setInputSeed(null)}
        />
      </div>
    </div>
  );
}

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={<p className="p-8">Yuklanmoqda...</p>}>
      <ChatPageInner id={id} />
    </Suspense>
  );
}
