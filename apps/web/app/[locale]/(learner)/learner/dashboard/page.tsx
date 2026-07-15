'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  AlertCircle,
  Award,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  FileText,
  Flame,
  Gamepad2,
  Layers,
  Loader2,
  Mail,
  Play,
  Presentation,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useContents } from '@/hooks/useContent';
import {
  useLearnerMaterials,
  useLearnerMessages,
  useLearnerProgress,
  useLearnerSummary,
  useLearnerUnreadCount,
} from '@/hooks/useTenant';
import { useLearnerAssessments } from '@/hooks/useAssessments';
import { Link } from '@/i18n/navigation';
import { Button, Progress, cn } from '@talim/ui';
import type {
  AppLocale,
  Content,
  ContentType,
  LearnerAssessment,
  LearnerMaterial,
} from '@talim/types';
import { formatRelativeTime } from '@/lib/format-relative-time';
import { masteryTone } from '@/lib/mastery-tone';
import { ActivityHeatmap } from '@/components/tenant/activity-heatmap';
import { StatCard } from '@/components/dashboard/stat-card';
import { StudentWelcomeBanner } from '@/components/learner/student-welcome-banner';

type CardStatus = 'processing' | 'failed' | 'completed' | 'continue' | 'notStarted';

/** Achievement codes → localized label keys under the `learner` namespace. */
const BADGE_LABEL_KEYS: Record<string, string> = {
  STREAK_5: 'badges.STREAK_5',
  FIRST_PERFECT: 'badges.FIRST_PERFECT',
  TEN_QUIZZES: 'badges.TEN_QUIZZES',
};

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

function TaskCard({ assessment }: { assessment: LearnerAssessment }) {
  const t = useTranslations('learner');
  const locale = useLocale() as AppLocale;
  const pastDue = assessment.dueAt != null && new Date(assessment.dueAt).getTime() < Date.now();
  // Mirrors /learner/assessments: a task submitted before the deadline is not "overdue".
  const overdue = pastDue && assessment.attemptCount === 0;

  const metaParts = [
    t('assessments.questionCount', { count: assessment.questions.length }),
    t('assessments.attempts', { used: assessment.attemptCount, max: assessment.maxAttempts }),
  ];
  if (assessment.latestScore != null) {
    metaParts.push(t('assessments.latest', { score: Math.round(assessment.latestScore) }));
  }
  if (assessment.mode === 'GAME' && assessment.latestPoints != null) {
    metaParts.push(t('assessments.points', { count: assessment.latestPoints }));
  }

  return (
    <Link
      href="/learner/assessments"
      className={cn(
        'hover-lift rounded-2xl border border-border/70 border-l-4 bg-card p-4 shadow-soft',
        assessment.mode === 'GAME' ? 'border-l-accent-secondary' : 'border-l-primary',
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 truncate font-display font-semibold">{assessment.title}</p>
        <span
          className={cn(
            'shrink-0 rounded-full px-2 py-0.5 font-label text-[10px] font-bold uppercase tracking-wide',
            assessment.mode === 'GAME'
              ? 'bg-accent-secondary/15 text-accent-secondary'
              : 'bg-primary/10 text-primary',
          )}
        >
          {assessment.mode === 'GAME' ? t('assessments.gameBadge') : t('assessments.writtenBadge')}
        </span>
      </div>
      {assessment.dueAt && (
        <p
          className={cn(
            'mt-1.5 flex items-center gap-1.5 text-xs font-medium',
            overdue ? 'text-destructive' : 'text-accent-secondary',
          )}
        >
          <CalendarClock className="h-3.5 w-3.5 shrink-0" />
          {overdue
            ? t('assessments.overdue', { date: formatRelativeTime(assessment.dueAt, locale) })
            : t('assessments.due', { date: formatRelativeTime(assessment.dueAt, locale) })}
        </p>
      )}
      <p className="mt-1 text-sm text-muted-foreground">{metaParts.join(' · ')}</p>
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
  const { data: progress } = useLearnerProgress();
  const { data: unreadMessages = 0 } = useLearnerUnreadCount();
  // Only fetch the message bodies when there is something unread to preview.
  const { data: messages } = useLearnerMessages(unreadMessages > 0);

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

  // Tasks sorted by urgency: live games first, then nearest upcoming deadline, then
  // no-deadline tasks; closed (past-due) tasks sort last — a passed dueAt means
  // submissions are closed, so they're no longer actionable.
  const sortedTasks = useMemo(() => {
    const now = Date.now();
    const rank = (a: LearnerAssessment) => {
      if (a.isLive) return 0;
      if (a.dueAt == null) return 2;
      return new Date(a.dueAt).getTime() >= now ? 1 : 3;
    };
    return [...(assessments ?? [])]
      .sort((x, y) => {
        const rx = rank(x);
        const r = rx - rank(y);
        if (r !== 0) return r;
        if (x.dueAt != null && y.dueAt != null) {
          const byDue = new Date(x.dueAt).getTime() - new Date(y.dueAt).getTime();
          // Upcoming: soonest first; closed: most recently closed first.
          return rx === 3 ? -byDue : byDue;
        }
        return 0;
      })
      .slice(0, 4);
  }, [assessments]);

  const activeDaysThisWeek = useMemo(() => {
    const days = new Set(progress?.activityDays ?? []);
    let count = 0;
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      if (days.has(date.toISOString().slice(0, 10))) count += 1;
    }
    return count;
  }, [progress?.activityDays]);

  // Weakest topics first — masteryByTopic arrives sorted by coverage desc.
  const focusTopics = useMemo(
    () =>
      [...(progress?.masteryByTopic ?? [])]
        .filter((topic) => topic.coverage < 70)
        .slice(-4)
        .reverse(),
    [progress?.masteryByTopic],
  );

  const badges = progress?.badges ?? [];
  // Preview the newest tutor message in the unread thread — an unread root's `readAt`
  // is also nulled when a newer in-thread tutor response is what's actually unread.
  const latestUnread = (messages ?? []).find((m) => m.readAt == null);
  const unreadPreview = latestUnread
    ? ([...latestUnread.thread].reverse().find((tm) => tm.fromTutor) ?? latestUnread)
    : undefined;

  const completedCount =
    progress?.materialsDone ??
    (materials ?? []).filter((m) => m.status === 'completed').length;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <StudentWelcomeBanner />

      {unreadMessages > 0 && (
        <div className="flex flex-wrap items-center gap-4 rounded-3xl border border-info/40 bg-info/10 p-5 shadow-soft">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-info text-info-foreground">
            <Mail className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display font-semibold text-foreground">
              {t('dashboard.unreadFromTutor', { count: unreadMessages })}
            </p>
            {unreadPreview && (
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {unreadPreview.senderName ?? t('messages.fromTutor')}: {unreadPreview.body}
              </p>
            )}
            <p className="mt-0.5 text-xs text-muted-foreground">{t('dashboard.checkBell')}</p>
          </div>
        </div>
      )}

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t('statAssigned')}
          value={assignedCount}
          icon={BookOpen}
          tone="pine"
        />
        <StatCard
          label={t('progress.materialsDone')}
          value={completedCount}
          icon={CheckCircle2}
          tone="success"
          hint={t('dashboard.completedHint', { count: assignedCount })}
        />
        <StatCard
          label={t('statAvgQuiz')}
          value={summary?.avgQuizScore != null ? `${Math.round(summary.avgQuizScore)}%` : '—'}
          icon={Target}
          tone="clay"
        />
        <StatCard
          href="/learner/progress"
          label={t('progress.overallMastery')}
          value={progress?.overallMastery != null ? `${Math.round(progress.overallMastery)}%` : '—'}
          icon={TrendingUp}
          tone="pine"
          valueClassName={
            progress?.overallMastery != null && progress.overallMastery >= 70
              ? 'text-primary'
              : undefined
          }
        />
      </div>

      {sortedTasks.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">{t('tasksTitle')}</h2>
            <Link href="/learner/assessments" className="text-sm font-medium text-primary hover:underline">
              {t('viewAll')}
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {sortedTasks.map((assessment) => (
              <TaskCard key={assessment.id} assessment={assessment} />
            ))}
          </div>
        </section>
      )}

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

      {progress && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
            <div className="mb-4 flex items-center gap-2">
              <Flame className="h-4 w-4 text-primary" aria-hidden />
              <h3 className="font-display text-base font-semibold tracking-tight">
                {t('dashboard.activityTitle')}
              </h3>
            </div>
            <ActivityHeatmap days={progress.activityDays} />
            <p className="mt-3 text-sm text-muted-foreground">
              {t('dashboard.activeDaysThisWeek', { count: activeDaysThisWeek })}
            </p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
            <div className="mb-4 flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" aria-hidden />
              <h3 className="font-display text-base font-semibold tracking-tight">
                {t('dashboard.focusTitle')}
              </h3>
            </div>
            {focusTopics.length === 0 ? (
              <p className="rounded-xl bg-muted/50 px-4 py-6 text-center text-sm text-muted-foreground">
                {t('progress.masteryEmpty')}
              </p>
            ) : (
              <div className="space-y-3">
                {focusTopics.map((topic) => {
                  const pct = Math.max(0, Math.min(100, Math.round(topic.coverage)));
                  const tone = masteryTone(topic.coverage);
                  return (
                    <div key={topic.sectionId}>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="truncate">{topic.title}</span>
                        <span className={`font-display font-bold tabular-nums ${tone.text}`}>
                          {pct}%
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${tone.bar}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" aria-hidden />
                <h3 className="font-display text-base font-semibold tracking-tight">
                  {t('progress.achievements')}
                </h3>
              </div>
              <Link href="/learner/progress" className="text-sm font-medium text-primary hover:underline">
                {t('viewAll')}
              </Link>
            </div>
            {badges.length === 0 ? (
              <p className="rounded-xl bg-muted/50 px-4 py-6 text-center text-sm text-muted-foreground">
                {t('progress.badgesEmpty')}
              </p>
            ) : (
              <div className="space-y-3">
                {badges.map((badge) => {
                  const earned = badge.earned;
                  const pct = Math.round(Math.max(0, Math.min(1, badge.progress ?? 0)) * 100);
                  const labelKey = BADGE_LABEL_KEYS[badge.code];
                  const label = labelKey ? t(labelKey) : badge.code;
                  return (
                    <div key={badge.code} className={`flex items-center gap-3 ${earned ? '' : 'opacity-60'}`}>
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${
                          earned ? 'bg-accent-secondary/15' : 'bg-muted'
                        }`}
                        aria-hidden="true"
                      >
                        {badge.emoji}
                      </span>
                      <div className="min-w-0">
                        <p className={`truncate text-sm font-semibold ${earned ? '' : 'text-muted-foreground'}`}>
                          {label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {earned
                            ? t('progress.badgeEarned')
                            : t('progress.badgeProgress', { percent: pct })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
