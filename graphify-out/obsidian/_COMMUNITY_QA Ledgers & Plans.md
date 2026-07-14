---
type: community
cohesion: 0.08
members: 44
---

# QA Ledgers & Plans

**Cohesion:** 0.08 - loosely connected
**Members:** 44 nodes

## Members
- [[Coverage Cell (route × role × state-variant)]] - concept - docs/qa/coverage-map.md
- [[Coverage Depth Enum (viewed  interacted  oracle-verified)]] - rationale - docs/qa/coverage-map.md
- [[Epic 1 — Subscriptions & Billing_1]] - concept - docs/PLANS.md
- [[Epic 2 — Platform Admin Panel_1]] - concept - docs/PLANS.md
- [[Epic 3 — Tenant (Organization) Experience_1]] - concept - docs/PLANS.md
- [[Epic 4 — Individual Learner Freemium]] - concept - docs/PLANS.md
- [[Epic 5 — Usage Metering & Platform Cost_1]] - concept - docs/PLANS.md
- [[Epic 6 — Tenant AI Assistant_1]] - concept - docs/PLANS.md
- [[F11 Stale session token after admin role change]] - concept - docs/qa/visual-qa-report.md
- [[F39 GAME leaderboard timing is client-supplied (responseMs)]] - concept - docs/qa/user-stories.md
- [[F45 Stale JWT after role change (tutor approval)]] - concept - docs/qa/user-stories.md
- [[F59 Quiz generation failure spun forever (no persisted Quiz.status)]] - concept - docs/qa/user-stories.md
- [[F63 PDF region-select opened a duplicate Learn panel on desktop]] - concept - docs/qa/user-stories.md
- [[F76 Due-date hint said 'does not block submission' but server 403s]] - concept - docs/qa/user-stories.md
- [[F77 Assessment re-assign silently no-ops on already-assigned learners]] - concept - docs/qa/user-stories.md
- [[F78 FLAGGED generated media is label-only (never hidden from learners)]] - concept - docs/qa/user-stories.md
- [[F79 CSV formula injection on students-roster export (CWE-1236)]] - concept - docs/qa/user-stories.md
- [[Findings Ledger (F-numbers)]] - concept - docs/qa/user-stories.md
- [[GAME speed-points cheat clamp (computeGamePoints)]] - rationale - docs/qa/visual-qa-report.md
- [[Impersonation security matrix (admin mint → act-as-user)]] - concept - docs/qa/visual-qa-report.md
- [[Multi-tenant isolation guard (contentAccess.service  assertCanAccessContent)]] - concept - docs/qa/user-stories.md
- [[O80 ASCII apostrophe (U+0027) vs Uzbek U+02BB in o'g']] - concept - docs/qa/user-stories.md
- [[O81 Impersonation token not single-use (replayable stateless JWT)]] - concept - docs/qa/user-stories.md
- [[Observations Ledger (O-numbers)]] - concept - docs/qa/user-stories.md
- [[Overnight Visual QA Report (session journal, Runs 1–18)]] - document - docs/qa/visual-qa-report.md
- [[PersonaLens Charter Method (FedEx, Hostile, Antisocial, Saboteur, OCD, Couch-potato)]] - rationale - docs/qa/visual-qa-report.md
- [[QA Frontier Formula (staleness × risk − recentness)]] - rationale - docs/qa/coverage-map.md
- [[QA Test Accounts (qa-admin, qa-owner, teststudent12, qa-individual)]] - concept - docs/qa/visual-qa-report.md
- [[QA-Deferred Structural Items (Run 18)]] - concept - docs/PLANS.md
- [[Route Auto-Enumeration at Run Start]] - rationale - docs/qa/coverage-map.md
- [[Run 18 — Session-based deep QA of the post-2026-06-28 surface]] - concept - docs/qa/visual-qa-report.md
- [[Suggested Build Order (Epics 5→1→32→4→6)]] - rationale - docs/PLANS.md
- [[Talim AI Product Plans]] - document - docs/PLANS.md
- [[Talim QA Coverage Map (frontier ledger)]] - document - docs/qa/coverage-map.md
- [[US-AUTH-01 Emailpassword login]] - concept - docs/qa/user-stories.md
- [[US-AUTH-03 Join-code enrolment + seat limits]] - concept - docs/qa/user-stories.md
- [[US-IND-05 Podcast generate + player]] - concept - docs/qa/user-stories.md
- [[US-IND-08 Usage limit → upgrade promotion modal]] - concept - docs/qa/user-stories.md
- [[US-LEARNER-01 Learner sees only assigned materials]] - concept - docs/qa/user-stories.md
- [[US-LEARNER-04 Learner blocked from owneradmin tools]] - concept - docs/qa/user-stories.md
- [[US-OWNER-12 Delete a material]] - concept - docs/qa/user-stories.md
- [[US-XCUT-01 i18n — Uzbek-first localization]] - concept - docs/qa/user-stories.md
- [[User Role Model (INDIVIDUAL  TENANT_OWNER  TENANT_LEARNER  ADMIN)]] - concept - docs/PLANS.md
- [[User Stories & QA Traceability (durable spec + results ledger)]] - document - docs/qa/user-stories.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/QA_Ledgers__Plans
SORT file.name ASC
```
