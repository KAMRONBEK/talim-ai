'use client';

import { useTranslations } from 'next-intl';
import type { MessageRole } from '@talim/types';
import { cn } from '@talim/ui';
import { TutorMessageContent } from './TutorMessageContent';

interface ChatMessageProps {
  role: MessageRole;
  text: string;
  streaming?: boolean;
  excerpt?: string;
  excerptImage?: string;
}

export function ChatMessage({ role, text, streaming, excerpt, excerptImage }: ChatMessageProps) {
  const t = useTranslations('chat');
  const isUser = role === 'USER';
  const hasExcerpt = Boolean(excerpt || excerptImage);
  return (
    <div className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm',
          isUser ? 'avatar-gradient' : 'bg-muted',
        )}
      >
        {isUser ? t('you') : '🎓'}
      </div>
      <div className={cn('max-w-[85%]', isUser && 'text-right')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-sm leading-relaxed',
            isUser ? 'bg-primary text-primary-foreground shadow-soft' : 'border border-border/70 bg-card',
          )}
        >
          {hasExcerpt && isUser && (
            <div className="mb-2 text-left">
              {excerptImage && (
                <img
                  src={excerptImage}
                  alt=""
                  className="max-h-24 w-full rounded-md border border-primary-foreground/20 object-contain"
                />
              )}
              {excerpt && (
                <p className="mt-1 line-clamp-3 rounded-md bg-primary-foreground/10 px-2 py-1 text-[10px] italic text-primary-foreground/80">
                  {excerpt}
                </p>
              )}
            </div>
          )}
          {isUser ? (
            <p className="whitespace-pre-wrap">{text}</p>
          ) : (
            <TutorMessageContent
              content={text || (streaming ? t('streaming') : '')}
              streaming={streaming}
            />
          )}
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {isUser ? t('you') : t('tutor')} · {t('now')}
        </p>
      </div>
    </div>
  );
}
