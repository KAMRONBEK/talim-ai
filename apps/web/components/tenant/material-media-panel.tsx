'use client';

import { useTranslations } from 'next-intl';
import { FileText, Loader2, Mic, Presentation, Video as VideoIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSavedSummary, useGenerateSummary } from '@/hooks/useQuiz';
import { usePodcast, useCreatePodcast } from '@/hooks/usePodcast';
import { useSlides, useGenerateSlides } from '@/hooks/useSlides';
import { useVideo, useGenerateVideo } from '@/hooks/useVideo';
import { useSections } from '@/hooks/useSections';

type TileState = 'loading' | 'empty' | 'generating' | 'ready' | 'failed';

const isRegen = (state: TileState) => state === 'ready' || state === 'failed';

/** One medium in the "Generate media" quad. Status comes from the existing content query;
 *  clicking fires that medium's existing generation mutation (generate / regenerate / retry). */
function MediaTile({
  icon: Icon,
  title,
  state,
  onAction,
}: {
  icon: LucideIcon;
  title: string;
  state: TileState;
  onAction: () => void;
}) {
  const t = useTranslations('tenant');
  const tc = useTranslations('content');

  const disabled = state === 'loading' || state === 'generating';
  const isReady = state === 'ready';
  const isFailed = state === 'failed';

  const verb =
    state === 'ready'
      ? t('material.regenerate')
      : state === 'failed'
        ? t('material.retry')
        : t('material.generate');

  const display =
    state === 'ready'
      ? tc('statusReady')
      : state === 'failed'
        ? tc('statusFailed')
        : state === 'generating'
          ? t('assessments.generating')
          : state === 'loading'
            ? '…'
            : t('material.generate');

  return (
    <button
      type="button"
      onClick={onAction}
      disabled={disabled}
      aria-label={`${title} — ${disabled ? display : verb}`}
      className={cn(
        'flex items-center gap-3 rounded-xl border p-3 text-left transition-colors disabled:cursor-default',
        isReady
          ? 'border-primary/40 bg-secondary'
          : isFailed
            ? 'border-destructive/40 bg-card hover:bg-secondary/50'
            : 'border-border bg-card hover:border-primary/30 hover:bg-secondary/50',
      )}
    >
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
          isReady ? 'bg-primary text-primary-foreground' : 'bg-secondary text-primary',
        )}
      >
        {disabled ? (
          <Loader2 className="h-[18px] w-[18px] animate-spin" />
        ) : (
          <Icon className="h-[18px] w-[18px]" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-foreground">{title}</span>
        <span
          className={cn(
            'block text-xs',
            isReady ? 'text-primary' : isFailed ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {display}
        </span>
      </span>
    </button>
  );
}

/**
 * Material detail LEFT column: a "Generate media" quad (Summary / Podcast / Slides / Video)
 * wired to the existing per-medium generation hooks, plus a numbered Sections list.
 * Read-only status + generation actions only — no new data flow.
 */
export function MaterialMediaPanel({ contentId }: { contentId: string }) {
  const t = useTranslations('tenant');
  const tc = useTranslations('content');

  const summary = useSavedSummary(contentId);
  const genSummary = useGenerateSummary();
  const podcast = usePodcast(contentId);
  const createPodcast = useCreatePodcast();
  const slides = useSlides(contentId);
  const genSlides = useGenerateSlides(contentId);
  const video = useVideo(contentId);
  const genVideo = useGenerateVideo(contentId);
  const { data: sections, isLoading: sectionsLoading } = useSections(contentId);

  const summaryState: TileState = genSummary.isPending
    ? 'generating'
    : genSummary.isError
      ? 'failed'
      : summary.isLoading
        ? 'loading'
        : summary.data
          ? 'ready'
          : 'empty';

  const pStatus = podcast.data?.status;
  const podcastState: TileState =
    createPodcast.isPending || pStatus === 'PENDING' || pStatus === 'GENERATING'
      ? 'generating'
      : pStatus === 'FAILED'
        ? 'failed'
        : podcast.isLoading
          ? 'loading'
          : pStatus === 'READY'
            ? 'ready'
            : 'empty';

  const slStatus = slides.data?.status;
  const slidesState: TileState =
    genSlides.isPending || slStatus === 'PENDING'
      ? 'generating'
      : slStatus === 'FAILED'
        ? 'failed'
        : slides.isLoading
          ? 'loading'
          : slStatus === 'READY'
            ? 'ready'
            : 'empty';

  const vStatus = video.data?.status;
  const videoState: TileState =
    genVideo.isPending || vStatus === 'PENDING' || vStatus === 'GENERATING'
      ? 'generating'
      : vStatus === 'FAILED'
        ? 'failed'
        : video.isLoading
          ? 'loading'
          : vStatus === 'READY'
            ? 'ready'
            : 'empty';

  const sectionCount = sections?.length ?? 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {t('material.generateMedia')}
      </div>
      <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
        <MediaTile
          icon={FileText}
          title={tc('summary')}
          state={summaryState}
          onAction={() => genSummary.mutate({ contentId })}
        />
        <MediaTile
          icon={Mic}
          title={tc('aiPodcast')}
          state={podcastState}
          onAction={() => createPodcast.mutate({ contentId, regenerate: isRegen(podcastState) })}
        />
        <MediaTile
          icon={Presentation}
          title={tc('slides')}
          state={slidesState}
          onAction={() => genSlides.mutate({ regenerate: isRegen(slidesState) })}
        />
        <MediaTile
          icon={VideoIcon}
          title={tc('aiVideo')}
          state={videoState}
          onAction={() => genVideo.mutate({ regenerate: isRegen(videoState) })}
        />
      </div>

      <div className="mt-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {tc('sectionsCount', { count: sectionCount })}
      </div>
      <div className="mt-3">
        {sectionsLoading ? (
          <p className="text-sm text-muted-foreground">{t('loading')}</p>
        ) : sectionCount === 0 ? (
          <p className="text-sm text-muted-foreground">{t('material.noSections')}</p>
        ) : (
          <ol className="space-y-1.5">
            {sections!.map((section, index) => (
              <li
                key={section.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5"
              >
                <span className="font-display text-sm font-semibold text-primary">{index + 1}</span>
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                  {section.title}
                </span>
                {section.readMinutes != null && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {t('material.readMin', { count: section.readMinutes })}
                  </span>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
