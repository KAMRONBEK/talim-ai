'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Bell, Send } from 'lucide-react';
import type { AppLocale, TenantMessageReply, TenantMessageThread } from '@talim/types';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, cn } from '@talim/ui';
import { useAuthStore } from '@/store/useAuthStore';
import {
  useMarkTenantMessageRead,
  useRespondToReply,
  useTenantMessages,
  useTenantUnreadCount,
} from '@/hooks/useTenant';
import { formatRelativeTime } from '@/lib/format-relative-time';

/**
 * Tutor-only (TENANT_OWNER) messaging badge + inbox panel. Mounted in the shared dashboard
 * header alongside the learner bell, but self-gated so the two never collide: it renders
 * nothing (and its polling query stays disabled) for any non-owner. The badge counts unread
 * student replies; the list is fetched only while the panel is open, and expanding a thread
 * marks its replies read.
 */
export function TenantMessagesBell() {
  const t = useTranslations('tenant.messages');
  const locale = useLocale() as AppLocale;
  const role = useAuthStore((s) => s.user?.role);
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data: unread = 0 } = useTenantUnreadCount();
  const { data: threads, isLoading, isError } = useTenantMessages(open);
  const markRead = useMarkTenantMessageRead();

  if (role !== 'TENANT_OWNER') return null;

  function toggle(thread: TenantMessageThread) {
    setExpandedId((prev) => {
      const next = prev === thread.id ? null : thread.id;
      if (next === thread.id) {
        // Opening a thread marks its unread student replies read (never the tutor's own
        // in-thread responses — those carry no owner recipient row to mark).
        for (const r of thread.replies) {
          if (!r.fromTutor && r.readAt == null) markRead.mutate(r.id);
        }
      }
      return next;
    });
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
          ) : (threads?.length ?? 0) === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t('empty')}</p>
          ) : (
            <div className="max-h-[26rem] space-y-2 overflow-y-auto">
              {threads!.map((thread) => {
                const isExpanded = expandedId === thread.id;
                const hasUnread = thread.unreadReplyCount > 0;
                return (
                  <div
                    key={thread.id}
                    className={cn(
                      'rounded-xl border transition-colors',
                      hasUnread
                        ? 'border-accent-secondary/40 bg-accent-secondary/5'
                        : 'border-border/70 bg-card',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => toggle(thread)}
                      aria-expanded={isExpanded}
                      className="w-full rounded-xl p-3 text-left transition-colors hover:bg-secondary/40"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate font-label text-xs font-semibold text-muted-foreground">
                          {t('recipients', { count: thread.recipientCount })} ·{' '}
                          {t('readStat', { count: thread.readCount })}
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          {hasUnread && (
                            <span className="rounded-full bg-accent-secondary/15 px-2 py-0.5 font-label text-[0.6rem] font-semibold uppercase tracking-wide text-accent-secondary">
                              {thread.unreadReplyCount} {t('new')}
                            </span>
                          )}
                          <span className="font-label text-[0.65rem] tabular-nums text-muted-foreground">
                            {formatRelativeTime(thread.createdAt, locale)}
                          </span>
                        </span>
                      </div>
                      {!isExpanded && (
                        <p className="mt-1.5 line-clamp-2 whitespace-pre-wrap text-sm text-foreground">
                          {thread.body}
                        </p>
                      )}
                      <p className="mt-1 font-label text-[0.65rem] text-muted-foreground">
                        {t('replies', { count: thread.replyCount })}
                      </p>
                    </button>

                    {isExpanded && (
                      <div className="space-y-2 px-3 pb-3">
                        <div className="flex flex-col items-end">
                          <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-3 py-2 text-primary-foreground">
                            <p className="whitespace-pre-wrap text-sm">{thread.body}</p>
                          </div>
                          <span className="mt-0.5 px-1 font-label text-[0.6rem] tabular-nums text-muted-foreground">
                            {t('you')} · {formatRelativeTime(thread.createdAt, locale)}
                          </span>
                        </div>
                        {thread.replies.length === 0 ? (
                          <p className="py-2 text-center text-xs text-muted-foreground">
                            {t('noReplies')}
                          </p>
                        ) : (
                          thread.replies.map((r) =>
                            r.fromTutor ? (
                              <ResponseBubble
                                key={r.id}
                                reply={r}
                                locale={locale}
                                youLabel={t('you')}
                              />
                            ) : (
                              <StudentReplyRow
                                key={r.id}
                                reply={r}
                                locale={locale}
                                fallbackName={t('student')}
                              />
                            ),
                          )
                        )}
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

/** The tutor's own in-thread response, sided right like the root broadcast. */
function ResponseBubble({
  reply,
  locale,
  youLabel,
}: {
  reply: TenantMessageReply;
  locale: AppLocale;
  youLabel: string;
}) {
  return (
    <div className="flex flex-col items-end">
      <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-3 py-2 text-primary-foreground">
        <p className="whitespace-pre-wrap text-sm">{reply.body}</p>
      </div>
      <span className="mt-0.5 px-1 font-label text-[0.6rem] tabular-nums text-muted-foreground">
        {reply.senderName ?? youLabel} · {formatRelativeTime(reply.createdAt, locale)}
      </span>
    </div>
  );
}

/** A student's reply plus an inline box to respond to that specific student. */
function StudentReplyRow({
  reply,
  locale,
  fallbackName,
}: {
  reply: TenantMessageReply;
  locale: AppLocale;
  fallbackName: string;
}) {
  const t = useTranslations('tenant.messages');
  const [draft, setDraft] = useState('');
  const respond = useRespondToReply();

  function send() {
    const body = draft.trim();
    if (!body) return;
    respond.mutate({ id: reply.id, body }, { onSuccess: () => setDraft('') });
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-col items-start">
        <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-secondary px-3 py-2 text-secondary-foreground">
          <p className="whitespace-pre-wrap text-sm">{reply.body}</p>
        </div>
        <span className="mt-0.5 px-1 font-label text-[0.6rem] tabular-nums text-muted-foreground">
          {reply.senderName ?? fallbackName} · {formatRelativeTime(reply.createdAt, locale)}
        </span>
      </div>
      <div className="flex items-center gap-2 pl-1">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={t('respondPlaceholder')}
          maxLength={5000}
          className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-1.5 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <Button
          type="button"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={send}
          disabled={respond.isPending || !draft.trim()}
          aria-label={t('respond')}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      {respond.isError && (
        <p className="pl-1 text-xs text-destructive" role="alert">
          {t('respondError')}
        </p>
      )}
    </div>
  );
}
