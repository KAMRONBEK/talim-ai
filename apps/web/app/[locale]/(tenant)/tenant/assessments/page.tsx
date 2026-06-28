'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
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
import { LeaderboardTable } from '@/components/learner/leaderboard-table';

function mutErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;
}

function ResultsSection({ assessmentId }: { assessmentId: string }) {
  const t = useTranslations('tenant.assessments');
  const { data: results } = useAssessmentResults(assessmentId || null);
  const { data: board } = useAssessmentLeaderboard(assessmentId || null);
  if (!assessmentId) {
    return <p className="text-sm text-muted-foreground">{t('chooseToSeeResults')}</p>;
  }
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
      <div className="overflow-hidden rounded-xl border border-border/70">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border/70 bg-muted/40">
            <tr className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-2">{t('colStudent')}</th>
              <th className="px-3 py-2">{t('colStatus')}</th>
              <th className="px-3 py-2">{t('colBestScore')}</th>
              {results.mode === 'GAME' && <th className="px-3 py-2">{t('colPoints')}</th>}
              <th className="px-3 py-2">{t('colAttempts')}</th>
            </tr>
          </thead>
          <tbody>
            {results.learners.map((l) => (
              <tr key={l.learnerId} className="border-b border-border/60 last:border-0">
                <td className="px-3 py-2 font-medium">{l.learnerName}</td>
                <td className="px-3 py-2">
                  {l.submitted ? (
                    <Badge variant="success">{t('statusSubmitted')}</Badge>
                  ) : (
                    <span className="text-muted-foreground">{t('statusNotYet')}</span>
                  )}
                </td>
                <td className="px-3 py-2 tabular-nums">{l.bestScore != null ? `${Math.round(l.bestScore)}%` : '—'}</td>
                {results.mode === 'GAME' && <td className="px-3 py-2 tabular-nums">{l.bestPoints}</td>}
                <td className="px-3 py-2 tabular-nums">{l.attempts}</td>
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
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">{t('leaderboard')}</h3>
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
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
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

  const selectedBank = banks.find((bank) => bank.id === selectedBankId);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{t('eyebrow')}</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="mt-1 text-muted-foreground">{t('desc')}</p>
      </div>

      <section className="grid gap-6 lg:grid-cols-[20rem_1fr]">
        <aside className="space-y-4 rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <h2 className="font-display text-lg font-semibold">{t('banksTitle')}</h2>
          <form
            className="space-y-3"
            onSubmit={async (event) => {
              event.preventDefault();
              const bank = await createBank.mutateAsync({ title, topic: topic || undefined });
              setSelectedBankId(bank.id);
              setTitle('');
              setTopic('');
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
            <Button type="submit" disabled={createBank.isPending}>
              {t('createBank')}
            </Button>
          </form>
          <div className="space-y-2">
            {banks.map((bank) => (
              <button
                key={bank.id}
                type="button"
                onClick={() => setSelectedBankId(bank.id)}
                className={`w-full rounded-xl border p-3 text-left text-sm transition-colors ${
                  selectedBankId === bank.id
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'border-border/70 hover:bg-secondary/50'
                }`}
              >
                <span className="block font-medium">{bank.title}</span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {t('approvedCount', { approved: bank.approvedCount, total: bank.questionCount })}
                </span>
              </button>
            ))}
          </div>
        </aside>

        <main className="space-y-6">
          <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
            <h2 className="font-display text-lg font-semibold">{selectedBank?.title ?? t('selectBank')}</h2>
            <p className="text-sm text-muted-foreground">{t('topicHelp')}</p>
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
                  className="rounded-lg border border-border/70 bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  aria-label={t('questionType')}
                >
                  <option value="mixed">{t('styleMixed')}</option>
                  <option value="multipleChoice">{t('styleMultipleChoice')}</option>
                  <option value="trueFalse">{t('styleTrueFalse')}</option>
                  <option value="written">{t('styleWritten')}</option>
                  <option value="numeric">{t('styleNumeric')}</option>
                </select>
                <Button type="submit" disabled={generate.isPending}>
                  {generate.isPending ? t('generating') : t('generateDrafts')}
                </Button>
              </form>
            )}
            {generate.isError && (
              <p className="mt-2 text-sm text-destructive">{mutErr(generate.error, t('genericError'))}</p>
            )}
          </section>

          <section className="grid gap-3">
            {questions.map((question) => (
              <div key={question.id} className="rounded-xl border border-border/70 bg-card p-4 shadow-soft">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Badge variant={question.status === 'APPROVED' ? 'success' : 'secondary'}>{question.type}</Badge>
                    <p className="mt-3 font-medium">{question.prompt}</p>
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
                      {t('approve')}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => patchQuestion.mutate({ id: question.id, status: 'REJECTED' })}
                    >
                      {t('reject')}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </section>
        </main>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <form
          className="space-y-4 rounded-2xl border border-border/70 bg-card p-5 shadow-soft"
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
          <h2 className="font-display text-lg font-semibold">{t('publishTitle')}</h2>
          <Input
            value={assessmentTitle}
            onChange={(event) => setAssessmentTitle(event.target.value)}
            placeholder={t('assessmentTitlePlaceholder')}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>{t('modeLabel')}</Label>
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
          <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-border/70 p-3">
            {approvedQuestions.map((question) => (
              <label key={question.id} className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 accent-[hsl(var(--primary))]"
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
          <Button type="submit" disabled={selectedQuestions.length === 0 || createAssessment.isPending}>
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
          <h2 className="font-display text-lg font-semibold">{t('assignTitle')}</h2>
          <select
            value={assessmentId}
            onChange={(event) => setAssessmentId(event.target.value)}
            aria-label={t('assignTitle')}
            className="w-full rounded-lg border border-border/70 bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            required
          >
            <option value="">{t('chooseAssessment')}</option>
            {assessments.map((assessment) => (
              <option key={assessment.id} value={assessment.id}>
                {assessment.title}
              </option>
            ))}
          </select>
          <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-border/70 p-3">
            {students.filter((s) => s.active).map((student) => (
              <label key={student.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[hsl(var(--primary))]"
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
        <h2 className="font-display text-lg font-semibold">{t('resultsTitle')}</h2>
        <select
          value={resultsId}
          onChange={(event) => setResultsId(event.target.value)}
          aria-label={t('resultsTitle')}
          className="w-full max-w-md rounded-lg border border-border/70 bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
