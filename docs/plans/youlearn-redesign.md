# Talim AI — Learning Workspace Redesign (YouLearn-inspired)

> Status: **Agreed spec, build paused.** Created 2026-06-25.
> Decisions locked: themes **polished equally** (light + dark, no strong default);
> upload flow stays **as-is** (user is happy with it); **slides ditched** as a learner
> generator; the **3-role model is preserved** as the thing that gates what each
> person can generate and see. Start point (P0 vs mockup) deferred — resume on "go".

## North star

Turn the content page from a **route-fragmented reader** (`/content/[id]`, `/chat`,
`/podcast`, `/slides` — each unmounts the player when you switch) into **one
persistent "study workspace"** where a single piece of content is the unit of work:
the source (video / PDF / section text) lives permanently in the center and never
unmounts, while every study action — summary, podcast, quiz, flashcards, notes, AI
tutor — opens **beside it as a tab** in a right-hand **Learn hub** (O'rganish).

Strongly inspired by YouLearn's airy single-screen workspace, but unmistakably
Talim: violet+marigold, Rubik display, girih / marker-highlight motifs, Uzbek-first
copy, and the three roles intact. **We are not building a new engine** — Talim
already has the generators, the RAG tutor, the GAME-quiz, transcript sync, and an
unused `ResizableSplit`. This is a **re-composition** + two new generators
(Flashcards, Notes) + one upgraded quiz flow.

## Layout — one route, three panes

```
┌────────────┬─────────────────────────────┬──────────────────────┐
│ BOBLAR     │ CENTER: <ContentStage>      │ <ContentLearnPanel>  │
│ sections   │ the source — never unmounts │ tabbed Learn hub     │
│ ~18%       │ ~47%                        │ ~35%                 │
│ ContentSidebar │ video+transcript / PDF / text │ Learn · Chat · Quiz …│
└────────────┴─────────────────────────────┴──────────────────────┘
   resizable (ResizableSplit, storageKey 'content-workspace-split') · collapsible
   mobile (<md): one pane at a time — ContentStage default; Sheets for L/R
```

- Single full-height (`h-dvh`) workspace; reuse `app/[locale]/content/[id]/layout.tsx`
  shell (LearningTopbar + flex row). LEFT = `ContentSidebar` (BOBLAR rail, exists) ·
  CENTER = new `<ContentStage>` · RIGHT = new tabbed `<ContentLearnPanel>`.
- Use the **already-built-but-unused** `components/layout/resizable-split.tsx`
  between center and right (it drag-persists to localStorage; `chat/page.tsx` already
  uses it with `storageKey 'talim-chat-material-split'`).
- Panes collapse: left → icon strip; Learn panel → closeable for a full-width reader,
  re-opened from a topbar toggle.
- Responsive: below `md`, one pane at a time. Reuse `ContentSidebarSheet`; convert
  `ContentRightPanelSheet` into the Learn-panel drawer with an internal tab strip
  (the `md:hidden` FAB pattern already exists in `page.tsx`).
- URL: keep `?section=X`; add `?panel=chat|quiz|<artifactId>` so an open tab is
  deep-linkable. Old `/chat`, `/podcast`, `/slides` become thin `?panel=` redirects.

## Center — <ContentStage> + transcript

- Branch on `content.type`, reusing **existing** components (today split across
  `page.tsx` and `chat/page.tsx`): YOUTUBE → `YoutubeVideoPlayer` + `TranscriptPanel`;
  PDF/SLIDE → `PdfViewer`; text → `SectionReader`/markdown. Lift `currentMs`/seek up so
  transcript + a Chapters view share it.
- Slim toolbar under the media: 2-segment **"Boblar | Matn"** (Chapters | Transcript),
  an **Auto-scroll** switch, a collapse chevron (styled like the existing
  slides/text toggle in `section-reader.tsx`).
- **Chapters** = the content's sections/BOBLAR as jump rows (derive video chapter
  times from section/transcript-paragraph boundaries; PDFs map sections → page
  ranges). Near-zero backend work.
- **Transcript** = the existing `TranscriptPanel` (already groups segments into
  sentences, highlights the active sentence with a 650 ms lead, smooth-scrolls,
  click-to-seek, select-to-ask). CHANGE: gate `scrollIntoView` on the Auto-scroll
  boolean; render visible left-gutter `m:ss` timestamp chips (`startMs` +
  `formatTimestamp` already exist) so it reads like YouLearn's 00:00 / 00:17 index.
- **Spotlight** `PdfViewer`'s marquee region → (cropped image + extracted text) →
  tutor flow — it beats YouLearn's text-only PDF chat. Frame with page X/N + zoom.
- "Reading mode" collapse hands full center height to the text, persisted per content.

## Right — the Learn hub (<ContentLearnPanel>)

Refactor `components/layout/content-right-panel.tsx` (today a fixed stack: progress
ring + Resources buttons + LearningHistoryPanel + streak) into a **tab host**. Demote
the progress ring + streak to a compact **header strip**. Default tab = **Learn**.

### Generate grid (Yaratish) — keep / add / ditch

| Generator | Decision | Notes |
|---|---|---|
| Summary (Xulosa) | **KEEP** | gear: short / detailed |
| Podcast (Podkast) | **KEEP** | in-panel player + speaker-labeled transcript |
| Quiz (Test) | **KEEP** | gear: style / count (move out of `page.tsx`) |
| Video (Manim) | **KEEP** | unique; lower priority than the adds |
| **Flashcards (Kartochkalar)** | **ADD** | highest-leverage active recall; new artifact model + AI JSON via `ai.service`; flip / again-good study mode |
| **Notes / Study guide (Konspekt)** | **ADD** | thin AI prompt over RAG context; markdown (react-markdown + KaTeX + mermaid) |
| **Lesson Plan (Dars rejasi)** | **ADD** | **TENANT_OWNER only** |
| Slides | **DITCH** | weakest YouLearn fit, overlaps Notes+Video, costs money; remove from the learner grid (optionally keep only as a tutor present-to-class aid) |

- Each card: icon (girih corner motif), label, **settings gear** (popover *before*
  generating). Card-body click = generate with defaults. Per-card **scope toggle**
  ("Shu bob" vs "Butun material") — generators are already section-scoped.
- Route every generator through the existing `assertQuota`/subscription path +
  `classifyGenerationError` messaging (cost stays bounded).

### My Sets (Mening to'plamlarim)

Replace `LearningHistoryPanel` with a unified artifacts list aggregating
`ContentSummary` + `PodcastEpisode` + `Quiz`/`Assessment` + `ContentVideo` + new
Flashcards/Notes. Each row = icon + title + meta + **live status** ("Test
tayyorlanmoqda…" shimmer, driven by the `refetchInterval` polling Talim already
does). Row opens the artifact as a **new closable tab**; kebab = open / regenerate /
delete / (tutor) **assign**. Persist open tabs + active tab + per-tab scroll in an
extended `useChatStore` (keep it minimal; react-query stays the source of truth for
artifact data, so switching tabs never loses progress).

## Chat & context (AI o'qituvchi)

- Becomes a **permanent tab** in the Learn panel (not the `/chat` route) — the
  ChatWindow sits beside the still-playing player.
- **@ Add Context** (@Kontekst qo'shish) chip-picker scoping retrieval to whole
  content / a BOB / the current transcript window / a flashcard or quiz question
  (pass a `sectionId`/chunk-range filter to `searchSimilarChunks`, mirroring the
  assessment generator's `getSectionContext`).
- **Elevate select-to-ask:** `selectedExcerpt`/`selectedExcerptImage` are already
  wired; make the trigger **visible** via the existing `SelectionToolbar.tsx`
  ("AI o'qituvchidan so'rash" / "Tushuntir") for both transcript selections and PDF
  marquee, instead of silently seeding the input.
- **Citations (top trust win):** extend the SSE protocol in `chat.controller.ts` with
  citation events `{chunkIndex, sectionTitle, timestamp}` (data already in the RAG
  context + `ContentTranscriptSegment`) → render small **"Manba"** pills under answers
  that deep-link the transcript/PDF to that spot.
- KEEP `classifyTutorScope` (graceful Uzbek refusal), the `TUTOR_MESSAGE` quota, and
  the visual tutor tools (Manim/Desmos/Mermaid/charts) — a real edge over YouLearn.

## Quiz — an interactive tutoring loop

- New `components/learner/quiz-learn-player.tsx` (sibling to `game-quiz-player.tsx`),
  reusing its phase machine + `useSubmitLearnerAssessment` but **without the
  countdown**.
- One MCQ at a time (A–D), progress bar (i/N), chip row: **"Maslahat ber"** (hint) ·
  **"Bosqichma-bosqich tushuntir"** (walk me through) · **"5 yoshlik bolaga
  tushuntir"** (ELI5) · Check · **"Bilmayman"** (Don't know).
- **Critical reuse:** every chip POSTs to the **same `/chat/stream` RAG tutor** with
  `selectedExcerpt` = question+options and a mode directive (`hint|walkthrough|eli5|
  explain_answer`) — the Uzbek prompt in `locale-prompts.ts` already implements
  ELI5/Socratic/example, so **no second AI path**.
- Per-question feedback + the stored `BankQuestion.explanation` inline (today only
  shown at the end). "Bilmayman" reveals a walk-through then offers Retry. Results →
  "retake wrong only" mini-quiz + "discuss this concept" handoff that opens Chat
  pre-seeded with the missed question.
- B2C: wire "generate quiz from this content" for INDIVIDUAL (assessments are
  tutor-only today), gated by `enforceQuota`.
- **KEEP GAME mode as-is** (speed/streak `computeGamePoints` + leaderboard) for
  tutor-assigned timed quizzes — complementary, not a duplicate; launch it as a Learn
  tab when started from content. (Also: `game-quiz-player.tsx` hardcodes English —
  fix to `messages/{uz,en,ru}.json` while building the learn player.)

## Navigation & Spaces

- Unify the three sidebars (`dashboard-sidebar`, `tenant-sidebar`,
  `learner-navigation`) into ONE **role-config `AppSidebar`**, keeping the shared
  violet active state (`bg-primary/10 text-primary rounded-xl`) + `user-sidebar-footer`.
- Shared top: logo + a prominent **"Kontent qo'shish"** button (opens a modal reusing
  `FileUploadField` + `YoutubeLinkForm` from `UploadCard.tsx`) — for INDIVIDUAL and
  TENANT_OWNER **only, never TENANT_LEARNER** — + Search + Recents/History.
- **One role-polymorphic "Space":** private folder (INDIVIDUAL) · a
  **class-with-join-code** (TENANT_OWNER — dropping a material into a Space = assign to
  that class's students, via `contentAccess.service.ts`; reuse `join-code-card.tsx`) ·
  read-only "My Classes" (TENANT_LEARNER).
- Add a role-scoped global Search + a Library page (filter by Space/type/status) that
  absorbs the flat `/tenant/materials` list and the learner grid; seed Recents from
  `useContents().slice(0,5)`.
- **Defer** YouLearn's consumer-growth rail (Discord, Chrome extension, mobile-app
  promo, in-nav streak/Upgrade) — off-brand for an Uzbek-first tutor/school product.

## Role adaptations (security stays server-side)

All three roles share the **same workspace shell**; role decides which cards/tabs
render. UI gating is cosmetic — real enforcement stays in `contentAccess.service.ts`
(`assertCanAccessContent` / `assertCanMutateContent` / `buildContentListWhere`).

- **INDIVIDUAL:** full Generate grid; generate freely + self-serve quiz loop; uploads;
  own content only.
- **TENANT_OWNER:** everything INDIVIDUAL has + the Lesson Plan card + **assign any
  artifact** to students (kebab → assign; reuse `AssignStudentsPanel`); org materials;
  uploads.
- **TENANT_LEARNER:** Generate grid **HIDDEN** (`hideGenerateActions` already
  threaded); sees pre-generated artifacts + Chat + assigned Quiz/GAME tabs, on
  **assigned materials only**, and **never** an Add-content affordance. A deactivated
  student (`TenantMembership.active=false`) loses access on the next request — preserve
  `requireActiveLearner`; if the workspace adds SSE/WebSocket sync, enforce active
  membership at connection level so deactivation kicks them immediately.

## Visual direction (both themes first-class)

Keep YouLearn's **structural restraint** — generous whitespace, `rounded-2xl` cards,
subtle `border-border/70` + `shadow-soft`, calm density — and make it read equally
well in **light and dark** (no strong default; tune both). Brand carries every accent:
Rubik display for tab headers / card titles / section H1; **violet** = primary/active
(active tab underline, selected card, progress ring); **marigold** = gamified moments
(streak, GAME speed-points, correct-answer celebration). Reuse the tokens already
shipped in `game-quiz-player.tsx` (`rounded-2xl border-border/70 shadow-soft`) so this
extends the system, not replaces it.

Signature motifs (the differentiator from a YouLearn clone): a faint **girih corner
motif** on each Generate card; a **marker-highlight** (not flat green) on correct quiz
answers and on cited "Manba" pills. Motion stays quiet — shimmer on "Generating…"
rows, 150 ms tab cross-fade, the existing transcript active-sentence glide.

**The one tasteful risk:** a thin animated **"girih thread"** that runs along the
active tab's underline and, on hover, connects a citation pill to the exact spot it
highlights in the transcript/PDF — a uniquely Talim, Uzbek-geometric way to make
"answers cite the source" feel physical. Hover-only progressive enhancement; degrades
to a plain pill + scroll.

## Phased plan

### P0 — First usable workspace slice (pure re-composition)
Goal: one persistent 3-pane workspace; content never unmounts; Chat lives beside it.
**No net-new generators.**
- Recompose `content/[id]/layout.tsx` + `page.tsx` into LEFT `ContentSidebar` | CENTER
  `<ContentStage>` | RIGHT `<ContentLearnPanel>`, with `resizable-split.tsx` between
  center and right (`storageKey 'content-workspace-split'`).
- Build `<ContentStage>` branching on `content.type`, reusing
  `YoutubeVideoPlayer`+`TranscriptPanel`, `PdfViewer`, `SectionReader`/markdown (lift
  `currentMs`/seek up).
- Refactor `content-right-panel.tsx` into the `<ContentLearnPanel>` tab host: tabs =
  Learn (existing Resources buttons as a first-pass grid), Chat (move `ChatWindow` in),
  dynamic artifact tabs; demote progress ring + streak to a header. Back tab/quiz state
  with an extended `useChatStore`.
- Fold `/content/[id]/chat` into the Chat tab; make `/chat`, `/podcast` thin `?panel=`
  redirects. Keep `ContentSidebarSheet`; convert `ContentRightPanelSheet` into the
  mobile Learn drawer with a tab strip.
- Preserve role gating (`hideGenerateActions`/`isLearner`); verify TENANT_LEARNER never
  sees generate/upload.
- Add `learnHub` i18n keys (Uzbek-first) to `messages/{uz,en,ru}.json`.

### P1 — Generate grid + My Sets + interactive quiz + transcript polish
- Generate grid with per-card gears (KEEP Summary/Podcast/Quiz/Video; move
  quizStyle/quizCount into the Quiz gear; add scope toggle).
- My Sets: unified artifacts query with live status; replace `LearningHistoryPanel`;
  rows open artifact tabs; kebab actions.
- `quiz-learn-player.tsx` (untimed) reusing the game player's phase machine; chips →
  `/chat/stream` with mode directives; "retake wrong only" + "discuss concept"
  handoff; B2C "generate quiz" (INDIVIDUAL, `enforceQuota`).
- Center toolbar: Boblar|Matn toggle + Auto-scroll + collapse; `m:ss` chips; gate
  `scrollIntoView`; Chapters from section/transcript boundaries.
- Citations: SSE citation events + "Manba" pills deep-linking the viewer; surface
  select-to-ask via `SelectionToolbar`.
- Ditch slides from the learner grid; redirect `/slides`; fix `game-quiz-player`
  hardcoded English.

### P2 — New generators, Spaces, unified nav, the brand risk
- ADD Flashcards (artifact model + AI JSON + flip/again-good; reuse GAME speed/streak
  for a flashcard sprint; `assertQuota`).
- ADD Notes/Study guide (AI over RAG context, markdown-rendered, doc tab).
- ADD Lesson Plan card (TENANT_OWNER-only); wire "assign to students" kebab via
  `contentAccess.service.ts` + `AssignStudentsPanel`.
- @ Add Context chip-picker scoping `searchSimilarChunks`.
- Unify sidebars into one role-config `AppSidebar`; promote Add-content modal to the
  rail (INDIVIDUAL/TENANT_OWNER only); Search + Library page + role-polymorphic Spaces
  (reuse `join-code-card.tsx`); role-specific empty states (extend
  `onboarding-checklist.tsx`).
- Ship the visual signatures: girih card corners, marker-highlight correct answers,
  and the animated "girih thread" citation link.

## Risks & guardrails

1. **Scope creep** — P0 is *purely* re-composition; do not bundle Flashcards/Notes/
   citations into it. The center reader must keep working for all three content types
   before any generator UI changes.
2. **State/tab persistence** — keep tab state minimal (open tabs + active + per-tab
   scroll); react-query stays the source of truth for artifact data, or switching tabs
   loses progress.
3. **Deep-link back-compat** — `/chat`, `/podcast`, `/slides` must keep working as
   `?panel=` redirects, or existing links/bookmarks 404.
4. **Role-gating regressions** — the shared shell could expose generate/upload to a
   TENANT_LEARNER in the UI; server guards still hold, but the UI must not imply
   actions that 403. Test the deactivated-student path explicitly.
5. **Generation cost** — two new generators + a B2C self-serve quiz widen the AI cost
   surface; all must go through `assertQuota`/subscription + the GENERATION/
   TUTOR_MESSAGE meters + `classifyGenerationError`.
6. **Citation accuracy** — validate `chunkIndex` → section/timestamp mapping before
   shipping "Manba" pills; wrong deep-links erode the trust the feature builds.
7. **i18n debt** — existing hardcoded-English components (`game-quiz-player`,
   `leaderboard-table`) + all new strings must land in all three `messages/*.json`
   Uzbek-first; AI-generated Flashcards/Notes content must follow proper-Uzbek-then-
   Russian output policy.
8. **Spaces is a real data-model change** (new Space table + content join) — the most
   expensive P2 item; if descoped, unified nav + Library can still ship without it.
9. **The "girih thread"** is finicky across PDF/video/text viewers and scroll
   positions — hover-only progressive enhancement that degrades to a plain pill+scroll.
