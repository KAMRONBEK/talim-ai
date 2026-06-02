'use client';

import type { MessageRole } from '@talim/types';
import { cn } from '@talim/ui';

interface ChatMessageProps {
  role: MessageRole;
  text: string;
  streaming?: boolean;
}

export function ChatMessage({ role, text, streaming }: ChatMessageProps) {
  const isUser = role === 'USER';
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-4 py-2 text-sm',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted',
        )}
      >
        <p className="whitespace-pre-wrap">{text || (streaming ? '...' : '')}</p>
      </div>
    </div>
  );
}
