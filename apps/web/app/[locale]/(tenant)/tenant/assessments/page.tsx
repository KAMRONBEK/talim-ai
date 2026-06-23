'use client';

import { useMemo, useState } from 'react';
import { Button, Input, Label } from '@talim/ui';
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

function mutErr(e: unknown): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Something went wrong. Please try again.';
}

function ResultsSection({ assessmentId }: { assessmentId: string }) {
  const { data: results } = useAssessmentResults(assessmentId || null);
  const { data: board } = useAssessmentLeaderboard(assessmentId || null);
  if (!assessmentId) {
    return <p className="text-sm text-muted-foreground">Choose an assessment to see results.</p>;
  }
  if (!results) return <p className="text-sm text-muted-foreground">Loading results…</p>;
  const submitted = results.learners.filter((l) => l.submitted).length;
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {submitted}/{results.learners.length} learners submitted · {results.mode === 'GAME' ? 'Game' : 'Written'}
      </p>
      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="px-3 py-2">Student</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Best score</th>
              {results.mode === 'GAME' && <th className="px-3 py-2">Points</th>}
              <th className="px-3 py-2">Attempts</th>
            </tr>
          </thead>
          <tbody>
            {results.learners.map((l) => (
              <tr key={l.learnerId} className="border-b last:border-0">
                <td className="px-3 py-2">{l.learnerName}</td>
                <td className="px-3 py-2">
                  {l.submitted ? (
                    <span className="text-emerald-600">Submitted</span>
                  ) : (
                    <span className="text-muted-foreground">Not yet</span>
                  )}
                </td>
                <td className="px-3 py-2">{l.bestScore != null ? `${Math.round(l.bestScore)}%` : '—'}</td>
                {results.mode === 'GAME' && <td className="px-3 py-2">{l.bestPoints}</td>}
                <td className="px-3 py-2">{l.attempts}</td>
              </tr>
            ))}
            {results.learners.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                  Not assigned to anyone yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {board && board.rows.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Leaderboard</h3>
          <LeaderboardTable rows={board.rows} mode={board.mode} />
        </div>
      )}
    </div>
  );
}

export default function TenantAssessmentsPage() {
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
        <h1 className="text-2xl font-bold">Assessments</h1>
        <p className="text-muted-foreground">
          Generate many draft questions, approve the best ones, and assign written tasks.
        </p>
      </div>

      <section className="grid gap-6 lg:grid-cols-[20rem_1fr]">
        <aside className="space-y-4 rounded-2xl border bg-card p-4">
          <h2 className="font-semibold">Question banks</h2>
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
              <Label htmlFor="bankTitle">Title</Label>
              <Input id="bankTitle" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankTopic">Topic</Label>
              <Input id="bankTopic" value={topic} onChange={(e) => setTopic(e.target.value)} />
            </div>
            <Button type="submit" disabled={createBank.isPending}>
              Create bank
            </Button>
          </form>
          <div className="space-y-2">
            {banks.map((bank) => (
              <button
                key={bank.id}
                type="button"
                onClick={() => setSelectedBankId(bank.id)}
                className={`w-full rounded-xl border p-3 text-left text-sm ${
                  selectedBankId === bank.id ? 'bg-secondary' : 'hover:bg-secondary/50'
                }`}
              >
                <span className="block font-medium">{bank.title}</span>
                <span className="text-muted-foreground">
                  {bank.approvedCount}/{bank.questionCount} approved
                </span>
              </button>
            ))}
          </div>
        </aside>

        <main className="space-y-6">
          <section className="rounded-2xl border bg-card p-4">
            <h2 className="font-semibold">{selectedBank?.title ?? 'Select a question bank'}</h2>
            <p className="text-sm text-muted-foreground">
              Topic mode can create related questions beyond the uploaded material. Section-scoped generation stays closer to material.
            </p>
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
                  placeholder="Topic prompt, e.g. Algebra equations"
                />
                <select
                  value={draftStyle}
                  onChange={(event) =>
                    setDraftStyle(event.target.value as typeof draftStyle)
                  }
                  className="rounded-lg border bg-background px-3 py-2 text-sm"
                  aria-label="Question type"
                >
                  <option value="mixed">Mixed (all types)</option>
                  <option value="multipleChoice">Multiple choice</option>
                  <option value="trueFalse">True / False</option>
                  <option value="written">Written (short answer)</option>
                  <option value="numeric">Numeric</option>
                </select>
                <Button type="submit" disabled={generate.isPending}>
                  {generate.isPending ? 'Generating…' : 'Generate drafts'}
                </Button>
              </form>
            )}
            {generate.isError && (
              <p className="mt-2 text-sm text-destructive">{mutErr(generate.error)}</p>
            )}
          </section>

          <section className="grid gap-3">
            {questions.map((question) => (
              <div key={question.id} className="rounded-xl border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span className="rounded-full bg-secondary px-2 py-1 text-xs">{question.type}</span>
                    <p className="mt-3 font-medium">{question.prompt}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Answers: {question.acceptableAnswers.join(', ')}
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
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => patchQuestion.mutate({ id: question.id, status: 'REJECTED' })}
                    >
                      Reject
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
          className="space-y-4 rounded-2xl border bg-card p-4"
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
          <h2 className="font-semibold">Publish assessment</h2>
          <Input
            value={assessmentTitle}
            onChange={(event) => setAssessmentTitle(event.target.value)}
            placeholder="Assessment title"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Mode</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={mode === 'WRITTEN' ? 'default' : 'outline'}
                  onClick={() => setMode('WRITTEN')}
                >
                  Written
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={mode === 'GAME' ? 'default' : 'outline'}
                  onClick={() => setMode('GAME')}
                >
                  Game
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="maxAttempts">Max attempts</Label>
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
              <Label htmlFor="secs">Seconds per question</Label>
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
          <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border p-3">
            {approvedQuestions.map((question) => (
              <label key={question.id} className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
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
            Publish selected
          </Button>
          {createAssessment.isError && (
            <p className="text-sm text-destructive">{mutErr(createAssessment.error)}</p>
          )}
        </form>

        <form
          className="space-y-4 rounded-2xl border bg-card p-4"
          onSubmit={async (event) => {
            event.preventDefault();
            await assignAssessment.mutateAsync({ assessmentId, learnerIds });
            setLearnerIds([]);
          }}
        >
          <h2 className="font-semibold">Assign assessment</h2>
          <select
            value={assessmentId}
            onChange={(event) => setAssessmentId(event.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            required
          >
            <option value="">Choose assessment</option>
            {assessments.map((assessment) => (
              <option key={assessment.id} value={assessment.id}>
                {assessment.title}
              </option>
            ))}
          </select>
          <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border p-3">
            {students.filter((s) => s.active).map((student) => (
              <label key={student.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
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
            Assign
          </Button>
          {assignAssessment.isError && (
            <p className="text-sm text-destructive">{mutErr(assignAssessment.error)}</p>
          )}
        </form>
      </section>

      <section className="space-y-4 rounded-2xl border bg-card p-4">
        <h2 className="font-semibold">Results &amp; leaderboard</h2>
        <select
          value={resultsId}
          onChange={(event) => setResultsId(event.target.value)}
          className="w-full max-w-md rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="">Choose assessment</option>
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
