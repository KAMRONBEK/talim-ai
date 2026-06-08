# Epic 2 — Platform admin panel

**Roadmap:** [../PLANS.md](../PLANS.md#epic-2--platform-admin-panel)  
**Depends on:** [Epic 5 — Usage metering](./epic-5-usage-metering.md) (cost dashboard); Epic 1 optional for subscription admin  
**Blocks:** nothing critical

---

## Cursor prompt

Paste `@docs/plans/epic-2-admin-panel.md` into chat, or copy the block below. Rules auto-apply.

---

```
Build the platform admin panel for talim-ai.

Context: Express API + Next.js 15 web monorepo. JWT auth exists in apps/api/src/middleware/auth.middleware.ts. Project rules in .cursor/rules/ apply automatically.

Product rules (from docs/PLANS.md):
- Platform admin (you) manages ALL users: individuals and tenants.
- Full CRUD on users, tenants, uploads, generated assets (podcasts, quizzes, slideshows/ContentVideo, summaries).
- See API cost per user/tenant (tokens, model, estimated USD).
- Statistics dashboard: signups, activity, generations, revenue, top tenants by usage.

Backend:

1. Ensure UserRole ADMIN exists. Add requireRole('ADMIN') middleware.

2. Prisma (if not from Epic 5):
   - ApiUsageEvent: userId, tenantId?, feature, model, inputTokens, outputTokens, estimatedCostUsd, createdAt
   - AdminAuditLog: adminUserId, action, targetType, targetId, metadata JSON, createdAt

3. Admin routes under /api/admin/* (all require ADMIN):
   - GET/POST/PATCH/DELETE /users — list with pagination, search email/name, filter role/plan
   - GET/PATCH/DELETE /users/:id — detail; PATCH can change role, name; POST /users/:id/reset-password
   - GET/PATCH /tenants, /tenants/:id — org, owner, members, subscription, suspend flag
   - GET/DELETE /contents — any user's or tenant's uploads; POST /contents/:id/retry-job for FAILED status
   - GET/DELETE /generated — podcasts, quizzes, content-videos, summaries (metadata + storage paths)
   - GET /subscriptions — all active/past_due with Stripe ids
   - GET /usage/summary — aggregate ApiUsageEvent by user/tenant/day, last 7/30/90 days
   - GET /stats/platform — signups over time, active users, content count, generation counts, estimated API spend, subscription counts

4. Never return passwordHash in responses. Rate-limit admin routes.

Frontend:

1. Separate Next.js app `apps/admin` on `admin.talim-ai.uz` (login only, no register) with layout + sidebar nav:
   Users | Tenants | Content | Generated media | Subscriptions | Usage & costs | Statistics

2. Reuse TanStack Query + packages/ui table/card patterns from existing dashboard.

3. Pages:
   - /admin — statistics overview (cards + charts)
   - /admin/users — searchable table; /admin/users/[id] — profile, subscription, 30-day usage chart, contents list
   - /admin/tenants — table; detail with members + billing
   - /admin/content — all uploads with owner, status, delete
   - /admin/generated — tabs: Podcasts | Quizzes | Slideshows | Summaries
   - /admin/usage — cost breakdown by user/tenant, sortable by spend

4. Redirect non-ADMIN users to dashboard with 403.

Security:
- ADMIN role only; audit log on destructive actions (delete user, delete content).
- i18n: admin UI can be English-only initially if faster; note in PR if so.
```
