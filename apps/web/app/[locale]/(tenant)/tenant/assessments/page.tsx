'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  BarChart3,
  Check,
  ClipboardList,
  FileText,
  Library,
  Plus,
  Sparkles,
  Trophy,
  UserCheck,
  Wand2,
  X,
} from 'lucide-react';
import { Badge, Button, Input, Label } from '@talim/ui';
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
  useTenantAssessments,
} from '@/hooks/useAssessments';
import { useTenantStudents } from '@/hooks/useTenant';
import { useTenantContents } from '@/hooks/useTenantContent';
import { LeaderboardTable } from '@/components/learner/leaderboard-table';

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
  const [draftStyle, setDraftStyle] = useState<
    'mixed' | 'multipleChoice' | 'trueFalse' | 'written' | 'numeric'
  >('mixed');
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [assessmentTitle, setAssessmentTitle] = useState('');
  const [assessmentId, setAssessmentId] = useState('');
  const [learnerIds, setLearnerIds] = useState<string[]>([]);
  const [mode, setMode] = useState<'WRITTEN' | 'GAME'>('WRITTEN');
  const [secondsPerQuestion, setSecondsPerQuestion] = useState(20);
  const [maxAttempts, setMaxAttempts] = useState(1);
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
        <a
          href="#new-assessment"
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-150 ease-out hover:-translate-y-px hover:bg-primary/90 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Plus className="h-4 w-4" />
          {t('newAssessment')}
        </a>
      </div>

      <section className="grid gap-6 lg:grid-cols-[20rem_1fr]">
        <aside className="space-y-4 rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
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
                  onClick={() => setSelectedBankId(bank.id)}
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
        </aside>

        <main className="space-y-6">
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
                  onChange={(event) =>
                    setDraftStyle(event.target.value as typeof draftStyle)
                  }
                  className="rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  aria-label={t('questionType')}
                >
                  <option value="mixed">{t('styleMixed')}</option>
                  <option value="multipleChoice">{t('styleMultipleChoice')}</option>
                  <option value="trueFalse">{t('styleTrueFalse')}</option>
                  <option value="written">{t('styleWritten')}</option>
                  <option value="numeric">{t('styleNumeric')}</option>
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

          <section className="space-y-3">
            {(pendingQuestions.length > 0 || approvingAll) && (
              <div className="flex justify-end">
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
              </div>
            )}
            <div className="grid gap-3">
              {questions.map((question) => (
              <div
                key={question.id}
                className={`rounded-xl border bg-card p-4 shadow-soft transition-colors ${
                  question.status === 'APPROVED'
                    ? 'border-primary/40 bg-primary/[0.04]'
                    : 'border-border/70'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Badge variant={question.status === 'APPROVED' ? 'success' : 'secondary'}>{question.type}</Badge>
                    <p className="mt-3 font-medium text-foreground">{question.prompt}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t('answersLabel', { answers: question.acceptableAnswers.join(', ') })}
                    </p>
                    {question.explanation && (
                      <p className="mt-1 text-sm text-muted-foreground">{question.explanation}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
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
            </div>
          </section>
        </main>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <form
          id="new-assessment"
          className="scroll-mt-24 space-y-4 rounded-2xl border border-border/70 bg-card p-5 shadow-soft"
          onSubmit={async (event) => {
            event.preventDefault();
            const assessment = await createAssessment.mutateAsync({
              bankId: selectedBankId ?? undefined,
              title: assessmentTitle,
              questionIds: selectedQuestions,
              publish: true,
              mode,
              maxAttempts,
              ...(mode === 'GAME' ? { secondsPerQuestion } : {}),
            });
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

        <form
          className="space-y-4 rounded-2xl border border-border/70 bg-card p-5 shadow-soft"
          onSubmit={async (event) => {
            event.preventDefault();
            await assignAssessment.mutateAsync({ assessmentId, learnerIds });
            setLearnerIds([]);
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
