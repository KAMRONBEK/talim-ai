# Question Engine Rework — Design

Status: **in progress** (2026-07-11). This document is the authoritative design for the unified
question generation + evaluation engine, replacing the split B2C-quiz / flashcard / B2B-bank
pipelines. Research base: 2024–2026 item-writing (IWF rubric, misconception distractors,
Generate-Then-Validate), mastery modeling (Pelánek Elo, Khan Academy bands, ALEKS re-checks),
grading practice (Moodle tolerances, QTI partial credit, Uzbek Unicode normalization).

## Why (product owner requirements)

1. Flashcards, numeric, test etc. must be **one** question-generation surface — flashcards are
   currently a silo (`FlashcardDeck` + separate page + own SM-2 state).
2. "Quick questions" (QuizKind `QUICK`) is not needed — remove from the product surface.
3. "Question style" single-select is too generic → **type multi-select** + **count** + **depth**.
4. Questions must not just parrot the material — also generate *near-transfer* questions
   (same concept/section/theme, new scenario/numbers).
5. Evaluation must be honest: correct answers push mastery **up**, wrong answers push it
   **down**; answering one question on a topic ≠ having learnt it.

## 1. Unified generation parameters (B2C and B2B)

| Param | Values | Default | Notes |
| --- | --- | --- | --- |
| `count` | 1–30 | 10 | UI presets 5 / 10 / 15 / 20 (B2B keeps free input) |
| `types` | subset of QuestionType (+ `FLASHCARD` pseudo-type in B2C UI) | MCQ+TRUE_FALSE+FILL_BLANK+SHORT_ANSWER | replaces the single `style` select; `style` column kept for legacy rows |
| `depth` | `recall` \| `understanding` \| `application` \| `mixed` | `mixed` | maps to Bloom bands; `application` triggers near-transfer prompting |
| scope | `sectionId` \| whole material | current section | unchanged |
| `locale` | uz/en/ru | resolveLocale | unchanged, Uzbek-first |

- `QuizKind.QUICK` stops being creatable (enum value stays in DB for old rows; UI stops
  offering it, controller rejects it). The `quickCheckAccuracy` progress input degrades
  gracefully (no new QUICK attempts; blend re-weights, see §4).
- B2C gains the full structured type set (MULTIPLE_SELECT, FILL_BLANK, DROPDOWN_CLOZE,
  MATCHING, ORDERING). HOTSPOT/DRAG_DROP stay B2B/manual-author only.
- Flashcards: the Practice dialog exposes a "Flashcards" choice that drives the *existing*
  deck endpoints (count param added). The deck viewer page stays; its reviews now also feed
  mastery (§4).

## 2. Generation pipeline (shared: `apps/api/src/services/question-gen.service.ts`)

Used by `generateQuiz.job` (B2C) and `assessment/banks.generateQuestions` (B2B).

1. **Context**: per-section chunk range (or hybrid RAG for whole material) — existing code.
2. **Prompt** (per locale × depth):
   - depth definitions + allowed stem verbs (recall: define/list; understanding:
     explain/compare/classify *restated* instances; application: apply to a NEW scenario).
   - **Near-transfer constraints** (understanding/application): stem must not reuse any ≥5-word
     phrase from the source; application items set in a scenario NOT in the source, but the
     answer must be derivable from the source concept alone.
   - **Misconception distractors**: each wrong option derived from a named realistic learner
     error; label stored per option (becomes targeted feedback when that option is picked).
   - **Source anchor**: every item must carry `sourceQuote` — a verbatim span from the context
     proving the correct answer.
   - Per-type rules: single-blank cloze only; no negatives/always/never/all-of-the-above;
     options grammatically parallel + similar length; T/F paraphrased (never copied sentences);
     numeric answers must include tolerance-friendly canonical values.
   - LLM declares `difficulty` (easy/medium/hard) per item → seeds the Elo item prior.
   - Overgenerate ~1.5× requested count.
3. **Rule filter** (code, free): dedupe stems; drop parroting (existing `dropParrotingQuestions`
   + new 5-gram overlap check between stem and source); ban-list (all/none of the above,
   always/never in options, negative stems); answerability checks (existing
   `isAnswerableMultipleChoice`/`MultipleSelect` + structured builders); reject items whose
   `sourceQuote` doesn't fuzzy-match the context (normalized containment ≥ threshold).
4. **Balanced shuffle** (code): server-side option shuffle with correct answers assigned an
   exactly-balanced position distribution — kills LLM key-position bias. Never persist the
   model's option order.
5. Trim to requested count with a type/difficulty mix that honors the request; persist.

Rationale generation: `explanation` (already exists) + per-distractor `optionRationales`
shown post-answer.

## 3. Unified grading (shared module `packages/types/grading.ts`)

Single implementation used by API (authoritative) and web (instant practice feedback):

- **Normalization**: trim → NFKC → lowercase (locale-aware) → **fold apostrophe variants**
  (U+02BB ʻ, U+02BC ʼ, U+2018 ', U+2019 ', backtick, ´ → U+0027) → collapse whitespace →
  strip edge punctuation. Critical for Uzbek Latin (oʻ/gʻ/tutuq belgisi typed many ways).
- **Numeric**: parse `.`/`,` decimals; correct iff `|x−a| ≤ max(0.001, 0.01·|a|)` (abs floor
  keeps legacy behavior, relative term fixes large-magnitude answers).
- **Partial credit** (`creditFraction`):
  - MULTIPLE_SELECT: clamped ratio `max(0, hits/totalCorrect − wrong/totalCorrect)` (Moodle).
  - ORDERING: pairwise (Kendall-tau) `correctPairs / C(n,2)`.
  - MATCHING: per-pair `correctPairs/totalPairs`.
  - FILL_BLANK / DROPDOWN_CLOZE: per-blank.
  - GAME mode stays all-or-nothing (leaderboard clarity).
- `assessment/shared.ts gradeQuestion` and `quiz.controller evaluateQuizAnswers` both call
  this module (superset-compatible with today's behavior).

## 4. Mastery model — "Elo-KT" per (user, section)

New tables (additive migration only — **hand-write SQL, never `migrate diff` with pgvector**):

```prisma
model SectionMastery {
  id            String    @id @default(cuid())
  userId        String
  contentId     String
  sectionId     String?          // null = whole-material bucket
  theta         Float     @default(0)   // ability logit, clamped ±3
  attempts      Int       @default(0)
  correct       Int       @default(0)
  activeDays    Int       @default(0)   // distinct days with answers (mastered gate)
  lastAnswerDay String?                  // YYYY-MM-DD of last counted day
  lastAnswerAt  DateTime?
  updatedAt     DateTime  @updatedAt
  @@unique([userId, contentId, sectionId])
}
model QuestionStat {
  itemKey    String  @id      // "quiz:<quizQuestionId>" | "bank:<bankQuestionId>" | "card:<flashcardId>"
  difficulty Float   @default(0)  // logit; seeded from LLM difficulty easy/med/hard → −1/0/+1
  attempts   Int     @default(0)
}
```

**Per answer** (`recordAnswer({userId, contentId, sectionId, itemKey, questionType, correct, credit, source, declaredDifficulty})`):

1. Lazy decay: if `Δdays ≥ 7`: `θ ← θ·exp(−Δdays/60)` (no cron).
2. Guess floor `g`: 1/numOptions for MCQ (0.25), 0.5 T/F, ~0.05 structured, 0 free-text,
   0.2 flashcard self-report.
3. Expected `E = g + (1−g)·σ(θ − d)`; item difficulty `d` from QuestionStat (prior n₀=5).
4. `K_user = 1/(1+0.05·attempts)`; source weight: flashcard self-report ×0.5.
5. `θ ← clamp(θ + w·K_user·(y−E), −3, 3)`; `d ← clamp(d + K_item·(E−y), −3, 3)` with
   `K_item = 1/(1+0.05·(attempts_item+5))`. `y` uses graded credit (partial counts partially).
6. Counters, `activeDays` (increment when the calendar day changes), timestamps.

**Display**: `M = round(100·σ(θ_decayed))`. Bands (score AND evidence gates):
`attempted` ≥1; `familiar` ≥4 answers ∧ M≥60; `proficient` ≥8 ∧ M≥75; `mastered` ≥12 ∧
`activeDays`≥2 ∧ M≥85. Demotion by recompute with 3-point hysteresis; inactivity decay can
demote at most to `familiar`. Mastery **can go down** and the UI says why.

**Currency separation**: GAME speed points/streaks stay a separate monotonic currency —
mastery consumes correctness only.

**Wiring**: B2C quiz submit (per question, section = quiz.sectionId ?? null), learner
assessment submit (per AttemptAnswer, section = bankQuestion.sourceSectionId), flashcard
review (correct = grade ≠ 'again', self-report weight). Submit responses include
`masteryDelta` so the UI can show +/− honestly. `GET /quiz/content/:contentId/mastery`
returns per-section mastery for the progress rail.

`SectionProgress.coverageScore` keeps working (viewing/coverage), but quiz-driven mastery
display shifts to SectionMastery; `preventDowngrade` stays only for *coverage*, not mastery.

## 5. UI changes

**B2C (Learn panel)**: one **Practice** block replacing style-select + "Practice quiz" +
"Quick check": count presets, type chips (incl. Flashcards), depth select, scope, Generate.
Quiz page (`QuizCard`) renders the full type set (renderers adapted from the learner
WrittenForm patterns) with instant feedback, partial credit display, chosen-distractor
rationale, and a mastery delta on the result screen. Progress rail shows band + 0–100 per
section (with "down" states framed as *needs review*).

**Tenant wizard**: generate step gets count (1–30), depth select, type multi-select; review
step shows difficulty/bloom badges per draft. Drafts stay DRAFT→APPROVED (unchanged).

**Learner (student)**: takes the same upgraded QuizCard for assigned quizzes; assessments
unchanged except grading now flows through the shared module and feeds mastery.

## 6. Migration & compat

- Additive columns: `Quiz.depth` (text default 'mixed'), `Quiz.types` (jsonb null),
  `QuizQuestion.{difficulty,bloom,sourceQuote,optionRationales,config}`,
  `BankQuestion.{difficulty,bloom,sourceQuote,optionRationales}` (BankQuestion already has
  `config`). New tables above. Enum values untouched.
- Old QUICK quizzes remain readable; history labels unchanged.
- `style` derived for display from `types` when absent.

## Rollout order

1. Schema + types → 2. grading module → 3. question-gen service + prompts → 4. mastery
service + wiring → 5. API surface → 6. web B2C → 7. web tenant → 8. i18n → 9. verify
(typecheck/build/migrate), docs, memory.

## 7. v2 follow-ups (2026-07-12) — count reliability, flashcards-in-session, math rendering

Shipped after live VPS feedback (15 requested → 5 delivered, of assorted types; flashcards
felt bolted-on; formulas rendered raw):

- **Fill-to-count retry** (`apps/api/src/lib/question-gen.ts` — `generateQuestionSet`, used
  by BOTH pipelines): pass 1 overgenerates 1.5×; if the quality filters leave a shortfall, a
  second pass re-prompts for the missing items with every kept stem listed as a forbidden
  repeat (`avoidStems` block in the prompt) and a shared stem-dedupe set. Postprocess now
  returns a per-reason skip `breakdown` (parroting / missingAnswer / typeNotAllowed /
  duplicateStem / quoteNotFound / bannedOption / malformedStructured / unanswerable), logged
  by both callers. Verified live: the failing request now delivers 15/15.
- **Whole-material context = stratified chunk spread**, sized to the requested count
  (`getWholeMaterialChunks`, ~1.6×count chunks, 12–30): title-similarity retrieval clustered
  at the intro and starved later sections; the bank path's take-20-first had the same bias
  (`getSectionContext` now samples the same even spread).
- **FLASHCARD as a first-class practice question type** (Prisma enum + `@talim/types`,
  migration `20260712010000_flashcard_question_type`): generated in the SAME session as
  other types (B2C only — tenant banks/assessment players exclude it), rendered as
  reveal-back + self-grade (Bildim/Bilmadim), graded via the `known`/`unknown` sentinel in
  the shared engine (`gradeQuestion` FLASHCARD case), and fed to mastery at half weight with
  a 0.2 guess floor (constants in `packages/types/grading.ts`). The Practice dialog's
  Flashcards chip is now a type chip, multi-selectable with the rest; the standalone
  SRS deck page stays for spaced review.
- **Math rendering**: prompts mandate `$...$`/`$$...$$` LaTeX for every formula (typeRules
  MATH NOTATION block, all locales); the shared `RichText` renderer normalizes `\(..\)` /
  `\[..\]` delimiters to dollars and converts bare newlines to markdown hard breaks so
  multi-line stems (e.g. an expression under the question line) don't collapse.
