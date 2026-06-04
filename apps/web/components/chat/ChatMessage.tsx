'use client';

import type { MessageRole } from '@talim/types';
import { cn } from '@talim/ui';

interface ChatMessageProps {
  role: MessageRole;
  text: string;
  streaming?: boolean;
  excerpt?: string;
}

export function ChatMessage({ role, text, streaming, excerpt }: ChatMessageProps) {
  const isUser = role === 'USER';
  return (
    <div className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm',
          isUser ? 'avatar-gradient' : 'bg-muted',
        )}
      >
        {isUser ? 'Siz' : '🎓'}
      </div>
      <div className={cn('max-w-[85%]', isUser && 'text-right')}>
        <div
          className={cn(
            'rounded-xl px-4 py-3 text-sm leading-relaxed',
            isUser ? 'bg-primary text-primary-foreground' : 'border bg-card',
          )}
        >
          {excerpt && isUser && (
            <div className="od-selected-quote mb-2 rounded-r-lg border-l-primary bg-primary-foreground/10 text-left text-primary-foreground">
              <div className="od-selected-quote-label text-primary-foreground/80">
                📖 Kitobdan tanlangan
              </div>
              {excerpt}
            </div>
          )}
          <p className="whitespace-pre-wrap">{text || (streaming ? '...' : '')}</p>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {isUser ? 'Siz' : "AI O'qituvchi"} · Hozir
        </p>
      </div>
    </div>
  );
}
