---
type: community
cohesion: 0.47
members: 6
---

# qa · US-AUTH-02: Register a new individual acc

**Cohesion:** 0.47 - moderately connected
**Members:** 6 nodes

## Members
- [[F26 (S3, fixed) seat-limit-full reported as 'Upload limit reached' (no STUDENT QuotaFeature)]] - document - docs/qa/visual-qa-report.md
- [[F27 (S2, logged) orphaned INDIVIDUAL account when register-with-join-code hits a full class]] - document - docs/qa/visual-qa-report.md
- [[F43 (S2, fixed) orphaned account on register-with-invalid-join-code (broadened F27)]] - document - docs/qa/visual-qa-report.md
- [[Seat-limit  join-code enrolment boundary (assertTenantQuota STUDENT)]] - concept - docs/qa/user-stories.md
- [[US-AUTH-02 Register a new individual account (+ optional join code)]] - document - docs/qa/user-stories-expansion.md
- [[US-AUTH-03 Join-code enrolment + seat limits]] - document - docs/qa/user-stories.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/qa__US-AUTH-02_Register_a_new_individual_acc
SORT file.name ASC
```
