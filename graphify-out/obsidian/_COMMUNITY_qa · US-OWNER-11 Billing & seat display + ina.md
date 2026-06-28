---
type: community
cohesion: 1.00
members: 2
---

# qa · US-OWNER-11: Billing & seat display + ina

**Cohesion:** 1.00 - tightly connected
**Members:** 2 nodes

## Members
- [[F33 (S2, fixed) TRIALING tenant subscription fully locked out (402 on every action)]] - document - docs/qa/visual-qa-report.md
- [[US-OWNER-11 Billing & seat display + inactive-subscription banner]] - document - docs/qa/user-stories-expansion.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/qa__US-OWNER-11_Billing__seat_display__ina
SORT file.name ASC
```
