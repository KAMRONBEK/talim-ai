'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Trash2 } from 'lucide-react';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Input, Label } from '@talim/ui';
import type { BankQuestion, QuestionType } from '@talim/types';
import { useCreateBankQuestion, usePatchBankQuestion } from '@/hooks/useAssessments';

/** Every authorable question type, in the order shown in the editor's type select. */
const QUESTION_TYPES: QuestionType[] = [
  'SHORT_ANSWER',
  'NUMERIC',
  'MULTIPLE_CHOICE',
  'TRUE_FALSE',
  'MULTIPLE_SELECT',
  'FILL_BLANK',
  'DROPDOWN_CLOZE',
  'MATCHING',
  'ORDERING',
  'HOTSPOT',
  'DRAG_DROP',
];

/** QuestionType → i18n key (under `tenant.assessments`) for a friendly, translated label. */
export const QUESTION_TYPE_LABEL_KEYS: Record<QuestionType, string> = {
  SHORT_ANSWER: 'typeShortAnswer',
  NUMERIC: 'typeNumeric',
  MULTIPLE_CHOICE: 'typeMultipleChoice',
  TRUE_FALSE: 'typeTrueFalse',
  MULTIPLE_SELECT: 'typeMultipleSelect',
  FILL_BLANK: 'typeFillBlank',
  DROPDOWN_CLOZE: 'typeDropdownCloze',
  MATCHING: 'typeMatching',
  ORDERING: 'typeOrdering',
  HOTSPOT: 'typeHotspot',
  DRAG_DROP: 'typeDragDrop',
  FLASHCARD: 'typeFlashcard',
};

const CHOICE_TYPES: QuestionType[] = ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'MULTIPLE_SELECT'];
const SIMPLE_ANSWER_TYPES: QuestionType[] = ['SHORT_ANSWER', 'NUMERIC', 'FILL_BLANK'];

const controlClass =
  'w-full rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

function mutErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

/** The shared create/patch body — the fields both mutations accept. */
type QuestionBody = {
  prompt: string;
  type: QuestionType;
  options: string[] | null;
  acceptableAnswers: string[];
  config: Record<string, unknown> | null;
  explanation: string | null;
};

/** A reusable editable list of free-text strings (acceptable answers, distractors, ordered items). */
function StringListField({
  label,
  hint,
  values,
  onChange,
  addLabel,
  placeholder,
}: {
  label: string;
  hint?: string;
  values: string[];
  onChange: (next: string[]) => void;
  addLabel: string;
  placeholder?: string;
}) {
  const t = useTranslations('tenant.assessments');
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      <div className="space-y-2">
        {values.map((value, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              value={value}
              placeholder={placeholder}
              onChange={(event) =>
                onChange(values.map((item, idx) => (idx === index ? event.target.value : item)))
              }
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="shrink-0 text-muted-foreground hover:text-destructive"
              aria-label={t('editorRemove')}
              onClick={() => onChange(values.filter((_, idx) => idx !== index))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" size="sm" variant="outline" onClick={() => onChange([...values, ''])}>
        <Plus className="h-3.5 w-3.5" />
        {addLabel}
      </Button>
    </div>
  );
}

/**
 * Create or edit a single bank question. Renders as a dialog. `question` undefined = create mode
 * (via useCreateBankQuestion, server forces APPROVED); a question = edit mode (via
 * usePatchBankQuestion, content fields only — status is left untouched). The parent should mount
 * this with a `key` tied to the target question id so each open starts from a fresh state.
 */
export function QuestionEditor({
  open,
  onClose,
  bankId,
  question,
}: {
  open: boolean;
  onClose: () => void;
  bankId: string | null;
  question?: BankQuestion;
}) {
  const t = useTranslations('tenant.assessments');
  const create = useCreateBankQuestion(bankId);
  const patch = usePatchBankQuestion(bankId);

  const trueLabel = t('editorTrue');
  const falseLabel = t('editorFalse');

  const [type, setType] = useState<QuestionType>(question?.type ?? 'MULTIPLE_CHOICE');
  const [prompt, setPrompt] = useState(question?.prompt ?? '');
  const [explanation, setExplanation] = useState(question?.explanation ?? '');

  // Free-text acceptable answers (SHORT_ANSWER / NUMERIC / FILL_BLANK).
  const [answers, setAnswers] = useState<string[]>(() =>
    question && SIMPLE_ANSWER_TYPES.includes(question.type) && question.acceptableAnswers.length
      ? [...question.acceptableAnswers]
      : [''],
  );

  // Options + correct marker (MULTIPLE_CHOICE / TRUE_FALSE / MULTIPLE_SELECT).
  const [options, setOptions] = useState<string[]>(() => {
    if (question?.options && question.options.length) return [...question.options];
    if ((question?.type ?? 'MULTIPLE_CHOICE') === 'TRUE_FALSE') return [trueLabel, falseLabel];
    return ['', ''];
  });
  const [correctIndex, setCorrectIndex] = useState<number>(() => {
    if (
      question?.options &&
      (question.type === 'MULTIPLE_CHOICE' || question.type === 'TRUE_FALSE')
    ) {
      const idx = question.options.findIndex((o) => question.acceptableAnswers.includes(o));
      return idx >= 0 ? idx : 0;
    }
    return 0;
  });
  const [correctIndices, setCorrectIndices] = useState<number[]>(() => {
    if (question?.type === 'MULTIPLE_SELECT' && question.options) {
      return question.options
        .map((o, i) => (question.acceptableAnswers.includes(o) ? i : -1))
        .filter((i) => i >= 0);
    }
    return [];
  });

  // MATCHING: parallel left/right pairs + optional distractor right-values.
  const [pairs, setPairs] = useState<{ left: string; right: string }[]>(() => {
    if (question?.type === 'MATCHING') {
      const left = asStringArray((question.config as { left?: unknown } | null)?.left);
      if (left.length) {
        return left.map((value, i) => ({
          left: value,
          right: question.acceptableAnswers[i] ?? '',
        }));
      }
    }
    return [
      { left: '', right: '' },
      { left: '', right: '' },
    ];
  });
  const [distractors, setDistractors] = useState<string[]>(() => {
    // Recover distractors from the stored options pool (correct ∪ distractors) minus the correct set.
    if (question?.type === 'MATCHING' && question.options) {
      return question.options.filter((o) => !question.acceptableAnswers.includes(o));
    }
    return [];
  });

  // ORDERING: items in their correct order.
  const [orderItems, setOrderItems] = useState<string[]>(() =>
    question?.type === 'ORDERING' && question.acceptableAnswers.length
      ? [...question.acceptableAnswers]
      : ['', ''],
  );

  // DROPDOWN_CLOZE: per-blank option lists + the correct choice index per blank.
  const [blanks, setBlanks] = useState<{ options: string[]; correctIndex: number }[]>(() => {
    if (question?.type === 'DROPDOWN_CLOZE') {
      const blankOptions = (question.config as { blankOptions?: unknown } | null)?.blankOptions;
      if (Array.isArray(blankOptions) && blankOptions.length) {
        return blankOptions.map((opts, i) => {
          const list = asStringArray(opts);
          const correct = question.acceptableAnswers[i] ?? '';
          const idx = list.indexOf(correct);
          return { options: list.length ? list : ['', ''], correctIndex: idx >= 0 ? idx : 0 };
        });
      }
    }
    return [{ options: ['', ''], correctIndex: 0 }];
  });

  // HOTSPOT: background image + normalized correct regions ({x,y,w,h}, all 0..1).
  const [hotspotImageUrl, setHotspotImageUrl] = useState<string>(() => {
    const url =
      question?.type === 'HOTSPOT'
        ? (question.config as { imageUrl?: unknown } | null)?.imageUrl
        : undefined;
    return typeof url === 'string' ? url : '';
  });
  const [regions, setRegions] = useState<{ x: number; y: number; w: number; h: number }[]>(() => {
    const raw =
      question?.type === 'HOTSPOT'
        ? (question.config as { regions?: unknown } | null)?.regions
        : undefined;
    if (!Array.isArray(raw)) return [];
    return raw
      .filter(
        (r): r is { x: number; y: number; w: number; h: number } =>
          !!r &&
          typeof r === 'object' &&
          typeof (r as { x?: unknown }).x === 'number' &&
          typeof (r as { y?: unknown }).y === 'number' &&
          typeof (r as { w?: unknown }).w === 'number' &&
          typeof (r as { h?: unknown }).h === 'number',
      )
      .map((r) => ({ x: r.x, y: r.y, w: r.w, h: r.h }));
  });

  // DRAG_DROP: items to place (with the correct target label per item) + the labeled target buckets.
  const [dragItems, setDragItems] = useState<{ item: string; target: string }[]>(() => {
    if (question?.type === 'DRAG_DROP') {
      const items = asStringArray((question.config as { items?: unknown } | null)?.items);
      if (items.length) {
        return items.map((item, i) => ({ item, target: question.acceptableAnswers[i] ?? '' }));
      }
    }
    return [
      { item: '', target: '' },
      { item: '', target: '' },
    ];
  });
  const [dragTargets, setDragTargets] = useState<string[]>(() => {
    if (question?.type === 'DRAG_DROP') {
      const targets = asStringArray((question.config as { targets?: unknown } | null)?.targets);
      if (targets.length) return targets;
    }
    return ['', ''];
  });

  const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

  const updateRegion = (index: number, key: 'x' | 'y' | 'w' | 'h', value: number) =>
    setRegions((prev) =>
      prev.map((region, idx) =>
        idx === index ? { ...region, [key]: clamp01(Number.isFinite(value) ? value : 0) } : region,
      ),
    );

  const addRegionAtClick = (event: React.MouseEvent<HTMLImageElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const size = 0.12;
    const cx = (event.clientX - rect.left) / rect.width;
    const cy = (event.clientY - rect.top) / rect.height;
    const x = clamp01(cx - size / 2);
    const y = clamp01(cy - size / 2);
    setRegions((prev) => [...prev, { x, y, w: Math.min(size, 1 - x), h: Math.min(size, 1 - y) }]);
  };

  const handleTypeChange = (next: QuestionType) => {
    setType(next);
    if (next === 'TRUE_FALSE') {
      setOptions([trueLabel, falseLabel]);
      setCorrectIndex(0);
    } else if (
      (next === 'MULTIPLE_CHOICE' || next === 'MULTIPLE_SELECT') &&
      options.filter((o) => o.trim()).length < 2
    ) {
      setOptions(['', '']);
    }
  };

  const trim = (value: string) => value.trim();
  const nonEmpty = (list: string[]) => list.map(trim).filter(Boolean);
  const explanationOut = explanation.trim() ? explanation.trim() : null;

  const buildBody = (): QuestionBody => {
    const base = { prompt: prompt.trim(), type, explanation: explanationOut };
    switch (type) {
      case 'SHORT_ANSWER':
      case 'NUMERIC':
      case 'FILL_BLANK':
        return { ...base, options: null, config: null, acceptableAnswers: nonEmpty(answers) };
      case 'MULTIPLE_CHOICE':
      case 'TRUE_FALSE': {
        const correct = (options[correctIndex] ?? '').trim();
        return {
          ...base,
          options: nonEmpty(options),
          config: null,
          acceptableAnswers: correct ? [correct] : [],
        };
      }
      case 'MULTIPLE_SELECT':
        return {
          ...base,
          options: nonEmpty(options),
          config: null,
          acceptableAnswers: correctIndices.map((i) => (options[i] ?? '').trim()).filter(Boolean),
        };
      case 'MATCHING': {
        const valid = pairs.filter((p) => p.left.trim() && p.right.trim());
        const right = nonEmpty(distractors);
        return {
          ...base,
          options: null,
          config: { left: valid.map((p) => p.left.trim()), ...(right.length ? { right } : {}) },
          acceptableAnswers: valid.map((p) => p.right.trim()),
        };
      }
      case 'ORDERING':
        return { ...base, options: null, config: null, acceptableAnswers: nonEmpty(orderItems) };
      case 'DROPDOWN_CLOZE':
        return {
          ...base,
          options: null,
          config: { blanks: blanks.length, blankOptions: blanks.map((b) => nonEmpty(b.options)) },
          acceptableAnswers: blanks.map((b) => (b.options[b.correctIndex] ?? '').trim()),
        };
      case 'HOTSPOT':
        return {
          ...base,
          options: null,
          config: { imageUrl: hotspotImageUrl.trim(), regions },
          acceptableAnswers: [],
        };
      case 'DRAG_DROP': {
        const targets = nonEmpty(dragTargets);
        const valid = dragItems.filter(
          (it) => it.item.trim() && it.target.trim() && targets.includes(it.target.trim()),
        );
        return {
          ...base,
          options: null,
          config: { items: valid.map((it) => it.item.trim()), targets },
          acceptableAnswers: valid.map((it) => it.target.trim()),
        };
      }
      // FLASHCARD is a B2C practice-only type — the tenant editor never offers it
      // (EDITOR_TYPES excludes it), but the QuestionType switch must stay exhaustive.
      case 'FLASHCARD':
        return { ...base, options: null, config: null, acceptableAnswers: nonEmpty(answers) };
    }
  };

  const body = buildBody();
  const matchingPairCount = pairs.filter((p) => p.left.trim() && p.right.trim()).length;
  const hotspotValid = hotspotImageUrl.trim().length > 0 && regions.length >= 1;
  const dragTargetsClean = nonEmpty(dragTargets);
  const dragNamedItems = dragItems.filter((it) => it.item.trim());
  const dragDropValid =
    dragNamedItems.length >= 2 &&
    dragTargetsClean.length >= 2 &&
    dragNamedItems.every((it) => dragTargetsClean.includes(it.target.trim()));
  const valid =
    body.prompt.length > 0 &&
    (type === 'HOTSPOT'
      ? hotspotValid
      : type === 'DRAG_DROP'
        ? dragDropValid
        : body.acceptableAnswers.length > 0) &&
    (CHOICE_TYPES.includes(type) ? (body.options?.length ?? 0) >= 2 : true) &&
    (type === 'MATCHING' ? matchingPairCount >= 2 : true);

  const active = question ? patch : create;

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!valid) return;
    try {
      if (question) {
        await patch.mutateAsync({ id: question.id, ...body });
      } else {
        await create.mutateAsync(body);
      }
      onClose();
    } catch {
      // The server-side validation error is surfaced below via the mutation's error state.
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{question ? t('editQuestion') : t('newQuestion')}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="editor-type">{t('editorTypeLabel')}</Label>
            <select
              id="editor-type"
              value={type}
              onChange={(event) => handleTypeChange(event.target.value as QuestionType)}
              className={controlClass}
            >
              {QUESTION_TYPES.map((value) => (
                <option key={value} value={value}>
                  {t(QUESTION_TYPE_LABEL_KEYS[value])}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="editor-prompt">{t('editorPromptLabel')}</Label>
            <textarea
              id="editor-prompt"
              rows={3}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder={t('editorPromptPlaceholder')}
              className={controlClass}
            />
            {type === 'DROPDOWN_CLOZE' && (
              <p className="text-[11px] text-muted-foreground">{t('editorClozeHint')}</p>
            )}
          </div>

          {SIMPLE_ANSWER_TYPES.includes(type) && (
            <StringListField
              label={t(type === 'FILL_BLANK' ? 'editorBlankAnswersLabel' : 'editorAnswersLabel')}
              hint={
                type === 'NUMERIC'
                  ? t('editorNumericHint')
                  : type === 'FILL_BLANK'
                    ? t('editorFillBlankHint')
                    : t('editorAnswersHint')
              }
              values={answers}
              onChange={setAnswers}
              addLabel={t('editorAddAnswer')}
              placeholder={t('editorAnswerPlaceholder')}
            />
          )}

          {CHOICE_TYPES.includes(type) && (
            <div className="space-y-2">
              <Label>{t('editorOptionsLabel')}</Label>
              <p className="text-[11px] text-muted-foreground">
                {type === 'MULTIPLE_SELECT' ? t('editorCorrectHintMulti') : t('editorCorrectHint')}
              </p>
              <div className="space-y-2">
                {options.map((opt, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {type === 'MULTIPLE_SELECT' ? (
                      <input
                        type="checkbox"
                        className="h-4 w-4 shrink-0 accent-[hsl(var(--primary))]"
                        aria-label={t('editorMarkCorrect')}
                        checked={correctIndices.includes(index)}
                        onChange={() =>
                          setCorrectIndices((prev) =>
                            prev.includes(index)
                              ? prev.filter((i) => i !== index)
                              : [...prev, index],
                          )
                        }
                      />
                    ) : (
                      <input
                        type="radio"
                        name="editor-mc-correct"
                        className="h-4 w-4 shrink-0 accent-[hsl(var(--primary))]"
                        aria-label={t('editorMarkCorrect')}
                        checked={correctIndex === index}
                        onChange={() => setCorrectIndex(index)}
                      />
                    )}
                    <Input
                      value={opt}
                      placeholder={t('editorOptionPlaceholder')}
                      onChange={(event) =>
                        setOptions(
                          options.map((o, idx) => (idx === index ? event.target.value : o)),
                        )
                      }
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      aria-label={t('editorRemove')}
                      onClick={() => {
                        setOptions(options.filter((_, idx) => idx !== index));
                        setCorrectIndices((prev) =>
                          prev.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i)),
                        );
                        setCorrectIndex((current) =>
                          current > index ? current - 1 : current === index ? 0 : current,
                        );
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setOptions([...options, ''])}
              >
                <Plus className="h-3.5 w-3.5" />
                {t('editorAddOption')}
              </Button>
            </div>
          )}

          {type === 'MATCHING' && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>{t('editorMatchingLabel')}</Label>
                <p className="text-[11px] text-muted-foreground">{t('editorMatchingHint')}</p>
                <div className="space-y-2">
                  {pairs.map((pair, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={pair.left}
                        placeholder={t('editorMatchingLeft')}
                        onChange={(event) =>
                          setPairs(
                            pairs.map((p, idx) =>
                              idx === index ? { ...p, left: event.target.value } : p,
                            ),
                          )
                        }
                      />
                      <span className="shrink-0 text-muted-foreground" aria-hidden="true">
                        →
                      </span>
                      <Input
                        value={pair.right}
                        placeholder={t('editorMatchingRight')}
                        onChange={(event) =>
                          setPairs(
                            pairs.map((p, idx) =>
                              idx === index ? { ...p, right: event.target.value } : p,
                            ),
                          )
                        }
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        aria-label={t('editorRemove')}
                        onClick={() => setPairs(pairs.filter((_, idx) => idx !== index))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setPairs([...pairs, { left: '', right: '' }])}
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t('editorAddPair')}
                </Button>
              </div>
              <StringListField
                label={t('editorDistractorsLabel')}
                hint={t('editorDistractorsHint')}
                values={distractors}
                onChange={setDistractors}
                addLabel={t('editorAddDistractor')}
                placeholder={t('editorMatchingRight')}
              />
            </div>
          )}

          {type === 'ORDERING' && (
            <StringListField
              label={t('editorOrderingLabel')}
              hint={t('editorOrderingHint')}
              values={orderItems}
              onChange={setOrderItems}
              addLabel={t('editorAddItem')}
              placeholder={t('editorItemPlaceholder')}
            />
          )}

          {type === 'DROPDOWN_CLOZE' && (
            <div className="space-y-3">
              {blanks.map((blank, blankIndex) => (
                <div
                  key={blankIndex}
                  className="space-y-2 rounded-xl border border-border/70 bg-secondary/30 p-3"
                >
                  <div className="flex items-center justify-between">
                    <Label className="font-label text-[11px] uppercase tracking-wider text-muted-foreground">
                      {t('editorBlankLabel', { n: blankIndex + 1 })}
                    </Label>
                    {blanks.length > 1 && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive"
                        aria-label={t('editorRemove')}
                        onClick={() => setBlanks(blanks.filter((_, idx) => idx !== blankIndex))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {blank.options.map((opt, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`editor-cloze-${blankIndex}`}
                          className="h-4 w-4 shrink-0 accent-[hsl(var(--primary))]"
                          aria-label={t('editorMarkCorrect')}
                          checked={blank.correctIndex === optIndex}
                          onChange={() =>
                            setBlanks(
                              blanks.map((b, idx) =>
                                idx === blankIndex ? { ...b, correctIndex: optIndex } : b,
                              ),
                            )
                          }
                        />
                        <Input
                          value={opt}
                          placeholder={t('editorOptionPlaceholder')}
                          onChange={(event) =>
                            setBlanks(
                              blanks.map((b, idx) =>
                                idx === blankIndex
                                  ? {
                                      ...b,
                                      options: b.options.map((o, k) =>
                                        k === optIndex ? event.target.value : o,
                                      ),
                                    }
                                  : b,
                              ),
                            )
                          }
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                          aria-label={t('editorRemove')}
                          onClick={() =>
                            setBlanks(
                              blanks.map((b, idx) =>
                                idx === blankIndex
                                  ? {
                                      ...b,
                                      options: b.options.filter((_, k) => k !== optIndex),
                                      correctIndex:
                                        b.correctIndex > optIndex
                                          ? b.correctIndex - 1
                                          : b.correctIndex === optIndex
                                            ? 0
                                            : b.correctIndex,
                                    }
                                  : b,
                              ),
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setBlanks(
                        blanks.map((b, idx) =>
                          idx === blankIndex ? { ...b, options: [...b.options, ''] } : b,
                        ),
                      )
                    }
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {t('editorAddOption')}
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setBlanks([...blanks, { options: ['', ''], correctIndex: 0 }])}
              >
                <Plus className="h-3.5 w-3.5" />
                {t('editorAddBlank')}
              </Button>
            </div>
          )}

          {type === 'HOTSPOT' && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="editor-hotspot-url">{t('editorHotspotImageLabel')}</Label>
                <Input
                  id="editor-hotspot-url"
                  value={hotspotImageUrl}
                  placeholder={t('editorHotspotImagePlaceholder')}
                  onChange={(event) => setHotspotImageUrl(event.target.value)}
                />
              </div>
              {hotspotImageUrl.trim() ? (
                <div className="space-y-2">
                  <p className="text-[11px] text-muted-foreground">{t('editorHotspotHint')}</p>
                  <div className="relative inline-block max-w-full overflow-hidden rounded-xl border border-border">
                    <img
                      src={hotspotImageUrl}
                      alt=""
                      draggable={false}
                      onClick={addRegionAtClick}
                      className="block max-h-72 w-auto max-w-full cursor-crosshair select-none"
                    />
                    {regions.map((region, index) => (
                      <div
                        key={index}
                        className="pointer-events-none absolute border-2 border-primary bg-primary/20"
                        style={{
                          left: `${region.x * 100}%`,
                          top: `${region.y * 100}%`,
                          width: `${region.w * 100}%`,
                          height: `${region.h * 100}%`,
                        }}
                      >
                        <button
                          type="button"
                          aria-label={t('editorRemove')}
                          onClick={() => setRegions(regions.filter((_, idx) => idx !== index))}
                          className="pointer-events-auto absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  {regions.length > 0 && (
                    <div className="space-y-2">
                      {regions.map((region, index) => (
                        <div key={index} className="flex flex-wrap items-center gap-2">
                          <span className="w-5 shrink-0 text-center text-[11px] text-muted-foreground">
                            {index + 1}
                          </span>
                          {(['x', 'y', 'w', 'h'] as const).map((key) => (
                            <label
                              key={key}
                              className="flex items-center gap-1 text-[11px] uppercase text-muted-foreground"
                            >
                              {key}
                              <Input
                                type="number"
                                min={0}
                                max={1}
                                step={0.01}
                                value={region[key]}
                                onChange={(event) =>
                                  updateRegion(index, key, Number(event.target.value))
                                }
                                className="w-16"
                              />
                            </label>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground">{t('editorHotspotNoImage')}</p>
              )}
            </div>
          )}

          {type === 'DRAG_DROP' && (
            <div className="space-y-3">
              <StringListField
                label={t('editorDragTargetsLabel')}
                hint={t('editorDragTargetsHint')}
                values={dragTargets}
                onChange={setDragTargets}
                addLabel={t('editorAddTarget')}
                placeholder={t('editorDragTargetPlaceholder')}
              />
              <div className="space-y-2">
                <Label>{t('editorDragItemsLabel')}</Label>
                <p className="text-[11px] text-muted-foreground">{t('editorDragItemsHint')}</p>
                <div className="space-y-2">
                  {dragItems.map((row, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={row.item}
                        placeholder={t('editorDragItemPlaceholder')}
                        onChange={(event) =>
                          setDragItems(
                            dragItems.map((r, idx) =>
                              idx === index ? { ...r, item: event.target.value } : r,
                            ),
                          )
                        }
                      />
                      <span className="shrink-0 text-muted-foreground" aria-hidden="true">
                        →
                      </span>
                      <select
                        value={row.target}
                        aria-label={t('editorDragTargetSelect')}
                        onChange={(event) =>
                          setDragItems(
                            dragItems.map((r, idx) =>
                              idx === index ? { ...r, target: event.target.value } : r,
                            ),
                          )
                        }
                        className={controlClass}
                      >
                        <option value="">{t('editorDragTargetSelect')}</option>
                        {nonEmpty(dragTargets).map((target) => (
                          <option key={target} value={target}>
                            {target}
                          </option>
                        ))}
                      </select>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        aria-label={t('editorRemove')}
                        onClick={() => setDragItems(dragItems.filter((_, idx) => idx !== index))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setDragItems([...dragItems, { item: '', target: '' }])}
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t('editorAddItem')}
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="editor-explanation">{t('editorExplanationLabel')}</Label>
            <textarea
              id="editor-explanation"
              rows={2}
              value={explanation}
              onChange={(event) => setExplanation(event.target.value)}
              placeholder={t('editorExplanationPlaceholder')}
              className={controlClass}
            />
          </div>

          {active.isError && (
            <p className="text-sm text-destructive">{mutErr(active.error, t('genericError'))}</p>
          )}

          <div className="flex justify-end gap-2 border-t border-border/60 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('editorCancel')}
            </Button>
            <Button type="submit" disabled={!valid || active.isPending}>
              {question ? t('editorSave') : t('editorCreate')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
