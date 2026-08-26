'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, Bot } from 'lucide-react';
import { Button } from '@talim/ui';
import { ChatMessage } from './ChatMessage';
import { isAnswerStillExpected, useChatSession } from '@/hooks/useChat';
import { useChatStore } from '@/store/useChatStore';
import { useLimitErrorHandler } from '@/hooks/useLimitErrorHandler';

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
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hydratedSigRef = useRef<string | null>(null);
  const { data: sessionData, isLoading } = useChatSession(contentId);
  const { messages, isStreaming, streamMessage, hydrate, reset, seededPrompt, clearSeededPrompt } =
    useChatStore();
  const handleLimitError = useLimitErrorHandler();

  const placeholder = useMemo(() => {
    if (quickActions.length === 0) return t('placeholder');
    const index = Math.floor(Math.random() * quickActions.length);
    return quickActions[index] ?? t('placeholder');
  }, [contentId, locale, quickActions, t]);

  useEffect(() => {
    hydratedSigRef.current = null;
    reset();
  }, [contentId, locale, reset]);

  // Re-hydrate whenever the server's copy of the conversation actually changes, not just once
  // on mount. Hydrating once was why a reload mid-answer stayed broken forever: the refetch
  // landed, the query cache updated, and this component ignored it. It is also why the manim
  // recovery in useJobEvents (which invalidates ['chat-session']) never reached the screen.
  //
  // The signature includes the last message's text length because the manim render job patches
  // a message in place — same id, same count, new content.
  useEffect(() => {
    if (!sessionData || isLoading) return;
    // A stream in flight exists only in the store; hydrating over it would wipe the partial
    // answer the user is watching arrive.
    if (isStreaming) return;
    const next = sessionData.messages;
    // Never accept a response that is BEHIND what we already show. The poll below runs while a
    // question is unanswered, so a response issued mid-stream (user row written, assistant row
    // not yet) can land just after our own stream finished — hydrating that would delete the
    // answer the user just watched being written.
    if (next.length < messages.length) return;
    const last = next[next.length - 1];
    const sig = `${contentId}:${locale}:${next.length}:${last?.id ?? ''}:${last?.text.length ?? 0}`;
    if (hydratedSigRef.current === sig) return;
    hydratedSigRef.current = sig;
    hydrate(sessionData.sessionId, next);
  }, [sessionData, isLoading, isStreaming, messages.length, contentId, locale, hydrate]);

  useEffect(() => {
    if (inputSeed) {
      setInput(inputSeed);
      onInputSeedConsumed?.();
    }
  }, [inputSeed, onInputSeedConsumed]);

  // A text selection in the reader ("Ask AI about selection") queues a prompt on
  // the chat store. Prefill + focus the composer so the user can send/edit it —
  // consumed here whether the Chat tab was already open or just opened (this
  // window only mounts on the Chat tab).
  useEffect(() => {
    if (!seededPrompt) return;
    const text = seededPrompt;
    setInput(text);
    clearSeededPrompt();
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(text.length, text.length);
    });
  }, [seededPrompt, clearSeededPrompt]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Single send path shared by the composer and the suggestion chips, so both
  // go through the exact same streaming + limit-error handling.
  const sendMessage = async (raw: string) => {
    const message = raw.trim();
    if (!message || isStreaming || isLoading) return;
    setInput('');
    setError(null);
    try {
      await streamMessage(contentId, message, selectedExcerpt, selectedExcerptImage);
      onClearExcerpt?.();
    } catch (err) {
      // A daily tutor-message quota opens the promotion modal; other failures
      // show inline so the user isn't left with a silently dropped message.
      setError(handleLimitError(err, t('error')));
      // Nothing was sent — restore the composed text so the user can retry.
      setInput(message);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  const showGreeting = !isLoading && messages.length === 0;
  const hasExcerptSelection = Boolean(selectedExcerpt || selectedExcerptImage);

  // The conversation ends on the learner's own question with no stream running: the answer is
  // being written by a request this page no longer owns (it reloaded), or generation died.
  const awaitingAnswer =
    !isLoading && !isStreaming && messages[messages.length - 1]?.role === 'USER';

  // While awaiting, re-render on a slow tick so the "writing…" indicator can give way to a
  // failure notice once the answer window closes. Without it, a generation that died leaves a
  // typing indicator running forever — the same silent lie as showing nothing, just prettier.
  const [, setAwaitTick] = useState(0);
  useEffect(() => {
    if (!awaitingAnswer) return;
    const id = setInterval(() => setAwaitTick((n) => n + 1), 5000);
    return () => clearInterval(id);
  }, [awaitingAnswer]);

  const answerStillExpected =
    awaitingAnswer && isAnswerStillExpected(sessionData?.messages, Date.now());

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
      <div className="flex items-center gap-3 border-b border-border/70 px-4 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-brand text-primary-foreground">
          <Bot className="h-[18px] w-[18px]" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h2 className="font-display font-semibold leading-tight">{t('title')}</h2>
          <p className="truncate text-xs text-muted-foreground">{t('subtitle')}</p>
        </div>
        <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full bg-accent-secondary/10 px-2.5 py-1 text-[11px] font-semibold text-accent-secondary">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-secondary" aria-hidden="true" />
          RAG
        </span>
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
        {answerStillExpected && <ChatMessage role="ASSISTANT" text="" streaming />}
        {awaitingAnswer && !answerStillExpected && (
          <p role="status" className="text-sm text-muted-foreground">
            {t('noAnswer')}
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border/70 p-4">
        {quickActions.length > 0 && (
          <div
            role="group"
            aria-label={t('suggestionsLabel')}
            className="mb-2.5 flex flex-wrap gap-1.5"
          >
            {quickActions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                disabled={isStreaming || isLoading}
                onClick={() => void sendMessage(suggestion)}
                className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
        {hasExcerptSelection && (
          <div className="mb-2 flex items-start gap-2">
            <div className="min-w-0 flex-1 rounded-xl border border-border bg-secondary p-2">
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
        {error && <p className="mb-2 text-sm text-destructive">{error}</p>}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            disabled={isStreaming || isLoading}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button
            type="submit"
            disabled={isStreaming || isLoading || !input.trim()}
            className="shrink-0 self-end rounded-xl"
          >
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </form>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">{t('footer')}</p>
      </div>
    </div>
  );
}
