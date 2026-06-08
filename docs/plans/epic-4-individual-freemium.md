# Epic 4 — Individual learner freemium UX

**Roadmap:** [../PLANS.md](../PLANS.md#epic-4--individual-learner-current-product)  
**Depends on:** [Epic 1 — Subscriptions & billing](./epic-1-subscriptions-billing.md)  
**Blocks:** nothing

---

## Cursor prompt

Paste `@docs/plans/epic-4-individual-freemium.md` into chat, or copy the block below. Rules auto-apply.

---

```
Add freemium UX for individual learners on talim-ai.

Context: Individual learner flow already works (dashboard, upload, podcast, quiz, tutor). Epic 1 must be done first — Plan, Subscription, UsageCounter, enforceQuota middleware, GET /api/billing/me, Stripe checkout. Project rules in .cursor/rules/ apply automatically.

Product rules (from docs/PLANS.md):
- FREE tier: limited uploads, generations/month, tutor messages (individuals only).
- INDIVIDUAL_PRO: higher/unlimited limits via paid subscription.
- Tenants use a different UI — do not touch tenant/learner routes.

Goals:

1. Dashboard (INDIVIDUAL users only):
   - Plan badge (Free / Pro) in header or sidebar
   - Usage meters: uploads remaining, AI generations this month, tutor messages remaining
   - Fetch from GET /api/billing/me (or /api/usage/me)

2. Quota exceeded UX:
   - When API returns 402 QUOTA_EXCEEDED, show UpgradeModal with feature-specific copy
   - CTA → POST /api/billing/checkout for INDIVIDUAL_PRO
   - Disable upload + generate buttons when client knows quota is 0 (optimistic; server is source of truth)

3. Settings → Billing section (new or extend settings):
   - Current plan + renewal date
   - "Upgrade to Pro" / "Manage subscription" (Stripe portal via POST /api/billing/portal)
   - Usage history table: last 3 months by feature (from billing/usage API)

4. i18n: add strings to apps/web/messages/uz.json, en.json, ru.json

5. Visual: match existing dashboard Tailwind style; reuse packages/ui Button, Card, Progress if available.

Out of scope:
- Changing backend billing logic (Epic 1 owns that)
- Tenant or learner dashboards
- New payment providers

Verify: Playwright smoke or manual test — free user hits limit, sees modal, can start checkout (test mode).
```
