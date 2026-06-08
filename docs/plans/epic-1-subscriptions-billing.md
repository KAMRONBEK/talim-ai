# Epic 1 — Subscriptions & billing

**Roadmap:** [../PLANS.md](../PLANS.md#epic-1--subscriptions--billing)  
**Depends on:** [Epic 5 — Usage metering](./epic-5-usage-metering.md) (recommended first)  
**Blocks:** Epic 3 (tenant gates), Epic 4 (freemium UX)

---

## Cursor prompt

Paste `@docs/plans/epic-1-subscriptions-billing.md` into chat, or copy the block below. Rules auto-apply.

---

```
Implement subscription billing for talim-ai.

Context: monorepo apps/web, apps/api, packages/types. Project rules in .cursor/rules/ apply automatically. Secrets in Doppler only — add vars to env.template, never commit .env.

Product rules (from docs/PLANS.md):
- Monthly subscription model.
- Individual learners: FREE freemium tier + optional INDIVIDUAL_PRO paid tier.
- Tenants (schools/tutors/orgs): MUST have active paid subscription — no free tenant tier.
- Tenant price scales with number of active students and uploaded materials (plan tiers + optional overage).

Goals:

1. Prisma models:
   - Plan (code, name, kind: INDIVIDUAL | TENANT, limits JSON: maxUploads, maxGenerationsPerMonth, maxStudents, maxContentItems, maxTutorMessages)
   - Subscription (userId OR tenantId, planId, status, stripeSubscriptionId, currentPeriodStart/End)
   - SubscriptionStatus enum: ACTIVE, PAST_DUE, CANCELED, TRIALING
   - UsageCounter (userId OR tenantId, month YYYY-MM, feature, count) — or integrate with ApiUsageEvent from Epic 5
   - StripeCustomerId on User and Tenant

2. UserRole enum on User: INDIVIDUAL, TENANT_OWNER, TENANT_LEARNER, ADMIN. New registrations default INDIVIDUAL + FREE plan.

3. Stripe integration:
   - Checkout sessions for INDIVIDUAL_PRO and tenant plans (TENANT_STARTER, TENANT_GROWTH — seed sensible defaults)
   - Webhook handler: subscription.created/updated/deleted → sync Subscription status
   - Customer portal link for manage/cancel

4. Quota enforcement middleware enforceQuota(feature, req):
   - Call before: content upload, podcast/quiz/slideshow/summary generation, tutor chat message, adding tenant student
   - Return 402 with code QUOTA_EXCEEDED and upgrade hint
   - Tenant: block student invite and upload when over seat/content limits unless plan upgraded

5. API routes /api/billing/*:
   - GET /me — current plan, usage vs limits, renewal date
   - POST /checkout — create Stripe session (plan code)
   - POST /portal — Stripe customer portal
   - GET /tenant/:tenantId — tenant billing summary (TENANT_OWNER only)

6. Web (apps/web):
   - Settings → Billing page: plan badge, usage meters, upgrade button, portal link
   - Shared UpgradeModal component when API returns QUOTA_EXCEEDED

7. Migration: existing users → FREE plan with grandfather limits (e.g. 10 uploads, generous generation cap) so nothing breaks.

Constraints:
- Do not break existing individual learner dashboard flow.
- Enforce limits server-side, not UI-only.
- Minimal tests for enforceQuota middleware.
- Document new env vars in env.template only: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_INDIVIDUAL_PRO, STRIPE_PRICE_TENANT_*.
```
