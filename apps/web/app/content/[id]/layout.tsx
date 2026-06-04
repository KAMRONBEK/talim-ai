'use client';

import { Suspense, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuthGuard } from '@/components/auth-guard';
import { ContentSidebar } from '@/components/layout/content-sidebar';
import { LearningTopbar } from '@/components/layout/learning-topbar';
import { useContent } from '@/hooks/useContent';
import { useSections } from '@/hooks/useSections';

function ContentLayoutInner({
  children,
  id,
}: {
  children: React.ReactNode;
  id: string;
}) {
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get('section');
  const { data: content } = useContent(id);
  const { data: sections = [] } = useSections(id);

  if (!content) {
    return <p className="p-8 text-muted-foreground">Loading...</p>;
  }

  const activeId = sectionParam ?? sections[0]?.id;

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <LearningTopbar contentId={id} title={content.title} />
      <div className="flex flex-1 overflow-hidden">
        <ContentSidebar
          contentId={id}
          contentTitle={content.title}
          sections={sections}
          activeSectionId={activeId}
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
