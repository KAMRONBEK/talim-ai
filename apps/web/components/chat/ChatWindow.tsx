'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@talim/ui';
import { ChatMessage } from './ChatMessage';
import { useChatStore } from '@/store/useChatStore';

interface ChatWindowProps {
  contentId: string;
  contentTitle?: string;
  selectedExcerpt?: string;
  selectedExcerptImage?: string;
  onClearExcerpt?: () => void;
  inputSeed?: string | null;
  onInputSeedConsumed?: () => void;
}

export function ChatWindow({
  contentId,
  contentTitle,
  selectedExcerpt,
  selectedExcerptImage,
  onClearExcerpt,
  inputSeed,
  onInputSeedConsumed,
}: ChatWindowProps) {
  const locale = useLocale();
  const t = useTranslations('chat');
  const quickActions = t.raw('quickActions') as string[];
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const { messages, isStreaming, streamMessage, reset } = useChatStore();

  useEffect(() => {
    reset();
  }, [contentId, locale, reset]);

  useEffect(() => {
    if (inputSeed) {
      setInput(inputSeed);
      onInputSeedConsumed?.();
    }
  }, [inputSeed, onInputSeedConsumed]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    const message = input.trim();
    setInput('');
    await streamMessage(contentId, message, selectedExcerpt, selectedExcerptImage);
    onClearExcerpt?.();
  };

  const askAboutExcerpt = () => {
    if (!selectedExcerpt && !selectedExcerptImage) return;
    if (selectedExcerptImage) {
      setInput(t('areaImagePrompt'));
      return;
    }
    const snippet =
      selectedExcerpt!.length > 120 ? `${selectedExcerpt!.slice(0, 120)}...` : selectedExcerpt!;
    setInput(t('excerptPrompt', { snippet }));
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-card">
      <div className="border-b px-4 py-3">
        <h2 className="font-semibold">{t('title')}</h2>
        <p className="text-xs text-muted-foreground">{t('subtitle')}</p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <ChatMessage
            role="ASSISTANT"
            text={t('greeting', { title: contentTitle ?? t('defaultTitle') })}
          />
        )}
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            role={msg.role}
            text={msg.text}
            streaming={msg.streaming}
            excerpt={msg.excerpt}
            excerptImage={msg.excerptImage}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t p-4">
        {(selectedExcerpt || selectedExcerptImage) && (
          <div className="mb-3">
            <div className="od-selected-quote rounded-lg">
              <div className="od-selected-quote-label">
                📖 {selectedExcerptImage ? t('selectedArea') : t('selectedText')}
              </div>
              {selectedExcerptImage && (
                <img
                  src={selectedExcerptImage}
                  alt=""
                  className="mb-2 max-h-40 w-full rounded-md border object-contain"
                />
              )}
              {selectedExcerpt && <p className="line-clamp-3">{selectedExcerpt}</p>}
            </div>
            <div className="mt-2 flex gap-2">
              <Button type="button" size="sm" variant="secondary" onClick={askAboutExcerpt}>
                {t('askAboutExcerpt')}
              </Button>
              {onClearExcerpt && (
                <Button type="button" size="sm" variant="ghost" onClick={onClearExcerpt}>
                  {t('clear')}
                </Button>
              )}
            </div>
          </div>
        )}
        <div className="mb-3 flex flex-wrap gap-2">
          {quickActions.map((action) => (
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
            placeholder={t('placeholder')}
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
        <p className="mt-2 text-center text-[11px] text-muted-foreground">{t('footer')}</p>
      </div>
    </div>
  );
}
