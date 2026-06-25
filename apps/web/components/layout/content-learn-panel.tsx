'use client';

import { useTranslations } from 'next-intl';
import { cn, Sheet, SheetContent, SheetHeader, SheetTitle } from '@talim/ui';
import { ChatWindow } from '@/components/chat/ChatWindow';
import {
  ContentRightPanelBody,
  type ContentRightPanelBodyProps,
} from '@/components/layout/content-right-panel';

export type LearnTab = 'learn' | 'chat';

export interface ContentLearnPanelProps {
  /** Props for the Learn tab (generate cards + progress + history + streak). */
  panelProps: ContentRightPanelBodyProps;
  contentTitle: string;
  activeTab: LearnTab;
  onTabChange: (tab: LearnTab) => void;
  // Chat tab state (lifted to the workspace so a stage selection seeds the tutor).
  selectedExcerpt?: string;
  selectedExcerptImage?: string;
  onClearExcerpt?: () => void;
  inputSeed?: string | null;
  onInputSeedConsumed?: () => void;
  /** Extra content rendered at the bottom of the Learn tab (e.g. tutor assign panel). */
  learnFooter?: React.ReactNode;
  /** Mobile sheet: called after a Learn-tab action so the drawer can close. */
  onAction?: () => void;
}

export function ContentLearnPanelBody({
  panelProps,
  contentTitle,
  activeTab,
  onTabChange,
  selectedExcerpt,
  selectedExcerptImage,
  onClearExcerpt,
  inputSeed,
  onInputSeedConsumed,
  learnFooter,
  onAction,
}: ContentLearnPanelProps) {
  const t = useTranslations('learnHub');
  const tabs: { id: LearnTab; label: string }[] = [
    { id: 'learn', label: t('learn') },
    { id: 'chat', label: t('chat') },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-card">
      <div className="flex shrink-0 border-b border-border/70" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex-1 border-b-2 py-3 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {activeTab === 'learn' ? (
          <div className="h-full overflow-y-auto">
            <ContentRightPanelBody {...panelProps} onAction={onAction} />
            {learnFooter && <div className="border-t border-border/70 p-4">{learnFooter}</div>}
          </div>
        ) : (
          <div className="flex h-full min-h-0 flex-col p-2 md:p-3">
            <ChatWindow
              contentId={panelProps.contentId}
              contentTitle={contentTitle}
              selectedExcerpt={selectedExcerpt}
              selectedExcerptImage={selectedExcerptImage}
              onClearExcerpt={onClearExcerpt}
              inputSeed={inputSeed}
              onInputSeedConsumed={onInputSeedConsumed}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/** Desktop right pane of the workspace (placed inside ResizableSplit). */
export function ContentLearnPanel(props: ContentLearnPanelProps) {
  return (
    <aside className="flex h-full min-h-0 w-full flex-col overflow-hidden border-l border-border/70 bg-card">
      <ContentLearnPanelBody {...props} />
    </aside>
  );
}

interface ContentLearnPanelSheetProps extends ContentLearnPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Mobile drawer variant of the Learn panel. */
export function ContentLearnPanelSheet({
  open,
  onOpenChange,
  ...props
}: ContentLearnPanelSheetProps) {
  const t = useTranslations('learnHub');
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full max-w-sm flex-col p-0">
        <SheetHeader className="border-b border-border/70 p-4">
          <SheetTitle>{t('learn')}</SheetTitle>
        </SheetHeader>
        <ContentLearnPanelBody {...props} onAction={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  );
}
