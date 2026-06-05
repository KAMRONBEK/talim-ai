'use client';

import { Suspense, use, useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AuthGuard } from '@/components/auth-guard';
import { ContentSidebar } from '@/components/layout/content-sidebar';
import { LearningTopbar } from '@/components/layout/learning-topbar';
import { useContent } from '@/hooks/useContent';
import { useSections } from '@/hooks/useSections';
import { useContentProgress, useMarkSectionViewed } from '@/hooks/useProgress';

function ContentLayoutInner({
  children,
  id,
}: {
  children: React.ReactNode;
  id: string;
}) {
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

  const storedLastSectionId = progressData?.contentProgress?.lastSectionId;
  const validLastSectionId =
    storedLastSectionId && sections.some((s) => s.id === storedLastSectionId)
      ? storedLastSectionId
      : undefined;
  const activeId = sectionParam ?? validLastSectionId ?? sections[0]?.id;

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
    return <p className="p-8 text-muted-foreground">Loading...</p>;
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <LearningTopbar contentId={id} title={content.title} />
      <div className="flex flex-1 overflow-hidden">
        <ContentSidebar
          contentId={id}
          contentTitle={content.title}
          sections={sections}
          activeSectionId={activeId}
          sectionProgressMap={progressData?.sections}
        />
        <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
      </div>
    </div>
  );
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
      <Suspense fallback={<p className="p-8">Loading...</p>}>
        <ContentLayoutInner id={id}>{children}</ContentLayoutInner>
      </Suspense>
    </AuthGuard>
  );
}
