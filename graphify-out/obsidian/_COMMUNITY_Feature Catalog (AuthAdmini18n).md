---
type: community
cohesion: 0.15
members: 15
---

# Feature Catalog (Auth/Admin/i18n)

**Cohesion:** 0.15 - loosely connected
**Members:** 15 nodes

## Members
- [[Accounts & Auth]] - concept - docs/FEATURES.md
- [[Admin Audit Log]] - concept - docs/FEATURES.md
- [[Admin Panel Features]] - concept - docs/FEATURES.md
- [[Become-a-tutor Request Flow]] - concept - docs/FEATURES.md
- [[End-to-end Journeys]] - concept - docs/PLATFORM.md
- [[Feature Catalog]] - document - docs/FEATURES.md
- [[Internationalization (uzenru)]] - concept - docs/FEATURES.md
- [[JWT Sessions]] - concept - docs/FEATURES.md
- [[Manual Payment Model]] - rationale - docs/PLATFORM.md
- [[Rate Limiting]] - concept - docs/FEATURES.md
- [[Security Headers & CORS]] - concept - docs/FEATURES.md
- [[Signup  Login by email OR username]] - concept - docs/FEATURES.md
- [[Subscriptions  Plans (manual activation)]] - concept - docs/FEATURES.md
- [[Usage Metering]] - concept - docs/FEATURES.md
- [[mustChangePassword & Password Reset]] - concept - docs/FEATURES.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Feature_Catalog_Auth/Admin/i18n
SORT file.name ASC
```

## Connections to other communities
- 3 edges to [[_COMMUNITY_Platform Job & Content Pipeline Concepts]]
- 2 edges to [[_COMMUNITY_Isolation Guard & Visual Direction]]
- 1 edge to [[_COMMUNITY_Assessments & Game Quiz Concepts]]
- 1 edge to [[_COMMUNITY_B2C AI Learning Loop]]
- 1 edge to [[_COMMUNITY_Tenant Owner Capabilities]]
- 1 edge to [[_COMMUNITY_Deployment Infrastructure]]

## Top bridge nodes
- [[Feature Catalog]] - degree 11, connects to 5 communities
- [[Accounts & Auth]] - degree 6, connects to 1 community
- [[Subscriptions  Plans (manual activation)]] - degree 5, connects to 1 community
- [[End-to-end Journeys]] - degree 2, connects to 1 community
- [[Manual Payment Model]] - degree 2, connects to 1 community