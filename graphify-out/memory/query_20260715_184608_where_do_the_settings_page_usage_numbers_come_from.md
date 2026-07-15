---
type: "query"
date: "2026-07-15T18:46:08.003413+00:00"
question: "Where do the settings-page usage numbers come from for an INDIVIDUAL user?"
contributor: "graphify"
outcome: "useful"
---

# Q: Where do the settings-page usage numbers come from for an INDIVIDUAL user?

## Answer

GET /billing/me -> getBillingMe -> getUsageVsLimits (services/subscription/user.ts): counts Content/ApiUsageEvent/Podcast/ContentVideo rows in dayRange() (server-local midnight->now), limits from Plan.limits JSON via parseLimits. usage.service explain surfaced getUsageForPeriod quickly.

## Outcome

- Signal: useful