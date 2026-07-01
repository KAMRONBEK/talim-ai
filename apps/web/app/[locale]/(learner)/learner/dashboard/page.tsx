'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  AlertCircle,
  BookOpen,
  FileText,
  Flame,
  Gamepad2,
  Loader2,
  Play,
  Presentation,
  Target,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useContents } from '@/hooks/useContent';
import { useLearnerMaterials, useLearnerSummary } from '@/hooks/useTenant';
import { useLearnerAssessments } from '@/hooks/useAssessments';
import { Link } from '@/i18n/navigation';
import { Button, Progress, cn } from '@talim/ui';
import type { AppLocale, Content, ContentType, LearnerMaterial } from '@talim/types';
import { formatRelativeTime } from '@/lib/format-relative-time';
import { StudentWelcomeBanner } from '@/components/learner/student-welcome-banner';

type CardStatus = 'processing' | 'failed' | 'completed' | 'continue' | 'notStarted';

const typeStyles: Record<
  ContentType,
  { gradient: string; icon: typeof FileText; iconClass: string; badgeClass: string; label: string }
> = {
  PDF: {
    gradient: 'from-muted to-muted/50',
    icon: FileText,
    iconClass: 'text-primary/40',
    badgeClass: 'text-primary',
    label: 'PDF',
  },
  YOUTUBE: {
    gradient: 'from-accent-secondary/15 to-accent-secondary/5',
    icon: Play,
    iconClass: 'text-accent-secondary/50',
    badgeClass: 'text-accent-secondary',
    label: 'Video',
  },
  SLIDE: {
    gradient: 'from-secondary to-secondary/50',
    icon: Presentation,
    iconClass: 'text-primary/40',
    badgeClass: 'text-primary',
    label: 'Slides',
  },
};

function AssignedMaterialCard({
  content,
  status,
  coverage,
}: {
  content: Content;
  status: CardStatus;
  coverage: number;
}) {
  const t = useTranslations('learner');
  const style = typeStyles[content.type];
  const Icon = style.icon;

  // Materials that are ready carry a real per-material % + progress bar; still-
  // processing / failed items instead show a spinner or error line (no bar).
  const showBar = status === 'notStarted' || status === 'continue' || status === 'completed';
  const barValue = status === 'completed' ? 100 : status === 'notStarted' ? 0 : coverage;

  const statusLabel =
    status === 'processing'
      ? t('cardStatusProcessing')
      : status === 'failed'
        ? t('cardStatusFailed')
        : status === 'completed'
          ? `${t('cardStatusCompleted')} ✓`
          : status === 'continue'
            ? t('cardStatusContinuePercent', { percent: coverage })
            : t('cardStatusNotStarted');

  return (
    <Link
      href={`/content/${content.id}`}
      aria-label={content.title}
      className="hover-lift block overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft"
    >
      <div
        className={cn(
          'relative flex aspect-video w-full items-center justify-center bg-gradient-to-br',
          style.gradient,
        )}
      >
        <span
          className={cn(
            'absolute left-2.5 top-2.5 rounded-md bg-card/95 px-1.5 py-0.5 font-label text-[10px] font-bold uppercase tracking-wide shadow-sm',
            style.badgeClass,
          )}
        >
          {style.label}
        </span>
        <Icon className={cn('h-10 w-10', style.iconClass)} />
      </div>
      <div className="p-4">
        <p className="truncate font-display text-sm font-semibold leading-snug text-foreground">
          {content.title}
        </p>
        {showBar ? (
          <>
            <Progress
              value={barValue}
              aria-hidden
              className="mt-2 h-1.5"
            />
            <p
              className={cn(
                'mt-1.5 text-xs',
                status === 'completed' ? 'font-semibold text-primary' : 'text-muted-foreground',
              )}
            >
              {statusLabel}
            </p>
          </>
        ) : (
          <div
            className={cn(
              'mt-2 flex items-center gap-1.5 text-xs',
              status === 'failed' ? 'text-destructive' : 'text-muted-foreground',
            )}
          >
            {status === 'processing' && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />}
            {status === 'failed' && <AlertCircle className="h-3.5 w-3.5 shrink-0" />}
            <span>{statusLabel}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

export default function LearnerDashboardPage() {
  const t = useTranslations('learner');
  const locale = useLocale() as AppLocale;
  const user = useAuthStore((s) => s.user);
  const { data: contents, isLoading } = useContents();
  const { data: summary } = useLearnerSummary();
  const { data: materials } = useLearnerMaterials();
  const { data: assessments } = useLearnerAssessments();

  // Live/scheduled GAME quiz → prominent join banner. Prefer an open live session;
  // otherwise the soonest upcoming scheduled game. Nothing renders when neither exists.
  const liveGame = useMemo(() => {
    const games = (assessments ?? []).filter((a) => a.mode === 'GAME');
    const live = games.find((a) => a.isLive);
    if (live) return { assessment: live, isLive: true as const };
    const now = Date.now();
    const upcoming = games
      .filter((a) => a.scheduledAt != null && new Date(a.scheduledAt).getTime() > now)
      .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())[0];
    return upcoming ? { assessment: upcoming, isLive: false as const } : null;
  }, [assessments]);

  const assigned = useMemo(() => contents ?? [], [contents]);
  const assignedCount = summary?.assignedCount ?? assigned.length;

  // Per-material coverage now comes from useLearnerMaterials(); index it by contentId
  // so each assigned-material card can render a real progress bar + status.
  const materialByContentId = useMemo(() => {
    const map = new Map<string, LearnerMaterial>();
    (materials ?? []).forEach((material) => map.set(material.contentId, material));
    return map;
  }, [materials]);

  // Fallback while materials load: the summary's single "continue" item still carries
  // a coverage %, so cards degrade gracefully to "not started" for everything else.
  const continueId = summary?.continueContent?.contentId;
  const continueCoverage = summary?.continueContent
    ? Math.round(summary.continueContent.overallCoverage)
    : 0;

  const statusForContent = (content: Content): CardStatus => {
    if (content.status === 'PENDING' || content.status === 'PROCESSING') return 'processing';
    if (content.status === 'FAILED') return 'failed';
    const material = materialByContentId.get(content.id);
    if (material) {
      if (material.status === 'completed') return 'completed';
      if (material.status === 'in_progress') return 'continue';
      return 'notStarted';
    }
    if (content.id === continueId) return continueCoverage >= 100 ? 'completed' : 'continue';
    return 'notStarted';
  };

  const coverageForContent = (content: Content): number => {
    const material = materialByContentId.get(content.id);
    if (material) return Math.round(material.coverage);
    if (content.id === continueId) return continueCoverage;
    return 0;
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <StudentWelcomeBanner />

      {liveGame && (
        <div className="relative flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-3xl border border-accent-secondary/40 bg-accent-secondary/10 p-5 shadow-soft">
          {liveGame.isLive && (
            <span
              aria-hidden
              className="absolute right-4 top-4 flex h-2.5 w-2.5"
            >
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-secondary opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent-secondary" />
            </span>
          )}
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent-secondary text-accent-secondary-foreground">
              <Gamepad2 className="h-6 w-6" />
            </span>
            <div>
              <p className="font-label text-xs font-semibold uppercase tracking-[0.18em] text-accent-secondary">
                {liveGame.isLive ? t('liveGame.liveNow') : t('liveGame.startsSoon')}
              </p>
              <p className="mt-0.5 font-display text-lg font-semibold text-foreground">
                {liveGame.assessment.title}
              </p>
              {!liveGame.isLive && liveGame.assessment.scheduledAt && (
                <p className="text-sm text-muted-foreground">
                  {t('liveGame.scheduledFor', {
                    time: formatRelativeTime(liveGame.assessment.scheduledAt, locale),
                  })}
                </p>
              )}
            </div>
          </div>
          <Link
            href={
              liveGame.isLive
                ? `/learner/assessments?play=${liveGame.assessment.id}`
                : '/learner/assessments'
            }
          >
            <Button variant="spark" className="shrink-0">
              <Play className="mr-1.5 h-4 w-4" />
              {liveGame.isLive ? t('liveGame.join') : t('liveGame.view')}
            </Button>
          </Link>
        </div>
      )}

      {/* Pine-gradient welcome hero — theme-independent pine, cream text + faint girih. */}
      <div className="relative overflow-hidden rounded-3xl bg-primary p-8 text-primary-foreground shadow-soft">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-transparent to-black/20"
        />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-girih opacity-[0.18] invert" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="font-label text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground/70">
              {summary?.tenantName ?? user?.tenantName ?? t('schoolFallback')}
            </p>
            <h1 className="mt-3 font-display text-3xl font-bold italic tracking-tight sm:text-4xl">
              {t('welcome', { name: user?.name ?? user?.email ?? '' })}
            </h1>
            <p className="mt-2 not-italic text-primary-foreground/80">
              {t('materialsAssignedSubtitle', { count: assignedCount })}
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-white/12 px-4 py-3 backdrop-blur-sm">
            <Flame className="h-6 w-6 shrink-0 text-accent-secondary" />
            <div>
              <p className="font-display text-2xl font-bold leading-none tabular-nums">
                {t('streakDays', { count: summary?.streakDays ?? 0 })}
              </p>
              <p className="mt-1 font-label text-[0.65rem] uppercase tracking-wide text-primary-foreground/70">
                {t('statStreak')}
              </p>
            </div>
          </div>
        </div>
        {summary?.continueContent && (
          <div className="relative mt-6 max-w-lg rounded-2xl border border-white/15 bg-white/10 p-5 text-left backdrop-blur-sm">
            <p className="font-label text-xs font-medium uppercase tracking-wide text-primary-foreground/70">
              {t('continueTitle')}
            </p>
            <p className="mt-1 font-display text-lg font-semibold">{summary.continueContent.title}</p>
            <p className="text-sm text-primary-foreground/70">
              {t('percentComplete', { percent: Math.round(summary.continueContent.overallCoverage) })}
            </p>
            <Link
              href={`/content/${summary.continueContent.contentId}${
                summary.continueContent.lastSectionId
                  ? `?section=${summary.continueContent.lastSectionId}`
                  : ''
              }`}
            >
              <Button variant="gradient" className="mt-4">{t('continueLearning')}</Button>
            </Link>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <div className="flex items-start justify-between">
            <p className="font-label text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('statAssigned')}
            </p>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <BookOpen className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 font-display text-4xl font-bold tabular-nums tracking-tight">
            {assignedCount}
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <div className="flex items-start justify-between">
            <p className="font-label text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('statAvgQuiz')}
            </p>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-success/10 text-success">
              <Target className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 font-display text-4xl font-bold tabular-nums tracking-tight">
            {summary?.avgQuizScore != null ? `${Math.round(summary.avgQuizScore)}%` : '—'}
          </p>
        </div>
      </div>

      <div className="w-full">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">{t('assignedToYou')}</h2>
          {!isLoading && assigned.length > 0 && (
            <span className="rounded-full bg-secondary px-2.5 py-1 font-label text-xs font-medium text-muted-foreground">
              {t('materialsCount', { count: assigned.length })}
            </span>
          )}
        </div>
        {isLoading ? (
          <p className="text-muted-foreground">{t('loading')}</p>
        ) : assigned.length === 0 ? (
          <div className="rounded-2xl border border-border/70 bg-card p-12 text-center shadow-soft">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <BookOpen className="h-7 w-7" />
            </div>
            <p className="mt-4 font-display font-semibold">{t('noAssigned')}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t('noAssignedDesc')}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {assigned.map((content) => (
              <AssignedMaterialCard
                key={content.id}
                content={content}
                status={statusForContent(content)}
                coverage={coverageForContent(content)}
              />
            ))}
          </div>
        )}
      </div>

      {(assessments?.length ?? 0) > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">{t('tasksTitle')}</h2>
            <Link href="/learner/assessments" className="text-sm font-medium text-primary hover:underline">
              {t('viewAll')}
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {assessments?.slice(0, 2).map((assessment) => (
              <Link
                key={assessment.id}
                href="/learner/assessments"
                className="hover-lift rounded-2xl border border-border/70 border-l-4 border-l-primary bg-card p-4 shadow-soft"
              >
                <p className="font-display font-semibold">{assessment.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('taskMeta', {
                    count: assessment.questions.length,
                    used: assessment.attemptCount,
                    max: assessment.maxAttempts,
                  })}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
