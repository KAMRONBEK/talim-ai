---
type: community
cohesion: 0.20
members: 10
---

# Admin Panel Stories

**Cohesion:** 0.20 - loosely connected
**Members:** 10 nodes

## Members
- [[Area Admin panel + billingseats + subscriptions]] - document - docs/qa/user-stories-expansion.md
- [[US-ADMIN-01 Approve a tutor request → org + ACTIVE subscription + seat limit]] - document - docs/qa/user-stories-expansion.md
- [[US-ADMIN-03 Admin user management (create  role change  reset-pw  delete  patch subscription)]] - document - docs/qa/user-stories-expansion.md
- [[US-ADMIN-04 Tenant management — seat limit, plan, status, period; members + usage]] - document - docs/qa/user-stories-expansion.md
- [[US-ADMIN-05 Content & generated-media moderation (browse  delete  retry stuck job)]] - document - docs/qa/user-stories-expansion.md
- [[US-ADMIN-06 Usage & cost metering (per-user spend, platform stats)]] - document - docs/qa/user-stories-expansion.md
- [[US-ADMIN-07 Audit log — immutable, filterable, every admin action recorded]] - document - docs/qa/user-stories-expansion.md
- [[US-ADMIN-08 Admin authentication, role gate & rate limiting]] - document - docs/qa/user-stories-expansion.md
- [[US-ADMIN-09 Subscription status transitions & their access effects (cross-cutting)]] - document - docs/qa/user-stories-expansion.md
- [[US-OWNER-11 Billing & seat display + inactive-subscription banner + request-upgrade]] - document - docs/qa/user-stories-expansion.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Admin_Panel_Stories
SORT file.name ASC
```

## Connections to other communities
- 1 edge to [[_COMMUNITY_Cross-Cutting Quality]]

## Top bridge nodes
- [[Area Admin panel + billingseats + subscriptions]] - degree 10, connects to 1 community