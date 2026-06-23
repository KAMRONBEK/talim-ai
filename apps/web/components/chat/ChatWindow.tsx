'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@talim/ui';
import { ChatMessage } from './ChatMessage';
import { useChatSession } from '@/hooks/useChat';
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
  const tCommon = useTranslations('common');
  const quickActions = t.raw('quickActions') as string[];
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const hydratedKeyRef = useRef<string | null>(null);
  const { data: sessionData, isLoading } = useChatSession(contentId);
  const { messages, isStreaming, streamMessage, hydrate, reset } = useChatStore();

  const placeholder = useMemo(() => {
    if (quickActions.length === 0) return t('placeholder');
    const index = Math.floor(Math.random() * quickActions.length);
    return quickActions[index] ?? t('placeholder');
  }, [contentId, locale, quickActions, t]);

  useEffect(() => {
    hydratedKeyRef.current = null;
    reset();
  }, [contentId, locale, reset]);

  useEffect(() => {
    if (!sessionData || isLoading) return;
    const key = `${contentId}:${locale}`;
    if (hydratedKeyRef.current === key) return;
    hydratedKeyRef.current = key;
    hydrate(sessionData.sessionId, sessionData.messages);
  }, [sessionData, isLoading, contentId, locale, hydrate]);

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
    await streamMessage(contentId, message, selectedExcerpt, selectedExcerptImage);
    onClearExcerpt?.();
  };

  const showGreeting = !isLoading && messages.length === 0;
  const hasExcerptSelection = Boolean(selectedExcerpt || selectedExcerptImage);

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
      <div className="border-b border-border/70 px-4 py-3">
        <h2 className="font-display font-semibold">{t('title')}</h2>
        <p className="text-xs text-muted-foreground">{t('subtitle')}</p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {isLoading && (
          <p className="text-sm text-muted-foreground">{tCommon('loading')}</p>
        )}
        {showGreeting && (
          <ChatMessage
            role="ASSISTANT"
            text={t('greeting', { title: contentTitle ?? t('defaultTitle') })}
          />
        )}
        {!isLoading &&
          messages.map((msg) => (
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

      <div className="border-t border-border/70 p-4">
        {hasExcerptSelection && (
          <div className="mb-2 flex items-start gap-2">
            <div className="min-w-0 flex-1 rounded-md border border-primary/20 bg-accent/30 p-1.5">
              {selectedExcerptImage && (
                <img
                  src={selectedExcerptImage}
                  alt=""
                  className="max-h-24 w-full rounded object-contain"
                />
              )}
              {selectedExcerpt && (
                <p className="line-clamp-3 px-1 text-[10px] italic text-muted-foreground">
                  {selectedExcerpt}
                </p>
              )}
            </div>
            {onClearExcerpt && (
              <Button type="button" size="sm" variant="ghost" onClick={onClearExcerpt} className="shrink-0">
                {t('clear')}
              </Button>
            )}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            disabled={isStreaming || isLoading}
            rows={1}
            className="flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button type="submit" disabled={isStreaming || isLoading || !input.trim()} className="shrink-0">
            ↑
          </Button>
        </form>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">{t('footer')}</p>
      </div>
    </div>
  );
}
