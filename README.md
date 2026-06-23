# Talim AI

AI-powered learning platform for **individuals and tutors/schools**. It turns study materials into summaries, podcasts, quizzes, and an interactive AI tutor — and gives tutors the tools to manage students, assign content, and run live game quizzes with a class leaderboard.

- **B2C** — anyone uploads PDFs/slides or pastes a YouTube link, then learns through structured sections, audio, tests, and chat grounded in their own content.
- **B2B** — a learner can request to **become a tutor**; once a platform admin approves and sets a seat limit, the tutor gets an organization, student management, content assignment, AI question banks, and assessments.

**Production:** [talim-ai.uz](https://talim-ai.uz) · **Admin panel:** [admin.talim-ai.uz](https://admin.talim-ai.uz)

> Payment is **manual**: there is no payment integration. A platform admin activates subscriptions and sets seat limits.

## Features

### Learner / content (B2C)

- **Content ingestion** — PDF/slide upload and YouTube import
- **Sectioned study view** — AI-generated sections with reading-time estimates
- **AI summaries** — key points extracted from uploaded material
- **Podcasts** — generated audio episodes from content sections
- **Quizzes** — auto-generated questions with explanations and attempt tracking
- **AI tutor chat** — RAG-backed Q&A scoped to your material, with Manim-rendered visuals
- **i18n** — Uzbek, English, Russian (next-intl, `[locale]` routing)

### Tutor / organization (B2B)

- **Become a tutor** — a learner sends a tutor request (`POST /auth/upgrade-to-tenant`); an admin approves it and sets a **custom seat limit** that scales with student count, which creates the org and an active subscription
- **Students** — a tutor creates student accounts (name + **optional** email; username + password for email-less kids) and shares a **class join code** so students can self-enroll at registration
- **Materials** — upload, assign content per student/class, and generate media (podcast / slides / summary / video)
- **Assessments** — build AI question banks and create assessments in two modes: `WRITTEN` and `GAME` (per-question timer, speed points, streaks, class leaderboard)
- **Progress** — per-student and whole-class progress views
- A **deactivated** student loses content access immediately

### Platform admin

- Dedicated admin panel (`apps/admin`): dashboard, **tutor requests** (approve + set seat limit), users (roles, password reset, support credential lookup), tenants, content, generated media, subscriptions, usage, and an **audit log**

> Roles (`UserRole`): `ADMIN` (platform operator), `TENANT_OWNER` (paying tutor/school), `TENANT_LEARNER` (student under one tutor), `INDIVIDUAL` (B2C solo learner).

## Tech stack

| Layer | Technologies |
|-------|----------------|
| Frontend | Next.js 15, React 19, Tailwind CSS, TanStack Query, Zustand, next-intl (web only) |
| Backend | Express 4, Prisma 6, Bull (Redis queues) |
| Data | PostgreSQL 16 + pgvector, Redis |
| AI | OpenAI (embeddings + tutor chat/RAG + TTS), DeepSeek, Manim (tutor visuals) |
| Infra | Docker Compose, nginx, Doppler, GitHub Actions → VPS |

## Monorepo layout

```
apps/
  web/          # Next.js B2C + tutor/learner UI (i18n, port 3000)
  admin/        # Next.js platform-admin panel (no i18n, port 3001)
  api/          # Express API + Prisma + Bull background jobs (port 4000)
packages/
  types/        # Shared TypeScript types (build BEFORE running apps)
  ui/           # Shared UI components
  config/       # ESLint, Tailwind, tsconfig presets
```

The web app uses Next App Router with a `[locale]` segment (`uz`, `en`, `ru`; messages in `apps/web/messages/{uz,en,ru}.json`). Route groups: `(auth)` login/register, `(learner)` learner dashboard/progress/assessments/settings, `(tenant)` tutor dashboard/materials/students/progress/assessments/billing/settings, plus B2C `content/[id]`, `dashboard`, and `quiz/[id]`.

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/) 10+
- [Docker](https://www.docker.com/) (PostgreSQL + Redis locally)
- [Doppler CLI](https://docs.doppler.com/docs/install-cli) (secrets for local dev and deploy)

## Local development

### 1. Clone and install

```bash
git clone https://github.com/KAMRONBEK/talim-ai.git
cd talim-ai
pnpm install
```

### 2. Configure secrets (Doppler)

Secrets live in Doppler — never commit `.env` files or API keys. Use config `dev` locally and `prd` on the VPS. Most root scripts wrap their command in `doppler run --`.

```bash
doppler login
pnpm doppler:setup          # project: talim-ai, config: dev
```

If you are bootstrapping a new Doppler project, upload the template, then set real values:

```bash
pnpm doppler:upload
# Then set real values in Doppler (JWT_SECRET, OPENAI_API_KEY, DEEPSEEK_API_KEY, …)
```

See [`env.template`](env.template) for the full variable list.

### 3. Start infrastructure and database

```bash
pnpm dev:infra              # PostgreSQL (pgvector) + Redis via Docker
pnpm db:migrate:deploy      # use migrate deploy locally — NOT migrate dev (see note below)
pnpm db:seed                # seed plans/reference data
```

> **Use `db:migrate:deploy`, not `db:migrate` (migrate dev), locally.** The dev DB has migration-checksum drift that `migrate dev` would try to reset. `pnpm db:generate` (Prisma client) is wired into `predev`/`prebuild`/`pretypecheck` in `apps/api` — a stale client produces hundreds of phantom TS errors, so always regenerate before typecheck/build.

### 4. Run the apps

```bash
pnpm dev                    # builds @talim/types, then web → :3000 + api → :4000 (Doppler + Turbo)
pnpm dev:admin             # builds @talim/types, then admin → :3001
```

`pnpm dev:all` does the full local bring-up (`dev:infra` → `db:migrate:deploy` → `db:seed` → `dev`).

| Service | URL |
|---------|-----|
| Web | http://localhost:3000 |
| Admin | http://localhost:3001 |
| API | http://localhost:4000 |
| Health | http://localhost:4000/health |

## Common scripts

```bash
pnpm dev                    # web + api (Doppler dev secrets, builds @talim/types first)
pnpm dev:admin              # admin panel on :3001
pnpm dev:all                # infra + migrate deploy + seed + dev
pnpm dev:infra              # db + redis only
pnpm build                  # production build (all packages)
pnpm lint                   # lint all packages
pnpm typecheck              # typecheck all packages
pnpm db:generate            # regenerate Prisma client
pnpm db:migrate:deploy      # apply migrations (preferred locally)
pnpm db:seed                # seed plans/reference data
pnpm db:studio              # Prisma Studio (Doppler dev DB)
pnpm inspect-chunks -- --contentId <id> [--query "…"]   # list chunks / test RAG search
pnpm create-admin -- --email … --password … --name …    # bootstrap platform admin
pnpm create-tenant-owner -- --email … --password … --orgName …   # bootstrap tutor + org + active plan
pnpm docker:up              # full stack in Docker (Doppler-injected)
pnpm docker:down            # stop Docker stack
```

## Bootstrap accounts

Admin and tenant-owner accounts are **not self-registerable**. Secrets and DB access go through Doppler (`dev` locally, `prd` on the VPS).

### Platform admin

Creates an `ADMIN` user for [`apps/admin`](apps/admin) (local `:3001`, production `admin.talim-ai.uz`):

```bash
# Local (Doppler dev)
pnpm create-admin -- --email you@example.com --password 'your-secure-password' --name 'Operator'

# Production — on the VPS with Doppler prd (see docs/DEPLOY.md)
doppler run --project talim-ai --config prd -- pnpm --filter @talim/api create-admin -- \
  --email you@example.com --password 'your-secure-password' --name 'Operator'
```

From the admin panel you can approve tutor requests, change roles, assign subscriptions, reset passwords, and look up recorded credentials (`adminPasswordNote`) for support.

### Tenant owner (organization)

Two paths:

**1. Tutor request → admin approval (the product flow).** A learner signs up normally, then requests "Become a tutor" (`POST /auth/upgrade-to-tenant`, which creates a `TutorRequest`). An admin approves it in the admin panel and sets a **seat limit**, which creates the org + an **ACTIVE** subscription and unlocks tutor tools.

**2. CLI (recommended for dev/staging)** — creates owner + organization + active plan (`TENANT_STARTER` by default):

```bash
pnpm create-tenant-owner -- \
  --email owner@school.uz \
  --password 'your-secure-password' \
  --orgName 'My School' \
  --name 'School Admin' \
  --planCode TENANT_STARTER
```

On production, run the same command on the VPS with `--config prd`. Re-running updates password/role and ensures the org subscription is active.

### Students (tenant learners)

Created by the **tutor** in the web app (Students → Add student): name + **optional** email; for email-less kids the system generates a username, a synthetic email (`username@students.talim.local`), a temporary password, and a `mustChangePassword` flag. Tutors also share a **class join code** so students can self-enroll at registration. Students log in at the normal login page and see **assigned materials only**.

## Docker (full stack)

Use Doppler so Compose receives `JWT_SECRET`, API keys, and other secrets:

```bash
pnpm docker:up
```

Plain `docker compose up` without Doppler will not inject secrets correctly. See comments in [`docker-compose.yml`](docker-compose.yml).

Services: `db`, `redis`, `api`, `web`, `admin`, `nginx`.

## Deployment

Production deploys to a VPS via GitHub Actions on every push to `main`.

- **Secrets:** Doppler config `prd`
- **Compose:** `docker-compose.yml` + `docker-compose.prod.yml`
- **Details:** [`docs/DEPLOY.md`](docs/DEPLOY.md)

Post-deploy smoke check (nginx proxies the API under `/api` in production):

```bash
curl -s https://talim-ai.uz/api/health
```

## API overview

The API mounts all routers at the **root — there is NO `/api` prefix** (the production `/api` path is added by nginx, not the app). See [`apps/api/src/routes/index.ts`](apps/api/src/routes/index.ts).

| Area | Router | Notes |
|------|--------|-------|
| Health | `/health` | liveness check (not `/api/health`) |
| Auth | `/auth` | login/register, `upgrade-to-tenant` (tutor request) |
| Content | `/content` | upload, YouTube, sections, delete |
| Chat | `/chat` | RAG AI tutor |
| Quiz | `/quiz` | quiz generation + attempts |
| Summary | `/summary` | content summaries |
| Admin | `/admin` | platform-admin operations + audit |
| Usage | `/usage` | usage metering |
| Billing | `/billing` | subscriptions/plans (manual activation) |
| Tenant | `/tenant` | students, materials, assessments, join-code |
| Learner | `/learner` | assigned materials + learner progress |

Multi-tenant isolation is enforced centrally in [`apps/api/src/services/contentAccess.service.ts`](apps/api/src/services/contentAccess.service.ts) (`assertCanAccessContent`) — every content/assessment query is scoped by role + ACTIVE membership.

Background jobs (Bull + Redis), registered at boot from [`apps/api/src/jobs`](apps/api/src/jobs): `processContent`, `generateQuiz`, `generatePodcast`, `renderManim`.

## Environment variables

| Variable | Scope | Notes |
|----------|-------|-------|
| `DATABASE_URL` | API | `localhost` for `pnpm dev`; `db` hostname in Docker |
| `REDIS_URL` | API | same pattern as database |
| `JWT_SECRET` | API | min 32 characters |
| `OPENAI_API_KEY` | API | embeddings + tutor chat + TTS |
| `DEEPSEEK_API_KEY` | API | AI provider |
| `DEEPSEEK_MODEL` | API | default `deepseek-v4-flash` |
| `TUTOR_MODEL` | API | default `gpt-4o` |
| `TTS_PROVIDER` / `TTS_MODEL` | API | podcast TTS (default `openai` / `tts-1-hd`) |
| `TRANSCRIPTION_MODEL` | API | default `whisper-1` |
| `MANIM_BIN` | API | optional; path to Manim CLI (falls back to SVG animation) |
| `DEFAULT_CONTENT_LOCALE` | API | default `uz` |
| `UPLOAD_DIR` | API | default `./uploads` |
| `CORS_ORIGIN` | API | allow-list; must include web + admin origins |
| `NEXT_PUBLIC_API_URL` | Browser | e.g. `http://localhost:4000` locally |
| `NEXT_PUBLIC_DESMOS_API_KEY` | Browser | Desmos graphing (optional) |

Full list: [`env.template`](env.template).

## QA

Browser smoke tests use Playwright MCP. See [`docs/QA.md`](docs/QA.md). After QA, delete ephemeral screenshots and `.playwright-mcp/` artifacts before committing.

## License

Private — all rights reserved.