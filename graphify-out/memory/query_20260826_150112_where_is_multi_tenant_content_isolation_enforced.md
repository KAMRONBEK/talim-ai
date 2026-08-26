---
type: "query"
date: "2026-08-26T15:01:12.659310+00:00"
question: "Where is multi-tenant content isolation enforced, and what is the blast radius of changing it?"
contributor: "graphify"
outcome: "useful"
---

# Q: Where is multi-tenant content isolation enforced, and what is the blast radius of changing it?

## Answer

contentAccess.service.ts (buildContentListWhere + assertCanAccessContent); 'graphify affected' listed 17 dependent modules, which justified shipping the #29 change behind six isolation controls rather than feature assertions

## Outcome

- Signal: useful