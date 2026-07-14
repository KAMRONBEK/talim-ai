---
type: community
cohesion: 0.10
members: 40
---

# Prisma Client & Seed

**Cohesion:** 0.10 - loosely connected
**Members:** 40 nodes

## Members
- [[AuthPayload]] - code - apps/api/src/middleware/auth.middleware.ts
- [[Badge]] - code - packages/types/index.ts
- [[FlashcardGrade]] - code - apps/api/src/services/srs.service.ts
- [[FlashcardReviewResult]] - code - apps/api/src/services/srs.service.ts
- [[GRADE_QUALITY]] - code - apps/api/src/services/srs.service.ts
- [[LearnerMastery]] - code - apps/api/src/services/mastery.service.ts
- [[LearnerProgress]] - code - packages/types/index.ts
- [[MasteryTopic]] - code - packages/types/index.ts
- [[PLANS]] - code - apps/api/src/prisma/seed.ts
- [[PlanSeed]] - code - apps/api/src/prisma/seed.ts
- [[SampledChunk]] - code - apps/api/src/lib/chunk-sampling.ts
- [[assertIndividualContentRoute()]] - code - apps/api/src/services/contentAccess.service.ts
- [[badges.service.ts]] - code - apps/api/src/services/badges.service.ts
- [[chunk-sampling.ts]] - code - apps/api/src/lib/chunk-sampling.ts
- [[clamp01()]] - code - apps/api/src/services/badges.service.ts
- [[computeBadges()]] - code - apps/api/src/services/badges.service.ts
- [[computeStreakDays()]] - code - apps/api/src/services/learningProgress.service.ts
- [[contentAccess.service.ts]] - code - apps/api/src/services/contentAccess.service.ts
- [[create-admin.ts]] - code - apps/api/src/scripts/create-admin.ts
- [[finalize()]] - code - apps/api/src/services/badges.service.ts
- [[getAssignedContentIds()]] - code - apps/api/src/services/contentAccess.service.ts
- [[getClassMastery()]] - code - apps/api/src/services/mastery.service.ts
- [[getLearnerMastery()]] - code - apps/api/src/services/mastery.service.ts
- [[getLearnerMaterials()]] - code - apps/api/src/services/tenant/progress.ts
- [[getLearnerProgress()]] - code - apps/api/src/services/tenant/progress.ts
- [[getLearnerSummary()]] - code - apps/api/src/services/tenant/progress.ts
- [[getStudentProgress()_1]] - code - apps/api/src/services/tenant/progress.ts
- [[getTenantProgress()]] - code - apps/api/src/services/tenant/progress.ts
- [[listStudents()_1]] - code - apps/api/src/services/tenant/students.ts
- [[main()]] - code - apps/api/src/prisma/seed.ts
- [[main()_1]] - code - apps/api/src/scripts/create-admin.ts
- [[mastery.service.ts]] - code - apps/api/src/services/mastery.service.ts
- [[parseArgs()]] - code - apps/api/src/scripts/create-admin.ts
- [[prisma_2]] - code - apps/api/src/lib/prisma.ts
- [[prisma.ts]] - code - apps/api/src/lib/prisma.ts
- [[progress.ts]] - code - apps/api/src/services/tenant/progress.ts
- [[resolveSectionTitles()]] - code - apps/api/src/services/mastery.service.ts
- [[roundPct()]] - code - apps/api/src/services/mastery.service.ts
- [[seed.ts]] - code - apps/api/src/prisma/seed.ts
- [[srs.service.ts]] - code - apps/api/src/services/srs.service.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Prisma_Client__Seed
SORT file.name ASC
```

## Connections to other communities
- 20 edges to [[_COMMUNITY_Content Media Controllers]]
- 14 edges to [[_COMMUNITY_API Bootstrap & Background Jobs]]
- 13 edges to [[_COMMUNITY_Content Controller (B2C)]]
- 13 edges to [[_COMMUNITY_API Routes & Middleware]]
- 10 edges to [[_COMMUNITY_Subscription & Billing Service]]
- 10 edges to [[_COMMUNITY_SSE Endpoint & Error Middleware]]
- 9 edges to [[_COMMUNITY_Admin Content & Audit Controllers]]
- 9 edges to [[_COMMUNITY_Assessment Service]]
- 9 edges to [[_COMMUNITY_Tenant Org & Roles Service]]
- 8 edges to [[_COMMUNITY_Job Event Fan-out & Media Jobs]]
- 7 edges to [[_COMMUNITY_AI Tutor Chat Controller]]
- 7 edges to [[_COMMUNITY_Learning Progress & Coverage]]
- 6 edges to [[_COMMUNITY_Usage Pricing & Metering]]
- 6 edges to [[_COMMUNITY_Shared Types & Zustand Stores]]
- 5 edges to [[_COMMUNITY_Auth Controller]]
- 5 edges to [[_COMMUNITY_Quiz Controller & Grading]]
- 5 edges to [[_COMMUNITY_Section Controller]]
- 4 edges to [[_COMMUNITY_Admin Analytics]]
- 4 edges to [[_COMMUNITY_Student Management Service]]
- 3 edges to [[_COMMUNITY_Summary Controller]]
- 3 edges to [[_COMMUNITY_Quiz Generation Pipeline]]
- 3 edges to [[_COMMUNITY_Question Bank Service]]
- 2 edges to [[_COMMUNITY_Podcast Generation & TTS]]
- 2 edges to [[_COMMUNITY_Section Mastery (Elo-KT)]]
- 2 edges to [[_COMMUNITY_Tenant Messaging Service]]
- 2 edges to [[_COMMUNITY_Tenant Dashboard & Hooks]]
- 2 edges to [[_COMMUNITY_Flashcards UI]]
- 1 edge to [[_COMMUNITY_Learner Controller]]
- 1 edge to [[_COMMUNITY_Learner Dashboard]]

## Top bridge nodes
- [[prisma.ts]] - degree 70, connects to 24 communities
- [[prisma_2]] - degree 70, connects to 24 communities
- [[contentAccess.service.ts]] - degree 31, connects to 10 communities
- [[progress.ts]] - degree 25, connects to 8 communities
- [[mastery.service.ts]] - degree 17, connects to 6 communities