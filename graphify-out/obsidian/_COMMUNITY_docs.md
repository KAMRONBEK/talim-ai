---
type: community
cohesion: 0.18
members: 12
---

# docs

**Cohesion:** 0.18 - loosely connected
**Members:** 12 nodes

## Members
- [[Hard upload cap UPLOAD_MAX_MB = 120]] - concept - docs/FEATURES.md
- [[Manual Payment Model]] - rationale - docs/PLATFORM.md
- [[Platform stats]] - concept - docs/FEATURES.md
- [[Pricing config (libpricing.ts + pricing page)]] - concept - docs/FEATURES.md
- [[Quota error contract (402 QUOTA_EXCEEDED  413 PLAN_FILE_LIMIT  413 FILE_TOO_LARGE)]] - rationale - docs/FEATURES.md
- [[Role-aware upgradePlanCode]] - rationale - docs/FEATURES.md
- [[Single global upgrade modal (useUpgradeModal  GlobalUpgradeModal)]] - concept - docs/FEATURES.md
- [[Subscriptions  plans (manual activation)]] - concept - docs/FEATURES.md
- [[Usage & cost metering (admin)]] - concept - docs/FEATURES.md
- [[Usage metering]] - concept - docs/FEATURES.md
- [[Usage-limit UX & subscription promotion modal]] - concept - docs/FEATURES.md
- [[classifyLimitError  useLimitErrorHandler decision logic]] - concept - docs/FEATURES.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/docs
SORT file.name ASC
```

## Connections to other communities
- 1 edge to [[_COMMUNITY_docs · Become-a-tutor request flow]]
- 1 edge to [[_COMMUNITY_plans · Internationalization (uz  en  ru)]]
- 1 edge to [[_COMMUNITY_docs · User Types Model]]

## Top bridge nodes
- [[Subscriptions  plans (manual activation)]] - degree 5, connects to 2 communities
- [[Manual Payment Model]] - degree 2, connects to 1 community