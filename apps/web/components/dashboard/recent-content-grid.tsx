'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { FileText, Presentation, Play, AlertCircle, Trash2, Loader2 } from 'lucide-react';
import { Badge, Button } from '@talim/ui';
import { useLocale, useTranslations } from 'next-intl';
import type { AppLocale, Content, ContentType } from '@talim/types';
import { formatRelativeTime } from '@/lib/format-relative-time';
import { getYoutubeThumbnailUrl } from '@/lib/youtube';
import { cn } from '@talim/ui';
import { DeleteContentDialog } from '@/components/content/delete-content-dialog';

interface RecentContentGridProps {
  contents: Content[];
  showDelete?: boolean;
}

const typeStyles: Record<
  ContentType,
  { gradient: string; icon: typeof FileText; iconClass: string; badgeClass: string; label: string }
> = {
  PDF: {
    gradient: 'from-muted to-muted/50',
    icon: FileText,
    iconClass: 'text-primary/40',
    badgeClass: 'text-primary',
    label: 'PDF',
  },
  YOUTUBE: {
    gradient: 'from-accent-secondary/15 to-accent-secondary/5',
    icon: Play,
    iconClass: 'text-accent-secondary/50',
    badgeClass: 'text-accent-secondary',
    label: 'Video',
  },
  SLIDE: {
    gradient: 'from-secondary to-secondary/50',
    icon: Presentation,
    iconClass: 'text-primary/40',
    badgeClass: 'text-primary',
    label: 'Slides',
  },
};

function TypeBadge({ type }: { type: ContentType }) {
  return (
    <span
      className={cn(
        'absolute left-2 top-2 rounded-md bg-card/95 px-1.5 py-0.5 font-label text-[10px] font-bold uppercase tracking-wide shadow-sm',
        typeStyles[type].badgeClass,
      )}
    >
      {typeStyles[type].label}
    </span>
  );
}

function ContentThumbnail({ content }: { content: Content }) {
  const thumb = content.type === 'YOUTUBE' ? getYoutubeThumbnailUrl(content.url) : null;
  const style = typeStyles[content.type];
  const Icon = style.icon;

  if (thumb) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-muted">
        <Image
          src={thumb}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 280px"
          unoptimized
        />
        <TypeBadge type={content.type} />
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
          <Play className="h-10 w-10 fill-white text-white" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative flex aspect-video w-full items-center justify-center rounded-2xl border border-border bg-gradient-to-br',
        style.gradient,
      )}
    >
      <TypeBadge type={content.type} />
      <Icon className={cn('h-11 w-11', style.iconClass)} />
    </div>
  );
}

export function RecentContentGrid({ contents, showDelete = true }: RecentContentGridProps) {
  const t = useTranslations('common');
  const tContent = useTranslations('content');
  const locale = useLocale() as AppLocale;
  const [deleteTarget, setDeleteTarget] = useState<Content | null>(null);

  if (contents.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-soft">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-2xl">📚</div>
        <p className="mt-4 text-muted-foreground">{t('noMaterials')}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {contents.map((content) => (
          <article key={content.id} className="hover-lift group relative">
            <div className="relative">
              <Link href={`/content/${content.id}`} aria-label={content.title} className="block">
                <ContentThumbnail content={content} />
              </Link>
              {(content.status === 'PENDING' || content.status === 'PROCESSING') && (
                <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl bg-background/70 backdrop-blur-sm">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-xs font-medium text-muted-foreground">
                    {tContent('processing')}
                  </span>
                </div>
              )}
              {showDelete && (
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute right-2 top-2 z-10 h-8 w-8 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus:opacity-100"
                  aria-label={tContent('deleteMaterialAria', { title: content.title })}
                  onClick={() => setDeleteTarget(content)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
            <Link href={`/content/${content.id}`} className="mt-3 block">
              <p className="truncate font-display text-sm font-semibold leading-snug text-foreground">
                {content.title}
              </p>
              <div className="mt-1 flex items-center gap-2">
                {content.status === 'FAILED' && (
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />
                )}
                <p className="text-xs text-muted-foreground">
                  {formatRelativeTime(content.createdAt, locale)}
                </p>
                {content.status === 'FAILED' && (
                  <Badge
                    variant="outline"
                    className="h-5 border-destructive/50 px-1.5 text-[10px] text-destructive"
                  >
                    {tContent('failedBadge')}
                  </Badge>
                )}
              </div>
            </Link>
          </article>
        ))}
      </div>

      <DeleteContentDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        content={deleteTarget ? { id: deleteTarget.id, title: deleteTarget.title } : null}
      />
    </>
  );
}
