'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FileText, Presentation, Play, AlertCircle } from 'lucide-react';
import { Badge } from '@talim/ui';
import type { Content, ContentType } from '@talim/types';
import { formatRelativeTime } from '@/lib/format-relative-time';
import { getYoutubeThumbnailUrl } from '@/lib/youtube';
import { cn } from '@talim/ui';

interface RecentContentGridProps {
  contents: Content[];
}

const typeStyles: Record<
  ContentType,
  { gradient: string; icon: typeof FileText }
> = {
  PDF: { gradient: 'from-rose-100 to-orange-100', icon: FileText },
  YOUTUBE: { gradient: 'from-red-100 to-rose-200', icon: Play },
  SLIDE: { gradient: 'from-violet-100 to-indigo-100', icon: Presentation },
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
      <Icon className="h-12 w-12 text-foreground/40" />
    </div>
  );
}

export function RecentContentGrid({ contents }: RecentContentGridProps) {
  if (contents.length === 0) {
    return (
      <p className="text-center text-muted-foreground">
        Hali material yo&apos;q. Yuqoridagi kartochkalar orqali birinchi materialingizni qo&apos;shing.
      </p>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {contents.map((content) => (
        <Link
          key={content.id}
          href={`/content/${content.id}`}
          className="group block transition-transform hover:scale-[1.02]"
        >
          <ContentThumbnail content={content} />
          <div className="mt-2 flex items-start gap-2">
            {content.status === 'FAILED' ? (
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
            ) : (
              <Play className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{content.title}</p>
              <div className="mt-0.5 flex items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  {formatRelativeTime(content.createdAt)}
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
          </div>
        </Link>
      ))}
    </div>
  );
}
