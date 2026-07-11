# Talim AI — Feature Catalog

This document is a map from **features that exist today** to the **code that implements them**. Every entry has been verified against the source. Use it to find where a behavior lives.

## How to read this

- **What** — short description of the feature.
- **Who** — which role(s) it serves: `INDIVIDUAL` (B2C solo learner), `TENANT_OWNER` (tutor/school admin, the paying customer), `TENANT_LEARNER` (a student inside one tutor's org), `ADMIN` (platform operator).
- **API** — backend files (Express + Prisma) under `apps/api/src`.
- **Web / Admin** — frontend files under `apps/web` (next-intl, port 3000) or `apps/admin` (no i18n, port 3001).

> Conventions worth knowing up front:
> - API routes are mounted at **root** (no `/api` prefix). Health is `GET /health`. See `apps/api/src/routes/index.ts`.
> - Multi-tenant isolation is enforced centrally in `apps/api/src/services/contentAccess.service.ts`.
> - Several backend modules are folders re-exported through a barrel at the original path (e.g. `apps/api/src/services/assessment.service.ts` re-exports `apps/api/src/services/assessment/*`), so imports stay stable.

---

## 1. Content & AI

The original B2C learning loop, reused by tutors for their own materials. Tutors operate on the same content pipeline through the `/tenant/content/*` routes; individuals use `/content/*`.

### 1.1 Upload PDFs / slides
- **What:** Upload a PDF (or slide deck) which is stored, parsed, sectioned, chunked, and embedded for downstream AI features.
- **Who:** INDIVIDUAL, TENANT_OWNER.
- **API:** `controllers/content.controller.ts` (`uploadContent`) and `controllers/tenant-content.controller.ts` for the tenant variant; `middleware/upload.middleware.ts` (multipart), `middleware/quota.middleware.ts` (`enforceQuota('UPLOAD','GENERATION')`); `services/storage.service.ts`, `services/pdf.service.ts` (`extractPdfText`, `extractRegionTextFromImage`); ingestion job `jobs/processContent.job.ts`. Routes: `routes/content.routes.ts` (`POST /content/upload`), `routes/tenant.routes.ts` (`POST /tenant/content/upload`).
- **Web:** `app/[locale]/dashboard/page.tsx`, `hooks/useFileUpload.tsx`, `hooks/useContent.ts`, `hooks/useTenantContent.ts`, `components/content/*`.

### 1.2 YouTube import
- **What:** Import a YouTube video by URL; pulls captions when available or AI-transcribes, then treats the transcript like any other content (sections, chunks, chat, quizzes).
- **Who:** INDIVIDUAL, TENANT_OWNER.
- **API:** `services/youtube.service.ts` (`extractYoutubeVideoId`, `extractYoutubeTranscript`, transcript-source handling), `controllers/content.controller.ts` (`createYoutubeContent`), tenant variant in `controllers/tenant-content.controller.ts`. Routes: `POST /content/youtube`, `POST /tenant/content/youtube`. Transcript segments persist via `ContentTranscriptSegment` (Prisma).
- **Web:** transcript viewing through `hooks/useTranscript.ts`; content pages under `app/[locale]/content/[id]/`.

### 1.3 Sectioning (hierarchical)
- **What:** Splits content into ordered sections with AI-generated titles, used for navigation, assignment scoping, and progress tracking. Sections can be **2-level hierarchical** (chapter → subsection): section generation optionally emits a nested chapter/subsection outline and the section rail renders it nested.
- **Who:** INDIVIDUAL, TENANT_OWNER (generation); TENANT_LEARNER (read).
- **API:** `services/section.service.ts`, `controllers/section.controller.ts`. Routes expose `GET /content/:id/sections` and `:sectionId` (also under `/tenant/content/...`). Models `ContentSection` (self-relation `parentId` + `depth`), `ContentSectionTitle`, `SectionProgress` (Prisma). Migration `20260702010000_section_hierarchy`.
- **Web:** `hooks/useSections.ts`, the nested rail in `components/layout/content-sidebar.tsx`, `components/content/*`, `components/learning/*`.

### 1.4 AI summaries
- **What:** Generate a structured AI summary of a piece of content.
- **Who:** INDIVIDUAL, TENANT_OWNER (learners are blocked from generation via `blockLearnerMutations`).
- **API:** `controllers/summary.controller.ts` (`getSummary`, `generateSummary`); `routes/summary.routes.ts` (`GET/POST /summary/:contentId`). Model `ContentSummary`; usage feature `SUMMARY_GEN`.
- **Web:** surfaced on content pages; AI calls flow through `services/ai.service.ts`.

### 1.5 Podcasts (TTS + synced transcript)
- **What:** Generate a multi-episode audio "podcast" from content using text-to-speech; tracks per-episode listening progress, streams audio, and shows a **transcript that follows the audio**. Segment timings are derived from the **real per-segment TTS audio byte-lengths** (Azure CBR) and rescaled to the true audio duration in the player; legacy episodes without stored segments fall back to character-length estimation.
- **Who:** INDIVIDUAL, TENANT_OWNER (generate); TENANT_LEARNER (listen to assigned content).
- **API:** `services/tts.service.ts` (`synthesizeSpeech`, `synthesizeDialogueWithSegments` returning per-turn byte lengths), `controllers/podcast.controller.ts` (`getPodcast`, `createPodcast`, `streamEpisodeAudio`), background job `jobs/generatePodcast.job.ts`. Routes: `GET/POST /content/:id/podcast`, `GET /content/:id/podcast/episodes/:episodeId/audio`, progress at `PATCH /content/:id/podcast/episodes/:episodeId/progress`. Models `Podcast`, `PodcastEpisode` (now carries `segments`), `PodcastEpisodeProgress`; usage feature `PODCAST_GEN`. Migration `20260702020000_podcast_segments`.
- **Web:** `app/[locale]/content/[id]/podcast/page.tsx`, `components/podcast/PodcastPlayer.tsx` (transcript sync), `components/podcast/*`, `hooks/usePodcast.ts`.

### 1.6 Practice generator (unified questions + flashcards) & Elo-KT mastery
- **What:** ONE generator for all practice from a piece of content (design: `docs/plans/question-engine.md`): the learner picks **count** (1–30, default 10), **question types** (multi-select: MCQ, true/false, multi-select, fill-blank, dropdown-cloze, matching, ordering, short answer, numeric — or flashcards), **depth** (recall / understanding / application / mixed; application = near-transfer questions set in NEW scenarios, never parroted from the text), and **scope** (section or whole material). Generation runs a quality pipeline: misconception-derived distractors with per-option rationales, a verbatim `sourceQuote` anchor verified against the material (hallucination firewall), overgenerate → rule-filter → balanced answer-position shuffle. After submitting, the learner gets a per-question review screen plus **mastery deltas**. Mastery is **Elo-KT** per (user, section): correct answers push it up, wrong answers push it **down**, inactivity decays it; bands (attempted/familiar/proficient/mastered) are gated by evidence so one right answer never shows a topic as "learnt". The legacy "quick check" (QuizKind `QUICK`) is retired (old rows still render). (Distinct from tenant assessments in §4, which share the same generation + grading engine.)
- **Who:** INDIVIDUAL, TENANT_OWNER (create); TENANT_LEARNER (take, via assigned content).
- **API:** `controllers/quiz.controller.ts` (`createQuiz` with `types`/`depth`/`count`, `submitQuiz` returning `masteryDeltas`, `getContentMastery`), job `jobs/generateQuiz.job.ts`; generation engine `lib/question-gen-prompt.ts` + `lib/question-postprocess.ts` + `lib/question-builders.ts`; mastery `services/sectionMastery.service.ts` (+ pure math `packages/types/mastery.ts`). Routes: `routes/quiz.routes.ts` (`/quiz/content/:contentId`, `/quiz/content/:contentId/mastery`, `/quiz/:id`, `/quiz/:id/submit`). Models `Quiz` (`depth`, `types`), `QuizQuestion` (`config`, `difficulty`, `bloom`, `sourceQuote`, `optionRationales`, `sourceSectionId`), `QuizAttempt`, `SectionMastery`, `QuestionStat`; usage feature `QUIZ_GEN`. Migration `20260711000000_question_engine`.
- **Web:** `components/practice/practice-generator.tsx` (the unified dialog), `app/[locale]/quiz/[id]/page.tsx`, `components/quiz/*` (all types + partial credit + misconception rationales), `hooks/useQuiz.ts`, `hooks/useMastery.ts`; flashcards study UI stays at `app/[locale]/content/[id]/flashcards/page.tsx` (reviews feed mastery at self-report weight).

### 1.7 RAG AI tutor chat
- **What:** Streaming AI tutor grounded in the content's embedded chunks (retrieval-augmented). Persists chat sessions and messages; supports tool calls (see §1.8).
- **Who:** INDIVIDUAL, TENANT_OWNER, TENANT_LEARNER.
- **API:** `services/rag.service.ts` (`chunkText`, `storeChunksWithEmbeddings`, `searchSimilarChunks`, `buildRagContext`), `services/embed.service.ts` (OpenAI `text-embedding-3-small`, 1536 dims, stored in pgvector), `services/ai.service.ts` (DeepSeek chat completions via OpenAI SDK + OpenAI for other steps), `controllers/chat.controller.ts` (`streamChat`, `getContentChat`, `getMessages`). Routes: `routes/chat.routes.ts` (`POST /chat/stream` behind `enforceQuota('TUTOR_MESSAGE')`, plus session/message GETs). Models `ChatSession`, `ChatMessage`, `Chunk`; usage feature `TUTOR_CHAT`.
- **Web:** `app/[locale]/content/[id]/chat/page.tsx`, `components/chat/*`, `hooks/useChat.ts`.

### 1.8 AI tutor visuals (Manim)
- **What:** The tutor can request a rendered math/visual animation via a `render_manim` tool call; the script is validated, queued, rendered, and served back to the chat as an authenticated asset.
- **Who:** all chat users (server-side capability of the tutor).
- **API:** `lib/tutor-tools.ts` (`getTutorTools`, `handleTutorToolCall`, `render_manim` case, `serializeBlockForMessage`), `lib/tutor-manim.ts` (`validateManimScript`, `buildPendingManimPayload`), render job `jobs/renderManim.job.ts`. Asset endpoint: `GET /chat/visual/manim/:jobId/asset` (`controllers/chat.controller.ts`).
- **Web:** rendered inline in `components/chat/*`.

### 1.9 Content viewing extras
- **What:** Raw file download/stream, OCR of a selected PDF region, transcript fetch, and learning history.
- **Who:** content viewers per role/assignment.
- **API:** `controllers/content.controller.ts` (`getContentFile`, `ocrPdfRegion`, `getContentTranscript`), `controllers/progress.controller.ts` (`getContentProgress`, `patchContentProgress`, `getLearningHistory`). Routes under `/content/:id/...` and `/tenant/content/:id/...`. Models `ContentProgress`, `LearningActivityDay`.

---

## 2. Accounts & Auth

### 2.1 Signup / login by email OR username
- **What:** Register and log in. Login accepts an **email or a student username** as the identifier. Individual self-registration and tenant registration are separate endpoints.
- **Who:** all roles (sign-up creates a learner; admins/tenant-owners are provisioned differently — see §2.5).
- **API:** `controllers/auth.controller.ts` (`register`, `registerTenant`, `login` — `identifier.includes('@')` chooses `email` vs `username` lookup, `me`, `updateMe`, `changePassword`). Routes: `routes/auth.routes.ts` (`POST /auth/register`, `POST /auth/register-tenant`, `POST /auth/login`, `GET/PATCH /auth/me`, `PATCH /auth/me/password`). Login is rate-limited (`loginRateLimit`); writes use `authWriteRateLimit`.
- **Web:** `app/[locale]/(auth)/login/page.tsx`, `app/[locale]/(auth)/register/page.tsx` (registration gates submit behind an interactive **terms-acceptance** checkbox), and the standalone **terms page** `app/[locale]/terms/page.tsx`.

### 2.2 JWT sessions
- **What:** Stateless JWT auth; protected routes pass through `authMiddleware`, role gates through `requireRole`.
- **Who:** all roles.
- **API:** `middleware/auth.middleware.ts` (`authMiddleware`, `requireRole`).
- **Web:** session wiring in `components/session-sync.tsx`, `components/auth-guard.tsx`, `components/role-guard.tsx`; admin equivalent `apps/admin/components/auth-guard.tsx`.

### 2.3 mustChangePassword & password reset
- **What:** Email-less student accounts (and admin/tutor-reset accounts) carry a `mustChangePassword` flag forcing a password change on first login. Tutors and admins can reset passwords.
- **Who:** TENANT_LEARNER (flagged), TENANT_OWNER & ADMIN (issue resets).
- **API:** `services/tenant/students.ts` (`mustChangePassword: !body.password`), tutor reset `controllers/tenant.controller.ts` (`resetStudentPassword`, `POST /tenant/students/:id/reset-password`), admin reset `controllers/admin/users.controller.ts` via `adminController.resetUserPassword` (`POST /admin/users/:id/reset-password`). `User.mustChangePassword` (Prisma).

### 2.4 Become-a-tutor request flow
- **What:** A signed-in learner requests an upgrade to tutor; this creates a `TutorRequest` (PENDING). An admin approves (creating the org + ACTIVE subscription and optional seat limit) or rejects. See §5.2.
- **Who:** INDIVIDUAL (requests), ADMIN (decides).
- **API:** `services/tutorRequest.service.ts` (`createTutorRequest`, `getMyLatestTutorRequest`, `approveTutorRequest`, `rejectTutorRequest`), `controllers/auth.controller.ts` (`upgradeToTenant`, `getTutorRequest`). Routes: `POST /auth/upgrade-to-tenant`, `GET /auth/tutor-request`. Model `TutorRequest` with `TutorRequestStatus`.
- **Web:** `hooks/useTutorRequest.ts`.

### 2.5 Role-based landing / redirects & provisioning
- **What:** After auth, users are routed by role (learner vs tenant vs B2C dashboard). Admins and tenant owners are **not self-registerable** — admins are created via the `create-admin` script; tenant owners via `create-tenant-owner` or admin approval of a tutor request.
- **Who:** all roles.
- **API:** scripts `apps/api/src/scripts/create-admin.ts`, `apps/api/src/scripts/create-tenant-owner.ts` (root: `pnpm create-admin`, `pnpm create-tenant-owner`). Admins can also be created from the panel via `POST /admin/users`.
- **Web:** route groups under `app/[locale]/`: `(auth)`, `(learner)/learner/*`, `(tenant)/tenant/*`, plus B2C `dashboard/*` and `content/*`; guards in `components/auth-guard.tsx`, `components/role-guard.tsx`.

---

## 3. Tenant (B2B Tutor) Experience

All endpoints below sit under `/tenant/*` and are gated by `authMiddleware, attachTenantId, requireTenantOwner` (`routes/tenant.routes.ts`).

### 3.1 Tenant dashboard & org settings
- **What:** View/update the organization, including its join code and seat limit.
- **Who:** TENANT_OWNER.
- **API:** `controllers/tenant.controller.ts` (`getTenant`, `patchTenant`, `regenerateJoinCode`), `services/tenant/organization.ts`. Routes: `GET/PATCH /tenant`, `POST /tenant/join-code/regenerate`. Models `Tenant` (`seatLimit`, join code), `TenantMembership`.
- **Web:** `app/[locale]/(tenant)/tenant/dashboard/page.tsx`, `app/[locale]/(tenant)/tenant/settings/page.tsx`, `hooks/useTenant.ts`.

### 3.2 Materials + assignment
- **What:** Upload/import materials (reuses the content pipeline) and assign them to specific learners, content, or sections.
- **Who:** TENANT_OWNER (assign); TENANT_LEARNER (consume assigned).
- **API:** `controllers/tenant-content.controller.ts` (content CRUD, `getContentFile`, `ocrPdfRegion`, transcript), assignment in `controllers/tenant.controller.ts` (`assignContent`, `unassignContent`, `listContentAssignments`) backed by `services/tenant/assignments.ts`. Routes: `POST/DELETE /tenant/assignments`, `GET /tenant/content/:contentId/assignments`, plus `/tenant/content/*`. Model `ContentAssignment`.
- **Web:** `app/[locale]/(tenant)/tenant/materials/page.tsx`, a dedicated material **detail page** `.../materials/[id]/page.tsx`, `.../materials/[id]/assign/page.tsx`, `hooks/useTenantContent.ts`.

### 3.3 Students management (email + email-less username students)
- **What:** Create student accounts with a name and **optional** email. Email-less students get a username + password and a synthesized internal email (`<username>@students.talim.local`) plus `mustChangePassword`. List, edit, delete, reset passwords, and view per-student progress.
- **Who:** TENANT_OWNER.
- **API:** `services/tenant/students.ts` (synthetic email, username uniqueness, `mustChangePassword`), `controllers/tenant.controller.ts` (`listStudents`, `createStudent`, `patchStudent`, `deleteStudent`, `resetStudentPassword`, `getStudentProgress`). Routes: `/tenant/students`, `/tenant/students/:id`, `/tenant/students/:id/reset-password`, `/tenant/students/:id/progress`.
- **Web:** `app/[locale]/(tenant)/tenant/students/page.tsx`, `.../students/[id]/page.tsx`.

### 3.4 Class JOIN CODE self-enroll
- **What:** Each org has a join code; a signed-in learner can self-enroll into the class with the code, becoming a `TENANT_LEARNER` of that org.
- **Who:** INDIVIDUAL → TENANT_LEARNER (join), TENANT_OWNER (manage/regenerate code).
- **API:** `controllers/auth.controller.ts` (`joinClass`, `POST /auth/join-class`), code regeneration `POST /tenant/join-code/regenerate`.
- **Web:** join flow surfaced at register/onboarding; org code shown in tenant dashboard/settings.

### 3.5 Custom seat limit
- **What:** Seat capacity scales with student count; set by the admin at approval time and editable per tenant.
- **Who:** ADMIN sets; TENANT_OWNER bounded by it.
- **API:** `services/tutorRequest.service.ts` (`seatLimit` schema + `tenant.update` on approve), enforced when creating students (`services/tenant/students.ts` / `middleware/quota.middleware.ts`). `Tenant.seatLimit` (Prisma). Admin edit via `PATCH /admin/tenants/:id`.

### 3.6 Progress (per-student + class)
- **What:** View an individual student's progress and aggregate class progress.
- **Who:** TENANT_OWNER.
- **API:** `services/tenant/progress.ts`, `controllers/tenant.controller.ts` (`getProgress`, `getStudentProgress`). Routes: `GET /tenant/progress`, `GET /tenant/students/:id/progress`. Backed by `services/learningProgress.service.ts` and progress models.
- **Web:** `app/[locale]/(tenant)/tenant/progress/page.tsx`.

---

## 4. Assessments & Game Quizzes

Tenant assessments are distinct from per-content auto-quizzes (§1.6). Owner-side routes live under `/tenant/*`; learner-side under `/learner/*`. Service split: `services/assessment/{banks,assessments,learner,results,shared}.ts` (barrel: `services/assessment.service.ts`); controller `controllers/assessment.controller.ts`.

### 4.1 Question banks (AI-generated + manual authoring, approve flow)
- **What:** Create question banks, AI-generate draft questions (10 generation styles), and approve/reject/edit them — or author questions by hand for **any** type. Drafts move `DRAFT → APPROVED/REJECTED`. The engine supports **11 question types** (see §4.7).
- **Who:** TENANT_OWNER.
- **API:** `services/assessment/banks.ts`, controller `listBanks`, `createBank`, `listQuestions`, `generateQuestions` (behind `enforceQuota('GENERATION')`), `patchQuestion`, and manual create `createBankQuestion`. Routes: `/tenant/question-banks`, `.../:bankId/questions` (GET list + **POST** manual create), `.../:bankId/generate`, `.../:bankId/questions/:questionId`. Models `QuestionBank`, `BankQuestion` (`BankQuestionStatus`); usage feature `QUESTION_DRAFT`.
- **Web:** the tutor builder is a **5-step wizard** — Bank → Generate → Review → Publish → Assign — at `app/[locale]/(tenant)/tenant/assessments/page.tsx`: all 10 AI generation styles, a Review step with filter chips + a multi-action bulk-select bar, and manual question authoring/editing for every type via `components/tenant/question-editor.tsx`. Hooks in `hooks/useAssessments.ts`.

### 4.2 Written assessments
- **What:** Compose an assessment from approved bank questions (`mode: WRITTEN`), with per-assessment `maxAttempts` and per-question points.
- **Who:** TENANT_OWNER (author); TENANT_LEARNER (take).
- **API:** `services/assessment/assessments.ts`, controller `createAssessment`, `listAssessments`. Models `TenantAssessment` (`status DRAFT/PUBLISHED`, `maxAttempts`), `AssessmentQuestion` (order, points).

### 4.3 GAME mode (per-question timer, speed points, streaks)
- **What:** Live game quiz: `mode: GAME` with `secondsPerQuestion` (default 20 on create, 30 fallback at play). Correct answers earn **speed-weighted, streak-multiplied** points; streaks reset on a wrong answer; attempt stores `pointsTotal` and `maxStreak`.
- **Who:** TENANT_OWNER (author); TENANT_LEARNER (play).
- **API:** scoring in `services/assessment/learner.ts` (`isGame`, `streak`/`maxStreak`, `computeGamePoints`) and `services/assessment/shared.ts` (`GAME_BASE_POINTS = 1000`, `computeGamePoints` with `speedFactor` 0.5–1.0, payload schema accepting per-question `timings`). Models `AssessmentAttempt` (`pointsTotal`, `maxStreak`, `durationMs`), `AttemptAnswer` (`responseMs`, `pointsAwarded`).
- **Web:** `components/learner/game-quiz-player.tsx` (per-question timer, points, best-streak summary, per-answer `+points` feedback). The player now **renders and correctly grades every structured type** — MULTIPLE_SELECT, FILL_BLANK, DROPDOWN_CLOZE, MATCHING, ORDERING, etc. (previously several of these fell through to a plain text box and scored ~0).

### 4.4 Assignment, attempts, max attempts & due dates
- **What:** Assign an assessment to learners / content / section, optionally with a **due date**; learners submit attempts bounded by `maxAttempts`. **Due dates are enforced** — late submissions are rejected.
- **Who:** TENANT_OWNER (assign); TENANT_LEARNER (attempt).
- **API:** owner `assignAssessment` (`POST /tenant/assessments/:assessmentId/assign`); learner `listLearnerAssessments`, `submitLearnerAssessment` (`POST /learner/assessments/:assessmentId/attempts`). `submitLearnerAssessment` (`services/assessment/learner.ts`) resolves the **earliest applicable `dueAt`** across a learner's assignments and **rejects late submissions with 403** (both WRITTEN and GAME; a null `dueAt` never blocks). Learner routes gated by `requireTenantMember, requireActiveLearner` (`routes/learner.routes.ts`). Model `AssessmentAssignment` (learner/content/section targets, `dueAt`).
- **Web:** `app/[locale]/(learner)/learner/assessments/page.tsx` shows a **"submissions closed" locked state** past the deadline; `app/[locale]/(tenant)/tenant/assessments/page.tsx`, `hooks/useAssessments.ts`.

### 4.5 Per-question results & feedback
- **What:** Owner sees per-assessment results; learners see per-question correctness and awarded points.
- **Who:** TENANT_OWNER (aggregate results); TENANT_LEARNER (own feedback).
- **API:** `services/assessment/results.ts`, controller `assessmentResults` (`GET /tenant/assessments/:assessmentId/results`). `AttemptAnswer` carries `correct` + `pointsAwarded`.

### 4.6 Class leaderboard (real-time)
- **What:** Ranked leaderboard for an assessment (by total points), visible to owner and to participating learners, and **updated live** as classmates submit.
- **Who:** TENANT_OWNER, TENANT_LEARNER.
- **API:** `assessmentLeaderboard` (`GET /tenant/assessments/:assessmentId/leaderboard`) and `learnerAssessmentLeaderboard` (`GET /learner/assessments/:assessmentId/leaderboard`). Indexed by `@@index([assessmentId, pointsTotal])` on `AssessmentAttempt`. On submit the API publishes a `leaderboard.update` job event (`packages/types/jobEvents.ts`, payload `{assessmentId, tenantId}`).
- **Web:** `components/learner/leaderboard-table.tsx`; the `leaderboard.update` event arrives over **SSE** via `hooks/useJobEvents.ts`, which invalidates the tenant/learner leaderboard queries so the table refreshes live. The current learner's own row is highlighted.

### 4.7 Question types & grading engine (11 types)
- **What:** The assessment engine supports **11 question types**: `SHORT_ANSWER`, `NUMERIC`, `MULTIPLE_CHOICE`, `TRUE_FALSE`, `MULTIPLE_SELECT`, `FILL_BLANK`, `DROPDOWN_CLOZE`, `MATCHING`, `ORDERING`, `HOTSPOT`, and `DRAG_DROP`. **HOTSPOT** = click a spot on an image (config `{imageUrl, regions:[{x,y,w,h}]}` normalized 0..1; point-in-region binary grading). **DRAG_DROP** = drag items into target buckets (config `{items, targets}`; `acceptableAnswers` = correct target per item; index-wise categorization grading). `HOTSPOT` and `DRAG_DROP` are **manual-authoring only** (not AI-generated); the other 9 can be AI-generated or hand-authored.
- **Who:** TENANT_OWNER (author); TENANT_LEARNER (answer).
- **API:** grading for every type lives in **`packages/types/grading.ts`** (`gradeQuestion` — shared verbatim by the API and the web instant feedback; re-exported through `services/assessment/shared.ts` for the old import surface). Normalization folds Uzbek apostrophe variants (ʻ ʼ ' ' `) + NFKC; NUMERIC tolerance is `max(0.001, 1%·|answer|)`; ORDERING partial credit is pairwise (Kendall-tau). HOTSPOT's answer is the spatial `config.regions` geometry, so it stores an empty `acceptableAnswers`. Enum `QuestionType` in `apps/api/src/prisma/schema.prisma` + `packages/types/index.ts`. Migrations `20260702000000_hotspot_dragdrop_question_types`, `20260711000000_question_engine` (adds `difficulty`/`bloom`/`sourceQuote`/`optionRationales` to bank questions; bank generation accepts `count`/`types`/`depth`).
- **Web:** per-type authoring/editing in `components/tenant/question-editor.tsx` (§4.1); the GAME player renders all structured types (§4.3).

---

## 5. Admin Panel (`apps/admin`, port 3001)

No i18n. Login at `/login`; everything else under `app/(admin)/*`. Backend gated by `authMiddleware, requireRole('ADMIN'), adminRateLimit` (`routes/admin.routes.ts`). Nav defined in `apps/admin/components/admin-sidebar.tsx`; data via `apps/admin/hooks/useAdmin.ts`.

### 5.1 Platform stats
- **What:** Platform-wide statistics dashboard.
- **API:** `controllers/admin/analytics.controller.ts` → `platformStats` (`GET /admin/stats/platform`).
- **Admin:** `app/(admin)/dashboard/page.tsx` (sidebar label "Statistics").

### 5.2 Tutor-request approvals (org + subscription + seat limit)
- **What:** Review pending tutor requests; approving creates the org + an ACTIVE subscription and sets an optional seat limit; or reject with a note.
- **API:** `controllers/admin-tutor-request.controller.ts` (`listTutorRequests`, `approveTutorRequest`, `rejectTutorRequest`) → `services/tutorRequest.service.ts`. Routes: `GET /admin/tutor-requests`, `POST /admin/tutor-requests/:id/approve`, `.../reject`.
- **Admin:** `app/(admin)/tutor-requests/`.

### 5.3 User management (role, reset/show password, delete)
- **What:** List/create/view/edit/delete users; reset passwords; adjust a user's subscription.
- **API:** `controllers/admin/users.controller.ts` (via `admin.controller.ts` barrel): `listUsers`, `createUser`, `getUser`, `patchUser`, `deleteUser`, `resetUserPassword`, `patchUserSubscription`. Routes: `/admin/users`, `/admin/users/:id`, `.../reset-password`, `.../subscription`. (Password display for support lookups is backed by `User.adminPasswordNote` — see recent commits.)
- **Admin:** `app/(admin)/users/page.tsx`, `app/(admin)/users/[id]/page.tsx`.

### 5.4 Tenant management + subscriptions
- **What:** List/view/edit tenants (including seat limit) and view subscriptions.
- **API:** `controllers/admin/tenants.controller.ts`: `listTenants`, `getTenant`, `patchTenant`; subscriptions via `listSubscriptions` (`services/subscription/admin.ts`). Routes: `/admin/tenants`, `/admin/tenants/:id`, `GET /admin/subscriptions`.
- **Admin:** `app/(admin)/tenants/page.tsx`, `app/(admin)/tenants/[id]/page.tsx`, `app/(admin)/subscriptions/`.

### 5.5 Content & generated media
- **What:** Browse all content, delete content, retry stuck ingestion jobs; browse and delete generated media.
- **API:** `controllers/admin/content.controller.ts`: `listContents`, `deleteContent`, `retryContentJob`, `listGenerated`, `deleteGenerated`. Routes: `/admin/contents`, `/admin/contents/:id`, `.../retry-job`, `/admin/generated`, `/admin/generated/:id`. Model `GeneratedMediaStatus` (Prisma).
- **Admin:** `app/(admin)/content/`, `app/(admin)/generated/`.

### 5.6 Usage & cost metering
- **What:** Aggregated usage and cost summary across the platform.
- **API:** `controllers/admin/analytics.controller.ts` → `usageSummary` (`GET /admin/usage/summary`), backed by `services/usage.service.ts` + `ApiUsageEvent`.
- **Admin:** `app/(admin)/usage/` (sidebar "Usage & costs").

### 5.7 Audit log
- **What:** Immutable record of admin actions.
- **API:** `controllers/admin-audit.controller.ts` (`listAuditLogs`, `GET /admin/audit-logs`) → `services/admin/audit.service.ts`. Model `AdminAuditLog`.
- **Admin:** `app/(admin)/audit/`.

### 5.8 User impersonation (one-click)
- **What:** An admin mints a short-lived (30 min) impersonation token for a target user and opens a real learner/tenant session as them from one button. Admins cannot impersonate themselves or another admin.
- **Who:** ADMIN (mint); the token then authenticates as the target user in `apps/web`.
- **API:** `controllers/admin/users.controller.ts` (`impersonateUser`, `POST /admin/users/:id/impersonate`) → `lib/impersonation.ts` (`signImpersonationToken`); the JWT carries `imp:true` + `impersonatorId` and nothing is persisted.
- **Admin:** `app/(admin)/users/[id]/page.tsx` (Impersonate → "Open impersonated session" button), hook `useImpersonateUser` in `hooks/useAdmin.ts`.
- **Web:** the accept route `app/[locale]/impersonate/page.tsx` consumes the `token` query param once, stores it, and confirms via `GET /auth/me`.

---

## 6. Platform / Infrastructure Features

### 6.1 Internationalization (uz / en / ru)
- **What:** The learner/B2C/tenant web app is fully localized via next-intl with a `[locale]` route segment. Locales: **uz, en, ru**. The admin app has no i18n.
- **API:** locale-aware AI output (e.g. `buildRagContext(..., locale)` in `services/rag.service.ts`).
- **Web:** message catalogs `apps/web/messages/{uz,en,ru}.json`; `components/language-switcher.tsx`, `components/locale-sync.tsx`; all pages live under `app/[locale]/`.

### 6.2 Subscriptions / plans (manual activation)
- **What:** Plans and subscriptions with **no payment integration** — an admin activates. `PlanKind {INDIVIDUAL, TENANT}`, `SubscriptionStatus {ACTIVE, PAST_DUE, CANCELED, TRIALING}`, `SubscriptionSource {ADMIN, PAYMENT_PROVIDER}` (today: ADMIN). Approving a tutor request mints an ACTIVE subscription.
- **Who:** ADMIN (manage); TENANT_OWNER / INDIVIDUAL (subject to).
- **API:** `services/subscription/{admin,tenant,user,shared}.ts` (barrel `services/subscription.service.ts`), `controllers/billing.controller.ts` (`getBillingMe`, `GET /billing/me`). Models `Plan`, `Subscription`.
- **Web:** `app/[locale]/(tenant)/tenant/billing/page.tsx`, `hooks/useBilling.ts`, the public pricing page `app/[locale]/pricing/page.tsx` (+ `components/marketing/pricing.tsx`, config `lib/pricing.ts`), and the promotion modal flow in §6.8.

### 6.3 Usage metering
- **What:** Every metered AI action records an `ApiUsageEvent`; quotas are enforced before expensive operations.
- **API:** `services/usage.service.ts`, `middleware/quota.middleware.ts` (`enforceQuota('UPLOAD' | 'GENERATION' | 'TUTOR_MESSAGE' | ...)`), `controllers/usage.controller.ts` (`getMyUsage`, `GET /usage/me`). Enum `UsageFeature` (EMBED, TUTOR_CHAT, QUIZ_GEN, QUESTION_DRAFT, PODCAST_GEN, SECTION_GEN, SUMMARY_GEN, SLIDESHOW_GEN, TRANSCRIBE, PDF_PARSE, TENANT_ASSISTANT).

### 6.4 Rate limiting
- **What:** Login and auth-write rate limits (15-minute windows) plus a dedicated admin rate limit.
- **API:** `middleware/rate-limit.middleware.ts` (`loginRateLimit`, `authWriteRateLimit`), `middleware/admin-rate-limit.middleware.ts` (`adminRateLimit`). Applied in `auth.routes.ts` and `admin.routes.ts`.

### 6.5 Security headers & CORS
- **What:** Helmet security headers and a CORS allow-list (localhost:3000 / 3001 added in dev).
- **API:** `apps/api/src/index.ts` (`helmet(...)`, `cors({...})` over an `allowedOrigins` set).

### 6.6 Multi-tenant isolation
- **What:** The core isolation guard. Every content/assessment query is scoped by role + ACTIVE membership; a deactivated learner loses content access immediately.
- **API:** `services/contentAccess.service.ts` (`resolveTenantIdForUser`, `getAssignedContentIds`, `buildContentListWhere`, `assertCanAccessContent`, `assertCanMutateContent`, `assertCanGenerate`, `assertIndividualContentRoute`, `assertTenantOwnsContent`), plus `middleware/tenant.middleware.ts` (`attachTenantId`, `requireTenantOwner`, `requireTenantMember`, `requireActiveLearner`, `blockLearnerMutations`, `blockIndividualContentForOwner`).

### 6.7 Background jobs (Bull / Redis)
- **What:** Heavy work runs off-request on Redis-backed Bull queues, registered at boot.
- **API:** `services/queue.service.ts`; jobs `jobs/processContent.job.ts` (ingest/section/chunk/embed), `jobs/generateQuiz.job.ts`, `jobs/generatePodcast.job.ts`, `jobs/renderManim.job.ts`. Infra in `docker-compose.yml` (PostgreSQL 16 + pgvector, Redis).

### 6.8 Usage-limit UX & subscription promotion (web)
- **What:** A single, app-wide **promotion modal** surfaces consistently whenever a self-serve usage limit is hit, instead of each call site failing silently or with ad-hoc text. Backed by the manual-activation flow (`POST /billing/request-upgrade`).
- **Error contract (API):** quota-gated actions return **402 `QUOTA_EXCEEDED`** `{feature, used, limit, upgradePlanCode}` (features `UPLOAD/GENERATION/TUTOR_MESSAGE/VIDEO/PODCAST/STUDENT`); per-file plan caps return **413 `PLAN_FILE_LIMIT`** `{maxPages, maxFileSizeMb, pages, fileSizeMb, upgradePlanCode}`; the hard upload cap returns **413 `FILE_TOO_LARGE`** `{maxFileSizeMb}` (no upgrade lifts it). `upgradePlanCode` is role-aware: FREE individual → `INDIVIDUAL_PRO`, STARTER tenant → `TENANT_GROWTH`, top plan → `null` (`services/subscription/{user,tenant}.ts`).
- **Web decision logic:** `lib/limit-error.ts` (`classifyLimitError`) → `hooks/useLimitErrorHandler.ts` chooses **modal vs inline message** by role + `upgradePlanCode`: a self-serve INDIVIDUAL quota/plan-file limit opens the global modal with a feature-specific headline; tenant-owner limits, already-top-plan limits, the hard 120 MB cap, inactive subs, and learner blocks return a localized inline message (no modal).
- **One global modal:** `store/useUpgradeModal.ts` + `components/account/global-upgrade-modal.tsx`, mounted once in `components/providers.tsx`; openable anywhere via `useUpgradeModal().openUpgrade()`. `billing-summary-card.tsx` and the upload card now open this shared instance.
- **Wired call sites:** file upload (`hooks/useFileUpload.tsx`), YouTube ingest + quiz/summary (`components/content/UploadCard.tsx`, `hooks/useContentActions.ts`), AI video (`content/[id]/video/page.tsx`), podcast generate + per-episode regenerate (`content/[id]/podcast/page.tsx`), AI tutor stream (`store/useChatStore.ts` → `components/chat/ChatWindow.tsx`).
- **Upgrade modal + pricing:** `components/account/upgrade-dialog.tsx` (so'm price, monthly/annual toggle, "Request upgrade", "see team plans" link) and the public **pricing page** `app/[locale]/pricing/page.tsx` + `components/marketing/pricing.tsx` are both driven by `lib/pricing.ts` (Free/Pro for individuals, Team/School for tutors & schools; prices in so'm; monthly + annual ~20% off). Hard upload cap `UPLOAD_MAX_MB = 120` (`middleware/upload.middleware.ts`) is kept in sync with nginx `client_max_body_size 120m`.

---

## Appendix — Build & run gotchas

- **Build shared types first:** `pnpm --filter @talim/types build` (the root `dev` script does this automatically).
- **Always `prisma generate` before typecheck/build:** wired into `predev`/`prebuild`/`pretypecheck` in `apps/api/package.json`; a stale client produces hundreds of phantom TS errors.
- **Local migrations:** use `pnpm db:migrate:deploy` (migrate deploy), **not** `migrate dev` — the dev DB has migration-checksum drift that `migrate dev` would try to reset.
- **Secrets:** managed by Doppler (config `dev` locally); most root scripts wrap commands in `doppler run --`.
- **Provisioning accounts:** `pnpm create-admin`, `pnpm create-tenant-owner`.
- **Health check:** `GET /health` (not `/api/health`).
