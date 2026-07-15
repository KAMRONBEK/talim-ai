---
type: community
cohesion: 0.07
members: 32
---

# Admin Panel Architecture

**Cohesion:** 0.07 - loosely connected
**Members:** 32 nodes

## Members
- [[API bootstrap() (helmetCORSjobslisten)]] - concept - apps/api/CLAUDE.md
- [[API middleware (authtenantquotarate-limituploaderror)]] - concept - apps/api/CLAUDE.md
- [[API route map (authcontentchatquizsummaryadminusagebillingtenantlearner)]] - concept - README.md
- [[Admin AuthGuard (ADMIN-only gating)]] - concept - apps/admin/CLAUDE.md
- [[Admin data layer (libapi.ts Axios + hooksuseAdmin.ts + TanStack Query)]] - concept - apps/admin/CLAUDE.md
- [[Admin has no i18n (locale-prefix stripping)]] - rationale - apps/admin/CLAUDE.md
- [[Admin routes (dashboardtutor-requestsuserstenantscontentgeneratedsubscriptionsusageaudit)]] - concept - apps/admin/CLAUDE.md
- [[B2B tutororganization features]] - concept - README.md
- [[B2C learnercontent features]] - concept - README.md
- [[Bootstrap accounts (create-admin  create-tenant-owner)]] - concept - README.md
- [[Bull background jobs (processContentgenerateQuizgeneratePodcastrenderManim)]] - concept - README.md
- [[Environment variables (DATABASE_URLJWT_SECRETOPENAIDEEPSEEK...)]] - concept - README.md
- [[Prisma schema (Postgres + pgvector models)]] - concept - apps/api/CLAUDE.md
- [[Role-based post-login routing (getPostLoginPath  RoleGuard)]] - concept - apps/web/CLAUDE.md
- [[Single API process is also the Bull worker]] - rationale - apps/api/CLAUDE.md
- [[Talim AI README]] - document - README.md
- [[Talim Tech Stack (Next.jsExpressPrismaBullPostgres+pgvector)]] - concept - README.md
- [[TenantMembership.active = live student access switch]] - rationale - apps/api/CLAUDE.md
- [[Web auth state (Zustand persist talim-auth)]] - concept - apps/web/CLAUDE.md
- [[Web data fetching (libapi.ts axios + react-query hooks)]] - concept - apps/web/CLAUDE.md
- [[Web i18n model (next-intl, locale segment, uzenru)]] - concept - apps/web/CLAUDE.md
- [[Web routing map (authlearnertenantB2C route groups)]] - concept - apps/web/CLAUDE.md
- [[adminPasswordNote plaintext support-lookup (sensitive)]] - rationale - apps/admin/CLAUDE.md
- [[appsadmin Guide (CLAUDE.md)]] - document - apps/admin/CLAUDE.md
- [[appsadmin — platform-admin panel (Talim Admin, port 3001)]] - concept - apps/admin/CLAUDE.md
- [[appsapi Guide (CLAUDE.md)]] - document - apps/api/CLAUDE.md
- [[appsapi — Express+Prisma+Bull backend (port 4000)]] - concept - apps/api/CLAUDE.md
- [[appsweb Guide (CLAUDE.md)]] - document - apps/web/CLAUDE.md
- [[appsweb — learner+tenant Next.js app (port 3000)]] - concept - apps/web/CLAUDE.md
- [[contentAccess.service.ts (isolation guard)]] - concept - apps/api/CLAUDE.md
- [[game-quiz-player.tsx (GAME-mode runner)]] - concept - apps/web/CLAUDE.md
- [[pgvector RAG raw-query embeddings (rag.service.ts)]] - concept - apps/api/CLAUDE.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Admin_Panel_Architecture
SORT file.name ASC
```
