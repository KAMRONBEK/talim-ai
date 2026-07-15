# apps/api — Express + Prisma backend

The Talim AI backend: an Express 4 + Prisma 6 + Bull (Redis) JSON API that serves all three
frontends (`apps/web` B2C/B2B learner+tutor app, `apps/admin` platform panel). It owns auth,
multi-tenant content, the AI tutor / RAG, assessments, subscriptions, and all background media
generation.

This file is API-specific guidance. For the monorepo big picture (Doppler, Turborepo, the three
apps, product/role model) see the root `CLAUDE.md`.

---

## 1. Stack & entry point

- **Runtime:** Node >= 20, ESM (`.js` import specifiers in source — Prisma client imported as
  `@prisma/client`). Dev runs with `tsx watch src/index.ts`; prod runs `node dist/index.js`
  after `tsc`.
- **Key deps** (`apps/api/package.json`): `express`, `@prisma/client` / `prisma` 6, `bull` (Redis
  queues), `jsonwebtoken`, `bcrypt`, `helmet`, `cors`, `express-rate-limit`, `multer`, `openai`,
  `zod`, `pdf-parse`, `@distube/ytdl-core` + `youtube-transcript`,
  and the shared `@talim/types` workspace package. (Text chunking is a custom
  `chunkText` in `services/rag.service.ts` — no langchain.)
- **Entry point:** `src/index.ts` → `bootstrap()`:
  1. Ensures the local upload dir exists when `storageService` is the `LocalStorageService`.
  2. **Registers all ten Bull job processors** before the server listens (so this single
     process is both the API and the worker): `processContent`, `reparseContent`,
     `generateQuiz`, `generatePodcast`, `generateVideo`, `generateFlashcards`,
     `generateSlides`, `renderManim`, `generateBankQuestions`, `backfillTranscript`.
  3. `app.set('trust proxy', 1)` — runs behind nginx in prod; needed so `req.ip` and the rate
     limiter see the real client IP from `X-Forwarded-For`.
  4. **helmet** with `contentSecurityPolicy`, `crossOriginResourcePolicy`, and
     `crossOriginEmbedderPolicy` all disabled — it streams cross-origin assets (audio, pdf,
     tutor visuals) to the web app on another origin.
  5. **CORS allow-list** built from `env.CORS_ORIGIN` (comma-separated); in non-production it
     also adds `http://localhost:3000` and `http://localhost:3001`. `credentials: true`.
     Unknown origins are rejected with an error.
  6. `express.json({ limit: '10mb' })`, then `app.use(routes)`, then the error middleware.
  7. `app.listen(env.PORT)` (default **4000**).
- **Config:** `src/config/env.ts` validates `process.env` with a zod schema and `process.exit(1)`
  on failure. Notable vars: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET` (min 32 chars),
  `OPENAI_API_KEY`, `DEEPSEEK_API_KEY` / `DEEPSEEK_MODEL`, `TUTOR_MODEL` (default `gpt-4o`),
  `TTS_MODEL` / `TTS_PROVIDER` (`openai` | `elevenlabs` | `azure` — prod uses `azure`,
  Microsoft native uz/ru neural voices), `TRANSCRIPTION_MODEL`, `MANIM_BIN`,
  `UPLOAD_DIR` (default `/uploads`), `DEFAULT_CONTENT_LOCALE` (`uz`|`en`|`ru`), `CORS_ORIGIN`.
  Secrets come from **Doppler** (root scripts wrap commands in `doppler run --`); never hardcode.
- Pricing constants live in `src/config/usage-pricing.ts`.

---

## 2. Layout

```
src/
  index.ts            bootstrap (helmet/CORS/jobs/listen)
  config/             env.ts (zod-validated), usage-pricing.ts
  routes/             Express routers (HTTP surface) — index.ts is the barrel
  controllers/        request/response handlers (parse input, call services)
  services/           business logic + Prisma access (the brains)
  middleware/         auth, tenant, quota, rate-limit, upload, error
  jobs/               Bull processors registered at boot
  lib/                prisma client, asyncHandler, prompt builders, tutor tools/helpers
  prisma/             schema.prisma, migrations/, seed.ts
  scripts/            operational CLIs (create-admin, etc.)
```

Flow: **routes → controllers → services**. Controllers stay thin; isolation/quota/business rules
live in services and middleware.

**Barrel-split modules** — several big modules were broken into a folder and re-exported through a
barrel at the *original* path, so importers don't change:
- `controllers/admin.controller.ts` → re-exports `controllers/admin/{users,tenants,content,analytics}.controller.ts` (`shared.ts` is internal).
- `services/assessment.service.ts` → re-exports `services/assessment/{banks,assessments,learner,results}.ts` (`shared.ts` internal).
- `services/subscription.service.ts` → re-exports `services/subscription/{user,tenant,admin}.ts` + types/`QuotaExceededError` from `shared.ts`.
- `services/tenant.service.ts` → re-exports `services/tenant/{organization,students,assignments,progress}.ts` + `formatTenant` from `shared.ts`.
- `services/admin/audit.service.ts` exists as a folder for the audit log helper.

When editing one of these, change the file in the subfolder, not the barrel.

---

## 3. Route map

Routers are assembled in `src/routes/index.ts` and **mounted at the root — there is NO `/api`
prefix**. (Some legacy error messages mention `/api/...` paths; the actual mount points are below.)

- `GET /health` → `{ status: 'ok' }`. Health is at **`/health`, not `/api/health`**.
- `/auth` (`auth.routes.ts`) — register, login, `me`, password change, and the B2B onboarding
  flow: `POST /upgrade-to-tenant` (creates a TutorRequest), `GET /tutor-request`,
  `POST /join-class` (student self-enroll by class join code), plus `POST /register-tenant`.
  Public routes use rate limiters (see §4).
- `/content` (`content.routes.ts`) — the **INDIVIDUAL (B2C) + read surface**. List/get content,
  upload (PDF/slide via multer + `enforceQuota`), YouTube ingest, retry, delete, transcript,
  file streaming, OCR region, sections, summary→podcast/video, and progress endpoints. Guarded by
  `blockIndividualContentForOwner` (owners must use `/tenant/content`) and `blockLearnerMutations`.
- `/chat` (`chat.routes.ts`) — AI tutor. `POST /stream` (SSE, quota `TUTOR_MESSAGE`), session/
  content message history, and `GET /visual/manim/:jobId/asset` for rendered tutor visuals.
- `/quiz` (`quiz.routes.ts`) — per-content quiz list/create/get, attempts, submit. Learner
  mutations blocked except submit/progress semantics.
- `/summary` (`summary.routes.ts`) — get/generate a content summary.
- `/usage` (`usage.routes.ts`) — `GET /me` current usage for the authed user.
- `/billing` (`billing.routes.ts`) — `GET /me` subscription/plan view.
- `/tenant` (`tenant.routes.ts`) — the **TENANT_OWNER (tutor) surface**. Org settings, join-code
  regenerate, students CRUD + reset-password + per-student progress, content assignments,
  tenant-scoped content (`/tenant/content/...` sub-router), question banks + AI question
  generation, assessments (create/assign/results/leaderboard incl. GAME mode). Entire router is
  gated by `authMiddleware, attachTenantId, requireTenantOwner`.
- `/learner` (`learner.routes.ts`) — the **TENANT_LEARNER (student) surface**: summary, assigned
  assessments, leaderboard, submit attempt. Gated by
  `authMiddleware, attachTenantId, requireTenantMember, requireActiveLearner`.
- `/admin` (`admin.routes.ts`) — platform-admin (apps/admin). Entire router gated by
  `authMiddleware, requireRole('ADMIN'), adminRateLimit`. Tutor-request approve/reject, users
  CRUD + reset-password + subscription patch, tenants, contents (delete/retry-job), generated
  media, subscriptions, usage summary, platform stats, audit logs.

---

## 4. Auth & middleware

`src/middleware/`:

- **`auth.middleware.ts`**
  - `authMiddleware`: requires `Authorization: Bearer <jwt>`, verifies with `env.JWT_SECRET`.
    The payload is `{ userId, email, role, tenantId? }`. **Legacy-token handling:** if a token
    predates the embedded `role`, it loads the user and backfills `role` (sets
    `req.legacyToken`). For `TENANT_OWNER`/`TENANT_LEARNER` without a `tenantId` it resolves one
    via `resolveTenantIdForUser` (from `contentAccess.service`). Result is attached as `req.user`
    (`AuthenticatedRequest`).
  - `requireRole(...roles)`: 401 if unauthenticated, 403 if role not allowed. Used by `/admin`.
- **`tenant.middleware.ts`** — the tenant/role gates used across `/content`, `/tenant`, `/learner`,
  `/quiz`, `/summary`, `/chat`:
  - `attachTenantId` — lazily resolves+attaches `tenantId` for tenant users.
  - `requireTenantOwner` — 403 unless `role === TENANT_OWNER` **and** a `tenantId` is present.
  - `requireTenantMember` — owner or learner with a tenant.
  - `requireActiveLearner` — for `TENANT_LEARNER`, verifies an **active** `TenantMembership`
    (role `LEARNER`, `active: true`); a deactivated student is rejected with
    "Student account is deactivated". Non-learners pass through.
  - `blockIndividualContentForOwner` / `blockLearnerMutations` — keep owners off the B2C
    `/content` write path and prevent learners from uploading/generating (learners may GET and
    PATCH only `/progress`).
  - `requireTenantId` — throws `AppError(403)` when no org context (used inside `/tenant/content`).
- **`quota.middleware.ts`** — `enforceQuota(...features: QuotaFeature[])` calls
  `assertQuota(userId, feature, { role, tenantId })` from `subscription.service.ts` before the
  handler. Applied to uploads, YouTube ingest, generation, podcast/video, AI question generation,
  and tutor `POST /chat/stream`.
- **Rate limiting** — two mechanisms:
  - `rate-limit.middleware.ts` (`express-rate-limit`): `loginRateLimit` (15 min window, 30,
    `skipSuccessfulRequests` so only failed logins count — a whole NAT'd classroom can still log
    in) and `authWriteRateLimit` (15 min / 40) on register / password-change / tutor-request /
    join-class.
  - `admin-rate-limit.middleware.ts`: a small in-memory per-user bucket (120 req / 60s) applied to
    the whole `/admin` router. **In-memory ⇒ per-process; not shared across instances.**
- **`upload.middleware.ts`** — multer **memory** storage, 50 MB limit, file filter allows PDF and
  PowerPoint/`.pptx` mimetypes (and any `.pdf` name).
- **`error.middleware.ts`** — central error handler; throw `AppError(status, message)` from
  anywhere. `lib/asyncHandler.ts` wraps async handlers so rejections reach it.

---

## 5. Data layer (Prisma)

- **Schema:** `src/prisma/schema.prisma`. Postgres datasource with the **`vector` (pgvector)**
  extension enabled (`extensions = [vector]`, `previewFeatures = ["postgresqlExtensions"]`).
  Migrations in `src/prisma/migrations/` (latest:
  `20260623000000_tutor_requests_join_code_seat_limit`, `20260623010000_game_quizzes`).
  Prisma client is created once in `src/lib/prisma.ts` — import `prisma` from there, never
  `new PrismaClient()`.
- **Most important models:**
  - `User` — `role: UserRole` (`INDIVIDUAL | TENANT_OWNER | TENANT_LEARNER | ADMIN`), optional
    `username` (email-less students), `mustChangePassword`, `adminPasswordNote` (plaintext note
    set by admin tooling for support lookups), `preferredLocale`.
  - `Tenant` — an org owned by a `TENANT_OWNER`; `slug` (unique), `joinCode` (unique, class
    self-enroll), `seatLimit`.
  - `TenantMembership` — `(tenantId, userId)` unique; `role: TenantMemberRole`, `active` flag.
    **The `active` flag is the live access switch for students.**
  - `ContentAssignment` — `(contentId, learnerId)` unique; the join that decides what a student
    can read.
  - `Content` + `Chunk` — `Content.tenantId` is null for INDIVIDUAL, set for tenant materials.
    `Chunk.embedding` is `Unsupported("vector(1536)")?` (pgvector). Because Prisma can't type
    vectors, embeddings are written/queried with `$executeRaw`/`$queryRaw` in
    `services/rag.service.ts` (`INSERT ... $4::vector`, similarity via `embedding <=> $2::vector`).
  - Assessments: `QuestionBank` → `BankQuestion` (AI-draftable bank) → `TenantAssessment`
    (`mode: WRITTEN | GAME`, `secondsPerQuestion`, `maxAttempts`) → `AssessmentQuestion`
    (bank→assessment link with `points`) → `AssessmentAssignment` (to learner/content/section) →
    `AssessmentAttempt` (`pointsTotal`, `maxStreak`, `durationMs`, `score`) → `AttemptAnswer`
    (`correct`, `responseMs`, `pointsAwarded`). The `pointsTotal`/`maxStreak`/leaderboard fields
    back the GAME-quiz speed-points/streak/leaderboard feature.
  - `Plan` (`code` unique, JSON `limits`, `kind: PlanKind`) + `Subscription` (one per user **or**
    one per tenant — both `userId` and `tenantId` are unique; `status`, `source` default `ADMIN`).
  - `TutorRequest` — a learner's "become a tutor" request (`status: TutorRequestStatus`,
    `orgName`, decided-by audit fields).
  - `AdminAuditLog` — `adminUserId`, `action`, `targetType`, `targetId`, JSON `metadata`.
  - Plus: `ChatSession`/`ChatMessage`, `Quiz`/`QuizQuestion`/`QuizAttempt`, `Podcast`/
    `PodcastEpisode`/`PodcastEpisodeProgress`, `ContentSection`(+`ContentSectionTitle`),
    `ContentTranscriptSegment`, `ContentSummary`, `ContentVideo`, `ContentProgress`/
    `SectionProgress`/`LearningActivityDay`, `ApiUsageEvent` (usage metering, `UsageFeature`).
- **Migration rule:** locally run **`pnpm db:migrate:deploy`** (`prisma migrate deploy`), **NOT**
  `migrate dev` — the dev DB has migration-checksum drift that `migrate dev` would try to reset.
  (`pnpm db:migrate` in this package maps to `prisma migrate dev`; avoid it locally.)

---

## 6. Multi-tenant isolation contract

`src/services/contentAccess.service.ts` is the **single source of truth** for "can this user touch
this content" and must be used for every content/assessment access path:

- `resolveTenantIdForUser(userId, role)` — owner → their tenant; learner → their active
  membership's tenant.
- `buildContentListWhere(user)` — the `Prisma.ContentWhereInput` for list views: INDIVIDUAL sees
  `{ userId, tenantId: null }`; a `TENANT_LEARNER` sees only **assigned** content **and only while
  their membership is active** (no active membership ⇒ empty result); owners are told to use the
  tenant route.
- `assertCanAccessContent(user, contentId, { requireReady? })` — the per-record guard. INDIVIDUAL:
  own untenanted content. TENANT_OWNER: any content in their tenant. TENANT_LEARNER: only assigned
  content **and only with an active membership** — a deactivated/removed student loses access
  immediately, not just when the JWT expires. Throws `AppError(404)` if not visible.
- `assertCanMutateContent` / `assertCanGenerate` / `assertIndividualContentRoute` /
  `assertTenantOwnsContent` enforce the write/generate boundaries.

**Rule:** do not hand-roll `prisma.content.findFirst` scoping in new controllers — go through these
helpers (and the tenant middleware) so isolation stays centralized and consistent.

---

## 7. Background jobs & queues (Bull / Redis)

Queues are defined in `src/services/queue.service.ts` (`new Bull(name, env.REDIS_URL)`) and the
processors live in `src/jobs/`, registered at boot in `index.ts`:

- **`process-content`** (`processContent.job.ts`) — main ingest pipeline: marks content
  `PROCESSING`, extracts text (PDF via `pdf.service`, YouTube transcript via `youtube.service`
  storing `ContentTranscriptSegment`s), `chunkText` → `storeChunksWithEmbeddings` (pgvector),
  generates sections, sets `READY`/`FAILED`. Charges a `GENERATION` quota when large enough.
- **`reparse-content`** (`reparseContent.job.ts`) — re-runs extraction/sectioning for existing content.
- **`generate-quiz`** (`generateQuiz.job.ts`) — async quiz generation for a content/section.
- **`generate-podcast`** (`generatePodcast.job.ts`) — TTS podcast episode rendering (per-section parts).
- **`generate-video`** (`generateVideo.job.ts`) — AI video parts from section slide decks.
- **`generate-flashcards`** (`generateFlashcards.job.ts`) — flashcard deck generation.
- **`generate-slides`** (`generateSlides.job.ts`) — per-section slide deck generation.
- **`render-manim`** (`renderManim.job.ts`) — runs the Manim binary (`env.MANIM_BIN`) to render
  tutor visuals, stores the asset, and patches the `manim` visual block (ready/failed) back into
  the chat message (`@talim/types` `ManimPayload`/`VisualBlock`).
- **`generate-bank-questions`** (`generateBankQuestions.job.ts`) — AI question-bank drafts for tenants.
- **`backfill-transcript`** (`backfillTranscript.job.ts`) — backfills transcript segments for older content.

`cancelContentJobs(contentId)` removes pending/active content-scoped jobs across the content/quiz/
podcast queues (used when content is deleted). Redis must be running (`docker-compose.yml`).

---

## 8. Scripts

Run via the package scripts (and wrap in `doppler run --` so `DATABASE_URL` etc. are present):

- `pnpm create-admin --email <e> --password <p> [--name <n>]` (`scripts/create-admin.ts`) — creates
  or promotes an ADMIN, bcrypt-hashes the password (min 8 chars), stores it in `adminPasswordNote`,
  and attaches a FREE plan if one exists. **Admins are not self-registerable.**
- `pnpm create-tenant-owner` (`scripts/create-tenant-owner.ts`) — provisions a tutor org + owner
  (the manual alternative to approving a TutorRequest).
- `pnpm inspect-chunks` (`scripts/inspect-chunks.ts`) — debug a content's chunks/embeddings.
- `scripts/smoke-quota.ts`, `scripts/tutor-graph-smoke.ts`, `scripts/tutor-scope-smoke.ts` — smoke
  checks for quota and the tutor graph/scope helpers (run with `tsx`).
- DB helpers: `pnpm db:generate`, `pnpm db:push`, `pnpm db:seed`, `pnpm db:studio` (note
  `pnpm db:migrate` = `migrate dev`; prefer the root `pnpm db:migrate:deploy` locally — see §9).

---

## 9. Local gotchas

- **Always `prisma generate` before typecheck/build/run.** It's wired into `predev`, `prebuild`,
  and `pretypecheck` in this package; a stale client produces hundreds of phantom TS errors. If you
  see them, run `pnpm --filter @talim/api db:generate`.
- **Build `@talim/types` first** (`pnpm --filter @talim/types build`) — the API imports shared
  types from it.
- **Use `migrate deploy`, not `migrate dev`, locally** (root `pnpm db:migrate:deploy`) — the dev DB
  has migration-checksum drift `migrate dev` would try to reset (§5).
- Postgres **must have pgvector** and Redis must be up (both in `docker-compose.yml`) or ingest and
  the tutor RAG path will fail.
- The single API process is **also the Bull worker** — if you change a job processor, restart the
  server for it to take effect.
