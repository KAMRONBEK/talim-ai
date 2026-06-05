'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { FileText, Presentation, Play, AlertCircle, Trash2 } from 'lucide-react';
import { Badge, Button } from '@talim/ui';
import { useLocale, useTranslations } from 'next-intl';
import type { AppLocale, Content, ContentType } from '@talim/types';
import { formatRelativeTime } from '@/lib/format-relative-time';
import { getYoutubeThumbnailUrl } from '@/lib/youtube';
import { cn } from '@talim/ui';
import { DeleteContentDialog } from '@/components/content/delete-content-dialog';

interface RecentContentGridProps {
  contents: Content[];
}

const typeStyles: Record<
  ContentType,
  { gradient: string; icon: typeof FileText }
> = {
  PDF: { gradient: 'from-warning-muted to-destructive/10', icon: FileText },
  YOUTUBE: { gradient: 'from-destructive/15 to-destructive/5', icon: Play },
  SLIDE: { gradient: 'from-info-muted to-accent', icon: Presentation },
};

function ContentThumbnail({ content }: { content: Content }) {
  const thumb = content.type === 'YOUTUBE' ? getYoutubeThumbnailUrl(content.url) : null;
  const style = typeStyles[content.type];
  const Icon = style.icon;

  if (thumb) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted">
        <Image
          src={thumb}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 280px"
          unoptimized
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
          <Play className="h-10 w-10 fill-white text-white" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex aspect-video w-full items-center justify-center rounded-xl bg-gradient-to-br',
        style.gradient,
      )}
    >
      <Icon className="h-12 w-12 text-muted-foreground/60" />
    </div>
  );
}

export function RecentContentGrid({ contents }: RecentContentGridProps) {
  const t = useTranslations('common');
  const locale = useLocale() as AppLocale;
  const [deleteTarget, setDeleteTarget] = useState<Content | null>(null);

  if (contents.length === 0) {
    return (
      <p className="text-center text-muted-foreground">{t('noMaterials')}</p>
    );
  }

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {contents.map((content) => (
          <article key={content.id} className="group relative transition-transform hover:scale-[1.02]">
            <div className="relative">
              <Link href={`/content/${content.id}`} className="block">
                <ContentThumbnail content={content} />
              </Link>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute right-2 top-2 z-10 h-8 w-8 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus:opacity-100"
                aria-label={`${content.title} ni o'chirish`}
                onClick={() => setDeleteTarget(content)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            <Link href={`/content/${content.id}`} className="mt-2 flex items-start gap-2">
              {content.status === 'FAILED' ? (
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
              ) : (
                <Play className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{content.title}</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(content.createdAt, locale)}
                  </p>
                  {content.status === 'FAILED' && (
                    <Badge
                      variant="outline"
                      className="h-5 border-destructive/50 px-1.5 text-[10px] text-destructive"
                    >
                      Xato
                    </Badge>
                  )}
                </div>
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
