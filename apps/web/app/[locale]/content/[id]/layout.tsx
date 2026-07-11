'use client';

import { Suspense, use, useEffect, useRef } from 'react';
import type { UserRole } from '@talim/types';
import { useSearchParams } from 'next/navigation';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useAutoGenerateOnLocaleChange } from '@/hooks/useLocaleContent';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@talim/ui';
import { AuthGuard } from '@/components/auth-guard';
import {
  ContentSidebar,
  ContentSidebarSheet,
  type SidebarGenerationProps,
} from '@/components/layout/content-sidebar';
import { LearningTopbar } from '@/components/layout/learning-topbar';
import { SummaryText } from '@/components/learning/summary-text';
import { useSidebarSheet } from '@/hooks/useSidebarSheet';
import { useContentActions } from '@/hooks/useContentActions';
import { useAuthStore } from '@/store/useAuthStore';
import { getHomePathForRole } from '@/lib/auth-routing';
import { useContent } from '@/hooks/useContent';
import { useSections } from '@/hooks/useSections';
import { useTranslations } from 'next-intl';
import { useContentProgress, useLearningHistory, useMarkSectionViewed } from '@/hooks/useProgress';

function ContentLayoutInner({
  children,
  id,
}: {
  children: React.ReactNode;
  id: string;
}) {
  const t = useTranslations('common');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get('section');
  const isReaderPage = pathname === `/content/${id}`;
  const role = useAuthStore((s) => s.user?.role);
  const { data: content, isError: contentError } = useContent(id);
  const { data: sections = [] } = useSections(id);
  const { data: progressData } = useContentProgress(id);
  const markViewed = useMarkSectionViewed(id);
  const prevActiveRef = useRef<string | undefined>(undefined);
  const { open: sidebarOpen, setOpen: setSidebarOpen } = useSidebarSheet();

  const storedLastSectionId = progressData?.contentProgress?.lastSectionId;
  const validLastSectionId =
    storedLastSectionId && sections.some((s) => s.id === storedLastSectionId)
      ? storedLastSectionId
      : undefined;
  const activeId = sectionParam ?? validLastSectionId ?? sections[0]?.id;

  useAutoGenerateOnLocaleChange(id, activeId);

  // The generations live in the left sidebar now, so the generation actions are owned here
  // in the layout (where the sidebar is mounted), not in the reader page.
  const tContent = useTranslations('content');
  const { data: history } = useLearningHistory(id);
  const isLearner = role === 'TENANT_LEARNER';
  const {
    handleSummary,
    generateSummary,
    summary,
    summaryOpen,
    setSummaryOpen,
    actionError,
    clearActionError,
  } = useContentActions(id, activeId);

  useEffect(() => {
    if (!isReaderPage) return;
    if (!content || content.status !== 'READY' || sections.length === 0) return;
    if (sectionParam) return;
    if (validLastSectionId && validLastSectionId !== sections[0]?.id) {
      router.replace(`/content/${id}?section=${validLastSectionId}`);
    }
  }, [isReaderPage, content, sections, sectionParam, validLastSectionId, id, router]);

  useEffect(() => {
    if (!isReaderPage) return;
    if (!activeId || content?.status !== 'READY') return;
    if (!sections.some((s) => s.id === activeId)) return;
    if (prevActiveRef.current === activeId) return;
    prevActiveRef.current = activeId;
    markViewed.mutate(activeId);
  }, [isReaderPage, activeId, content?.status, sections, markViewed]);

  // A failed content fetch (404) means the content is missing or the user has
  // no access — e.g. a learner opening a non-assigned id. Without this the
  // layout hangs forever on "Loading…" (content stays undefined), so bounce
  // them to their role home instead.
  if (contentError) {
    return <ContentAccessRedirect role={role} />;
  }

  if (!content) {
    return <p className="p-8 text-muted-foreground">{t('loading')}</p>;
  }

  const generations: SidebarGenerationProps = {
    onSummary: handleSummary,
    summaryPending: generateSummary.isPending,
    quizCount: history?.quizzes.length ?? 0,
    hideGenerateActions: isLearner,
  };

  const sidebarProps = {
    contentId: id,
    contentTitle: content.title,
    sections,
    activeSectionId: activeId,
    sectionProgressMap: progressData?.sections,
    generations,
  };

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden">
      {actionError && (
        <div className="absolute left-1/2 top-16 z-50 flex -translate-x-1/2 items-center gap-3 rounded-lg border border-destructive/40 bg-card px-4 py-2.5 text-sm shadow-lg">
          <span className="text-destructive">{actionError}</span>
          <button
            type="button"
            onClick={clearActionError}
            className="text-muted-foreground hover:text-foreground"
            aria-label={t('close')}
          >
            ✕
          </button>
        </div>
      )}
      <LearningTopbar
        contentId={id}
        title={content.title}
        onMenuClick={() => setSidebarOpen(true)}
      />
      <ContentSidebarSheet
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        {...sidebarProps}
      />
      <div className="flex flex-1 overflow-hidden">
        <ContentSidebar {...sidebarProps} />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      </div>
      <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tContent('summaryTitle')}</DialogTitle>
          </DialogHeader>
          <SummaryText text={summary ?? ''} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ContentAccessRedirect({ role }: { role?: UserRole }) {
  const t = useTranslations('common');
  const router = useRouter();
  useEffect(() => {
    router.replace(getHomePathForRole(role));
  }, [role, router]);
  return <p className="p-8 text-muted-foreground">{t('loading')}</p>;
}

function ContentLayoutSuspenseFallback() {
  const t = useTranslations('common');
  return <p className="p-8">{t('loading')}</p>;
}

export default function ContentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <AuthGuard>
      <Suspense fallback={<ContentLayoutSuspenseFallback />}>
        <ContentLayoutInner id={id}>{children}</ContentLayoutInner>
      </Suspense>
    </AuthGuard>
  );
}
