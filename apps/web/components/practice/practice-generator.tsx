'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import {
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@talim/ui';
import { Loader2 } from 'lucide-react';
import type { QuestionDepth, QuestionType } from '@talim/types';
import { PRACTICE_GENERATOR_TYPES } from '@talim/types';
import { useCreateQuiz } from '@/hooks/useQuiz';
import { useLimitErrorHandler } from '@/hooks/useLimitErrorHandler';

const COUNT_PRESETS = [5, 10, 15, 20];
const DEPTHS: QuestionDepth[] = ['mixed', 'recall', 'understanding', 'application'];

/** What gets generated: the server's default type blend or a custom type set. Flashcards
 * are one of the selectable types — they land in the same practice session. */
type PracticeMode = 'mixed' | 'types';

export interface PracticeGeneratorProps {
  contentId: string;
  /** Anchors the "current section" scope; when absent only whole-material practice is offered. */
  activeSectionId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after generation kicked off and navigation happened (e.g. to close a mobile drawer). */
  onGenerated?: () => void;
}

/**
 * The unified Practice generator dialog: count presets, question-type chips (Mixed default;
 * Flashcards is one of the types and lands in the same session), cognitive-depth picker,
 * and section vs whole-material scope. Routes to /quiz/{id}.
 */
export function PracticeGenerator({
  contentId,
  activeSectionId,
  open,
  onOpenChange,
  onGenerated,
}: PracticeGeneratorProps) {
  const t = useTranslations('content');
  const router = useRouter();
  const handleLimitError = useLimitErrorHandler();

  const [mode, setMode] = useState<PracticeMode>('mixed');
  const [types, setTypes] = useState<QuestionType[]>([]);
  const [depth, setDepth] = useState<QuestionDepth>('mixed');
  const [count, setCount] = useState(10);
  const [scope, setScope] = useState<'section' | 'material'>(
    activeSectionId ? 'section' : 'material',
  );
  const [error, setError] = useState<string | null>(null);

  // The dialog stays mounted while closed; re-anchor the default scope on each open
  // (the active section may have changed, or sections may have loaded after mount).
  useEffect(() => {
    if (open) setScope(activeSectionId ? 'section' : 'material');
  }, [open, activeSectionId]);

  const scopeSectionId = scope === 'section' && activeSectionId ? activeSectionId : undefined;
  const createQuiz = useCreateQuiz();
  const pending = createQuiz.isPending;

  const toggleType = (type: QuestionType) => {
    const next = types.includes(type) ? types.filter((v) => v !== type) : [...types, type];
    setTypes(next);
    // Deselecting the last type falls back to the server's default Mixed blend.
    setMode(next.length === 0 ? 'mixed' : 'types');
  };

  const handleGenerate = async () => {
    setError(null);
    try {
      const quiz = await createQuiz.mutateAsync({
        contentId,
        ...(scopeSectionId ? { sectionId: scopeSectionId } : {}),
        ...(mode === 'types' && types.length > 0 ? { types } : {}),
        depth,
        count,
      });
      onOpenChange(false);
      onGenerated?.();
      router.push(`/quiz/${quiz.id}`);
    } catch (err) {
      setError(handleLimitError(err, t('generationFailed')));
    }
  };

  const chip = (selected: boolean) =>
    cn(
      'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
      selected
        ? 'border-primary bg-primary text-primary-foreground'
        : 'border-border bg-muted/50 text-foreground hover:bg-muted',
    );

  const sectionLabel = (text: string) => (
    <p className="mb-2 font-label text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
      {text}
    </p>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('practice.title')}</DialogTitle>
          <DialogDescription>{t('practice.subtitle')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            {sectionLabel(t('practice.scopeLabel'))}
            <div
              className="flex gap-1 rounded-xl bg-muted p-1"
              role="radiogroup"
              aria-label={t('practice.scopeLabel')}
            >
              {(['section', 'material'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={scope === value}
                  disabled={value === 'section' && !activeSectionId}
                  onClick={() => setScope(value)}
                  className={cn(
                    'flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                    scope === value
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {value === 'section' ? t('practice.scopeSection') : t('practice.scopeMaterial')}
                </button>
              ))}
            </div>
          </div>

          <div>
            {sectionLabel(t('practice.countLabel'))}
            <div className="flex gap-2">
              {COUNT_PRESETS.map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={count === n}
                  onClick={() => setCount(n)}
                  className={chip(count === n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div>
            {sectionLabel(t('practice.typesLabel'))}
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                aria-pressed={mode === 'mixed'}
                onClick={() => {
                  setMode('mixed');
                  setTypes([]);
                }}
                className={chip(mode === 'mixed')}
              >
                {t('practice.typeMixed')}
              </button>
              {PRACTICE_GENERATOR_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  aria-pressed={mode === 'types' && types.includes(type)}
                  onClick={() => toggleType(type)}
                  className={chip(mode === 'types' && types.includes(type))}
                >
                  {t(`practice.type_${type}`)}
                </button>
              ))}
            </div>
          </div>

          <div>
            {sectionLabel(t('practice.depthLabel'))}
            <div
              className="space-y-1.5"
              role="radiogroup"
              aria-label={t('practice.depthLabel')}
            >
              {DEPTHS.map((value) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={depth === value}
                  onClick={() => setDepth(value)}
                  className={cn(
                    'w-full rounded-xl border p-2.5 text-left transition-colors',
                    depth === value
                      ? 'border-primary bg-secondary'
                      : 'border-border bg-muted/30 hover:bg-muted/60',
                  )}
                >
                  <span className="block text-sm font-medium">
                    {t(`practice.depth_${value}`)}
                  </span>
                  <span className="block text-[11px] text-muted-foreground">
                    {t(`practice.depthDesc_${value}`)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
          )}

          <Button type="button" className="w-full" disabled={pending} onClick={handleGenerate}>
            {pending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('practice.generating')}
              </>
            ) : (
              t('practice.generate')
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
