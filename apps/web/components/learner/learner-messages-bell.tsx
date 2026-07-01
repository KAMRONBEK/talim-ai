'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Bell, Send } from 'lucide-react';
import type { AppLocale, LearnerThreadMessage } from '@talim/types';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, cn } from '@talim/ui';
import { useAuthStore } from '@/store/useAuthStore';
import {
  useLearnerMessages,
  useLearnerUnreadCount,
  useMarkMessageRead,
  useReplyToLearnerMessage,
} from '@/hooks/useTenant';
import { formatRelativeTime } from '@/lib/format-relative-time';

/**
 * Learner-only two-way messaging badge + panel. Lives in the shared dashboard header, so it
 * renders nothing (and its polling query stays disabled) for INDIVIDUAL/B2C users. The list
 * is fetched only while the panel is open; opening a message marks it read, and each message
 * expands into its full thread (tutor + own replies) with a reply box.
 */
export function LearnerMessagesBell() {
  const t = useTranslations('learner.messages');
  const locale = useLocale() as AppLocale;
  const role = useAuthStore((s) => s.user?.role);
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const { data: unread = 0 } = useLearnerUnreadCount();
  const { data: messages, isLoading, isError } = useLearnerMessages(open);
  const markRead = useMarkMessageRead();
  const reply = useReplyToLearnerMessage();

  if (role !== 'TENANT_LEARNER') return null;

  const textareaClass =
    'w-full rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

  function toggle(id: string, isUnread: boolean) {
    setExpandedId((prev) => {
      const next = prev === id ? null : id;
      if (next === id) {
        setDraft('');
        reply.reset();
        if (isUnread) markRead.mutate(id);
      }
      return next;
    });
  }

  function handleSend(id: string) {
    const body = draft.trim();
    if (!body) return;
    reply.mutate({ id, body }, { onSuccess: () => setDraft('') });
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen(true)}
        aria-label={t('open', { count: unread })}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-secondary px-1 font-label text-[0.6rem] font-bold tabular-nums text-accent-secondary-foreground">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('title')}</DialogTitle>
          </DialogHeader>
          {isError ? (
            <p className="py-6 text-center text-sm text-destructive">{t('error')}</p>
          ) : isLoading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{t('loading')}</p>
          ) : (messages?.length ?? 0) === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t('empty')}</p>
          ) : (
            <div className="max-h-[26rem] space-y-2 overflow-y-auto">
              {messages!.map((message) => {
                const isUnread = message.readAt == null;
                const isExpanded = expandedId === message.id;
                return (
                  <div
                    key={message.id}
                    className={cn(
                      'rounded-xl border transition-colors',
                      isUnread
                        ? 'border-accent-secondary/40 bg-accent-secondary/5'
                        : 'border-border/70 bg-card',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => toggle(message.id, isUnread)}
                      aria-expanded={isExpanded}
                      className="w-full rounded-xl p-3 text-left transition-colors hover:bg-secondary/40"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate font-label text-xs font-semibold text-muted-foreground">
                          {message.senderName ?? t('fromTutor')}
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          {isUnread && (
                            <span className="rounded-full bg-accent-secondary/15 px-2 py-0.5 font-label text-[0.6rem] font-semibold uppercase tracking-wide text-accent-secondary">
                              {t('new')}
                            </span>
                          )}
                          <span className="font-label text-[0.65rem] tabular-nums text-muted-foreground">
                            {formatRelativeTime(message.createdAt, locale)}
                          </span>
                        </span>
                      </div>
                      {!isExpanded && (
                        <p className="mt-1.5 line-clamp-2 whitespace-pre-wrap text-sm text-foreground">
                          {message.body}
                        </p>
                      )}
                    </button>

                    {isExpanded && (
                      <div className="space-y-3 px-3 pb-3">
                        <div className="space-y-2">
                          {message.thread.map((entry) => (
                            <ThreadBubble
                              key={entry.id}
                              entry={entry}
                              locale={locale}
                              youLabel={t('you')}
                              tutorLabel={t('fromTutor')}
                            />
                          ))}
                        </div>
                        <div className="space-y-2">
                          <textarea
                            rows={2}
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            placeholder={t('reply')}
                            className={textareaClass}
                            maxLength={5000}
                          />
                          {reply.isError && (
                            <p className="text-sm text-destructive" role="alert">
                              {t('replyError')}
                            </p>
                          )}
                          <div className="flex justify-end">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleSend(message.id)}
                              disabled={reply.isPending || !draft.trim()}
                            >
                              <Send className="h-4 w-4" />
                              {reply.isPending ? t('sending') : t('send')}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function ThreadBubble({
  entry,
  locale,
  youLabel,
  tutorLabel,
}: {
  entry: LearnerThreadMessage;
  locale: AppLocale;
  youLabel: string;
  tutorLabel: string;
}) {
  const label = entry.senderName ?? (entry.fromTutor ? tutorLabel : youLabel);
  return (
    <div className={cn('flex flex-col', entry.fromTutor ? 'items-start' : 'items-end')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3 py-2',
          entry.fromTutor
            ? 'rounded-tl-sm bg-secondary text-secondary-foreground'
            : 'rounded-tr-sm bg-primary text-primary-foreground',
        )}
      >
        <p className="whitespace-pre-wrap text-sm">{entry.body}</p>
      </div>
      <span className="mt-0.5 px-1 font-label text-[0.6rem] tabular-nums text-muted-foreground">
        {label} · {formatRelativeTime(entry.createdAt, locale)}
      </span>
    </div>
  );
}
