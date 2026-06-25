# Talim AI — Project Guide for AI Coding Agents

## What this is

Talim AI is a multi-tenant AI learning platform with both **B2C** (an individual uploads PDFs/YouTube/slides and gets AI summaries, podcasts, quizzes, and an AI tutor) and **B2B** (a tutor/school org buys seats, manages students, assigns materials, and runs assessments including timed "game" quizzes) experiences. The stack is a pnpm + Turborepo monorepo: a Next.js learner/tenant web app, a Next.js platform-admin panel, and an Express + Prisma + Bull (Redis) API backed by PostgreSQL 16 with pgvector. **Payment is manual** — there is no payment integration; a platform admin activates orgs and sets seat limits.

## Monorepo map

| Path | What | Port |
| --- | --- | --- |
| `apps/web` | Next.js 15 / React 19 learner + tenant app. App Router, i18n via `next-intl` (`[locale]` segment; locales `uz`/`en`/`ru`, messages in `apps/web/messages/{uz,en,ru}.json`). Tailwind, Zustand, `@tanstack/react-query`. | 3000 |
| `apps/admin` | Next.js 15 platform-admin panel ("Talim Admin"). **No i18n.** | 3001 |
| `apps/api` | Express 4 + Prisma 6 + Bull/Redis. Routes mounted at **root** (no `/api` prefix). | 4000 |
| `packages/types` (`@talim/types`) | Shared TS types. **Must be built before running apps** (`pnpm --filter @talim/types build`). |
| `packages/ui` (`@talim/ui`) | Shared UI components. |
| `packages/config/*` (`@talim/config`, eslint/tsconfig) | Shared config. |

### apps/web route groups (under `app/[locale]`)
- `(auth)`: `login`, `register`
- `(learner)`: `learner/{dashboard,progress,assessments,settings}`
- `(tenant)`: `tenant/{dashboard,materials,materials/[id]/assign,students,students/[id],progress,assessments,billing,settings}`
- B2C: `content/[id]/{page,chat,podcast}`, `dashboard/{page,settings}`, `quiz/[id]`
- Marketing: `[locale]/page.tsx` (components in `components/marketing/*`)

### apps/admin routes
`/login`, and `app/(admin)/{dashboard,tutor-requests,users,users/[id],tenants,tenants/[id],content,generated,subscriptions,usage,audit}`

### apps/api routes (`apps/api/src/routes/index.ts`)
`GET /health`, plus `/auth /content /chat /quiz /summary /admin /usage /billing /tenant /learner`. Security: `helmet` + CORS allow-list (`apps/api/src/index.ts`). Background jobs registered at boot: `processContent`, `generateQuiz`, `generatePodcast`, `renderManim` (`apps/api/src/jobs`).

## Roles & product model

Roles (`UserRole`):
- **ADMIN** — platform operator; uses `apps/admin`.
- **TENANT_OWNER** — a tutor/school org admin and the paying customer; seat limit scales with student count.
- **TENANT_LEARNER** — a student belonging to one tutor.
- **INDIVIDUAL** — B2C solo learner; uploads own content.

Flow:
- Everyone signs up as a learner. A learner requests "Become a tutor" (`POST /auth/upgrade-to-tenant` creates a `TutorRequest`). An **ADMIN approves and sets a seat limit**, which creates the org + an **ACTIVE subscription** and unlocks tutor tools.
- A tutor creates student accounts (name + **optional** email; username + password for email-less kids — these get a synthetic email `username@students.talim.local` and a `mustChangePassword` flag) and shares a class **JOIN CODE** for self-enroll at register.
- **TENANT_OWNER** can: manage students, upload/assign materials, generate media (podcast/slides/summary/video), build AI question banks, create/assign assessments incl. **GAME** quizzes (`AssessmentMode WRITTEN|GAME` with per-question timer, speed points, streaks, class leaderboard), and view per-student + class progress.
- **TENANT_LEARNER** reads only **assigned** materials, asks the AI tutor, takes quizzes/games, sees own progress; does **not** upload content. A **deactivated** student loses content access immediately.
- **INDIVIDUAL** is the original B2C experience (upload, summaries, podcasts, quizzes, AI tutor).

## Essential commands (run from repo root)

Secrets are managed via **Doppler** (config `dev` locally, `prd` on the VPS); most root scripts wrap commands in `doppler run --`. `@talim/types` builds first in `dev`/`dev:admin`.

| Command | Does |
| --- | --- |
| `pnpm dev` | Build `@talim/types`, then `turbo run dev` (all apps). |
| `pnpm dev:admin` | Build `@talim/types`, then run only the admin app. |
| `pnpm dev:infra` | `docker compose up -d --wait db redis`. |
| `pnpm dev:all` | `dev:infra` → `db:migrate:deploy` → `db:seed` → `dev`. |
| `pnpm build` | `turbo run build`. |
| `pnpm typecheck` | `turbo run typecheck`. |
| `pnpm lint` | `turbo run lint`. |
| `pnpm db:migrate:deploy` | `prisma migrate deploy` — **use this locally** (not `migrate dev`). |
| `pnpm db:seed` | `prisma db seed`. |
| `pnpm db:generate` | `prisma generate`. |
| `pnpm db:studio` | Prisma Studio. |
| `pnpm create-admin` | Create a platform admin (`apps/api/src/scripts/create-admin.ts`). |
| `pnpm create-tenant-owner` | Create a tenant owner directly. |
| `pnpm docker:up` / `docker:down` | Full Docker stack via `scripts/doppler-docker.sh` / `docker compose down`. |

Node `>=20`, pnpm `10`. Data services from `docker-compose.yml`: PostgreSQL 16 + pgvector, Redis.

## Architecture conventions & invariants

- **Run `prisma generate` before typecheck/build.** It's wired into `predev`/`prebuild`/`pretypecheck` in `apps/api`; a stale client causes hundreds of phantom TS errors.
- **Use `pnpm db:migrate:deploy` locally, NOT `migrate dev`** — the dev DB has migration-checksum drift that `migrate dev` would try to reset.
- **Multi-tenant isolation is enforced centrally** in `apps/api/src/services/contentAccess.service.ts` (`assertCanAccessContent`). Scope every content/assessment query by role + ACTIVE membership; route new access paths through this guard.
- **Barrel-split pattern:** larger backend modules (`admin.controller`, `subscription`/`assessment`/`tenant` services) live as folders re-exported via a barrel at the original path, so imports stay unchanged.
- **No `/api` prefix** — API routes are mounted at root. Health is `GET /health` (not `/api/health`).
- **i18n lives only in `apps/web`** (`next-intl` + `[locale]`); `apps/admin` has none.
- **Manual activation** — no payment integration; admins activate orgs and set seat limits.
- **Admins are not self-registerable** — create via `pnpm create-admin`; tenant owners via `pnpm create-tenant-owner` or admin approval of a tutor request.

## Where things live

- `apps/api/src/prisma/schema.prisma` — data model; migrations under `apps/api/src/prisma/migrations`.
- `apps/api/src/services/` — `contentAccess` (the core isolation guard), `ai`, `rag`, `embed`, `tts`, `youtube`, `pdf`, `storage`, `queue`, `usage`, `learningProgress`, `section`, `subscription/*`, `tenant/*`, `assessment/*`, `adminUserRole`, `tutorRequest`, `admin/audit`.
- `apps/api/src/jobs/` — Bull job processors (`processContent`, `generateQuiz`, `generatePodcast`, `renderManim`).
- AI providers: OpenAI (embeddings + tutor chat / RAG), DeepSeek; TTS for podcasts; Manim for tutor visuals.
- Per-app guides: `apps/api/CLAUDE.md`, `apps/web/CLAUDE.md`, `apps/admin/CLAUDE.md` — read the one for the app you're editing.
- Docs: `docs/PLATFORM.md` (what Talim is + how it works end-to-end), `docs/FEATURES.md` (feature → code map), `docs/DEPLOY.md` (deployment), `docs/QA.md` (QA), `docs/PLANS.md` + `docs/plans/` (epics/backlog).
- Root config: `pnpm-workspace.yaml`, `turbo.json`, `docker-compose.yml` / `docker-compose.prod.yml`, `doppler.yaml`, `env.template`, `nginx.conf`.

## Gotchas (quick recap)

1. Always `prisma generate` before typecheck/build (auto-wired in `apps/api`, but watch for stale clients).
2. Locally use `db:migrate:deploy`, never `migrate dev` (checksum drift).
3. Every content/assessment access must pass through `contentAccess.service.ts`.
4. Activation/billing is manual (admin-driven); there is no payment gateway.
5. API has no `/api` prefix; health is `/health`.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- The committed `graphify-out/` is a curated snapshot (hand-labeled communities). `graphify update .` is AST-only/free but regenerates `GRAPH_REPORT.md` with generic `Community N` labels and leaves the Obsidian vault stale — don't commit that churn for small code changes. Refresh the committed graph with a full `/graphify . --obsidian` rebuild (re-labels communities) when the architecture has meaningfully shifted.
