---
type: community
cohesion: 0.24
members: 13
---

# Architecture Notes for Epics

**Cohesion:** 0.24 - loosely connected
**Members:** 13 nodes

## Members
- [[Admin Cost Dashboard]] - concept - docs/plans/epic-2-admin-panel.md
- [[ApiUsageEvent Model & recordUsage]] - concept - docs/plans/epic-5-usage-metering.md
- [[Content Assignment & Learner Scoping]] - concept - docs/plans/epic-3-tenant-experience.md
- [[Epic 1 — Subscriptions & Billing_2]] - document - docs/plans/epic-1-subscriptions-billing.md
- [[Epic 2 — Platform Admin Panel_2]] - document - docs/plans/epic-2-admin-panel.md
- [[Epic 3 — Tenant (Organization) Experience_2]] - document - docs/plans/epic-3-tenant-experience.md
- [[Epic 4 — Individual Learner Freemium UX_1]] - document - docs/plans/epic-4-individual-freemium.md
- [[Epic 5 — Usage Metering & Platform Cost_2]] - document - docs/plans/epic-5-usage-metering.md
- [[Epic 6 — Tenant AI Assistant]] - document - docs/plans/epic-6-tenant-assistant.md
- [[Epic Prompts Index]] - document - docs/plans/README.md
- [[Quota Enforcement Middleware (enforceQuota)]] - concept - docs/plans/epic-1-subscriptions-billing.md
- [[Quota-exceeded UpgradeModal UX]] - concept - docs/plans/epic-4-individual-freemium.md
- [[Stripe Integration]] - concept - docs/plans/epic-1-subscriptions-billing.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Architecture_Notes_for_Epics
SORT file.name ASC
```
