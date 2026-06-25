'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@talim/ui';
import { cn } from '@talim/ui';
import type { ContentSection, SectionProgress } from '@talim/types';
import { usePodcast } from '@/hooks/usePodcast';
import { useVideo } from '@/hooks/useVideo';

const SECTION_COMPLETE_THRESHOLD = 70;

export interface ContentSidebarBodyProps {
  contentId: string;
  contentTitle: string;
  sections: ContentSection[];
  activeSectionId?: string;
  sectionProgressMap?: Record<string, SectionProgress>;
  onNavigate?: () => void;
}

export function ContentSidebarBody({
  contentId,
  contentTitle,
  sections,
  activeSectionId,
  sectionProgressMap = {},
  onNavigate,
}: ContentSidebarBodyProps) {
  const t = useTranslations('sidebar');
  const tContent = useTranslations('content');
  const pathname = usePathname();
  const { data: podcast } = usePodcast(contentId);
  const { data: video } = useVideo(contentId);
  const podcastBusy = podcast?.status === 'GENERATING' || podcast?.status === 'PENDING';
  const videoBusy = video?.status === 'GENERATING' || video?.status === 'PENDING';

  const navLink = (href: string, label: string, icon: string, busy = false) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        onClick={onNavigate}
        className={cn(
          'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
          active
            ? 'bg-primary/10 font-semibold text-primary'
            : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
        )}
      >
        <span>{icon}</span>
        <span>{label}</span>
        {busy && <Loader2 className="ml-auto h-3.5 w-3.5 shrink-0 animate-spin text-primary" />}
      </Link>
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border/70 p-4">
        <h2 className="truncate font-display font-semibold">{contentTitle}</h2>
        <p className="text-xs text-muted-foreground">
          {t('sectionCount', { count: sections.length })}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('sections')}
        </p>
        <div className="space-y-0.5">
          {sections.map((section) => {
            const progress = sectionProgressMap[section.id];
            const complete =
              progress != null && progress.coverageScore >= SECTION_COMPLETE_THRESHOLD;
            return (
              <Link
                key={section.id}
                href={`/content/${contentId}?section=${section.id}`}
                onClick={onNavigate}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                  activeSectionId === section.id
                    ? 'bg-primary/10 font-semibold text-primary'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                )}
              >
                <span>📄</span>
                <span className="truncate">{section.title}</span>
                {complete && (
                  <span className="ml-auto text-xs text-success">✓</span>
                )}
              </Link>
            );
          })}
        </div>
        <p className="mb-2 mt-6 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('actions')}
        </p>
        <div className="space-y-0.5">
          {navLink(`/content/${contentId}`, t('read'), '📖')}
          {navLink(`/content/${contentId}?panel=chat`, tContent('askTutor'), '💬')}
          {navLink(`/content/${contentId}/podcast`, t('listenPodcast'), '🎧', podcastBusy)}
          {navLink(`/content/${contentId}/video`, t('watchVideo'), '🎬', videoBusy)}
        </div>
      </div>
    </div>
  );
}

interface ContentSidebarProps extends ContentSidebarBodyProps {}

export function ContentSidebar(props: ContentSidebarProps) {
  return (
    <aside className="hidden h-full w-64 shrink-0 flex-col overflow-hidden border-r bg-card md:flex">
      <ContentSidebarBody {...props} />
    </aside>
  );
}

interface ContentSidebarSheetProps extends ContentSidebarBodyProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContentSidebarSheet({
  open,
  onOpenChange,
  ...props
}: ContentSidebarSheetProps) {
  const t = useTranslations('common');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="flex h-dvh w-[min(100%,16rem)] flex-col overflow-hidden p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>{t('menu')}</SheetTitle>
        </SheetHeader>
        <ContentSidebarBody {...props} onNavigate={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  );
}
