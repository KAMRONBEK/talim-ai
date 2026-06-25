---
type: community
cohesion: 0.08
members: 33
---

# QA Runbook & Error Fixtures

**Cohesion:** 0.08 - loosely connected
**Members:** 33 nodes

## Members
- [[Admin SSR error page (hasHydrated TypeError)]] - document - docs/qa/screenshots/_admin_err.html
- [[Deep Flow Tests Per Role]] - concept - docs/qa/overnight-visual-qa.md
- [[F1 web dev server wedged (stale .next)]] - document - docs/qa/visual-qa-report.md
- [[F10 admin reject uses native window.confirm]] - document - docs/qa/visual-qa-report.md
- [[F11 stale JWT role after role change - 403s]] - document - docs/qa/visual-qa-report.md
- [[F12 Create-podcast button shown to learners]] - document - docs/qa/visual-qa-report.md
- [[F13 hidden upload file-input leaked to learnersowners]] - document - docs/qa/visual-qa-report.md
- [[F14 return-after-login not preserved (no redirect param)]] - document - docs/qa/visual-qa-report.md
- [[F15 material delete dialog hardcoded Uzbek leak]] - document - docs/qa/visual-qa-report.md
- [[F16 deactivated login shows server-unreachable not deactivated]] - document - docs/qa/visual-qa-report.md
- [[F2 wrong-password shows no error (login 401 interceptor)]] - document - docs/qa/visual-qa-report.md
- [[F3 summary 404 console noise on workspace load]] - document - docs/qa/visual-qa-report.md
- [[F4 RichText div-in-p hydration error on quiz reveal]] - document - docs/qa/visual-qa-report.md
- [[F5 assessment mutations don't invalidate cache (stale)]] - document - docs/qa/visual-qa-report.md
- [[F6 deactivate no-confirm + native regenerate confirm]] - document - docs/qa/visual-qa-report.md
- [[F7 Upload button shown to learnersowners in topbar]] - document - docs/qa/visual-qa-report.md
- [[F8 inaccessible content hangs on Loading forever]] - document - docs/qa/visual-qa-report.md
- [[F9 every admin page SSR-500 (auth-guard hydration)]] - document - docs/qa/visual-qa-report.md
- [[Finding Severity Scale (S1-S4)]] - concept - docs/qa/user-stories.md
- [[Findings Ledger]] - concept - docs/qa/user-stories.md
- [[Generic Internal Server Error page]] - document - docs/qa/screenshots/_err.html
- [[Overnight Deep QA Runbook]] - document - docs/qa/overnight-visual-qa.md
- [[Overnight Visual QA Report]] - document - docs/qa/visual-qa-report.md
- [[Pythagoras QA fixture text]] - document - docs/qa/screenshots/qa-pythagoras.txt
- [[Pythagorean Theorem QA test PDF]] - paper - docs/qa/screenshots/qa-pythagoras.pdf
- [[QA Cross-Cutting Matrix]] - concept - docs/qa/overnight-visual-qa.md
- [[QA Hard Rules (branch-only, local-only, fix-discipline)]] - rationale - docs/qa/overnight-visual-qa.md
- [[QA Run 1 Final Summary]] - document - docs/qa/visual-qa-report.md
- [[QA Run 2 Closing Summary]] - document - docs/qa/visual-qa-report.md
- [[QA Test Depth Matrix]] - concept - docs/qa/overnight-visual-qa.md
- [[US-AUTH-01 Emailpassword login]] - concept - docs/qa/user-stories.md
- [[US-OWNER-12 Delete a material]] - concept - docs/qa/user-stories.md
- [[User Stories & QA Traceability]] - document - docs/qa/user-stories.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/QA_Runbook__Error_Fixtures
SORT file.name ASC
```
