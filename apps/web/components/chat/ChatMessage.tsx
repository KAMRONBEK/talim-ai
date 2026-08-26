'use client';

import { useTranslations } from 'next-intl';
import type { MessageRole } from '@talim/types';
import { cn } from '@talim/ui';
import { TutorMessageContent } from './TutorMessageContent';
import { describeMessageAge, formatExactTime } from '@/lib/relative-time';

interface ChatMessageProps {
  role: MessageRole;
  text: string;
  streaming?: boolean;
  excerpt?: string;
  excerptImage?: string;
  /** Omitted for a bubble created locally moments ago, where "now" is the truthful label. */
  createdAt?: string;
}

export function ChatMessage({
  role,
  text,
  streaming,
  excerpt,
  excerptImage,
  createdAt,
}: ChatMessageProps) {
  const t = useTranslations('chat');
  // Every message used to be stamped "now" — a constant string, not a rounded-down
  // computation — so a conversation from last week claimed to have just happened.
  const age = describeMessageAge(createdAt);
  const when =
    !age || age.unit === 'now'
      ? t('now')
      : age.unit === 'date'
        ? age.text
        : t(`time${age.unit === 'minutes' ? 'Minutes' : age.unit === 'hours' ? 'Hours' : 'Days'}`, {
            count: age.value,
          });
  const isUser = role === 'USER';
  const hasExcerpt = Boolean(excerpt || excerptImage);
  return (
    <div className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm',
          isUser ? 'avatar-gradient' : 'bg-secondary text-primary',
        )}
      >
        {isUser ? t('you') : '🎓'}
      </div>
      <div className={cn('max-w-[85%]', isUser && 'text-right')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-sm leading-relaxed',
            isUser
              ? 'rounded-br-sm bg-primary text-primary-foreground shadow-soft'
              : 'rounded-bl-sm border border-border bg-background',
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
          {isUser ? t('you') : t('tutor')}
          {/* No timestamp for things that were never sent — the canned greeting and the
              placeholder shown while an answer is still on its way. Stamping those "now"
              on every render is the same untruth this fixed for real messages. */}
          {createdAt && (
            <>
              {' · '}
              <time dateTime={createdAt} title={formatExactTime(createdAt)}>
                {when}
              </time>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
