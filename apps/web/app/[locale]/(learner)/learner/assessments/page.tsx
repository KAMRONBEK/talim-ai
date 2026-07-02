'use client';

import { Fragment, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowDown, ArrowUp, CalendarClock, GripVertical, Play, Sparkles, Trophy } from 'lucide-react';
import { Badge, Button, Input } from '@talim/ui';
import type { AppLocale, AssessmentSubmitResult, LearnerAssessment } from '@talim/types';
import {
  useLearnerAssessments,
  useLearnerLeaderboard,
  useSubmitLearnerAssessment,
} from '@/hooks/useAssessments';
import { formatRelativeTime } from '@/lib/format-relative-time';
import { GameQuizPlayer } from '@/components/learner/game-quiz-player';
import { LeaderboardTable } from '@/components/learner/leaderboard-table';
import { useAuthStore } from '@/store/useAuthStore';

function Leaderboard({
  assessmentId,
  live = false,
}: {
  assessmentId: string;
  live?: boolean;
}) {
  const t = useTranslations('learner.assessments');
  const tc = useTranslations('common');
  // Highlight the current learner's own row in the board.
  const currentUserId = useAuthStore((s) => s.user?.id);
  const { data, isLoading, isError } = useLearnerLeaderboard(assessmentId, { live });
  if (isError) return <p className="text-sm text-destructive">{tc('loadError')}</p>;
  if (isLoading) return <p className="text-sm text-muted-foreground">{t('loadingLeaderboard')}</p>;
  if (!data) return null;
  return <LeaderboardTable rows={data.rows} mode={data.mode} highlightId={currentUserId} />;
}

function WrittenForm({ assessment }: { assessment: LearnerAssessment }) {
  const t = useTranslations('learner.assessments');
  const submit = useSubmitLearnerAssessment();
  // Existing single-string answers (SHORT_ANSWER / NUMERIC / MULTIPLE_CHOICE / TRUE_FALSE).
  const [answers, setAnswers] = useState<Record<string, string>>({});
  // MULTIPLE_SELECT: selected option values per question.
  const [multiSelect, setMultiSelect] = useState<Record<string, string[]>>({});
  // FILL_BLANK: per-blank text values per question (indexed by blank position).
  const [fillBlanks, setFillBlanks] = useState<Record<string, string[]>>({});
  // DROPDOWN_CLOZE: selected value per blank per question (indexed by blank position).
  const [cloze, setCloze] = useState<Record<string, string[]>>({});
  // MATCHING: chosen right-hand value per question, parallel to config.left order.
  const [matching, setMatching] = useState<Record<string, string[]>>({});
  // ORDERING: the learner's current ordering of a question's shuffled items.
  const [ordering, setOrdering] = useState<Record<string, string[]>>({});
  // DRAG_DROP: chosen target label per item, parallel to config.items ('' = still in the pool).
  const [dragDrop, setDragDrop] = useState<Record<string, string[]>>({});
  // DRAG_DROP: the item index currently picked in the tap/click fallback (per question).
  const [dragPick, setDragPick] = useState<Record<string, number | null>>({});
  const [result, setResult] = useState<AssessmentSubmitResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const locked = assessment.attemptCount >= assessment.maxAttempts;
  // Shared token-styled native <select> for MATCHING / DROPDOWN_CLOZE dropdowns.
  const selectClass =
    'rounded-lg border border-border/70 bg-background px-2 py-1.5 text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60';
  // FILL_BLANK / DROPDOWN_CLOZE blank count comes from question.config.blanks (defaults to a single blank).
  const blankCount = (config: Record<string, unknown> | null) => {
    const raw = config?.blanks;
    return typeof raw === 'number' && raw > 0 ? Math.floor(raw) : 1;
  };
  // MATCHING: config.left holds the ordered left-hand prompts.
  const matchingLeft = (config: Record<string, unknown> | null): string[] => {
    const raw = config?.left;
    return Array.isArray(raw) ? raw.filter((v): v is string => typeof v === 'string') : [];
  };
  // DROPDOWN_CLOZE: config.blankOptions holds the choice pool per blank.
  const clozeOptions = (config: Record<string, unknown> | null): string[][] => {
    const raw = config?.blankOptions;
    if (!Array.isArray(raw)) return [];
    return raw.map((b) => (Array.isArray(b) ? b.filter((v): v is string => typeof v === 'string') : []));
  };
  // HOTSPOT: config.imageUrl is the backdrop the learner clicks (accept regions live in
  // config.regions, but the player only needs the image to render the click surface).
  const hotspotImageUrl = (config: Record<string, unknown> | null): string => {
    const raw = config?.imageUrl;
    return typeof raw === 'string' ? raw : '';
  };
  // HOTSPOT: the learner's stored click point ({ x, y } in 0..1) for marker rendering, or null.
  const hotspotPoint = (qid: string): { x: number; y: number } | null => {
    const raw = answers[qid];
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as { x?: unknown; y?: unknown };
      if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
        return { x: parsed.x, y: parsed.y };
      }
    } catch {
      /* not a stored point */
    }
    return null;
  };
  // DRAG_DROP: config.items are the draggable chips; config.targets are the labelled buckets.
  const dragItems = (config: Record<string, unknown> | null): string[] => {
    const raw = config?.items;
    return Array.isArray(raw) ? raw.filter((v): v is string => typeof v === 'string') : [];
  };
  const dragTargets = (config: Record<string, unknown> | null): string[] => {
    const raw = config?.targets;
    return Array.isArray(raw) ? raw.filter((v): v is string => typeof v === 'string') : [];
  };
  // DRAG_DROP: assign item `index` to a target bucket (or '' to send it back to the pool),
  // keeping the per-question array parallel to config.items.
  const placeDrag = (qid: string, itemCount: number, index: number, target: string) => {
    setDragDrop((prev) => {
      const current = Array.from({ length: itemCount }, (_, i) => prev[qid]?.[i] ?? '');
      current[index] = target;
      return { ...prev, [qid]: current };
    });
  };
  // DRAG_DROP results view: parse a JSON string[] submission ([] when absent/invalid).
  const parseStringArray = (raw: string): string[] => {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
    } catch {
      return [];
    }
  };
  // HOTSPOT results view: format a stored click point as percentage coords (or a dash when blank).
  const formatHotspotAnswer = (raw: string): string => {
    if (!raw) return '—';
    try {
      const parsed = JSON.parse(raw) as { x?: unknown; y?: unknown };
      if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
        return `${Math.round(parsed.x * 100)}%, ${Math.round(parsed.y * 100)}%`;
      }
    } catch {
      /* not a point */
    }
    return '—';
  };
  // Move an ORDERING item up (-1) or down (+1); state initialises from the shuffled options.
  const moveOrder = (qid: string, fallback: string[], index: number, dir: -1 | 1) => {
    setOrdering((prev) => {
      const current = [...(prev[qid] ?? fallback)];
      const target = index + dir;
      if (target < 0 || target >= current.length) return prev;
      const a = current[index];
      const b = current[target];
      if (a === undefined || b === undefined) return prev;
      current[index] = b;
      current[target] = a;
      return { ...prev, [qid]: current };
    });
  };

  if (result) {
    const questionById = new Map(assessment.questions.map((q) => [q.id, q]));
    // Strict scoring attaches signed points; when present, show a correct/wrong/blank
    // breakdown with the net points. Absent (legacy percentage scoring) → unchanged view.
    const strict = result.attempt.pointsEarned != null && result.attempt.maxPoints != null;
    const isBlankAnswer = (a: string) => {
      const s = (a ?? '').trim();
      return s === '' || s === '[]' || s === '{}' || s === '""';
    };
    const correctCount = result.results.filter((r) => r.correct).length;
    const blankCountResult = result.results.filter(
      (r) => !r.correct && isBlankAnswer(r.submittedAnswer),
    ).length;
    const wrongCount = result.results.length - correctCount - blankCountResult;
    const round1 = (n: number) => Math.round(n * 10) / 10;
    return (
      <div className="space-y-3 rounded-2xl border border-border/70 bg-background p-5">
        <p className="font-display font-semibold">
          {t('result', { correct: result.correct, total: result.total })}
        </p>
        {strict && (
          <div className="rounded-xl border border-border/70 bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-label text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
                {t('scoreBreakdown')}
              </p>
              <p className="font-display text-sm font-semibold">
                {t('netPoints', {
                  earned: round1(result.attempt.pointsEarned ?? 0),
                  max: round1(result.attempt.maxPoints ?? 0),
                })}
              </p>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-primary/10 px-2 py-2">
                <p className="font-display text-lg font-bold text-primary">{correctCount}</p>
                <p className="text-xs text-muted-foreground">{t('breakdownCorrect')}</p>
              </div>
              <div className="rounded-lg bg-destructive/10 px-2 py-2">
                <p className="font-display text-lg font-bold text-destructive">{wrongCount}</p>
                <p className="text-xs text-muted-foreground">{t('breakdownWrong')}</p>
              </div>
              <div className="rounded-lg bg-muted px-2 py-2">
                <p className="font-display text-lg font-bold text-muted-foreground">{blankCountResult}</p>
                <p className="text-xs text-muted-foreground">{t('breakdownBlank')}</p>
              </div>
            </div>
          </div>
        )}
        {result.results.map((r, i) => {
          const q = questionById.get(r.questionId);
          const isDragDrop = q?.type === 'DRAG_DROP';
          const isHotspot = q?.type === 'HOTSPOT';
          return (
            <div
              key={r.questionId}
              className={`rounded-xl border p-3 ${
                r.correct ? 'border-success/40 bg-success/5' : 'border-destructive/40 bg-destructive/5'
              }`}
            >
              <p className="text-sm font-medium">
                {i + 1}. {q?.prompt}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                <span className={r.correct ? 'font-semibold text-success' : 'font-semibold text-destructive'}>
                  {r.correct ? t('correctMark') : t('incorrectMark')}
                </span>
                {!isDragDrop && (
                  <>
                    {' · '}
                    {t('yourAnswer', {
                      answer: isHotspot
                        ? formatHotspotAnswer(r.submittedAnswer)
                        : r.submittedAnswer || '—',
                    })}
                  </>
                )}
              </p>
              {isDragDrop ? (
                // Chosen-vs-correct mapping per item (parallel to config.items).
                <div className="mt-1 space-y-1">
                  {dragItems(q?.config ?? null).map((item, idx) => {
                    const chosen = parseStringArray(r.submittedAnswer);
                    const got = chosen[idx] ?? '';
                    const want = r.acceptableAnswers[idx] ?? '';
                    const ok = got !== '' && got.trim().toLowerCase() === want.trim().toLowerCase();
                    return (
                      <p key={idx} className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{item}</span>
                        {' → '}
                        <span className={ok ? 'font-semibold text-success' : 'font-semibold text-destructive'}>
                          {got || '—'}
                        </span>
                        {!ok && want ? (
                          <span> ({t('acceptable', { answers: want })})</span>
                        ) : null}
                      </p>
                    );
                  })}
                </div>
              ) : (
                !r.correct &&
                !isHotspot &&
                r.acceptableAnswers.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {t('acceptable', { answers: r.acceptableAnswers.join(', ') })}
                  </p>
                )
              )}
              {r.explanation && <p className="mt-1 text-xs text-muted-foreground">{r.explanation}</p>}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <form
      className="space-y-4 rounded-2xl border border-border/70 bg-background p-5"
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);
        // Build the per-question payload. Existing types keep their single-string shape;
        // the new structured types submit arrays (MULTIPLE_SELECT) or a string/string[]
        // (FILL_BLANK: a bare string for one blank, an array for many). The backend
        // JSON-parses these structured answers.
        const scoped: Record<string, string | string[]> = Object.fromEntries(
          assessment.questions.map((q) => {
            if (q.type === 'MULTIPLE_SELECT') {
              return [q.id, multiSelect[q.id] ?? []];
            }
            if (q.type === 'FILL_BLANK') {
              const count = blankCount(q.config);
              const values = fillBlanks[q.id] ?? [];
              const filled = Array.from({ length: count }, (_, i) => values[i] ?? '');
              return [q.id, count <= 1 ? filled[0] ?? '' : filled];
            }
            if (q.type === 'DROPDOWN_CLOZE') {
              // One selected value per blank, parallel to config.blanks (server grades like FILL_BLANK).
              const count = blankCount(q.config);
              const values = cloze[q.id] ?? [];
              return [q.id, Array.from({ length: count }, (_, i) => values[i] ?? '')];
            }
            if (q.type === 'MATCHING' && matchingLeft(q.config).length) {
              // A right-value per left prompt, parallel to config.left order.
              const lefts = matchingLeft(q.config);
              const values = matching[q.id] ?? [];
              return [q.id, lefts.map((_, i) => values[i] ?? '')];
            }
            if (q.type === 'ORDERING' && q.options?.length) {
              // The items in the learner's chosen order (defaults to the shuffled options).
              return [q.id, ordering[q.id] ?? q.options];
            }
            if (q.type === 'DRAG_DROP' && dragItems(q.config).length) {
              // A chosen target per item, parallel to config.items, JSON-encoded — the
              // ordered-array shape the grader compares index-wise.
              const items = dragItems(q.config);
              const chosen = dragDrop[q.id] ?? [];
              return [q.id, JSON.stringify(items.map((_, i) => chosen[i] ?? ''))];
            }
            // HOTSPOT rides through the default single-string path: answers[q.id] already
            // holds JSON.stringify({ x, y }) (the normalized click point) written on click.
            return [q.id, answers[q.id] ?? ''];
          }),
        );
        try {
          const data = await submit.mutateAsync({
            assessmentId: assessment.id,
            // The mutation types answers as Record<string,string>; structured values ride
            // through unchanged and are parsed server-side.
            answers: scoped as Record<string, string>,
          });
          setResult(data);
        } catch (err) {
          setError(
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
              t('submitError'),
          );
        }
      }}
    >
      <div className="space-y-3">
        {assessment.questions.map((question, index) => (
          <div key={question.id} className="space-y-2 rounded-xl border border-border/70 bg-card p-3">
            <p className="text-sm font-medium">
              {index + 1}. {question.prompt}
            </p>
            {question.type === 'MULTIPLE_CHOICE' && question.options?.length ? (
              <div className="space-y-2">
                {question.options.map((option) => (
                  <label
                    key={option}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/70 px-3 py-2 text-sm transition-colors hover:border-primary/40 hover:bg-secondary/40"
                  >
                    <input
                      type="radio"
                      className="h-4 w-4 accent-primary"
                      name={`${assessment.id}-${question.id}`}
                      disabled={locked}
                      checked={answers[question.id] === option}
                      onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: option }))}
                    />
                    {option}
                  </label>
                ))}
              </div>
            ) : question.type === 'TRUE_FALSE' && question.options?.length ? (
              <div className="space-y-2">
                {question.options.map((option) => (
                  <label
                    key={option}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/70 px-3 py-2 text-sm transition-colors hover:border-primary/40 hover:bg-secondary/40"
                  >
                    <input
                      type="radio"
                      className="h-4 w-4 accent-primary"
                      name={`${assessment.id}-${question.id}`}
                      disabled={locked}
                      checked={answers[question.id] === option}
                      onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: option }))}
                    />
                    {option}
                  </label>
                ))}
              </div>
            ) : question.type === 'MULTIPLE_SELECT' && question.options?.length ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">{t('selectAllHint')}</p>
                {question.options.map((option) => {
                  const selected = multiSelect[question.id] ?? [];
                  return (
                    <label
                      key={option}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/70 px-3 py-2 text-sm transition-colors hover:border-primary/40 hover:bg-secondary/40"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-primary"
                        disabled={locked}
                        checked={selected.includes(option)}
                        onChange={() =>
                          setMultiSelect((prev) => {
                            const cur = prev[question.id] ?? [];
                            return {
                              ...prev,
                              [question.id]: cur.includes(option)
                                ? cur.filter((v) => v !== option)
                                : [...cur, option],
                            };
                          })
                        }
                      />
                      {option}
                    </label>
                  );
                })}
              </div>
            ) : question.type === 'FILL_BLANK' ? (
              <div className="space-y-2">
                {Array.from({ length: blankCount(question.config) }).map((_, i) => (
                  <Input
                    key={i}
                    disabled={locked}
                    value={fillBlanks[question.id]?.[i] ?? ''}
                    onChange={(event) =>
                      setFillBlanks((prev) => {
                        const next = [...(prev[question.id] ?? [])];
                        next[i] = event.target.value;
                        return { ...prev, [question.id]: next };
                      })
                    }
                    placeholder={
                      blankCount(question.config) > 1
                        ? t('blankLabel', { number: i + 1 })
                        : t('textPlaceholder')
                    }
                  />
                ))}
              </div>
            ) : question.type === 'DROPDOWN_CLOZE' ? (
              (() => {
                const count = blankCount(question.config);
                const pools = clozeOptions(question.config);
                const segments = question.prompt.split(/_{3,}/);
                const inline = segments.length > 1;
                const control = (i: number) => {
                  const pool = pools[i] ?? [];
                  const value = cloze[question.id]?.[i] ?? '';
                  const onSet = (v: string) =>
                    setCloze((prev) => {
                      const next = [...(prev[question.id] ?? [])];
                      next[i] = v;
                      return { ...prev, [question.id]: next };
                    });
                  // Empty pool → graceful text-input fallback.
                  return pool.length ? (
                    <select
                      className={selectClass}
                      disabled={locked}
                      value={value}
                      onChange={(event) => onSet(event.target.value)}
                    >
                      <option value="">{t('choosePlaceholder')}</option>
                      {pool.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      className="inline-block h-9 w-40"
                      disabled={locked}
                      value={value}
                      onChange={(event) => onSet(event.target.value)}
                      placeholder={t('blankLabel', { number: i + 1 })}
                    />
                  );
                };
                if (inline) {
                  return (
                    <p className="flex flex-wrap items-center gap-1.5 text-sm leading-relaxed">
                      {Array.from({ length: count }).map((_, i) => (
                        <Fragment key={i}>
                          {segments[i] ? <span>{segments[i]}</span> : null}
                          {control(i)}
                        </Fragment>
                      ))}
                      {segments.length > count ? <span>{segments.slice(count).join(' ')}</span> : null}
                    </p>
                  );
                }
                return (
                  <div className="space-y-2">
                    {Array.from({ length: count }).map((_, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {t('blankLabel', { number: i + 1 })}
                        </span>
                        {control(i)}
                      </div>
                    ))}
                  </div>
                );
              })()
            ) : question.type === 'MATCHING' && matchingLeft(question.config).length ? (
              <div className="space-y-2">
                {matchingLeft(question.config).map((leftText, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2">
                    <span className="min-w-[6rem] flex-1 text-sm">{leftText}</span>
                    {question.options?.length ? (
                      <select
                        className={selectClass}
                        disabled={locked}
                        value={matching[question.id]?.[i] ?? ''}
                        onChange={(event) =>
                          setMatching((prev) => {
                            const next = [...(prev[question.id] ?? [])];
                            next[i] = event.target.value;
                            return { ...prev, [question.id]: next };
                          })
                        }
                      >
                        <option value="">{t('choosePlaceholder')}</option>
                        {question.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        className="h-9 w-48"
                        disabled={locked}
                        value={matching[question.id]?.[i] ?? ''}
                        onChange={(event) =>
                          setMatching((prev) => {
                            const next = [...(prev[question.id] ?? [])];
                            next[i] = event.target.value;
                            return { ...prev, [question.id]: next };
                          })
                        }
                        placeholder={t('textPlaceholder')}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : question.type === 'ORDERING' && question.options?.length ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">{t('orderHint')}</p>
                {(ordering[question.id] ?? question.options).map((item, i, arr) => (
                  <div
                    key={`${item}-${i}`}
                    className="flex items-center gap-2 rounded-lg border border-border/70 bg-background px-3 py-2 text-sm"
                  >
                    <span className="w-5 shrink-0 font-mono text-xs text-muted-foreground">{i + 1}.</span>
                    <span className="min-w-0 flex-1">{item}</span>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        disabled={locked || i === 0}
                        onClick={() => moveOrder(question.id, question.options ?? [], i, -1)}
                        className="rounded-md border border-border/70 p-1 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={t('moveUp')}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={locked || i === arr.length - 1}
                        onClick={() => moveOrder(question.id, question.options ?? [], i, 1)}
                        className="rounded-md border border-border/70 p-1 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={t('moveDown')}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : question.type === 'HOTSPOT' && hotspotImageUrl(question.config) ? (
              // Click the correct spot on the image; store the normalized 0..1 point as
              // JSON.stringify({ x, y }) in the answers map and drop a marker at the click.
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">{t('hotspotHint')}</p>
                <button
                  type="button"
                  disabled={locked}
                  onClick={(event) => {
                    const rect = event.currentTarget.getBoundingClientRect();
                    if (!rect.width || !rect.height) return;
                    const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
                    const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
                    setAnswers((prev) => ({ ...prev, [question.id]: JSON.stringify({ x, y }) }));
                  }}
                  className={`relative block w-full max-w-lg overflow-hidden rounded-lg border border-border/70 ${
                    locked ? 'cursor-not-allowed' : 'cursor-crosshair'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={hotspotImageUrl(question.config)}
                    alt=""
                    draggable={false}
                    className="pointer-events-none block w-full select-none"
                  />
                  {(() => {
                    const point = hotspotPoint(question.id);
                    return point ? (
                      <span
                        aria-hidden
                        className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-primary shadow-[0_0_0_3px_rgba(0,0,0,0.15)] ring-2 ring-primary/40"
                        style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
                      />
                    ) : null;
                  })()}
                </button>
              </div>
            ) : question.type === 'DRAG_DROP' &&
              dragItems(question.config).length >= 2 &&
              dragTargets(question.config).length >= 2 ? (
              // Drag each chip into a target bucket (HTML5 DnD) or tap a chip then a bucket
              // (click/tap fallback); the answer is a chosen-target-per-item array.
              (() => {
                const items = dragItems(question.config);
                const targets = dragTargets(question.config);
                const values = dragDrop[question.id] ?? [];
                const picked = dragPick[question.id] ?? null;
                const placedCount = items.filter((_, i) => (values[i] ?? '') !== '').length;
                return (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">{t('dragItemsHint')}</p>
                    {/* Pool of unplaced chips (draggable + tap-to-pick). */}
                    <div className="flex min-h-[3rem] flex-wrap gap-2 rounded-lg border border-dashed border-border/70 bg-background p-2">
                      {items.some((_, i) => !(values[i] ?? '')) ? (
                        items.map((item, i) =>
                          (values[i] ?? '') ? null : (
                            <button
                              key={`${item}-${i}`}
                              type="button"
                              disabled={locked}
                              draggable={!locked}
                              aria-pressed={picked === i}
                              onDragStart={(event) =>
                                event.dataTransfer.setData('text/plain', String(i))
                              }
                              onClick={() =>
                                setDragPick((prev) => ({
                                  ...prev,
                                  [question.id]: prev[question.id] === i ? null : i,
                                }))
                              }
                              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                                picked === i
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'cursor-grab border-border/70 bg-card hover:border-primary/40 hover:bg-secondary/40 active:cursor-grabbing'
                              }`}
                            >
                              <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                              {item}
                            </button>
                          ),
                        )
                      ) : (
                        <span className="px-1 py-1 text-sm text-muted-foreground">
                          {t('dragAllPlaced')}
                        </span>
                      )}
                    </div>
                    {/* Target buckets (drop zone + tap-to-place). */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      {targets.map((target) => (
                        <div
                          key={target}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={(event) => {
                            event.preventDefault();
                            if (locked) return;
                            const i = Number(event.dataTransfer.getData('text/plain'));
                            if (Number.isInteger(i)) placeDrag(question.id, items.length, i, target);
                          }}
                          onClick={() => {
                            if (locked || picked === null) return;
                            placeDrag(question.id, items.length, picked, target);
                            setDragPick((prev) => ({ ...prev, [question.id]: null }));
                          }}
                          className="min-h-[4.5rem] rounded-lg border border-border/70 bg-card p-3"
                        >
                          <p className="mb-2 text-xs font-medium text-muted-foreground">{target}</p>
                          <div className="flex flex-wrap gap-2">
                            {items.map((item, i) =>
                              (values[i] ?? '') === target ? (
                                <button
                                  key={`${item}-${i}`}
                                  type="button"
                                  disabled={locked}
                                  draggable={!locked}
                                  onDragStart={(event) =>
                                    event.dataTransfer.setData('text/plain', String(i))
                                  }
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    if (!locked) placeDrag(question.id, items.length, i, '');
                                  }}
                                  className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-sm text-primary disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {item}
                                </button>
                              ) : null,
                            )}
                            {items.every((_, i) => (values[i] ?? '') !== target) && (
                              <span className="text-xs text-muted-foreground/70">{t('dropHere')}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('placedCount', { count: placedCount, total: items.length })}
                    </p>
                  </div>
                );
              })()
            ) : (
              <Input
                disabled={locked}
                value={answers[question.id] ?? ''}
                onChange={(event) =>
                  setAnswers((prev) => ({ ...prev, [question.id]: event.target.value }))
                }
                placeholder={question.type === 'NUMERIC' ? t('numberPlaceholder') : t('textPlaceholder')}
              />
            )}
          </div>
        ))}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={locked || submit.isPending}>
        {locked ? t('attemptLimit') : t('submit')}
      </Button>
    </form>
  );
}

function AssessmentCard({
  assessment,
  autoPlay = false,
}: {
  assessment: LearnerAssessment;
  autoPlay?: boolean;
}) {
  const t = useTranslations('learner.assessments');
  const locale = useLocale() as AppLocale;
  const [playing, setPlaying] = useState(false);
  const [showBoard, setShowBoard] = useState(false);
  const [writtenStarted, setWrittenStarted] = useState(false);
  const locked = assessment.attemptCount >= assessment.maxAttempts;
  const isGame = assessment.mode === 'GAME';
  // Enforced due date: once the deadline passes, submissions are closed — the server also
  // rejects late attempts with a 403, so the start/play controls and form are hidden here.
  const pastDue = assessment.dueAt != null && new Date(assessment.dueAt).getTime() < Date.now();
  // Deep-link from the dashboard "Join" banner (?play=<id>) auto-opens the game player.
  useEffect(() => {
    if (autoPlay && isGame && !locked && !pastDue) setPlaying(true);
  }, [autoPlay, isGame, locked, pastDue]);
  // Overdue styling on the badge when past due and the learner hasn't submitted an attempt
  // yet (a completed task is no longer "overdue").
  const completed = assessment.attemptCount > 0;
  const overdue = pastDue && !completed;
  // Not-yet-started written tasks collapse behind a Start button; completed/locked ones stay
  // expanded. Past the deadline nothing can be started or submitted.
  const canStartWritten = !isGame && !locked && assessment.attemptCount === 0 && !pastDue;
  const showWrittenForm = !isGame && !pastDue && (!canStartWritten || writtenStarted);

  if (playing) {
    return <GameQuizPlayer assessment={assessment} onExit={() => setPlaying(false)} />;
  }

  return (
    <div
      className={`space-y-4 rounded-2xl border bg-card p-5 shadow-soft ${
        locked
          ? 'border-border/70 opacity-80'
          : `border-l-4 ${
              isGame
                ? 'border-accent-secondary/30 border-l-accent-secondary'
                : 'border-primary/20 border-l-primary'
            }`
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            {isGame ? (
              <Badge className="bg-accent-secondary text-accent-secondary-foreground hover:bg-accent-secondary">
                {t('gameBadge')}
              </Badge>
            ) : (
              <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                {t('writtenBadge')}
              </Badge>
            )}
            <h2 className="font-display text-lg font-semibold">{assessment.title}</h2>
            {assessment.dueAt && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                  overdue ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-muted-foreground'
                }`}
              >
                <CalendarClock className="h-3 w-3" />
                {overdue
                  ? t('overdue', { date: formatRelativeTime(assessment.dueAt, locale) })
                  : t('due', { date: formatRelativeTime(assessment.dueAt, locale) })}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('questionCount', { count: assessment.questions.length })}
            {isGame && assessment.secondsPerQuestion != null
              ? ` · ${t('secondsEach', { seconds: assessment.secondsPerQuestion })}`
              : ''}
            {` · ${t('attempts', { used: assessment.attemptCount, max: assessment.maxAttempts })}`}
            {assessment.latestScore != null
              ? ` · ${t('latest', { score: Math.round(assessment.latestScore) })}`
              : ''}
            {isGame && assessment.latestPoints != null
              ? ` · ${t('points', { count: assessment.latestPoints })}`
              : ''}
          </p>
          {assessment.instructions && (
            <p className="mt-1 text-sm text-muted-foreground">{assessment.instructions}</p>
          )}
        </div>
        <div className="flex gap-2">
          {isGame && !pastDue && (
            <Button variant="spark" disabled={locked} onClick={() => setPlaying(true)}>
              <Play className="mr-1.5 h-4 w-4" />
              {locked ? t('attemptLimit') : t('play')}
            </Button>
          )}
          {canStartWritten && !writtenStarted && (
            <Button variant="outline" onClick={() => setWrittenStarted(true)}>
              <Play className="mr-1.5 h-4 w-4" />
              {t('start')}
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowBoard((v) => !v)}>
            <Trophy className="mr-1.5 h-4 w-4" />
            {showBoard ? t('hideLeaderboard') : t('leaderboard')}
          </Button>
        </div>
      </div>

      {pastDue && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
            <CalendarClock className="h-4 w-4" />
            {t('submissionsClosed')}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{t('dueEnforcedHint')}</p>
        </div>
      )}
      {showWrittenForm && <WrittenForm assessment={assessment} />}
      {showBoard && <Leaderboard assessmentId={assessment.id} live={assessment.isLive} />}
    </div>
  );
}

export default function LearnerAssessmentsPage() {
  const t = useTranslations('learner.assessments');
  const { data: assessments = [], isLoading } = useLearnerAssessments();
  // Read a `?play=<assessmentId>` deep-link (set by the dashboard live-game banner)
  // client-side to avoid a useSearchParams Suspense boundary on this client page.
  const [autoPlayId, setAutoPlayId] = useState<string | null>(null);
  useEffect(() => {
    setAutoPlayId(new URLSearchParams(window.location.search).get('play'));
  }, []);

  if (isLoading) return <p className="text-muted-foreground">{t('loading')}</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="font-label text-xs font-medium uppercase tracking-[0.2em] text-primary">{t('eyebrow')}</p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="mt-1 text-muted-foreground">{t('desc')}</p>
      </div>
      {assessments.length === 0 && (
        <div className="rounded-2xl border border-border/70 bg-card p-12 text-center shadow-soft">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="h-7 w-7" />
          </div>
          <p className="mt-4 text-muted-foreground">{t('empty')}</p>
        </div>
      )}
      {assessments.map((assessment) => (
        <AssessmentCard
          key={assessment.id}
          assessment={assessment}
          autoPlay={autoPlayId != null && assessment.id === autoPlayId}
        />
      ))}
    </div>
  );
}
