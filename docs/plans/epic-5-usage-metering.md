# Epic 5 — Usage metering & platform cost

**Roadmap:** [../PLANS.md](../PLANS.md#epic-5--usage-metering--platform-cost)  
**Depends on:** nothing (build first)  
**Blocks:** Epic 1 (quotas), Epic 2 (admin cost dashboard)

---

## Cursor prompt

Paste `@docs/plans/epic-5-usage-metering.md` into chat, or copy the block below. Rules auto-apply.

---

```
Add API usage metering across the talim-ai generation pipeline.

Context: Monorepo apps/api. AI calls go through apps/api/src/services/ai.service.ts. Bull jobs: generateQuiz, generatePodcast, generate sections (section.service), summary.controller, pdf.service, chat.controller (tutor). Project rules in .cursor/rules/ apply automatically.

Product rules (from docs/PLANS.md):
- Record every paid API call for admin cost visibility and subscription quota enforcement.
- Per user and per tenant (when tenantId exists on request context).

Backend:

1. Prisma:
   - enum UsageFeature: EMBED, TUTOR_CHAT, QUIZ_GEN, PODCAST_GEN, SECTION_GEN, SUMMARY_GEN, SLIDESHOW_GEN, TRANSCRIBE, PDF_PARSE, TENANT_ASSISTANT
   - model ApiUsageEvent:
     id, userId, tenantId?, feature UsageFeature, model String,
     inputTokens Int, outputTokens Int, estimatedCostUsd Decimal,
     metadata Json? (contentId, jobId),
     createdAt DateTime
   - Indexes: [userId, createdAt], [tenantId, createdAt], [feature, createdAt]

2. apps/api/src/services/usage.service.ts:
   - recordUsage({ userId, tenantId?, feature, model, inputTokens, outputTokens, metadata? })
   - estimateCost(model, inputTokens, outputTokens) — pricing map in config/usage-pricing.ts (per 1M tokens, easy to update)
   - getUsageForPeriod({ userId?, tenantId?, from, to }) → totals by feature
   - Fire-and-forget insert; catch+log errors, never fail parent job

3. Instrument call sites:
   - ai.service.ts — after each completion (capture usage from provider response)
   - generateQuiz.job.ts, generatePodcast.job.ts, section.service.ts, summary.controller.ts, pdf.service.ts, chat.controller.ts
   - Pass tenantId from req.user context when available (nullable until Epic 3)

4. API routes:
   - GET /api/usage/me — month-to-date totals for authenticated user (and tenant if TENANT_OWNER)
   - GET /api/admin/usage/summary — stub or full aggregate if ADMIN role exists (Epic 2 expands this)

5. Optional: nightly Bull job rollupUsageDaily for faster admin queries (only if needed).

Shared types: export UsageFeature + usage summary types from packages/types.

Constraints:
- Minimal performance impact (async insert).
- No secrets in ApiUsageEvent metadata.
- Add migration; run pnpm db:generate.
- Do not implement billing/subscription logic here — Epic 1 consumes this data.
```
