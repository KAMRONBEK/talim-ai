'use client';

import type { ReactNode } from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Loader2, FileText, BookOpen, Check } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@talim/ui';
import { cn } from '@talim/ui';
import type { ContentSection, QuestionStyle, SectionProgress } from '@talim/types';
import { ContentGenerationsBlock } from '@/components/layout/content-generations';

const SECTION_COMPLETE_THRESHOLD = 70;

/** Generation handlers wired in from the layout (where useContentActions lives). */
export interface SidebarGenerationProps {
  onSummary: () => void;
  onQuiz: (style?: QuestionStyle) => void;
  onQuickCheck: (style?: QuestionStyle) => void;
  summaryPending?: boolean;
  quizPending?: boolean;
  quickCheckPending?: boolean;
  quizCount?: number;
  canQuiz?: boolean;
  hideGenerateActions?: boolean;
}

export interface ContentSidebarBodyProps {
  contentId: string;
  contentTitle: string;
  sections: ContentSection[];
  activeSectionId?: string;
  sectionProgressMap?: Record<string, SectionProgress>;
  onNavigate?: () => void;
  /** When provided, the generations block renders below the section list. */
  generations?: SidebarGenerationProps;
}

export function ContentSidebarBody({
  contentId,
  contentTitle,
  sections,
  activeSectionId,
  sectionProgressMap = {},
  onNavigate,
  generations,
}: ContentSidebarBodyProps) {
  const t = useTranslations('sidebar');
  const pathname = usePathname();

  const navLink = (href: string, label: string, icon: ReactNode, busy = false) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        onClick={onNavigate}
        className={cn(
          'flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors',
          active
            ? 'bg-primary font-semibold text-primary-foreground'
            : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
        )}
      >
        <span className="shrink-0">{icon}</span>
        <span className="truncate">{label}</span>
        {busy && (
          <Loader2
            className={cn(
              'ml-auto h-3.5 w-3.5 shrink-0 animate-spin',
              active ? 'text-primary-foreground' : 'text-primary',
            )}
          />
        )}
      </Link>
    );
  };

  const sectionLink = (section: ContentSection) => {
    const progress = sectionProgressMap[section.id];
    const complete =
      progress != null && progress.coverageScore >= SECTION_COMPLETE_THRESHOLD;
    const active = activeSectionId === section.id;
    return (
      <Link
        key={section.id}
        href={`/content/${contentId}?section=${section.id}`}
        onClick={onNavigate}
        className={cn(
          'flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors',
          active
            ? 'bg-primary font-semibold text-primary-foreground'
            : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
        )}
      >
        <FileText className="h-4 w-4 shrink-0" />
        <span className="truncate">{section.title}</span>
        {complete && (
          <Check
            className={cn(
              'ml-auto h-4 w-4 shrink-0',
              active ? 'text-primary-foreground' : 'text-success',
            )}
          />
        )}
      </Link>
    );
  };

  // Group subsections (depth 1) under their parent chapter (depth 0). Legacy/flat
  // content is entirely depth 0 with parentId null, so every row is top-level and
  // renders as a flat list identical to before. `sections` already arrives in
  // reading order, so both the top-level list and each child group stay ordered.
  const sectionIds = new Set(sections.map((s) => s.id));
  const topLevelSections = sections.filter(
    (s) => s.parentId == null || !sectionIds.has(s.parentId),
  );
  const childrenByParent = new Map<string, ContentSection[]>();
  for (const s of sections) {
    if (s.parentId != null && sectionIds.has(s.parentId)) {
      const group = childrenByParent.get(s.parentId);
      if (group) group.push(s);
      else childrenByParent.set(s.parentId, [s]);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border/70 p-4">
        <h2 className="truncate font-display font-semibold">{contentTitle}</h2>
        <p className="text-xs text-muted-foreground">
          {t('sectionCount', { count: sections.length })}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="p-3">
        <p className="mb-2 px-3 font-label text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {t('sections')}
        </p>
        <div className="space-y-0.5">
          {topLevelSections.map((section) => {
            const children = childrenByParent.get(section.id);
            if (!children || children.length === 0) {
              return sectionLink(section);
            }
            return (
              <div key={section.id} className="space-y-0.5">
                {sectionLink(section)}
                <div className="ml-3 space-y-0.5 border-l border-border/70 pl-2">
                  {children.map((child) => sectionLink(child))}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mb-2 mt-6 px-3 font-label text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {t('actions')}
        </p>
        <div className="space-y-0.5">
          {navLink(`/content/${contentId}`, t('read'), <BookOpen className="h-4 w-4" />)}
        </div>
        </div>
        {generations && (
          <ContentGenerationsBlock
            contentId={contentId}
            onSummary={generations.onSummary}
            onQuiz={generations.onQuiz}
            onQuickCheck={generations.onQuickCheck}
            summaryPending={generations.summaryPending}
            quizPending={generations.quizPending}
            quickCheckPending={generations.quickCheckPending}
            quizCount={generations.quizCount}
            canQuiz={generations.canQuiz}
            hideGenerateActions={generations.hideGenerateActions}
            onAction={onNavigate}
          />
        )}
      </div>
    </div>
  );
}

interface ContentSidebarProps extends ContentSidebarBodyProps {}

export function ContentSidebar(props: ContentSidebarProps) {
  return (
    <aside className="hidden h-full w-64 shrink-0 flex-col overflow-hidden border-r border-border bg-card md:flex">
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
