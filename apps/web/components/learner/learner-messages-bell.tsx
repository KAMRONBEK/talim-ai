'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Bell } from 'lucide-react';
import type { AppLocale } from '@talim/types';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, cn } from '@talim/ui';
import { useAuthStore } from '@/store/useAuthStore';
import {
  useLearnerMessages,
  useLearnerUnreadCount,
  useMarkMessageRead,
} from '@/hooks/useTenant';
import { formatRelativeTime } from '@/lib/format-relative-time';

/**
 * Learner-only unread-message badge + panel. Lives in the shared dashboard header, so it
 * renders nothing (and its polling query stays disabled) for INDIVIDUAL/B2C users. The
 * list is fetched only while the panel is open; opening an unread message marks it read.
 */
export function LearnerMessagesBell() {
  const t = useTranslations('learner.messages');
  const locale = useLocale() as AppLocale;
  const role = useAuthStore((s) => s.user?.role);
  const [open, setOpen] = useState(false);
  const { data: unread = 0 } = useLearnerUnreadCount();
  const { data: messages, isLoading, isError } = useLearnerMessages(open);
  const markRead = useMarkMessageRead();

  if (role !== 'TENANT_LEARNER') return null;

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
                return (
                  <button
                    key={message.id}
                    type="button"
                    onClick={() => {
                      if (isUnread) markRead.mutate(message.id);
                    }}
                    className={cn(
                      'w-full rounded-xl border p-3 text-left transition-colors',
                      isUnread
                        ? 'border-accent-secondary/40 bg-accent-secondary/5 hover:bg-accent-secondary/10'
                        : 'border-border/70 bg-card hover:bg-secondary/40',
                    )}
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
                    <p className="mt-1.5 whitespace-pre-wrap text-sm text-foreground">
                      {message.body}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
