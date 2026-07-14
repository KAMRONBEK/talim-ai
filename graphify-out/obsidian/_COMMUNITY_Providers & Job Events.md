---
type: community
cohesion: 0.22
members: 14
---

# Providers & Job Events

**Cohesion:** 0.22 - loosely connected
**Members:** 14 nodes

## Members
- [[GlobalUpgradeModal()]] - code - apps/web/components/account/global-upgrade-modal.tsx
- [[JobStream()]] - code - apps/web/components/providers.tsx
- [[LocaleSync()]] - code - apps/web/components/locale-sync.tsx
- [[Providers()_1]] - code - apps/web/components/providers.tsx
- [[UpgradeModalState]] - code - apps/web/store/useUpgradeModal.ts
- [[applyEvent()]] - code - apps/web/hooks/useJobEvents.ts
- [[global-upgrade-modal.tsx]] - code - apps/web/components/account/global-upgrade-modal.tsx
- [[locale-sync.tsx]] - code - apps/web/components/locale-sync.tsx
- [[providers.tsx_1]] - code - apps/web/components/providers.tsx
- [[useJobEvents()]] - code - apps/web/hooks/useJobEvents.ts
- [[useJobEvents.ts]] - code - apps/web/hooks/useJobEvents.ts
- [[useLocaleSync()]] - code - apps/web/hooks/useLocaleContent.ts
- [[useUpgradeModal]] - code - apps/web/store/useUpgradeModal.ts
- [[useUpgradeModal.ts]] - code - apps/web/store/useUpgradeModal.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Providers__Job_Events
SORT file.name ASC
```

## Connections to other communities
- 3 edges to [[_COMMUNITY_Tenant Pages & Billing UI]]
- 3 edges to [[_COMMUNITY_Material Media Panel]]
- 3 edges to [[_COMMUNITY_Content Hooks & Status]]
- 3 edges to [[_COMMUNITY_Content Stage & Limits]]
- 2 edges to [[_COMMUNITY_Pricing & Upgrade Flow]]
- 2 edges to [[_COMMUNITY_Auth Stores & Session]]
- 2 edges to [[_COMMUNITY_Web API Client & Job Stream]]
- 1 edge to [[_COMMUNITY_Shared Types & Locale]]
- 1 edge to [[_COMMUNITY_SSE Job Events Bus]]

## Top bridge nodes
- [[useJobEvents.ts]] - degree 9, connects to 4 communities
- [[useUpgradeModal]] - degree 7, connects to 2 communities
- [[useUpgradeModal.ts]] - degree 5, connects to 2 communities
- [[providers.tsx_1]] - degree 10, connects to 1 community
- [[global-upgrade-modal.tsx]] - degree 6, connects to 1 community