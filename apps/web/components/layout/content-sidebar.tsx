'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@talim/ui';
import type { ContentSection } from '@talim/types';

interface ContentSidebarProps {
  contentId: string;
  contentTitle: string;
  sections: ContentSection[];
  activeSectionId?: string;
}

export function ContentSidebar({
  contentId,
  contentTitle,
  sections,
  activeSectionId,
}: ContentSidebarProps) {
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
          {sections.length} bob
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Boblar
        </p>
        <div className="space-y-0.5">
          {sections.map((section, i) => (
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
              {i < 2 && (
                <span className="ml-auto text-xs text-emerald-600">✓</span>
              )}
            </Link>
          ))}
        </div>
        <p className="mb-2 mt-6 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Harakatlar
        </p>
        <div className="space-y-0.5">
          {navLink(`/content/${contentId}`, "O'qish", '📖')}
          {navLink(`/content/${contentId}/chat`, "AI o'qituvchidan so'rang", '💬')}
          {navLink(`/content/${contentId}/podcast`, 'Podkastni tinglang', '🎧')}
        </div>
      </div>
    </aside>
  );
}
