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
            'rounded-xl px-4 py-3 text-sm leading-relaxed',
            isUser ? 'bg-primary text-primary-foreground' : 'border bg-card',
          )}
        >
          {hasExcerpt && isUser && (
            <div className="od-selected-quote mb-2 rounded-r-lg border-l-primary bg-primary-foreground/10 text-left text-primary-foreground">
              <div className="od-selected-quote-label text-primary-foreground/80">
                📖 {excerptImage ? t('selectedArea') : t('selectedFromBook')}
              </div>
              {excerptImage && (
                <img
                  src={excerptImage}
                  alt=""
                  className="mb-2 max-h-40 w-full rounded-md border border-primary-foreground/20 object-contain"
                />
              )}
              {excerpt && <p className="whitespace-pre-wrap">{excerpt}</p>}
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
