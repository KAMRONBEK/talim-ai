'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@talim/ui';
import type { ContentSection, SectionProgress } from '@talim/types';

const SECTION_COMPLETE_THRESHOLD = 70;

interface ContentSidebarProps {
  contentId: string;
  contentTitle: string;
  sections: ContentSection[];
  activeSectionId?: string;
  sectionProgressMap?: Record<string, SectionProgress>;
}

export function ContentSidebar({
  contentId,
  contentTitle,
  sections,
  activeSectionId,
  sectionProgressMap = {},
}: ContentSidebarProps) {
  const t = useTranslations('sidebar');
  const tContent = useTranslations('content');
  const pathname = usePathname();

  const navLink = (href: string, label: string, icon: string) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        className={cn(
          'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
          active ? 'bg-accent font-medium text-accent-foreground' : 'text-muted-foreground hover:bg-secondary',
        )}
      >
        <span>{icon}</span>
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r bg-card">
      <div className="border-b p-4">
        <h2 className="truncate font-semibold">{contentTitle}</h2>
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
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                  activeSectionId === section.id
                    ? 'bg-accent font-medium text-accent-foreground'
                    : 'text-muted-foreground hover:bg-secondary',
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
          {navLink(`/content/${contentId}/chat`, tContent('askTutor'), '💬')}
          {navLink(`/content/${contentId}/podcast`, t('listenPodcast'), '🎧')}
        </div>
      </div>
    </aside>
  );
}
