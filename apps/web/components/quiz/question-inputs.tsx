'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { Input } from '@talim/ui';
import {
  FLASHCARD_KNOWN,
  FLASHCARD_UNKNOWN,
  isAiJudgedQuestionType,
  jsonStringArray,
  matchesAcceptedAnswer,
  normalizeAnswer,
  parseQuestionConfig,
  resolveAcceptedAnswers,
  type QuestionType,
  type QuizQuestion,
} from '@talim/types';
import { RichText } from '@/components/learning/rich-text';

/** Answer value shapes matching the server grading conventions (POST /quiz/:id/submit). */
export type QuizAnswerValue = string | string[] | Record<string, string>;

/** quiz.* message key for each question type's small uppercase header label. */
const TYPE_LABEL_KEYS: Partial<Record<QuestionType, string>> = {
  MULTIPLE_CHOICE: 'multipleChoice',
  TRUE_FALSE: 'trueFalse',
  MULTIPLE_SELECT: 'multipleSelect',
  FILL_BLANK: 'fillBlank',
  DROPDOWN_CLOZE: 'dropdownCloze',
  MATCHING: 'matching',
  ORDERING: 'ordering',
  NUMERIC: 'numeric',
  SHORT_ANSWER: 'shortAnswer',
  FLASHCARD: 'flashcard',
};

export function questionTypeLabelKey(type: QuestionType): string {
  return TYPE_LABEL_KEYS[type] ?? 'shortAnswer';
}

// ---- config helpers (same conventions the server grader uses) ----

export function blankCount(question: QuizQuestion): number {
  const raw = parseQuestionConfig(question.config)?.blanks;
  return typeof raw === 'number' && raw > 0 ? Math.floor(raw) : 1;
}

export function clozeOptions(question: QuizQuestion): string[][] {
  const raw = parseQuestionConfig(question.config)?.blankOptions;
  if (!Array.isArray(raw)) return [];
  return raw.map((pool) => jsonStringArray(pool));
}

export function matchingLeft(question: QuizQuestion): string[] {
  return jsonStringArray(parseQuestionConfig(question.config)?.left);
}

/** Legacy rows can have an empty acceptableAnswers list — fall back to correctAnswer. */
export function acceptedAnswers(question: QuizQuestion): string[] {
  return resolveAcceptedAnswers(question.acceptableAnswers, question.correctAnswer);
}

/**
 * Whether the Check button should ask the server for an AI verdict when the local
 * engine rejects the answer — mirrors the API's judge candidate selection exactly.
 */
export function isAiCheckable(question: QuizQuestion): boolean {
  return isAiJudgedQuestionType(question.type);
}

/** Question shape safe to pass to gradeQuestion (applies the legacy acceptableAnswers fallback). */
export function gradableQuestion(question: QuizQuestion): QuizQuestion {
  if (question.acceptableAnswers?.length) return question;
  return { ...question, acceptableAnswers: acceptedAnswers(question) };
}

/** Accepted answers for one blank (mirrors the grader's per-blank resolution). */
export function acceptedForBlank(question: QuizQuestion, index: number): string[] {
  const blankAnswers = parseQuestionConfig(question.config)?.blankAnswers;
  if (Array.isArray(blankAnswers) && blankAnswers.length > 0) {
    return jsonStringArray(blankAnswers[index]);
  }
  const flat = acceptedAnswers(question);
  if (blankCount(question) <= 1) return flat;
  const single = flat[index];
  return single != null ? [single] : [];
}

/** Which editor a question renders (with a graceful open-answer fallback). */
export type QuestionRenderKind =
  | 'multipleChoice'
  | 'trueFalse'
  | 'multipleSelect'
  | 'fillBlank'
  | 'dropdownCloze'
  | 'matching'
  | 'ordering'
  | 'flashcard'
  | 'open';

export function questionRenderKind(question: QuizQuestion): QuestionRenderKind {
  const optionCount = question.options?.length ?? 0;
  if (question.type === 'MULTIPLE_CHOICE' && optionCount > 0) return 'multipleChoice';
  if (question.type === 'TRUE_FALSE' && optionCount > 0) return 'trueFalse';
  if (question.type === 'MULTIPLE_SELECT' && optionCount > 0) return 'multipleSelect';
  if (question.type === 'FILL_BLANK') return 'fillBlank';
  if (question.type === 'DROPDOWN_CLOZE') return 'dropdownCloze';
  if (question.type === 'MATCHING' && matchingLeft(question).length > 0) return 'matching';
  if (question.type === 'ORDERING' && optionCount > 0) return 'ordering';
  if (question.type === 'FLASHCARD') return 'flashcard';
  return 'open';
}

/** Whether the learner has supplied enough of an answer to move on / submit. */
export function isAnswerProvided(
  question: QuizQuestion,
  value: QuizAnswerValue | undefined,
): boolean {
  // The starting order is a valid ORDERING answer — matches the assessments WrittenForm.
  if (questionRenderKind(question) === 'ordering') return true;
  if (value == null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.some((v) => v.trim() !== '');
  return Object.values(value).some((v) => v.trim() !== '');
}

/** Natural unit count for "{hits}/{total}" partial-credit display (null → show a percent). */
export function partialCreditUnits(question: QuizQuestion): number | null {
  if (question.type === 'FILL_BLANK' || question.type === 'DROPDOWN_CLOZE') {
    return blankCount(question);
  }
  if (question.type === 'MATCHING') return acceptedAnswers(question).length || null;
  return null;
}

/** Human-readable form of a stored answer (structured answers round-trip as JSON strings). */
export function formatAnswerDisplay(raw: unknown): string {
  let value: unknown = raw;
  if (typeof raw === 'string') {
    const s = raw.trim();
    if (s.startsWith('[') || s.startsWith('{')) {
      try {
        value = JSON.parse(s);
      } catch {
        /* plain string answer */
      }
    }
  }
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === 'string' && v.trim() !== '').join(', ');
  }
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1] !== '')
      .map(([left, right]) => `${left} → ${right}`)
      .join('; ');
  }
  return typeof value === 'string' ? value : '';
}

/** Token-styled native <select> matching the QuizCard look (adapted from the WrittenForm). */
const selectClass =
  'h-10 min-w-[10rem] rounded-xl border-2 border-border bg-card px-3 text-sm text-foreground transition-colors focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60';

function revealBorder(revealed: boolean, correct: boolean): string | undefined {
  if (!revealed) return undefined;
  return correct
    ? 'border-success focus-visible:border-success'
    : 'border-destructive focus-visible:border-destructive';
}

function optionRevealClass(revealed: boolean, selected: boolean, isCorrectOption: boolean): string {
  if (!revealed) {
    return selected
      ? 'border-primary bg-accent/50'
      : 'border-border hover:border-muted-foreground/30 hover:bg-muted/50';
  }
  if (selected) {
    return isCorrectOption ? 'border-success bg-success-muted' : 'border-destructive bg-destructive/10';
  }
  return isCorrectOption ? 'border-success bg-success-muted/80' : 'border-border bg-muted/20 opacity-60';
}

export function TrueFalseInput({
  question,
  value,
  revealed,
  onSelect,
}: {
  question: QuizQuestion;
  value: string | undefined;
  revealed: boolean;
  onSelect: (option: string) => void;
}) {
  const accepted = acceptedAnswers(question).map(normalizeAnswer);
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {(question.options ?? []).map((option) => {
        const selected = value === option;
        const isCorrectOption = accepted.includes(normalizeAnswer(option));
        return (
          <button
            key={option}
            type="button"
            disabled={revealed}
            onClick={() => onSelect(option)}
            className={`rounded-xl border-2 bg-muted/30 p-4 text-center text-[15px] font-medium transition-colors disabled:cursor-default ${optionRevealClass(revealed, selected, isCorrectOption)}`}
          >
            <RichText inline>{option}</RichText>
          </button>
        );
      })}
    </div>
  );
}

export function MultipleSelectInput({
  question,
  value,
  revealed,
  onToggle,
}: {
  question: QuizQuestion;
  value: string[];
  revealed: boolean;
  onToggle: (option: string) => void;
}) {
  const t = useTranslations('quiz');
  const accepted = acceptedAnswers(question).map(normalizeAnswer);
  return (
    <div className="space-y-2.5">
      <p className="text-xs text-muted-foreground">{t('selectAllHint')}</p>
      <div className="flex flex-wrap gap-2">
        {(question.options ?? []).map((option) => {
          const selected = value.includes(option);
          const isCorrectOption = accepted.includes(normalizeAnswer(option));
          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              onClick={() => onToggle(option)}
              className={`rounded-xl border-2 bg-muted/30 px-4 py-2.5 text-[15px] transition-colors ${optionRevealClass(revealed, selected, isCorrectOption)}`}
            >
              <RichText inline>{option}</RichText>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function FillBlankInput({
  question,
  value,
  revealed,
  onChangeBlank,
}: {
  question: QuizQuestion;
  value: string[];
  revealed: boolean;
  onChangeBlank: (index: number, text: string) => void;
}) {
  const t = useTranslations('quiz');
  const count = blankCount(question);
  return (
    <div className="space-y-2.5">
      {Array.from({ length: count }).map((_, i) => {
        const text = value[i] ?? '';
        const accepted = acceptedForBlank(question, i);
        // The engine's own typed-blank matcher (exact + typo tolerance) — display and
        // grade share one implementation, so they can never drift.
        const correct = matchesAcceptedAnswer(text, accepted);
        return (
          <div key={i} className="space-y-1">
            <Input
              value={text}
              onChange={(e) => onChangeBlank(i, e.target.value)}
              placeholder={count > 1 ? t('blankLabel', { number: i + 1 }) : t('answerPlaceholder')}
              aria-invalid={revealed && !correct}
              className={revealBorder(revealed, correct)}
            />
            {revealed && !correct && accepted.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {t('correctAnswerLabel')}{' '}
                <span className="font-semibold text-foreground">
                  <RichText inline>{accepted[0] ?? ''}</RichText>
                </span>
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Inline cloze: the sentence itself renders with numbered slot pills where the "___"
 * markers sit, and EVERY blank gets its own labeled chip row below — a 3-gap question
 * visibly offers 3 choice rows (an "active blank" indirection made multi-gap questions
 * look like a single multiple choice). Stateless: chips write straight to their blank.
 */
export function DropdownClozeInput({
  question,
  value,
  revealed,
  onChangeBlank,
}: {
  question: QuizQuestion;
  value: string[];
  revealed: boolean;
  onChangeBlank: (index: number, text: string) => void;
}) {
  const t = useTranslations('quiz');
  const count = blankCount(question);
  const pools = clozeOptions(question);

  // The stem carries the blanks as runs of underscores; slot pills render in their place.
  const segments = question.question.split(/_{2,}/);
  const markerCount = segments.length - 1;

  const blankFor = (i: number) => {
    const text = value[i] ?? '';
    const accepted = acceptedForBlank(question, i);
    const correct =
      text.trim() !== '' && accepted.some((a) => normalizeAnswer(a) === normalizeAnswer(text));
    return { text, accepted, correct };
  };

  // Pure indicator (not a control): shows the blank's number until its chip row fills it.
  const slot = (i: number) => {
    const { text, correct } = blankFor(i);
    const stateClass = revealed
      ? correct
        ? 'border-success bg-success-muted text-foreground'
        : 'border-destructive bg-destructive/10 text-foreground'
      : text
        ? 'border-primary/40 bg-secondary text-foreground'
        : 'border-dashed border-muted-foreground/50 bg-muted/30 text-muted-foreground';
    return (
      <span
        key={`slot-${i}`}
        aria-label={t('blankLabel', { number: i + 1 })}
        className={`mx-1 inline-flex min-w-[4.5rem] items-baseline justify-center rounded-lg border-2 px-2.5 py-0.5 align-baseline text-[0.85em] font-semibold transition-colors ${stateClass}`}
      >
        {text ? <RichText inline>{text}</RichText> : count > 1 ? String(i + 1) : '…'}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="font-display text-xl font-semibold leading-[2.2] text-foreground sm:text-2xl">
        {segments.map((seg, i) => (
          <span key={i}>
            <RichText inline>{seg}</RichText>
            {i < markerCount && (i < count ? slot(i) : '___')}
          </span>
        ))}
        {/* Blanks declared in config beyond the stem's markers still get a slot. */}
        {Array.from({ length: Math.max(0, count - markerCount) }).map((_, j) =>
          slot(markerCount + j),
        )}
      </div>

      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => {
          const pool = pools[i] ?? [];
          const { text, accepted, correct } = blankFor(i);
          const acceptedSet = accepted.map(normalizeAnswer);
          return (
            <div key={i} className="space-y-1.5">
              {count > 1 && (
                <p className="text-xs font-medium text-muted-foreground">
                  {t('blankLabel', { number: i + 1 })}
                </p>
              )}
              {pool.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {pool.map((opt) => {
                    const chosen = normalizeAnswer(text) === normalizeAnswer(opt);
                    const isCorrectOption = acceptedSet.includes(normalizeAnswer(opt));
                    return (
                      <button
                        key={opt}
                        type="button"
                        disabled={revealed}
                        aria-pressed={chosen}
                        onClick={() => onChangeBlank(i, opt)}
                        className={`rounded-xl border-2 bg-muted/30 px-4 py-2 text-[15px] transition-colors disabled:cursor-default ${optionRevealClass(revealed, chosen, isCorrectOption)}`}
                      >
                        <RichText inline>{opt}</RichText>
                      </button>
                    );
                  })}
                </div>
              ) : (
                // Empty pool → graceful text-input fallback (matches the WrittenForm).
                <Input
                  className={`h-10 w-56 ${revealBorder(revealed, correct) ?? ''}`}
                  value={text}
                  onChange={(e) => onChangeBlank(i, e.target.value)}
                  placeholder={t('blankLabel', { number: i + 1 })}
                />
              )}
              {revealed && !correct && accepted.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {t('correctAnswerLabel')}{' '}
                  <span className="font-semibold text-foreground">
                    <RichText inline>{accepted[0] ?? ''}</RichText>
                  </span>
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MatchingInput({
  question,
  value,
  revealed,
  onPick,
}: {
  question: QuizQuestion;
  /** Chosen right-hand value keyed by left prompt — the shape the server grades. */
  value: Record<string, string>;
  revealed: boolean;
  onPick: (leftPrompt: string, right: string) => void;
}) {
  const t = useTranslations('quiz');
  const left = matchingLeft(question);
  const pool = question.options ?? [];
  // acceptableAnswers = the correct right-hand value per left prompt, index-aligned.
  const correctRights = acceptedAnswers(question);
  return (
    <div className="space-y-2.5">
      {left.map((leftText, i) => {
        const chosen = value[leftText] ?? '';
        const want = correctRights[i] ?? '';
        const correct = chosen !== '' && normalizeAnswer(chosen) === normalizeAnswer(want);
        return (
          <div key={leftText} className="flex flex-wrap items-center gap-2">
            <span className="min-w-[6rem] flex-1 text-[15px]">
              <RichText inline>{leftText}</RichText>
            </span>
            {pool.length > 0 ? (
              <select
                className={`${selectClass} ${revealBorder(revealed, correct) ?? ''}`}
                value={chosen}
                onChange={(e) => onPick(leftText, e.target.value)}
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
                className={`h-10 w-48 ${revealBorder(revealed, correct) ?? ''}`}
                value={chosen}
                onChange={(e) => onPick(leftText, e.target.value)}
                placeholder={t('answerPlaceholder')}
              />
            )}
            {revealed && !correct && want && (
              <span className="text-sm font-semibold text-success">
                <RichText inline>{want}</RichText>
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function OrderingInput({
  question,
  value,
  revealed,
  onReorder,
}: {
  question: QuizQuestion;
  /** The items in the learner's current order (starts as question.options). */
  value: string[];
  revealed: boolean;
  onReorder: (next: string[]) => void;
}) {
  const t = useTranslations('quiz');
  // acceptableAnswers = the items in their correct order.
  const correctOrder = acceptedAnswers(question);
  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    const a = next[index];
    const b = next[target];
    if (a === undefined || b === undefined) return;
    next[index] = b;
    next[target] = a;
    onReorder(next);
  };
  return (
    <div className="space-y-2.5">
      <p className="text-xs text-muted-foreground">{t('orderHint')}</p>
      {value.map((item, i) => {
        const correct = normalizeAnswer(item) === normalizeAnswer(correctOrder[i] ?? '');
        const rowClass = revealed
          ? correct
            ? 'border-success bg-success-muted'
            : 'border-destructive bg-destructive/10'
          : 'border-border bg-muted/30';
        return (
          <div
            key={`${item}-${i}`}
            className={`flex items-center gap-3 rounded-xl border-2 p-3 transition-colors ${rowClass}`}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-border bg-card text-xs font-semibold">
              {i + 1}
            </span>
            <span className="min-w-0 flex-1 text-[15px]">
              <RichText inline>{item}</RichText>
            </span>
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                disabled={i === 0}
                onClick={() => move(i, -1)}
                aria-label={t('moveUp')}
                className="rounded-md border border-border p-1 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={i === value.length - 1}
                onClick={() => move(i, 1)}
                aria-label={t('moveDown')}
                className="rounded-md border border-border p-1 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Sentinel answer values for self-graded FLASHCARD items — the single source is the
 * shared grading engine (@talim/types), re-exported here for the quiz UI. */
export { FLASHCARD_KNOWN, FLASHCARD_UNKNOWN };

/**
 * Self-graded study card inside a practice session: the front is the question stem
 * (rendered by the caller); this input reveals the back, then asks the learner to
 * self-report. The report is the submitted answer and feeds mastery at half weight.
 * Callers must key this component by question id — it holds local reveal state.
 */
export function FlashcardInput({
  question,
  value,
  revealed,
  onReport,
}: {
  question: QuizQuestion;
  value: string | undefined;
  /** True once the learner self-reported (locks the buttons). */
  revealed: boolean;
  onReport: (report: string) => void;
}) {
  const t = useTranslations('quiz');
  const [showBack, setShowBack] = useState(false);
  const back = acceptedAnswers(question)[0] ?? '';

  if (!showBack && !revealed) {
    return (
      <button
        type="button"
        onClick={() => setShowBack(true)}
        className="w-full rounded-xl border-2 border-dashed border-border bg-muted/30 p-6 text-center text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
      >
        {t('showAnswer')}
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border-2 border-border bg-muted/30 p-4 text-[15px]">
        <RichText>{back}</RichText>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          disabled={revealed}
          onClick={() => onReport(FLASHCARD_UNKNOWN)}
          className={`rounded-xl border-2 p-3.5 text-center text-[15px] font-medium transition-colors disabled:cursor-default ${
            revealed && value === FLASHCARD_UNKNOWN
              ? 'border-destructive bg-destructive/10'
              : revealed
                ? 'border-border bg-muted/20 opacity-60'
                : 'border-border bg-muted/30 hover:border-destructive/50 hover:bg-destructive/5'
          }`}
        >
          {t('selfUnknown')}
        </button>
        <button
          type="button"
          disabled={revealed}
          onClick={() => onReport(FLASHCARD_KNOWN)}
          className={`rounded-xl border-2 p-3.5 text-center text-[15px] font-medium transition-colors disabled:cursor-default ${
            revealed && value === FLASHCARD_KNOWN
              ? 'border-success bg-success-muted'
              : revealed
                ? 'border-border bg-muted/20 opacity-60'
                : 'border-border bg-muted/30 hover:border-success/50 hover:bg-success-muted/40'
          }`}
        >
          {t('selfKnown')}
        </button>
      </div>
    </div>
  );
}
