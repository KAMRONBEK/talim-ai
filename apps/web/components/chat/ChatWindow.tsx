'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@talim/ui';
import { ChatMessage } from './ChatMessage';
import { useChatStore } from '@/store/useChatStore';

const QUICK_ACTIONS = [
  '5 yoshli bolaga tushuntirganday',
  'Menga misol bering',
  'Mendan sinang',
  'Transkripsiya bilan solishtiring',
];

interface ChatWindowProps {
  contentId: string;
  contentTitle?: string;
  selectedExcerpt?: string;
  onClearExcerpt?: () => void;
  inputSeed?: string | null;
  onInputSeedConsumed?: () => void;
}

export function ChatWindow({
  contentId,
  contentTitle,
  selectedExcerpt,
  onClearExcerpt,
  inputSeed,
  onInputSeedConsumed,
}: ChatWindowProps) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const { messages, isStreaming, streamMessage, reset } = useChatStore();

  useEffect(() => {
    reset();
  }, [contentId, reset]);

  useEffect(() => {
    if (inputSeed) {
      setInput(inputSeed);
      onInputSeedConsumed?.();
    }
  }, [inputSeed, onInputSeedConsumed]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    const message = input.trim();
    setInput('');
    await streamMessage(contentId, message, selectedExcerpt);
    onClearExcerpt?.();
  };

  const askAboutExcerpt = () => {
    if (!selectedExcerpt) return;
    const snippet =
      selectedExcerpt.length > 120 ? `${selectedExcerpt.slice(0, 120)}...` : selectedExcerpt;
    setInput(`"${snippet}"\n\nBu qism haqida tushuntiring:`);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-card">
      <div className="border-b px-4 py-3">
        <h2 className="font-semibold">AI O&apos;qituvchi</h2>
        <p className="text-xs text-muted-foreground">Onlayn — kitobdan javob berish</p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <ChatMessage
            role="ASSISTANT"
            text={`Salom! Men sizning ${contentTitle ?? 'material'} bo'yicha AI o'qituvchingizman. Chap tomonda material ko'rsatilgan. Istalgan matnni belgilang va "Bu qism haqida so'rang" tugmasini bosing — men aniq shu qism haqida javob beraman.`}
          />
        )}
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            role={msg.role}
            text={msg.text}
            streaming={msg.streaming}
            excerpt={msg.excerpt}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t p-4">
        {selectedExcerpt && (
          <div className="mb-3">
            <div className="od-selected-quote rounded-lg">
              <div className="od-selected-quote-label">📖 Tanlangan matn</div>
              <p className="line-clamp-3">{selectedExcerpt}</p>
            </div>
            <div className="mt-2 flex gap-2">
              <Button type="button" size="sm" variant="secondary" onClick={askAboutExcerpt}>
                Bu qism haqida so&apos;rang
              </Button>
              {onClearExcerpt && (
                <Button type="button" size="sm" variant="ghost" onClick={onClearExcerpt}>
                  Tozalash
                </Button>
              )}
            </div>
          </div>
        )}
        <div className="mb-3 flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action}
              type="button"
              className="rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
              onClick={() => setInput(action)}
            >
              {action}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Materialingiz haqida har qanday narsani so'rang..."
            disabled={isStreaming}
            rows={1}
            className="flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button type="submit" disabled={isStreaming || !input.trim()} className="shrink-0">
            ↑
          </Button>
        </form>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          AI javoblari materialingiz asosida yaratiladi va manbalar bilan tasdiqlanishi mumkin.
        </p>
      </div>
    </div>
  );
}
