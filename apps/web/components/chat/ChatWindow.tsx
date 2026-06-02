'use client';

import { useEffect, useRef, useState } from 'react';
import { Button, Input } from '@talim/ui';
import { ChatMessage } from './ChatMessage';
import { useChatStore } from '@/store/useChatStore';

interface ChatWindowProps {
  contentId: string;
}

export function ChatWindow({ contentId }: ChatWindowProps) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const { messages, isStreaming, streamMessage, reset } = useChatStore();

  useEffect(() => {
    reset();
  }, [contentId, reset]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    const message = input.trim();
    setInput('');
    await streamMessage(contentId, message);
  };

  return (
    <div className="flex h-full flex-col rounded-lg border">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">
            Ask anything about this content...
          </p>
        )}
        {messages.map((msg) => (
          <ChatMessage key={msg.id} role={msg.role} text={msg.text} streaming={msg.streaming} />
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2 border-t p-4">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          disabled={isStreaming}
        />
        <Button type="submit" disabled={isStreaming || !input.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
}
