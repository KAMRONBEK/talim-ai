---
type: community
cohesion: 0.06
members: 52
---

# Providers & Job Events

**Cohesion:** 0.06 - loosely connected
**Members:** 52 nodes

## Members
- [[.constructor()_3]] - code - apps/api/src/services/events/jobEvents.service.ts
- [[.loop()]] - code - apps/web/lib/jobStream.ts
- [[.onConnected()]] - code - apps/web/lib/jobStream.ts
- [[.publish()]] - code - apps/api/src/services/events/jobEvents.service.ts
- [[.replay()]] - code - apps/api/src/services/events/jobEvents.service.ts
- [[.setConnected()]] - code - apps/web/lib/jobStream.ts
- [[.start()]] - code - apps/web/lib/jobStream.ts
- [[.stop()]] - code - apps/web/lib/jobStream.ts
- [[.subscribe()]] - code - apps/api/src/services/events/jobEvents.service.ts
- [[.subscribe()_1]] - code - apps/web/lib/jobStream.ts
- [[BillingPeriod]] - code - apps/web/lib/pricing.ts
- [[FeatureSpec]] - code - apps/web/lib/pricing.ts
- [[GlobalUpgradeModal()]] - code - apps/web/components/account/global-upgrade-modal.tsx
- [[InProcessJobEventBus]] - code - apps/api/src/services/events/jobEvents.service.ts
- [[JobEvent]] - code - packages/types/jobEvents.ts
- [[JobEventBus]] - code - apps/api/src/services/events/jobEvents.service.ts
- [[JobEventStatus]] - code - packages/types/jobEvents.ts
- [[JobStream]] - code - apps/web/lib/jobStream.ts
- [[JobStream()]] - code - apps/web/components/providers.tsx
- [[Listener]] - code - apps/web/lib/jobStream.ts
- [[LocaleSync()]] - code - apps/web/components/locale-sync.tsx
- [[ManualTier]] - code - apps/web/lib/pricing.ts
- [[PRICING_PLANS]] - code - apps/web/lib/pricing.ts
- [[PlanAudience]] - code - apps/web/lib/pricing.ts
- [[PlanLimitsView]] - code - apps/web/lib/pricing.ts
- [[Providers()_1]] - code - apps/web/components/providers.tsx
- [[SeqJobEvent]] - code - packages/types/jobEvents.ts
- [[SessionSync()]] - code - apps/web/components/session-sync.tsx
- [[UpgradeDialog()]] - code - apps/web/components/account/upgrade-dialog.tsx
- [[UpgradeModalState]] - code - apps/web/store/useUpgradeModal.ts
- [[UserState]] - code - apps/api/src/services/events/jobEvents.service.ts
- [[applyEvent()]] - code - apps/web/hooks/useJobEvents.ts
- [[effectiveMonthlyUzs()]] - code - apps/web/lib/pricing.ts
- [[formatUzs()]] - code - apps/web/lib/pricing.ts
- [[getPlan()]] - code - apps/web/lib/pricing.ts
- [[global-upgrade-modal.tsx]] - code - apps/web/components/account/global-upgrade-modal.tsx
- [[jobEvents.service.ts]] - code - apps/api/src/services/events/jobEvents.service.ts
- [[jobEvents.ts]] - code - packages/types/jobEvents.ts
- [[jobStream.ts]] - code - apps/web/lib/jobStream.ts
- [[locale-sync.tsx]] - code - apps/web/components/locale-sync.tsx
- [[planFeatureSpecs()]] - code - apps/web/lib/pricing.ts
- [[plansForAudience()]] - code - apps/web/lib/pricing.ts
- [[pricing.ts]] - code - apps/web/lib/pricing.ts
- [[providers.tsx_1]] - code - apps/web/components/providers.tsx
- [[session-sync.tsx]] - code - apps/web/components/session-sync.tsx
- [[upgrade-dialog.tsx]] - code - apps/web/components/account/upgrade-dialog.tsx
- [[useJobEvents()]] - code - apps/web/hooks/useJobEvents.ts
- [[useJobEvents.ts]] - code - apps/web/hooks/useJobEvents.ts
- [[useLocaleSync()]] - code - apps/web/hooks/useLocaleContent.ts
- [[useRequestUpgrade()]] - code - apps/web/hooks/useBilling.ts
- [[useUpgradeModal]] - code - apps/web/store/useUpgradeModal.ts
- [[useUpgradeModal.ts]] - code - apps/web/store/useUpgradeModal.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Providers__Job_Events
SORT file.name ASC
```

## Connections to other communities
- 10 edges to [[_COMMUNITY_Shared Types & Auth Stores]]
- 6 edges to [[_COMMUNITY_Content & Flashcards Hooks]]
- 4 edges to [[_COMMUNITY_Billing, Usage & Limits]]
- 4 edges to [[_COMMUNITY_Background Jobs & Queues]]
- 4 edges to [[_COMMUNITY_Account & Settings UI]]
- 3 edges to [[_COMMUNITY_Auth & App Shell UI]]
- 3 edges to [[_COMMUNITY_Content Assignment & Hooks]]
- 2 edges to [[_COMMUNITY_Marketing Landing UI]]
- 2 edges to [[_COMMUNITY_Chat Visual Embeds]]
- 1 edge to [[_COMMUNITY_Podcast Generation & Prompts]]
- 1 edge to [[_COMMUNITY_Quiz Generation Job]]
- 1 edge to [[_COMMUNITY_Assessments Service]]
- 1 edge to [[_COMMUNITY_Slide Deck UI]]
- 1 edge to [[_COMMUNITY_Shared UI Primitives]]
- 1 edge to [[_COMMUNITY_B2C Dashboard Shell]]

## Top bridge nodes
- [[jobEvents.service.ts]] - degree 14, connects to 6 communities
- [[upgrade-dialog.tsx]] - degree 14, connects to 4 communities
- [[pricing.ts]] - degree 17, connects to 3 communities
- [[useJobEvents.ts]] - degree 9, connects to 2 communities
- [[useUpgradeModal]] - degree 7, connects to 2 communities