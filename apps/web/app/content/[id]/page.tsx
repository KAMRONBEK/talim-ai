'use client';

import { use, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Button,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@talim/ui';
import { useContent } from '@/hooks/useContent';
import { useSections, useSection } from '@/hooks/useSections';
import { useCreateQuiz, useGenerateSummary } from '@/hooks/useQuiz';
import { ContentRightPanel } from '@/components/layout/content-right-panel';
import { useState } from 'react';

function ContentDetailInner({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sectionId = searchParams.get('section') ?? undefined;
  const { data: content } = useContent(id);
  const { data: sections = [] } = useSections(id);
  const activeSectionId = sectionId ?? sections[0]?.id;
  const activeIndex = sections.findIndex((s) => s.id === activeSectionId);
  const { data: sectionData, isLoading: sectionLoading } = useSection(id, activeSectionId);
  const createQuiz = useCreateQuiz();
  const generateSummary = useGenerateSummary();
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const handleCreateQuiz = async () => {
    const quiz = await createQuiz.mutateAsync(id);
    router.push(`/quiz/${quiz.id}`);
  };

  const handleSummary = async () => {
    const text = await generateSummary.mutateAsync(id);
    setSummary(text);
    setSummaryOpen(true);
  };

  if (!content) {
    return <p className="p-8 text-muted-foreground">Yuklanmoqda...</p>;
  }

  if (content.status !== 'READY') {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="max-w-md rounded-xl border bg-card p-8 text-center">
          <h2 className="text-lg font-semibold">Material qayta ishlanmoqda</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Holat: {content.status}. Tayyor bo&apos;lganda sahifani yangilang.
          </p>
        </div>
      </div>
    );
  }

  const sectionTitle = sectionData?.section.title ?? content.title;
  const chapterLabel = activeIndex >= 0 ? `${activeIndex + 1}-bob` : '';

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-6 py-8 md:px-12">
          <nav className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Link href="/dashboard" className="hover:text-foreground">
              Bosh sahifa
            </Link>
            <span>/</span>
            <span className="text-foreground">{content.title}</span>
            {chapterLabel && (
              <>
                <span>/</span>
                <span className="text-foreground">{chapterLabel}</span>
              </>
            )}
          </nav>

          <h1 className="text-3xl font-bold tracking-tight">{sectionTitle}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {chapterLabel && <Badge variant="secondary">{chapterLabel}</Badge>}
            {sectionData?.section.readMinutes != null && (
              <span>{sectionData.section.readMinutes} daqiqa o&apos;qish</span>
            )}
          </div>

          <div className="mt-8 max-w-3xl">
            {sectionLoading ? (
              <p className="text-muted-foreground">Bob yuklanmoqda...</p>
            ) : (
              <article className="prose prose-sm max-w-none whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">
                {sectionData?.body ?? "Yon paneldan bob tanlang."}
              </article>
            )}

            {summary && (
              <div className="od-info-box mt-8">
                <div className="od-info-box-title">💡 Asosiy tushuncha</div>
                <p className="whitespace-pre-wrap">{summary}</p>
              </div>
            )}
          </div>

          <div className="mt-10 flex flex-wrap gap-2.5 border-t pt-8">
            <Button onClick={handleCreateQuiz} disabled={createQuiz.isPending}>
              ❓ {createQuiz.isPending ? 'Yaratilmoqda...' : 'Test ishlang'}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/content/${id}/podcast`)}
            >
              🎧 Tinglang
            </Button>
            <Button variant="outline" onClick={() => router.push(`/content/${id}/chat`)}>
              💬 AI o&apos;qituvchidan so&apos;rang
            </Button>
            <Button variant="outline" disabled title="Tez orada">
              🔖 Saqlash
            </Button>
          </div>
        </div>
      </div>

      <ContentRightPanel
        contentId={id}
        onSummary={handleSummary}
        onQuiz={handleCreateQuiz}
        summaryPending={generateSummary.isPending}
        quizPending={createQuiz.isPending}
      />

      <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xulosa</DialogTitle>
          </DialogHeader>
          <p className="whitespace-pre-wrap text-sm">{summary}</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ContentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={<p className="p-8">Yuklanmoqda...</p>}>
      <ContentDetailInner id={id} />
    </Suspense>
  );
}
