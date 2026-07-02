'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  BarChart3,
  CalendarClock,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  Library,
  Pencil,
  Plus,
  Radio,
  Sparkles,
  Trophy,
  UserCheck,
  Wand2,
  X,
} from 'lucide-react';
import { Badge, Button, cn, Input, Label } from '@talim/ui';
import type { AppLocale, BankQuestion, QuestionType, TenantAssessment } from '@talim/types';
import {
  useAssessmentLeaderboard,
  useAssessmentResults,
  useAssignAssessment,
  useBankQuestions,
  useCreateAssessment,
  useCreateQuestionBank,
  useGenerateBankQuestions,
  usePatchBankQuestion,
  useQuestionBanks,
  useScheduleAssessment,
  useSetAssessmentLive,
  useTenantAssessments,
  type BankQuestionStyle,
} from '@/hooks/useAssessments';
import { useTenantStudents } from '@/hooks/useTenant';
import { useTenantContents } from '@/hooks/useTenantContent';
import { formatRelativeTime } from '@/lib/format-relative-time';
import { LeaderboardTable } from '@/components/learner/leaderboard-table';
import {
  QUESTION_TYPE_LABEL_KEYS,
  QuestionEditor,
} from '@/components/tenant/question-editor';

/** Linear builder steps, in order. Results live in their own section below the wizard. */
const WIZARD_STEPS = ['bank', 'generate', 'review', 'publish', 'assign'] as const;
type WizardStep = (typeof WIZARD_STEPS)[number];

const STEP_LABEL_KEYS: Record<WizardStep, string> = {
  bank: 'stepBankLabel',
  generate: 'stepGenerateLabel',
  review: 'stepReviewLabel',
  publish: 'stepPublishLabel',
  assign: 'stepAssignLabel',
};

/** Every backend generation style (mirrors `BankQuestionStyle`), with its option label key. */
const STYLE_OPTIONS: { value: BankQuestionStyle; labelKey: string }[] = [
  { value: 'mixed', labelKey: 'styleMixed' },
  { value: 'multipleChoice', labelKey: 'styleMultipleChoice' },
  { value: 'multipleSelect', labelKey: 'styleMultipleSelect' },
  { value: 'trueFalse', labelKey: 'styleTrueFalse' },
  { value: 'written', labelKey: 'styleWritten' },
  { value: 'numeric', labelKey: 'styleNumeric' },
  { value: 'fillBlank', labelKey: 'styleFillBlank' },
  { value: 'dropdownCloze', labelKey: 'styleDropdownCloze' },
  { value: 'matching', labelKey: 'styleMatching' },
  { value: 'ordering', labelKey: 'styleOrdering' },
];

const STATUS_FILTERS: { value: 'ALL' | BankQuestion['status']; labelKey: string }[] = [
  { value: 'ALL', labelKey: 'filterAll' },
  { value: 'DRAFT', labelKey: 'filterPending' },
  { value: 'APPROVED', labelKey: 'filterApproved' },
  { value: 'REJECTED', labelKey: 'filterRejected' },
];

/** ISO string → `<input type="datetime-local">` value in local time (empty when unset). */
function toDatetimeLocal(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function mutErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;
}

function ResultsSection({ assessmentId }: { assessmentId: string }) {
  const t = useTranslations('tenant.assessments');
  const tc = useTranslations('common');
  const { data: results, isError } = useAssessmentResults(assessmentId || null);
  const { data: board } = useAssessmentLeaderboard(assessmentId || null);
  if (!assessmentId) {
    return <p className="text-sm text-muted-foreground">{t('chooseToSeeResults')}</p>;
  }
  if (isError) return <p className="text-sm text-destructive">{tc('loadError')}</p>;
  if (!results) return <p className="text-sm text-muted-foreground">{t('loadingResults')}</p>;
  const submitted = results.learners.filter((l) => l.submitted).length;
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t('submittedMeta', {
          submitted,
          total: results.learners.length,
          mode: results.mode === 'GAME' ? t('modeGame') : t('modeWritten'),
        })}
      </p>
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border/70 bg-secondary/40">
            <tr className="font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <th className="px-3 py-2.5">{t('colStudent')}</th>
              <th className="px-3 py-2.5">{t('colStatus')}</th>
              <th className="px-3 py-2.5">{t('colBestScore')}</th>
              {results.mode === 'GAME' && <th className="px-3 py-2.5">{t('colPoints')}</th>}
              <th className="px-3 py-2.5">{t('colAttempts')}</th>
            </tr>
          </thead>
          <tbody>
            {results.learners.map((l) => (
              <tr
                key={l.learnerId}
                className="border-b border-border/60 transition-colors last:border-0 hover:bg-secondary/30"
              >
                <td className="px-3 py-2.5 font-medium text-foreground">{l.learnerName}</td>
                <td className="px-3 py-2.5">
                  {l.submitted ? (
                    <Badge variant="success">{t('statusSubmitted')}</Badge>
                  ) : (
                    <span className="text-muted-foreground">{t('statusNotYet')}</span>
                  )}
                </td>
                <td className="px-3 py-2.5 font-display tabular-nums text-foreground">
                  {l.bestScore != null ? `${Math.round(l.bestScore)}%` : '—'}
                </td>
                {results.mode === 'GAME' && (
                  <td className="px-3 py-2.5 font-display tabular-nums text-primary">{l.bestPoints}</td>
                )}
                <td className="px-3 py-2.5 tabular-nums text-muted-foreground">{l.attempts}</td>
              </tr>
            ))}
            {results.learners.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                  {t('notAssigned')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {board && board.rows.length > 0 && (
        <div className="space-y-2.5">
          <h3 className="flex items-center gap-2 font-label text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <Trophy className="h-3.5 w-3.5 text-accent-secondary" />
            {t('leaderboard')}
          </h3>
          <LeaderboardTable rows={board.rows} mode={board.mode} />
        </div>
      )}
    </div>
  );
}

function GradingToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
        checked ? 'bg-primary' : 'bg-muted-foreground/50'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-background shadow-sm transition-transform duration-150 ${
          checked ? 'translate-x-[1.375rem]' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

// Per-GAME-assessment live controls: set/clear a scheduled start and start/end a live session.
function LiveGameRow({ assessment }: { assessment: TenantAssessment }) {
  const t = useTranslations('tenant.assessments');
  const locale = useLocale() as AppLocale;
  const schedule = useScheduleAssessment();
  const setLive = useSetAssessmentLive();
  const [when, setWhen] = useState(toDatetimeLocal(assessment.scheduledAt));

  const saveSchedule = () =>
    schedule.mutate({
      assessmentId: assessment.id,
      scheduledAt: when ? new Date(when).toISOString() : null,
    });

  const toggleLive = () =>
    setLive.mutate({ assessmentId: assessment.id, live: !assessment.isLive });

  const err = schedule.error ?? setLive.error;

  return (
    <div className="rounded-xl border border-border/70 bg-card p-4 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-display font-semibold text-foreground">{assessment.title}</p>
            {assessment.isLive ? (
              <Badge className="bg-accent-secondary text-accent-secondary-foreground hover:bg-accent-secondary">
                <Radio className="mr-1 h-3 w-3" />
                {t('live.liveNow')}
              </Badge>
            ) : assessment.scheduledAt ? (
              <Badge variant="secondary">{t('live.scheduled')}</Badge>
            ) : (
              <Badge variant="secondary">{t('live.idle')}</Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {assessment.isLive
              ? t('live.liveHint')
              : assessment.scheduledAt
                ? t('live.scheduledFor', {
                    time: formatRelativeTime(assessment.scheduledAt, locale),
                  })
                : t('live.notScheduled')}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant={assessment.isLive ? 'outline' : 'spark'}
          onClick={toggleLive}
          disabled={setLive.isPending}
        >
          <Radio className="h-4 w-4" />
          {assessment.isLive ? t('live.endLive') : t('live.goLive')}
        </Button>
      </div>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <Label
            htmlFor={`sched-${assessment.id}`}
            className="font-label text-[11px] uppercase tracking-wider text-muted-foreground"
          >
            {t('live.scheduleLabel')}
          </Label>
          <Input
            id={`sched-${assessment.id}`}
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            className="w-auto"
          />
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={saveSchedule}
          disabled={schedule.isPending}
        >
          <CalendarClock className="h-4 w-4" />
          {when ? t('live.saveSchedule') : t('live.clearSchedule')}
        </Button>
      </div>
      {err != null && <p className="mt-2 text-sm text-destructive">{mutErr(err, t('genericError'))}</p>}
    </div>
  );
}

export default function TenantAssessmentsPage() {
  const t = useTranslations('tenant.assessments');
  const { data: banks = [] } = useQuestionBanks();
  const { data: assessments = [] } = useTenantAssessments();
  const { data: students = [] } = useTenantStudents();
  const { data: materials = [] } = useTenantContents();
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [bankContentIds, setBankContentIds] = useState<string[]>([]);
  const [draftTopic, setDraftTopic] = useState('');
  const [draftStyle, setDraftStyle] = useState<BankQuestionStyle>('mixed');
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [assessmentTitle, setAssessmentTitle] = useState('');
  const [assessmentId, setAssessmentId] = useState('');
  const [learnerIds, setLearnerIds] = useState<string[]>([]);
  const [dueAt, setDueAt] = useState('');
  const [mode, setMode] = useState<'WRITTEN' | 'GAME'>('WRITTEN');
  const [secondsPerQuestion, setSecondsPerQuestion] = useState(20);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [strictScoring, setStrictScoring] = useState(false);
  const [wrongPenalty, setWrongPenalty] = useState(0.5);
  const [partialCredit, setPartialCredit] = useState(true);
  const [resultsId, setResultsId] = useState('');
  const createBank = useCreateQuestionBank();
  const generate = useGenerateBankQuestions(selectedBankId);
  const patchQuestion = usePatchBankQuestion(selectedBankId);
  const createAssessment = useCreateAssessment();
  const assignAssessment = useAssignAssessment();
  const { data: questions = [] } = useBankQuestions(selectedBankId);

  const approvedQuestions = useMemo(
    () => questions.filter((question) => question.status === 'APPROVED'),
    [questions],
  );

  const pendingQuestions = useMemo(
    () => questions.filter((question) => question.status === 'DRAFT'),
    [questions],
  );

  const [approvingAll, setApprovingAll] = useState(false);

  // Bulk-approve: reuse the existing per-question approve mutation for every
  // still-pending (DRAFT) question; already approved/rejected ones are skipped.
  // Each mutateAsync runs the existing onSuccess invalidation, refreshing the list.
  const approveAllPending = async () => {
    if (approvingAll || pendingQuestions.length === 0) return;
    setApprovingAll(true);
    try {
      await Promise.all(
        pendingQuestions.map((question) =>
          patchQuestion.mutateAsync({ id: question.id, status: 'APPROVED' }),
        ),
      );
    } finally {
      setApprovingAll(false);
    }
  };

  const selectedBank = banks.find((bank) => bank.id === selectedBankId);

  // --- Wizard chrome: one step visible at a time; Next is gated where a prerequisite is missing.
  const [step, setStep] = useState<WizardStep>('bank');
  const stepIndex = WIZARD_STEPS.indexOf(step);
  // Bank + Assign work with existing data; the bank-scoped steps need a selected bank first.
  const canAccess = (target: WizardStep) =>
    target === 'bank' || target === 'assign' || Boolean(selectedBankId);
  const prevStep = stepIndex > 0 ? WIZARD_STEPS[stepIndex - 1] : null;
  const nextStep = stepIndex < WIZARD_STEPS.length - 1 ? WIZARD_STEPS[stepIndex + 1] : null;
  const nextBlocked = !nextStep || !canAccess(nextStep);

  // --- Review step: client-side filtering + bulk selection over the already-loaded questions.
  const [statusFilter, setStatusFilter] = useState<'ALL' | BankQuestion['status']>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | QuestionType>('ALL');
  const [selectedReview, setSelectedReview] = useState<string[]>([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [editing, setEditing] = useState<BankQuestion | 'new' | null>(null);

  const presentTypes = useMemo(
    () => Array.from(new Set(questions.map((question) => question.type))),
    [questions],
  );

  const reviewQuestions = useMemo(
    () =>
      questions.filter((question) => {
        if (statusFilter !== 'ALL' && question.status !== statusFilter) return false;
        if (typeFilter !== 'ALL' && question.type !== typeFilter) return false;
        return true;
      }),
    [questions, statusFilter, typeFilter],
  );

  const filteredReviewIds = reviewQuestions.map((question) => question.id);
  const allReviewSelected =
    filteredReviewIds.length > 0 && filteredReviewIds.every((id) => selectedReview.includes(id));
  const someReviewSelected = filteredReviewIds.some((id) => selectedReview.includes(id));

  const toggleReviewOne = (id: string) =>
    setSelectedReview((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const clearReview = () => setSelectedReview([]);
  const toggleSelectAllReview = () => {
    if (allReviewSelected) {
      setSelectedReview((prev) => prev.filter((id) => !filteredReviewIds.includes(id)));
    } else {
      setSelectedReview((prev) => Array.from(new Set([...prev, ...filteredReviewIds])));
    }
  };

  // Bulk approve/reject: loop the existing per-question patch mutation over the selection and await
  // all, relying on its built-in invalidation of the bank/questions key to refresh the list.
  const bulkSetStatus = async (status: BankQuestion['status']) => {
    if (bulkBusy || selectedReview.length === 0) return;
    setBulkBusy(true);
    try {
      await Promise.all(
        selectedReview.map((id) => patchQuestion.mutateAsync({ id, status }).catch(() => null)),
      );
    } finally {
      setBulkBusy(false);
      clearReview();
    }
  };

  const editorKey = editing === 'new' ? 'new' : editing?.id ?? 'closed';

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-label text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            {t('eyebrow')}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl font-bold tracking-tight">{t('title')}</h1>
            <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 font-label text-xs font-semibold tabular-nums text-muted-foreground">
              {t('headerCount', { count: assessments.length })}
            </span>
          </div>
          <p className="mt-1 max-w-2xl text-muted-foreground">{t('desc')}</p>
        </div>
        <button
          type="button"
          onClick={() => setStep('publish')}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-150 ease-out hover:-translate-y-px hover:bg-primary/90 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Plus className="h-4 w-4" />
          {t('newAssessment')}
        </button>
      </div>

      <nav
        aria-label={t('wizardNav')}
        className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-border/70 bg-card p-3 shadow-soft"
      >
        {WIZARD_STEPS.map((wizardStep, index) => {
          const active = wizardStep === step;
          const complete = index < stepIndex;
          const accessible = canAccess(wizardStep);
          return (
            <button
              key={wizardStep}
              type="button"
              disabled={!accessible}
              aria-current={active ? 'step' : undefined}
              onClick={() => accessible && setStep(wizardStep)}
              className={cn(
                'flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors',
                active ? 'bg-primary/10' : 'hover:bg-secondary/60',
                !accessible && 'cursor-not-allowed opacity-50',
              )}
            >
              <span
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full font-label text-xs font-bold tabular-nums transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : complete
                      ? 'bg-primary/20 text-primary'
                      : 'bg-secondary text-muted-foreground',
                )}
              >
                {complete ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <span
                className={cn(
                  'font-label text-xs font-semibold uppercase tracking-[0.12em]',
                  active
                    ? 'text-primary'
                    : complete
                      ? 'text-foreground'
                      : 'text-muted-foreground',
                )}
              >
                {t(STEP_LABEL_KEYS[wizardStep])}
              </span>
            </button>
          );
        })}
      </nav>

      {assessments.some((a) => a.mode === 'GAME') && (
        <section className="space-y-4 rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-secondary/15 text-accent-secondary">
              <Radio className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-lg font-semibold">{t('live.title')}</h2>
              <p className="text-sm text-muted-foreground">{t('live.desc')}</p>
            </div>
          </div>
          <div className="grid gap-3">
            {assessments
              .filter((a) => a.mode === 'GAME')
              .map((a) => (
                <LiveGameRow key={a.id} assessment={a} />
              ))}
          </div>
        </section>
      )}

      {step === 'bank' && (
        <section className="space-y-4 rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Library className="h-5 w-5" />
            </span>
            <h2 className="font-display text-lg font-semibold">{t('banksTitle')}</h2>
          </div>
          <form
            className="space-y-3"
            onSubmit={async (event) => {
              event.preventDefault();
              const bank = await createBank.mutateAsync({
                title,
                topic: topic || undefined,
                contentIds: bankContentIds.length ? bankContentIds : undefined,
              });
              setSelectedBankId(bank.id);
              setTitle('');
              setTopic('');
              setBankContentIds([]);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="bankTitle">{t('bankTitleLabel')}</Label>
              <Input id="bankTitle" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankTopic">{t('bankTopicLabel')}</Label>
              <Input id="bankTopic" value={topic} onChange={(e) => setTopic(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{t('bankMaterialsLabel')}</Label>
              <p className="text-[11px] text-muted-foreground">{t('bankMaterialsHint')}</p>
              {materials.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t('bankNoMaterials')}</p>
              ) : (
                <div className="max-h-40 space-y-0.5 overflow-y-auto rounded-xl border border-border/70 bg-background p-2">
                  {materials.map((material) => (
                    <label
                      key={material.id}
                      className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-secondary/50"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 shrink-0 accent-[hsl(var(--primary))]"
                        checked={bankContentIds.includes(material.id)}
                        onChange={(event) =>
                          setBankContentIds((prev) =>
                            event.target.checked
                              ? [...prev, material.id]
                              : prev.filter((id) => id !== material.id),
                          )
                        }
                      />
                      <span className="truncate">{material.title}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={createBank.isPending}>
              {t('createBank')}
            </Button>
          </form>
          <div className="space-y-2">
            {banks.map((bank) => {
              const approvedPct =
                bank.questionCount > 0
                  ? Math.round((bank.approvedCount / bank.questionCount) * 100)
                  : 0;
              return (
                <button
                  key={bank.id}
                  type="button"
                  onClick={() => {
                    setSelectedBankId(bank.id);
                    clearReview();
                  }}
                  className={`w-full rounded-xl border p-3 text-left text-sm transition-colors ${
                    selectedBankId === bank.id
                      ? 'border-primary/40 bg-primary/10 text-primary shadow-soft'
                      : 'border-border/70 hover:border-border hover:bg-secondary/50'
                  }`}
                >
                  <span className="block truncate font-display font-semibold">{bank.title}</span>
                  <span className="mt-1 block text-xs tabular-nums text-muted-foreground">
                    {t('approvedCount', { approved: bank.approvedCount, total: bank.questionCount })}
                  </span>
                  <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-border/60">
                    <span
                      className="block h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${approvedPct}%` }}
                    />
                  </span>
                  {bank.materials.length > 0 && (
                    <span className="mt-2 flex items-center gap-1.5 truncate text-[11px] text-muted-foreground">
                      <FileText className="h-3 w-3 shrink-0" />
                      <span className="truncate">
                        {bank.materials.map((m) => m.title).join(', ')}
                      </span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {step === 'generate' && (
        <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-secondary/15 text-accent-secondary">
              <Wand2 className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-lg font-semibold">{selectedBank?.title ?? t('selectBank')}</h2>
              <p className="text-sm text-muted-foreground">{t('topicHelp')}</p>
            </div>
          </div>
          {selectedBankId && (
            <form
              className="mt-4 flex flex-col gap-3 md:flex-row"
              onSubmit={async (event) => {
                event.preventDefault();
                await generate.mutateAsync({
                  topic: draftTopic || undefined,
                  count: 12,
                  style: draftStyle,
                });
                setDraftTopic('');
              }}
            >
              <Input
                value={draftTopic}
                onChange={(event) => setDraftTopic(event.target.value)}
                placeholder={t('topicPlaceholder')}
              />
              <select
                value={draftStyle}
                onChange={(event) => setDraftStyle(event.target.value as BankQuestionStyle)}
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                aria-label={t('questionType')}
              >
                {STYLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </option>
                ))}
              </select>
              <Button type="submit" disabled={generate.isPending}>
                <Sparkles className="h-4 w-4" />
                {generate.isPending ? t('generating') : t('generateDrafts')}
              </Button>
            </form>
          )}
          {generate.isError && (
            <p className="mt-2 text-sm text-destructive">{mutErr(generate.error, t('genericError'))}</p>
          )}
        </section>
      )}

      {step === 'review' && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold">
                {selectedBank?.title ?? t('selectBank')}
              </h2>
              <p className="text-sm text-muted-foreground">{t('reviewDesc')}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(pendingQuestions.length > 0 || approvingAll) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={approveAllPending}
                  disabled={approvingAll || pendingQuestions.length === 0}
                >
                  <Check className="h-3.5 w-3.5" />
                  {approvingAll
                    ? t('approvingAll')
                    : t('approveAll', { count: pendingQuestions.length })}
                </Button>
              )}
              <Button
                size="sm"
                variant="gradient"
                disabled={!selectedBankId}
                onClick={() => setEditing('new')}
              >
                <Plus className="h-3.5 w-3.5" />
                {t('addQuestion')}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div role="group" aria-label={t('filterByStatus')} className="flex flex-wrap items-center gap-2">
              {STATUS_FILTERS.map((chip) => {
                const active = statusFilter === chip.value;
                return (
                  <button
                    key={chip.value}
                    type="button"
                    onClick={() => setStatusFilter(chip.value)}
                    aria-pressed={active}
                    className={cn(
                      'rounded-full px-3.5 py-1.5 font-label text-xs font-semibold transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                      active
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-secondary text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {t(chip.labelKey)}
                  </button>
                );
              })}
            </div>
            {presentTypes.length > 1 && (
              <div role="group" aria-label={t('filterByType')} className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTypeFilter('ALL')}
                  aria-pressed={typeFilter === 'ALL'}
                  className={cn(
                    'rounded-full px-3 py-1 font-label text-[11px] font-semibold transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                    typeFilter === 'ALL'
                      ? 'bg-primary/15 text-primary'
                      : 'bg-secondary/60 text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t('filterAllTypes')}
                </button>
                {presentTypes.map((questionType) => {
                  const active = typeFilter === questionType;
                  return (
                    <button
                      key={questionType}
                      type="button"
                      onClick={() => setTypeFilter(questionType)}
                      aria-pressed={active}
                      className={cn(
                        'rounded-full px-3 py-1 font-label text-[11px] font-semibold transition-colors',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                        active
                          ? 'bg-primary/15 text-primary'
                          : 'bg-secondary/60 text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {t(QUESTION_TYPE_LABEL_KEYS[questionType])}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {selectedReview.length > 0 && (
            <div
              role="region"
              aria-label={t('bulkActions')}
              className="sticky top-2 z-10 flex flex-wrap items-center gap-1 rounded-2xl border border-primary/25 bg-secondary px-3 py-2 shadow-soft"
            >
              <span className="px-2 font-label text-sm font-bold tabular-nums text-primary">
                {t('selectedCount', { count: selectedReview.length })}
              </span>
              <span className="mx-1 h-4 w-px bg-primary/25" aria-hidden="true" />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-primary hover:bg-primary/10 hover:text-primary"
                disabled={bulkBusy}
                onClick={() => bulkSetStatus('APPROVED')}
              >
                <Check className="h-4 w-4" />
                {t('approveSelected')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={bulkBusy}
                onClick={() => bulkSetStatus('REJECTED')}
              >
                <X className="h-4 w-4" />
                {t('rejectSelected')}
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="ml-auto text-muted-foreground hover:text-foreground"
                onClick={clearReview}
                aria-label={t('clearSelection')}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {reviewQuestions.length > 0 && (
            <label className="flex cursor-pointer items-center gap-2 px-1 text-sm text-muted-foreground">
              <input
                type="checkbox"
                className="h-4 w-4 cursor-pointer accent-[hsl(var(--primary))]"
                aria-label={t('selectAll')}
                checked={allReviewSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someReviewSelected && !allReviewSelected;
                }}
                onChange={toggleSelectAllReview}
              />
              {t('selectAll')}
            </label>
          )}

          <div className="grid gap-3">
            {reviewQuestions.map((question) => (
              <div
                key={question.id}
                className={cn(
                  'rounded-xl border bg-card p-4 shadow-soft transition-colors',
                  selectedReview.includes(question.id)
                    ? 'border-primary/50 bg-primary/[0.06]'
                    : question.status === 'APPROVED'
                      ? 'border-primary/40 bg-primary/[0.04]'
                      : question.status === 'REJECTED'
                        ? 'border-destructive/30'
                        : 'border-border/70',
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-[hsl(var(--primary))]"
                      aria-label={t('selectRow')}
                      checked={selectedReview.includes(question.id)}
                      onChange={() => toggleReviewOne(question.id)}
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={question.status === 'APPROVED' ? 'success' : 'secondary'}>
                          {t(QUESTION_TYPE_LABEL_KEYS[question.type])}
                        </Badge>
                        {question.status === 'REJECTED' && (
                          <span className="font-label text-[10px] font-semibold uppercase tracking-wide text-destructive">
                            {t('filterRejected')}
                          </span>
                        )}
                      </div>
                      <p className="mt-3 font-medium text-foreground">{question.prompt}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t('answersLabel', { answers: question.acceptableAnswers.join(', ') })}
                      </p>
                      {question.explanation && (
                        <p className="mt-1 text-sm text-muted-foreground">{question.explanation}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditing(question)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      {t('editQuestion')}
                    </Button>
                    <Button
                      size="sm"
                      variant={question.status === 'APPROVED' ? 'default' : 'outline'}
                      onClick={() => patchQuestion.mutate({ id: question.id, status: 'APPROVED' })}
                    >
                      <Check className="h-3.5 w-3.5" />
                      {t('approve')}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => patchQuestion.mutate({ id: question.id, status: 'REJECTED' })}
                    >
                      <X className="h-3.5 w-3.5" />
                      {t('reject')}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {reviewQuestions.length === 0 && (
              <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                {questions.length === 0 ? t('reviewEmpty') : t('reviewNoMatch')}
              </p>
            )}
          </div>
        </section>
      )}

      {step === 'publish' && (
        <section className="mx-auto w-full max-w-2xl">
        <form
          className="space-y-4 rounded-2xl border border-border/70 bg-card p-5 shadow-soft"
          onSubmit={async (event) => {
            event.preventDefault();
            // Grading fields ride along with the existing create mutation; the
            // backend createAssessmentSchema accepts strictScoring/wrongPenalty/
            // partialCredit. Built as a variable so the extra keys pass TS's
            // excess-property check without changing the shared hook's input type.
            const payload = {
              bankId: selectedBankId ?? undefined,
              title: assessmentTitle,
              questionIds: selectedQuestions,
              publish: true,
              mode,
              maxAttempts,
              strictScoring,
              ...(strictScoring ? { wrongPenalty, partialCredit } : {}),
              ...(mode === 'GAME' ? { secondsPerQuestion } : {}),
            };
            const assessment = await createAssessment.mutateAsync(payload);
            setAssessmentId(assessment.id);
            setResultsId(assessment.id);
            setAssessmentTitle('');
            setSelectedQuestions([]);
          }}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ClipboardList className="h-5 w-5" />
            </span>
            <h2 className="font-display text-lg font-semibold">{t('publishTitle')}</h2>
          </div>
          <Input
            value={assessmentTitle}
            onChange={(event) => setAssessmentTitle(event.target.value)}
            placeholder={t('assessmentTitlePlaceholder')}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="font-label text-[11px] uppercase tracking-wider text-muted-foreground">
                {t('modeLabel')}
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={mode === 'WRITTEN' ? 'default' : 'outline'}
                  onClick={() => setMode('WRITTEN')}
                >
                  {t('modeWritten')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={mode === 'GAME' ? 'spark' : 'outline'}
                  onClick={() => setMode('GAME')}
                >
                  {t('modeGame')}
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="maxAttempts">{t('maxAttemptsLabel')}</Label>
              <Input
                id="maxAttempts"
                type="number"
                min={1}
                max={5}
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(Math.max(1, Math.min(5, Number(e.target.value) || 1)))}
              />
            </div>
          </div>
          {mode === 'GAME' && (
            <div className="space-y-1">
              <Label htmlFor="secs">{t('secondsLabel')}</Label>
              <Input
                id="secs"
                type="number"
                min={5}
                max={120}
                value={secondsPerQuestion}
                onChange={(e) =>
                  setSecondsPerQuestion(Math.max(5, Math.min(120, Number(e.target.value) || 20)))
                }
              />
            </div>
          )}
          <div className="space-y-3 rounded-xl border border-border/70 bg-secondary/30 p-4">
            <p className="font-label text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t('gradingLabel')}
            </p>
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-foreground">{t('strictScoringLabel')}</p>
              <GradingToggle
                checked={strictScoring}
                onChange={setStrictScoring}
                label={t('strictScoringLabel')}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">{t('strictScoringHint')}</p>
            {strictScoring && (
              <div className="space-y-3 border-t border-border/60 pt-3">
                <div className="space-y-1">
                  <Label htmlFor="wrongPenalty">{t('wrongPenaltyLabel')}</Label>
                  <Input
                    id="wrongPenalty"
                    type="number"
                    min={0}
                    max={1}
                    step={0.05}
                    value={wrongPenalty}
                    onChange={(e) =>
                      setWrongPenalty(Math.max(0, Math.min(1, Number(e.target.value) || 0)))
                    }
                  />
                  <p className="text-[11px] text-muted-foreground">{t('wrongPenaltyHint')}</p>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{t('partialCreditLabel')}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{t('partialCreditHint')}</p>
                  </div>
                  <GradingToggle
                    checked={partialCredit}
                    onChange={setPartialCredit}
                    label={t('partialCreditLabel')}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="max-h-72 space-y-0.5 overflow-y-auto rounded-xl border border-border/70 bg-background p-2">
            {approvedQuestions.map((question) => (
              <label
                key={question.id}
                className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-secondary/50"
              >
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[hsl(var(--primary))]"
                  checked={selectedQuestions.includes(question.id)}
                  onChange={() =>
                    setSelectedQuestions((prev) =>
                      prev.includes(question.id)
                        ? prev.filter((id) => id !== question.id)
                        : [...prev, question.id],
                    )
                  }
                />
                <span>{question.prompt}</span>
              </label>
            ))}
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={selectedQuestions.length === 0 || createAssessment.isPending}
          >
            {t('publishSelected')}
          </Button>
          {createAssessment.isError && (
            <p className="text-sm text-destructive">{mutErr(createAssessment.error, t('genericError'))}</p>
          )}
        </form>
        </section>
      )}

      {step === 'assign' && (
        <section className="mx-auto w-full max-w-2xl">
        <form
          className="space-y-4 rounded-2xl border border-border/70 bg-card p-5 shadow-soft"
          onSubmit={async (event) => {
            event.preventDefault();
            await assignAssessment.mutateAsync({
              assessmentId,
              learnerIds,
              ...(dueAt ? { dueAt } : {}),
            });
            setLearnerIds([]);
            setDueAt('');
          }}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-secondary/15 text-accent-secondary">
              <UserCheck className="h-5 w-5" />
            </span>
            <h2 className="font-display text-lg font-semibold">{t('assignTitle')}</h2>
          </div>
          <select
            value={assessmentId}
            onChange={(event) => setAssessmentId(event.target.value)}
            aria-label={t('assignTitle')}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            required
          >
            <option value="">{t('chooseAssessment')}</option>
            {assessments.map((assessment) => (
              <option key={assessment.id} value={assessment.id}>
                {assessment.title}
              </option>
            ))}
          </select>
          <div className="max-h-72 space-y-0.5 overflow-y-auto rounded-xl border border-border/70 bg-background p-2">
            {students.filter((s) => s.active).map((student) => (
              <label
                key={student.id}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-secondary/50"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 shrink-0 accent-[hsl(var(--primary))]"
                  checked={learnerIds.includes(student.id)}
                  onChange={() =>
                    setLearnerIds((prev) =>
                      prev.includes(student.id)
                        ? prev.filter((id) => id !== student.id)
                        : [...prev, student.id],
                    )
                  }
                />
                {student.name ?? student.email ?? student.username}
              </label>
            ))}
          </div>
          <div className="space-y-1">
            <Label htmlFor="dueAt">{t('dueDateLabel')}</Label>
            <Input
              id="dueAt"
              type="date"
              value={dueAt}
              onChange={(event) => setDueAt(event.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">{t('dueDateHint')}</p>
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={!assessmentId || learnerIds.length === 0 || assignAssessment.isPending}
          >
            {t('assignButton')}
          </Button>
          {assignAssessment.isError && (
            <p className="text-sm text-destructive">{mutErr(assignAssessment.error, t('genericError'))}</p>
          )}
        </form>
        </section>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-4">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!prevStep}
          onClick={() => prevStep && setStep(prevStep)}
        >
          <ChevronLeft className="h-4 w-4" />
          {t('stepBack')}
        </Button>
        {nextStep && (
          <div className="flex items-center gap-3">
            {nextBlocked && step === 'bank' && (
              <span className="text-xs text-muted-foreground">{t('selectBankFirst')}</span>
            )}
            <Button
              type="button"
              size="sm"
              disabled={nextBlocked}
              onClick={() => !nextBlocked && nextStep && setStep(nextStep)}
            >
              {t('stepNext')}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <QuestionEditor
        key={editorKey}
        open={editing !== null}
        onClose={() => setEditing(null)}
        bankId={selectedBankId}
        question={editing && editing !== 'new' ? editing : undefined}
      />

      <section className="space-y-4 rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BarChart3 className="h-5 w-5" />
          </span>
          <h2 className="font-display text-lg font-semibold">{t('resultsTitle')}</h2>
        </div>
        <select
          value={resultsId}
          onChange={(event) => setResultsId(event.target.value)}
          aria-label={t('resultsTitle')}
          className="w-full max-w-md rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">{t('chooseAssessment')}</option>
          {assessments.map((assessment) => (
            <option key={assessment.id} value={assessment.id}>
              {assessment.title}
            </option>
          ))}
        </select>
        <ResultsSection assessmentId={resultsId} />
      </section>
    </div>
  );
}
