---
type: community
cohesion: 0.18
members: 16
---

# Tenant Messaging Service

**Cohesion:** 0.18 - loosely connected
**Members:** 16 nodes

## Members
- [[SentMessageShape]] - code - apps/api/src/services/tenant/messages.ts
- [[formatSentMessage()]] - code - apps/api/src/services/tenant/messages.ts
- [[getLearnerUnreadCount()]] - code - apps/api/src/services/tenant/messages.ts
- [[getOwnerUnreadReplyCount()]] - code - apps/api/src/services/tenant/messages.ts
- [[listLearnerMessages()]] - code - apps/api/src/services/tenant/messages.ts
- [[listTenantMessageThreads()]] - code - apps/api/src/services/tenant/messages.ts
- [[markLearnerMessageRead()]] - code - apps/api/src/services/tenant/messages.ts
- [[markOwnerReplyRead()]] - code - apps/api/src/services/tenant/messages.ts
- [[markRecipientRead()]] - code - apps/api/src/services/tenant/messages.ts
- [[messages.ts]] - code - apps/api/src/services/tenant/messages.ts
- [[replyMessageSchema]] - code - apps/api/src/services/tenant/messages.ts
- [[replyToTenantMessage()]] - code - apps/api/src/services/tenant/messages.ts
- [[resolveSenderNames()]] - code - apps/api/src/services/tenant/messages.ts
- [[respondToStudentReply()]] - code - apps/api/src/services/tenant/messages.ts
- [[sendMessageSchema]] - code - apps/api/src/services/tenant/messages.ts
- [[sendTenantMessage()]] - code - apps/api/src/services/tenant/messages.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Tenant_Messaging_Service
SORT file.name ASC
```

## Connections to other communities
- 2 edges to [[_COMMUNITY_Flashcards API & Prisma Seed]]
- 2 edges to [[_COMMUNITY_Billing, Usage & Limits]]
- 1 edge to [[_COMMUNITY_Tenant Service]]

## Top bridge nodes
- [[messages.ts]] - degree 20, connects to 3 communities