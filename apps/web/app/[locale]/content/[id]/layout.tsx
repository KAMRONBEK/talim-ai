'use client';

import { Suspense, use, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useAutoGenerateOnLocaleChange } from '@/hooks/useLocaleContent';
import { AuthGuard } from '@/components/auth-guard';
import { ContentSidebar, ContentSidebarSheet } from '@/components/layout/content-sidebar';
import { LearningTopbar } from '@/components/layout/learning-topbar';
import { useSidebarSheet } from '@/hooks/useSidebarSheet';
import { useContent } from '@/hooks/useContent';
import { useSections } from '@/hooks/useSections';
import { useTranslations } from 'next-intl';
import { useContentProgress, useMarkSectionViewed } from '@/hooks/useProgress';

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
  const { data: content } = useContent(id);
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

  if (!content) {
    return <p className="p-8 text-muted-foreground">{t('loading')}</p>;
  }

  const sidebarProps = {
    contentId: id,
    contentTitle: content.title,
    sections,
    activeSectionId: activeId,
    sectionProgressMap: progressData?.sections,
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
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
    </div>
  );
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
