# Epic 6 — Tenant AI assistant (tutor helper)

**Roadmap:** [../PLANS.md](../PLANS.md#epic-6--tenant-ai-assistant-tutor-helper)  
**Depends on:** [Epic 3 — Tenant experience](./epic-3-tenant-experience.md), [Epic 5 — Usage metering](./epic-5-usage-metering.md), [Epic 1 — Billing](./epic-1-subscriptions-billing.md) (quota)  
**Blocks:** nothing

---

## Cursor prompt

Paste `@docs/plans/epic-6-tenant-assistant.md` into chat, or copy the block below. Rules auto-apply.

---

```
Add tenant-only AI assistant for talim-ai tutors.

Context: Per-content tutor chat exists at POST /api/chat/* and apps/web ChatWindow component. Tenant roles from Epic 3 (TENANT_OWNER). Usage metering from Epic 5 (UsageFeature.TENANT_ASSISTANT). Project rules in .cursor/rules/ apply automatically.

Product rules (from docs/PLANS.md):
- AI assistant helps the TENANT prepare materials — NOT the student's primary teacher.
- Suggest quiz questions, summarize uploads, explain how to assign content, draft section outlines.
- Students keep existing per-content tutor at /content/[id]/chat unchanged.
- Usage counts against tenant subscription quota (Epic 1 enforceQuota).

Backend:

1. Prisma:
   - TenantAssistantSession: id, tenantId, userId (owner), optional contentId, locale, createdAt
   - TenantAssistantMessage: id, sessionId, role MessageRole, text, createdAt
   - Or reuse ChatSession with scope enum if cleaner — prefer minimal new tables

2. POST /api/tenant/assistant/chat:
   - Body: { message, sessionId?, contentId?, locale? }
   - requireTenantOwner middleware
   - System prompt (apps/api/src/lib/tenant-assistant-prompt.ts):
     - You assist tutors/orgs preparing learning materials
     - Do not roleplay as the student's teacher
     - When contentId provided, use RAG chunks from that content as context
   - Stream response like existing tutor chat
   - recordUsage feature TENANT_ASSISTANT

3. GET /api/tenant/assistant/sessions — list recent sessions for tenant owner
   - GET /api/tenant/assistant/sessions/:id/messages — history

Frontend:

1. Page app/[locale]/(tenant)/tenant/assistant/page.tsx
   - Reuse ChatWindow from apps/web/components/chat/
   - Optional sidebar: pick content to attach as context
   - Nav link under tenant layout: "AI Assistant"

2. i18n strings uz/en/ru — label as assistant for tutors, distinct from student "AI Tutor"

3. enforceQuota on send — show upgrade modal if tenant quota exceeded

Out of scope:
- Student-facing changes
- Multi-user tenant staff roles (future)

Verify: TENANT_OWNER can chat; TENANT_LEARNER gets 403; INDIVIDUAL user has no access to /tenant/assistant.
```
