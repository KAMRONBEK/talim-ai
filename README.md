# Talim AI

AI-powered learning platform that turns study materials into summaries, podcasts, quizzes, and an interactive tutor. Upload PDFs or slides, paste a YouTube link, then learn through structured sections, audio, tests, and chat grounded in your content.

**Production:** [talim-ai.uz](https://talim-ai.uz)

## Features

- **Content ingestion** — PDF/slide upload and YouTube import
- **Sectioned study view** — AI-generated sections with reading time estimates
- **AI summaries** — Key points extracted from uploaded material
- **Podcasts** — Generated audio episodes from content sections
- **Quizzes** — Auto-generated questions with explanations and attempt tracking
- **AI tutor chat** — RAG-backed Q&A scoped to your material

## Tech stack

| Layer | Technologies |
|-------|----------------|
| Frontend | Next.js 15, React 19, Tailwind CSS, TanStack Query, Zustand |
| Backend | Express, Prisma, Bull (Redis queues) |
| Data | PostgreSQL 16 + pgvector, Redis |
| AI | OpenAI, DeepSeek |
| Infra | Docker Compose, nginx, Doppler, GitHub Actions → VPS |

## Monorepo layout

```
apps/
  web/          # Next.js frontend
  api/          # Express API + Prisma + background jobs
packages/
  types/        # Shared TypeScript types
  ui/           # Shared UI components
  config/       # ESLint, Tailwind, tsconfig presets
```

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/) 9+
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

Secrets live in Doppler — never commit `.env` files or API keys.

```bash
doppler login
pnpm doppler:setup          # project: talim-ai, config: dev
```

If you are bootstrapping a new Doppler project, upload the template:

```bash
pnpm doppler:upload
# Then set real values in Doppler (JWT_SECRET, DEEPSEEK_API_KEY, OPENAI_API_KEY, …)
```

See [`env.template`](env.template) for the full variable list.

### 3. Start infrastructure

```bash
pnpm dev:infra              # PostgreSQL (pgvector) + Redis
pnpm db:migrate             # or: pnpm db:push
```

### 4. Run the apps

```bash
pnpm dev                    # web → :3000, api → :4000 (via Doppler + Turbo)
```

| Service | URL |
|---------|-----|
| Web | http://localhost:3000 |
| API | http://localhost:4000 |
| Health | http://localhost:4000/api/health |

## Common scripts

```bash
pnpm dev                    # Start web + api with Doppler dev secrets
pnpm dev:infra              # Start db + redis only
pnpm build                  # Production build (all packages)
pnpm lint                   # Lint all packages
pnpm typecheck              # Typecheck all packages
pnpm db:generate            # Regenerate Prisma client
pnpm db:migrate             # Run Prisma migrations
pnpm db:studio              # Prisma Studio (Doppler dev DB)
pnpm inspect-chunks -- --contentId <id> [--query "…"]  # List chunks / test RAG search (query uses OpenAI)
pnpm create-tenant-owner -- --email … --password … --orgName …  # Bootstrap tenant owner + org + plan
pnpm docker:up              # Full stack in Docker (Doppler-injected)
pnpm docker:down            # Stop Docker stack
```

## Bootstrap accounts

User roles: **individual learner** (self-study), **tenant owner** (school/tutor org admin), **tenant learner** (student under an org), **platform admin** (operator panel). Secrets and DB access go through Doppler — use config `dev` locally and `prd` on the VPS.

### Platform admin

Not self-registered. Creates an `ADMIN` user for [`apps/admin`](apps/admin) (local `:3001`, production `admin.talim-ai.uz`).

```bash
# Local (Doppler dev)
doppler run -- pnpm --filter @talim/api create-admin -- \
  --email you@example.com --password 'your-secure-password' --name 'Operator'

# Production — on the VPS with Doppler prd (see docs/DEPLOY.md)
doppler run --project talim-ai --config prd -- pnpm --filter @talim/api create-admin -- \
  --email you@example.com --password 'your-secure-password' --name 'Operator'
```

From the admin panel you can change user roles, assign tenant subscriptions, and reset passwords.

### Tenant owner (organization)

Owns an org: uploads materials, assigns content, manages students. Lands on `/tenant/dashboard` after login.

**CLI (recommended for dev/staging)** — creates owner + organization + active tenant plan (`TENANT_STARTER` by default):

```bash
pnpm create-tenant-owner -- \
  --email owner@school.uz \
  --password 'your-secure-password' \
  --orgName 'My School' \
  --name 'School Admin' \
  --planCode TENANT_STARTER
```

On production, run the same command on the VPS with `--config prd` (as for `create-admin` above). Re-running updates password/role and ensures the org subscription is active.

**Admin provisioning** — tenant owner accounts are created by platform admins (CLI above or admin panel). Public self-serve signup at `/register-tenant` is disabled; the login page directs new tutors to contact the admin.

### Tenant learners (students)

Created by the **tenant owner** in the web app: **Students → Add student**. The UI shows a one-time temporary password to share with the learner. Students log in at the normal login page and land on `/learner/dashboard` with assigned materials only.

Platform admins can also set a user’s role to `TENANT_LEARNER` and attach them to a tenant from the admin user detail page.

## Docker (full stack)

Use Doppler so Compose receives `JWT_SECRET`, API keys, and other secrets:

```bash
pnpm docker:up
```

Plain `docker compose up` without Doppler will not inject secrets correctly. See comments in [`docker-compose.yml`](docker-compose.yml).

Services: `db`, `redis`, `api`, `web`, `nginx`.

## Deployment

Production deploys to a VPS via GitHub Actions on every push to `main`.

- **Secrets:** Doppler config `prd`
- **Compose:** `docker-compose.yml` + `docker-compose.prod.yml`
- **Details:** [`docs/DEPLOY.md`](docs/DEPLOY.md)

Post-deploy smoke check:

```bash
curl -s https://talim-ai.uz/api/health
```

## QA

Browser smoke tests use Playwright MCP in Cursor. See [`docs/QA.md`](docs/QA.md).

After QA, delete ephemeral screenshots and `.playwright-mcp/` artifacts before committing (see [`.cursor/rules/mcp-qa.mdc`](.cursor/rules/mcp-qa.mdc)).

## API overview

| Area | Routes |
|------|--------|
| Auth | `/api/auth/*` |
| Content | `/api/content/*` (upload, YouTube, sections, delete) |
| Chat | `/api/chat/*` |
| Quiz | `/api/quiz/*` |
| Summary | `/api/summary/*` |
| Health | `/api/health` |

Background jobs (Bull + Redis) handle ingestion, section generation, podcast creation, and quiz generation.

## Environment variables

| Variable | Scope | Notes |
|----------|-------|-------|
| `DATABASE_URL` | API | `localhost` for `pnpm dev`; `db` hostname in Docker |
| `REDIS_URL` | API | Same pattern as database |
| `JWT_SECRET` | API | Min 32 characters |
| `DEEPSEEK_API_KEY` | API | AI provider |
| `OPENAI_API_KEY` | API | Tutor chat + embeddings |
| `TUTOR_MODEL` | API | Default `gpt-4o` |
| `NEXT_PUBLIC_API_URL` | Browser | e.g. `http://localhost:4000` locally |
| `CORS_ORIGIN` | API | Must match web origin |

Full list: [`env.template`](env.template).

## License

Private — all rights reserved.
