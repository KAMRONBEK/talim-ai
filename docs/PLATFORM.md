# Talim AI — Platform Guide

> The canonical "what is Talim AI and how does it work" document for engineers, new teammates, and stakeholders.

---

## 1. Overview

**Talim AI** is an AI-powered learning platform that turns raw study material (PDFs, YouTube videos, slides) into an interactive learning experience: AI-generated summaries, podcasts, quizzes, visual explainers, and a Retrieval-Augmented-Generation (RAG) AI tutor that answers questions grounded in the learner's own content.

It serves **two audiences from one codebase**:

- **B2C — Individual learners.** A solo learner uploads their own content and gets summaries, podcasts, quizzes, and an AI tutor on top of it.
- **B2B — Tutors & schools.** A tutor (or school org) manages a roster of students, uploads and *assigns* materials, builds AI question banks, creates assessments (including gamified quizzes with a class leaderboard), and tracks per-student and class-wide progress.

**Value proposition:** instead of passively reading material, learners interact with it — they get it explained, quizzed, narrated, and visualized by AI; tutors get a turnkey way to distribute material and measure understanding without building any of the AI plumbing themselves.

**Payment model is manual.** There is no payment-gateway integration. A platform admin activates a paying customer by approving their tutor request and setting a seat limit, which provisions their organization and an `ACTIVE` subscription.

---

## 2. The three apps and how they fit together

Talim AI is a **pnpm + Turborepo monorepo** with three deployable apps and three shared packages.

| App | Tech | Port | Purpose |
|-----|------|------|---------|
| `apps/web` | Next.js 15 + React 19 (App Router), next-intl i18n | 3000 | The learner & tutor product (B2C + B2B) |
| `apps/admin` | Next.js 15 (no i18n) | 3001 | Platform-operator admin panel |
| `apps/api` | Express 4 + Prisma 6 + Bull (Redis) | 4000 | Backend API, AI orchestration, background jobs |

Shared packages: `@talim/types` (shared TypeScript types — **must be built before running the apps**), `@talim/ui`, and `@talim/config` (incl. `@talim/tailwind-config`).

### Architecture diagram

```
                            ┌─────────────────────────────┐
   Learner / Tutor browser  │  apps/web   (Next.js, :3000) │
   ──────────────────────▶  │  i18n: uz / en / ru          │
                            └──────────────┬──────────────┘
                                           │  HTTP (JSON / SSE)
   Platform admin browser   ┌──────────────┴──────────────┐
   ──────────────────────▶  │  apps/admin (Next.js, :3001) │
                            └──────────────┬──────────────┘
                                           │
                            ┌──────────────▼──────────────┐
                            │  apps/api  (Express, :4000)  │
                            │  routes mounted at ROOT       │
                            │  (no /api prefix)             │
                            └───┬───────────┬───────────┬──┘
                                │           │           │
            ┌───────────────────▼──┐   ┌────▼────┐  ┌───▼───────────────┐
            │ PostgreSQL 16        │   │  Redis  │  │ AI providers       │
            │ + pgvector           │   │ (Bull   │  │ OpenAI (embed/TTS/ │
            │ (content, chunks,    │   │ queues) │  │   tutor RAG),      │
            │  embeddings, users,  │   └─────────┘  │ DeepSeek (chat)    │
            │  tenants, quizzes)   │                └────────────────────┘
            └──────────────────────┘
                                      ▲
   In production, nginx (:80/:443) ───┘  terminates TLS and reverse-proxies:
     talim-ai.uz        -> web    + /api-style calls -> api
     admin.talim-ai.uz  -> admin  +                  -> api
```

In **production**, all three apps plus Postgres, Redis, and nginx run as Docker containers behind nginx (`docker-compose.yml` + `docker-compose.prod.yml`). nginx routes `talim-ai.uz` to `web`, `admin.talim-ai.uz` to `admin`, and proxies API traffic to `api:4000`.

### How the API is mounted

All API routes are mounted at the **root** of the Express app — there is **no `/api` prefix**. Health lives at `/health` (not `/api/health`). From `apps/api/src/routes/index.ts`:

```
GET  /health
     /auth     /content   /chat    /quiz     /summary
     /admin    /usage     /billing /tenant   /learner
```

Security is set up in `apps/api/src/index.ts`: `helmet` for headers and a **CORS allow-list** (localhost:3000 / :3001 in dev, configured origins in prod). On boot, four background-job processors are registered: `processContent`, `generateQuiz`, `generatePodcast`, `renderManim` (`apps/api/src/jobs/`).

---

## 3. Roles & personas

Roles are the `UserRole` enum in `apps/api/src/prisma/schema.prisma`: `INDIVIDUAL`, `TENANT_OWNER`, `TENANT_LEARNER`, `ADMIN`.

### ADMIN — platform operator
Uses **apps/admin**. Approves/rejects tutor requests, manages users and tenants, resets passwords, edits subscriptions, inspects content & generated media, views usage and an audit log. Admins are **not self-registerable** — they are created via `pnpm create-admin`.

### TENANT_OWNER — the paying customer (a tutor or school org admin)
A learner who has been approved as a tutor. Their seat limit scales with their student count (set by the admin at approval time). They can:
- Manage students (create / edit / deactivate / reset password).
- Upload, assign, and unassign materials.
- Generate media: summary, podcast, slides, video (Manim) per content item.
- Build AI question banks and approve generated questions.
- Create and assign assessments, including **GAME** quizzes.
- View per-student progress and class progress.

### TENANT_LEARNER — a student belonging to one tutor
Reads **only ASSIGNED** materials, asks the AI tutor, takes quizzes/games, and sees their own progress. A student **does not upload content**. A **deactivated** student loses content access immediately (membership-scoped — see §6).

### INDIVIDUAL — B2C solo learner
The original B2C experience: uploads PDFs / YouTube links / slides, and gets summaries, podcasts, quizzes, and the AI tutor on their own content. This is the default role on signup.

---

## 4. End-to-end journeys

### (a) Individual learner: upload → AI processing → learn
1. Learner signs up (`POST /auth/register`) — defaults to `INDIVIDUAL`.
2. Uploads a PDF or pastes a YouTube URL via `apps/web`.
3. The API enqueues a `processContent` job. Content status moves `PENDING → PROCESSING → READY` (or `FAILED`). See the pipeline in §5.
4. Once `READY`, the learner reads the AI-generated **summary**, generates a **podcast** (TTS, with a transcript that follows the audio), takes a **quiz** (with a per-question review screen after submitting), and chats with the **AI tutor** — which retrieves the most relevant chunks of *their own content* via pgvector and answers grounded in them, optionally rendering visuals (graphs, charts, diagrams, Manim animations).

### (b) Learner becomes a tutor: request → admin approval → org + subscription
1. A signed-in learner submits **"Become a tutor"** → `POST /auth/upgrade-to-tenant`, which creates a `TutorRequest` (status `PENDING`).
2. The learner can poll their request via `GET /auth/tutor-request`.
3. An admin reviews it in apps/admin (**Tutor Requests**) and approves with a **seat limit** → `POST /admin/tutor-requests/:id/approve` (or rejects via `.../reject`).
4. Approval provisions the **organization** + an **`ACTIVE` subscription** and promotes the user to `TENANT_OWNER`, unlocking the tutor tools.

### (c) Tutor onboards students, assigns materials, creates assessments
1. **Add students** two ways:
   - **Manually:** `POST /tenant/students` with a name and an **optional** email. Email-less students (kids) get a username + password and a **synthetic email** (`username@students.talim.local`) plus a `mustChangePassword` flag.
   - **Join code:** the tutor shares a class **join code**; learners self-enroll at registration (`joinCode` accepted on `POST /auth/register`, or `POST /auth/join-class` for an existing user). The tutor can rotate it via `POST /tenant/join-code/regenerate`.
2. **Upload & assign materials:** tutor uploads content (`/tenant/content`), then assigns it to students via `POST /tenant/assignments` (and removes with `DELETE /tenant/assignments`).
3. **Question banks:** the tutor works through a **5-step wizard** (Bank → Generate → Review → Publish → Assign): AI-generate questions from content (10 generation styles) *or* author them by hand, then review/approve (`BankQuestionStatus`). The engine supports **11 question types** — from short-answer / multiple-choice through MATCHING and ORDERING to the image-based **HOTSPOT** and bucket-based **DRAG_DROP** (those last two are manual-authoring only); grading for every type lives in `services/assessment/shared.ts`.
4. **Assessments:** `POST /tenant/assessments` with `AssessmentMode` of `WRITTEN` or **`GAME`**. Game mode supports a per-question timer (`secondsPerQuestion`), speed-based points (`pointsAwarded`, `pointsTotal`), streaks (`maxStreak`), and a class **leaderboard** (indexed by `assessmentId, pointsTotal`) that updates in real time via a `leaderboard.update` SSE event. Assignments can carry a **due date**; late submissions are rejected (403).
5. **Track progress:** `GET /tenant/progress` (class), `GET /tenant/students/:id/progress` (per student).

### (d) Student logs in → assigned materials → game quiz → leaderboard
1. Student logs in (`POST /auth/login`); if `mustChangePassword`, they set a new one.
2. Sees **only assigned** materials (`GET /learner/...`, scoped by active membership).
3. Opens an assigned **GAME** quiz, answers under the per-question timer (every question type renders and grades natively in the player), and earns speed points + streak bonuses — as long as the assignment's due date hasn't passed (otherwise the quiz shows a "submissions closed" locked state).
4. Their score posts to the class leaderboard for that assessment, which updates **live** for everyone watching.

### (e) Admin operations
From apps/admin: approve/reject tutor requests; create / edit / delete users (`/admin/users`, `/admin/users/:id`), reset passwords, edit a user's subscription (`/admin/users/:id/subscription`), and **impersonate** a user for support via a short-lived (30 min) token (`/admin/users/:id/impersonate`, opened at the web `/impersonate` route); manage tenants (`/admin/tenants`); inspect & retry content jobs (`/admin/contents`); manage generated media (`/admin/generated`); review subscriptions (`/admin/subscriptions`), usage summary (`/admin/usage/summary`), platform stats (`/admin/stats/platform`), and the **audit log** (`/admin/audit-logs`). All admin routes require `authMiddleware + requireRole('ADMIN')` and are rate-limited.

---

## 5. Content pipeline & background-job model

Long-running AI work runs **off the request path** in Bull queues backed by Redis. Four processors are registered at API boot (`apps/api/src/jobs/`).

### Ingestion → RAG → derived media (the `processContent` job)
From `apps/api/src/jobs/processContent.job.ts`:

1. Mark content `PROCESSING`.
2. **Extract text:**
   - YouTube → `extractYoutubeTranscript` (segments persisted to `ContentTranscriptSegment`).
   - PDF → `extractPdfText`.
3. **Chunk** the text (`chunkText`).
4. **Embed & store:** `storeChunksWithEmbeddings` calls OpenAI `text-embedding-3-small` (1536 dims) and inserts each chunk + vector into the `Chunk` table as a pgvector `vector` column.
5. **Sections:** `generateContentSections` builds structured sections/summary (when there are enough chunks), optionally as a **2-level chapter → subsection outline** (`ContentSection.parentId` / `depth`) that renders as a nested navigation rail.
6. Mark content `READY` (or `FAILED` on error).

### Other jobs
- **`generateQuiz`** — generates quiz questions from content.
- **`generatePodcast`** — turns a script into audio via TTS (`tts.service.ts`, locale-aware voice), recording **per-segment audio byte-lengths** so the player can keep the transcript in sync with playback.
- **`renderManim`** — renders Manim animations requested by the AI tutor's `RENDER_MANIM` tool.

### RAG tutor chat
The AI tutor (`/chat`) embeds the user's question, finds the nearest content chunks via pgvector similarity, and feeds them as grounding context to the chat model. Chat completion uses **DeepSeek** (`apps/api/src/services/ai.service.ts`, OpenAI-compatible client pointed at `api.deepseek.com`), while embeddings and TTS use **OpenAI**. The tutor can call **visual tools** (`apps/api/src/lib/tutor-tools.ts`): graph, Mermaid diagram, chart, GeoGebra, HTML sandbox, and Manim — returning rich `VisualBlock` content inline in the conversation.

---

## 6. Multi-tenancy & data isolation

Isolation is enforced **centrally**, not sprinkled across controllers, in `apps/api/src/services/contentAccess.service.ts`.

Key guards:
- **`assertCanAccessContent(user, contentId)`** — the core gate for reading a single content item.
- **`buildContentListWhere(user)`** — builds the Prisma `where` for list queries by role.
- **`assertCanMutateContent` / `assertCanGenerate` / `assertIndividualContentRoute`** — role gates for writes, generation, and B2C-only routes.
- **`assertTenantOwnsContent(tenantId, contentId)`** — ensures a tenant only touches its own content.

Rules that fall out of this:
- **INDIVIDUAL** sees only content they own.
- **TENANT_OWNER** sees only content within their tenant (`resolveTenantIdForUser`).
- **TENANT_LEARNER** sees content **only if it is assigned to them AND their tenant membership is currently active.** The access check verifies a `ContentAssignment` *and* an active `TenantMembership` (`getAssignedContentIds`, active-membership check). This is why **deactivating a student revokes access immediately** — the membership is no longer active, so the assignment no longer resolves.

Because all of this is concentrated in one service, every content/assessment query is scoped by **role + active membership + assignment**, and there is a single place to audit the isolation logic.

> **Code-organization note:** several backend modules are split into folders (`admin/`, `subscription/`, `assessment/`, `tenant/`) but re-exported through a barrel at their original path (e.g. `assessment.service.ts` re-exports `assessment/`), so imports stay unchanged.

---

## 7. Tech stack & infra at a glance

### Stack summary

| Layer | Technology |
|-------|-----------|
| Monorepo | pnpm workspaces + Turborepo (`turbo.json`), Node ≥ 20, pnpm 10 |
| Web app | Next.js 15, React 19, App Router, next-intl (locales: **uz / en / ru**), Tailwind, Zustand, @tanstack/react-query |
| Admin app | Next.js 15 (no i18n), Tailwind |
| API | Express 4, Prisma 6, Bull (Redis-backed queues) |
| Database | PostgreSQL 16 + **pgvector** (image `pgvector/pgvector:pg16`) |
| Cache / queues | Redis 7 |
| AI | OpenAI (embeddings `text-embedding-3-small`, TTS, tutor RAG), DeepSeek (chat) |
| Tutor visuals | Manim, plus graph / Mermaid / chart / GeoGebra / HTML-sandbox tools |
| Secrets | Doppler (config `dev` locally, `prd` on the VPS) |
| Reverse proxy (prod) | nginx (TLS, host-based routing) |
| CI/CD | GitHub Actions → SSH deploy to VPS |

### Local development
- `pnpm dev:all` — brings up Docker infra (Postgres + Redis), runs migrations, seeds, and starts the apps. (`dev:infra` → `db:migrate:deploy` → `db:seed` → `dev`.)
- Root scripts wrap commands in `doppler run --` to inject secrets.
- **Always build shared types first:** `pnpm --filter @talim/types build` (wired into `pnpm dev`).
- **`prisma generate` is mandatory before typecheck/build** — it's wired into `predev` / `prebuild` / `pretypecheck` in `apps/api`. A stale Prisma client produces hundreds of phantom TS errors.
- **Use `pnpm db:migrate:deploy`** (migrate deploy) locally — **not** `migrate dev` — because the dev DB has migration-checksum drift that `migrate dev` would try to reset.
- Create operator/customer accounts via scripts: `pnpm create-admin` and `pnpm create-tenant-owner` (tenant owners can also be created by an admin approving a tutor request).

### Deployment
- **GitHub Actions** (`.github/workflows/deploy.yml`) triggers on push to `main`, SSHes into the VPS, ensures Docker + Doppler are installed, then builds and (re)starts the stack with `doppler run --project talim-ai --config prd -- docker compose -f docker-compose.yml -f docker-compose.prod.yml ...`.
- **Production hosts:** `talim-ai.uz` (web) and `admin.talim-ai.uz` (admin), served via nginx with TLS on :443; nginx proxies API calls to `api:4000`. (`talimai.uz` / `www` are also handled in `nginx.conf`.)

---

## Appendix: API route map

| Mount | Notable endpoints |
|-------|-------------------|
| `/health` | `GET /health` → `{ status: "ok" }` |
| `/auth` | `register`, `register-tenant`, `upgrade-to-tenant`, `tutor-request` (GET), `join-class`, `login`, `me` (GET/PATCH) |
| `/content`, `/chat`, `/quiz`, `/summary` | B2C content, RAG tutor chat, quizzes, summaries |
| `/tenant` | tenant info, `join-code/regenerate`, `students` (CRUD + reset-password + progress), `assignments`, `question-banks`, `assessments`, tenant `content` sub-router (upload, retry, podcast, video, sections, transcript, OCR) |
| `/learner` | `summary`, `assessments` (assigned), attempts |
| `/admin` | `audit-logs`, `tutor-requests` (+approve/reject), `users` (+`:id/impersonate`), `tenants`, `contents`, `generated`, `subscriptions`, `usage/summary`, `stats/platform` — all `ADMIN`-only |
| `/usage`, `/billing` | usage metering, billing/subscription info |
