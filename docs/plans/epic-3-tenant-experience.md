# Epic 3 — Tenant (organization) experience

**Roadmap:** [../PLANS.md](../PLANS.md#epic-3--tenant-organization-experience)  
**Depends on:** [Epic 1 — Subscriptions](./epic-1-subscriptions-billing.md) (tenant must be paid), [Epic 5](./epic-5-usage-metering.md) optional  
**Blocks:** [Epic 6 — Tenant assistant](./epic-6-tenant-assistant.md)

---

## Cursor prompt

Paste `@docs/plans/epic-3-tenant-experience.md` into chat, or copy the block below. Rules auto-apply.

---

```
Implement tenant (organization) and learner roles for talim-ai.

Context: Current app is individual-only — User owns Content directly (apps/api/src/prisma/schema.prisma). Background jobs: ingestion, sections, podcast, quiz. Progress models: ContentProgress, SectionProgress, LearningActivityDay, QuizAttempt, PodcastEpisodeProgress. Project rules in .cursor/rules/ apply automatically.

Product rules (from docs/PLANS.md):
- Tenant = paid tutor/school/business with many students.
- Tenant uploads materials and runs ALL generation (podcast, quiz, slideshow, summaries). Students ONLY consume assigned content.
- Tenant sees each student's learning track (daily activity, progress, quiz scores).
- AI tutor for students = scoped to assigned content (existing /content/[id]/chat). Separate tenant assistant is Epic 6.

Backend:

1. Prisma models:
   - Tenant: id, name, slug, ownerId, stripeCustomerId?, createdAt
   - TenantMembership: tenantId, userId, role (OWNER | LEARNER), active, joinedAt
   - Content.tenantId optional — when set, content belongs to org; userId = creator
   - ContentAssignment: contentId, learnerId, assignedById, assignedAt
   - User.role: INDIVIDUAL | TENANT_OWNER | TENANT_LEARNER | ADMIN

2. Auth & registration:
   - POST /api/auth/register-tenant { orgName, email, password, name } → User (TENANT_OWNER) + Tenant + redirect to Stripe checkout (Epic 1)
   - POST /api/auth/upgrade-to-tenant { orgName } for existing INDIVIDUAL users
   - JWT payload includes role + tenantId when applicable

3. Tenant APIs (/api/tenant/*, requireTenantOwner):
   - GET/PATCH /tenant — org settings
   - CRUD /tenant/students — create learner accounts (email, name, temp password or invite token), deactivate
   - Reuse content pipeline under /api/tenant/content — scoped to tenantId; same upload/generate as today
   - POST/DELETE /tenant/assignments — assign/unassign content to learner
   - GET /tenant/students/:id/progress — aggregate ContentProgress, SectionProgress, QuizAttempt, LearningActivityDay, PodcastEpisodeProgress

4. Learner access (TENANT_LEARNER):
   - All GET /api/content* filtered to assigned contentIds only
   - Block POST upload, podcast generate, quiz generate, slideshow generate, section regen
   - Allow: read sections, summaries, podcasts, take quizzes, tutor chat on assigned content, progress updates

5. Middleware: requireTenantOwner, requireTenantMember, scopeContentAccess

Frontend:

1. Role-based redirect after login:
   - INDIVIDUAL → existing /dashboard
   - TENANT_OWNER → /tenant/dashboard
   - TENANT_LEARNER → /learner/dashboard

2. Tenant layout app/[locale]/(tenant)/:
   - Nav: Materials | Students | Progress | Billing | Settings
   - Materials: reuse upload + content list from individual dashboard
   - Students: table (name, email, # assigned, last active, avg quiz); create student modal
   - Student detail /tenant/students/[id]: activity calendar, per-content progress
   - Content detail: "Assign to students" multi-select

3. Learner layout app/[locale]/(learner)/:
   - Dashboard: assigned materials only, no upload/generate buttons
   - Reuse content/[id] read/quiz/podcast/chat views

4. Gate tenant actions on active subscription (Epic 1 enforceQuota): no students/uploads if unpaid.

Constraints:
- Do NOT change INDIVIDUAL user experience.
- Bulk CSV invite = out of scope (note as follow-up).
- i18n: uz/en/ru for new strings.
```
