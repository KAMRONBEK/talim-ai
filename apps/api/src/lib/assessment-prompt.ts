import type { QuestionType } from '@prisma/client';

/** Styles offered by the B2C per-content quiz generator (unchanged). */
export type QuestionStyle = 'mixed' | 'multipleChoice' | 'trueFalse' | 'written' | 'numeric';

/** Styles for the B2B question-bank generator — adds the B1 + structured (B2) types. */
export type AssessmentQuestionStyle =
  | QuestionStyle
  | 'multipleSelect'
  | 'fillBlank'
  | 'dropdownCloze'
  | 'matching'
  | 'ordering';

/**
 * B2B assessment normalizer — the full set including the B1 types
 * (TRUE_FALSE / MULTIPLE_SELECT / FILL_BLANK), the B2 structured types
 * (DROPDOWN_CLOZE / MATCHING / ORDERING), and the manual-authoring-only types
 * (HOTSPOT / DRAG_DROP). Used only by the tenant question-bank generator, whose
 * storage + scoring engine handle these types. HOTSPOT/DRAG_DROP are never AI-generated
 * (not in any generation style list or the mixed prompt) — they only pass through here so
 * type-normalization of an already-typed manual/edited question preserves them.
 */
export function normalizeAssessmentQuestionType(type: string | undefined): QuestionType {
  switch (type) {
    case 'NUMERIC':
    case 'MULTIPLE_CHOICE':
    case 'TRUE_FALSE':
    case 'MULTIPLE_SELECT':
    case 'FILL_BLANK':
    case 'DROPDOWN_CLOZE':
    case 'MATCHING':
    case 'ORDERING':
    case 'HOTSPOT':
    case 'DRAG_DROP':
    // FLASHCARD must pass through as itself, NOT collapse to SHORT_ANSWER: the shared
    // system prompt teaches the flashcard shape, and the bank pipeline's allowedTypes
    // filter is what keeps tenant banks flashcard-free — a collapsed card would slip
    // past it as an unanswerable written question (its only accepted answer being a
    // definition-length card back).
    case 'FLASHCARD':
      return type;
    default:
      return 'SHORT_ANSWER';
  }
}
