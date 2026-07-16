# Talim QA Coverage Map — machine-readable frontier ledger

> **Role of this file (source of truth for coverage).** This is the planner's frontier ledger:
> one row per **route × role × state-variant** cell. The session planner sorts cells by
> `staleness × risk − recentness` and picks 6–10 charters per run. `user-stories.md` owns the EC
> spec + F-ledger; `visual-qa-report.md` owns the session journal. This file owns **what has been
> covered, how deeply, and how stale it is** — nothing else.
>
> **Frontier formula.** `staleness` = runs-since-last-touch (planner sorts desc). Risk is boosted
> for: recently-changed code (git-log since last run), cells with prior findings, never-oracle-verified
> cells, and all P0 gap areas. **Recently-tested cells are deprioritized, NOT excluded** — the
> `− recentness` term pushes them down the queue, but a "green" cell is never off-limits (this suite is
> fallible; a passing cell is only proven bug-free under the angles tried so far). **Every run reserves
> ≥2 charters to re-examine oracle-verified / low-staleness cells from a NEW angle** (different
> persona × tour × state × input-attack than `tour_last`) — the only forbidden move is a literal replay.
>
> **Run-ID scheme:** `R<date><seq>` (e.g. `R2026-07-12a`). **staleness stamp** = `last_run` + `last_commit`.
>
> **Axes.**
> - **role:** ADMIN · TENANT_OWNER · TENANT_LEARNER-active · TENANT_LEARNER-deactivated · INDIVIDUAL · logged-out
> - **state (explicit sweep dimension):** empty · populated · error/failed-job · loading/generating · quota-exceeded · mustChangePassword · locale{uz,ru,en} · theme{light,dark} · viewport{desktop,390}
> - **depth enum:** viewed < interacted < oracle-verified
> - **locale-tier:** uz (primary) · ru (secondary) · en (low-priority) — a cell is not `oracle-verified`
>   for i18n until at least uz + ru are checked.
>
> **Auto-enumeration.** Routes are enumerated at run start from `apps/web/app/[locale]` and
> `apps/admin/app`; a run-start diff flags **new routes as staleness-∞ cells** (top of the queue).
> This committed file is a seeded skeleton — the P0/P1 frontier from the coverage-expansion pass —
> plus the header contract. The enumerator fills the long tail.

| cell_id | route | role | state | locale_tier | tour_last | depth | last_run | last_commit | findings | staleness |
|---------|-------|------|-------|-------------|-----------|-------|----------|-------------|----------|-----------|
| quiz.[id]/INDIVIDUAL/generator | /[locale]/quiz/[id] | INDIVIDUAL | populated | uz | FedEx | oracle-verified | R2026-07-12a | a9b2c397 | O80 | 0 |
| quiz.[id]/INDIVIDUAL/short-answer-ai-judge | /[locale]/quiz/[id] | INDIVIDUAL | populated | uz | Hostile | oracle-verified | R2026-07-14b | 02fbf803 | — | 0 |
| quiz.[id]/INDIVIDUAL/thin-content | /[locale]/quiz/[id] | INDIVIDUAL | populated | uz | FedEx | oracle-verified | R2026-07-12a | a9b2c397 | — | 0 |
| quiz.[id]/INDIVIDUAL/quota-exceeded | /[locale]/quiz/[id] | INDIVIDUAL | quota-exceeded | uz | Couch-potato | oracle-verified | R2026-07-14b | 02fbf803 | — | 0 |
| quiz.[id]/INDIVIDUAL/generating | /[locale]/quiz/[id] | INDIVIDUAL | loading/generating | uz | — | viewed | — | — | — | ∞ |
| quiz.[id]/INDIVIDUAL/failed-job | /[locale]/quiz/[id] | INDIVIDUAL | error/failed-job | uz | — | viewed | — | — | F59 | ∞ |
| content.[id].flashcards/INDIVIDUAL/populated | /[locale]/content/[id]/flashcards | INDIVIDUAL | populated | uz | OCD | oracle-verified | R2026-07-12a | 662d4c62 | — | 0 |
| content.[id].flashcards/INDIVIDUAL/empty | /[locale]/content/[id]/flashcards | INDIVIDUAL | empty | uz | OCD | oracle-verified | R2026-07-12a | 662d4c62 | — | 0 |
| content.[id].flashcards/INDIVIDUAL/review-fail | /[locale]/content/[id]/flashcards | INDIVIDUAL | error/failed-job | uz | OCD | oracle-verified | R2026-07-12a | 662d4c62 | — | 0 |
| content.[id].flashcards/TENANT_LEARNER-deactivated/populated | /[locale]/content/[id]/flashcards | TENANT_LEARNER-deactivated | populated | uz | — | viewed | — | — | — | ∞ |
| content.[id]/TENANT_LEARNER-deactivated/access-loss-live | /[locale]/content/[id] | TENANT_LEARNER-deactivated | populated | uz | Nodira | oracle-verified | R2026-07-14a | 13a93172 | O86 | 0 |
| content.[id]/INDIVIDUAL/study-mode | /[locale]/content/[id] | INDIVIDUAL | populated | uz | — | viewed | — | — | — | ∞ |
| content.[id]/INDIVIDUAL/selection-ask | /[locale]/content/[id] | INDIVIDUAL | populated | uz | — | viewed | — | — | F63 | ∞ |
| content.[id]/INDIVIDUAL/section-rail | /[locale]/content/[id] | INDIVIDUAL | populated | uz | — | viewed | — | — | — | ∞ |
| content.[id].podcast/INDIVIDUAL/transcript-sync | /[locale]/content/[id]/podcast | INDIVIDUAL | populated | uz | OCD | oracle-verified | R2026-07-14b | a783868a | F81 | 0 |
| content.[id].podcast/INDIVIDUAL/sse-generate | /[locale]/content/[id]/podcast | INDIVIDUAL | loading/generating | uz | FedEx | oracle-verified | R2026-07-14a | a783868a | O82,O83 | 0 |
| content.[id].podcast/INDIVIDUAL/legacy-timings | /[locale]/content/[id]/podcast | INDIVIDUAL | populated | uz | OCD | interacted | R2026-07-14b | a783868a | O82→PLANS | 1 |
| learner.assessments/TENANT_LEARNER-active/structured-players | /[locale]/learner/assessments | TENANT_LEARNER-active | populated | uz | FedEx | interacted | R2026-07-12a | a9b2c397 | — | 1 |
| learner.assessments/TENANT_LEARNER-active/malformed-config | /[locale]/learner/assessments | TENANT_LEARNER-active | error/failed-job | uz | — | viewed | — | — | — | ∞ |
| learner.assessments/TENANT_LEARNER-active/hotspot-dragdrop-a11y | /[locale]/learner/assessments | TENANT_LEARNER-active | populated | uz | — | viewed | — | — | PLANS:QA-DEFER-HOTSPOT-A11Y | ∞ |
| quiz.[id]/INDIVIDUAL/structured-player-a11y | /[locale]/quiz/[id] | INDIVIDUAL | populated | uz | Rustam | oracle-verified | R2026-07-14a | a9b2c397 | O87 | 2 |
| quiz.[id]/INDIVIDUAL/keyboard-operability | /[locale]/quiz/[id] | INDIVIDUAL | populated | uz | Rustam | oracle-verified | R2026-07-16a | a9b2c397 | — | 0 |
| quiz.[id]/INDIVIDUAL/i18n-ru-en-chrome | /[locale]/quiz/[id] | INDIVIDUAL | locale{ru,en} | ru | Dilnoza | oracle-verified | R2026-07-14b | a783868a | — | 0 |
| tenant.assessments/TENANT_OWNER/i18n-ru-chrome | /[locale]/tenant/assessments | TENANT_OWNER | locale{ru} | ru | Dilnoza | oracle-verified | R2026-07-14b | a783868a | O89 | 0 |
| learner.dashboard/TENANT_LEARNER-active/game-banner | /[locale]/learner/dashboard | TENANT_LEARNER-active | populated | uz | FedEx | oracle-verified | R2026-07-14b | 9714b45a | — | 0 |
| learner.assessments/TENANT_LEARNER-active/game-live-play | /[locale]/learner/assessments | TENANT_LEARNER-active | loading/generating | uz | FedEx | oracle-verified | R2026-07-14b | 9714b45a | F39 | 0 |
| learner.assessments/TENANT_LEARNER-active/quiz-review | /[locale]/learner/assessments | TENANT_LEARNER-active | populated | uz | FedEx | oracle-verified | R2026-07-14b | 9714b45a | — | 0 |
| learner.messages-bell/TENANT_LEARNER-active/populated | /[locale]/learner/dashboard | TENANT_LEARNER-active | populated | uz | Hostile | oracle-verified | R2026-07-12a | 2d8ddab3 | — | 0 |
| learner.messages-bell/TENANT_LEARNER-active/IDOR | /learner/messages/:id | TENANT_LEARNER-active | populated | uz | Hostile | oracle-verified | R2026-07-12a | 2d8ddab3 | — | 0 |
| tenant.progress/TENANT_OWNER/mastery-by-topic | /[locale]/tenant/progress | TENANT_OWNER | populated | uz | — | viewed | — | — | — | ∞ |
| tenant.progress/TENANT_OWNER/mastery-empty | /[locale]/tenant/progress | TENANT_OWNER | empty | uz | — | viewed | — | — | — | ∞ |
| tenant.assessments/TENANT_OWNER/builder-8types | /[locale]/tenant/assessments | TENANT_OWNER | populated | uz | Antisocial | interacted | R2026-07-12a | 8fa216f3 | — | 1 |
| tenant.assessments/TENANT_OWNER/invalid-config | /[locale]/tenant/assessments | TENANT_OWNER | error/failed-job | uz | Couch-potato | interacted | R2026-07-12a | 8fa216f3 | — | 1 |
| tenant.assessments/TENANT_OWNER/due-date | /[locale]/tenant/assessments | TENANT_OWNER | populated | uz | Antisocial | oracle-verified | R2026-07-12a | 31500cd4 | F76,F77 | 0 |
| tenant.assessments/TENANT_OWNER/game-live-control | /[locale]/tenant/assessments | TENANT_OWNER | loading/generating | uz | Antisocial | oracle-verified | R2026-07-12a | 9714b45a | — | 0 |
| tenant.messages-bell/TENANT_OWNER/populated | /[locale]/tenant/dashboard | TENANT_OWNER | populated | uz | — | viewed | — | — | — | ∞ |
| tenant.students/TENANT_OWNER/csv-import-valid | /[locale]/tenant/students | TENANT_OWNER | populated | uz | FedEx | oracle-verified | R2026-07-12a | 2d8ddab3 | — | 0 |
| tenant.students/TENANT_OWNER/csv-import-malformed | /[locale]/tenant/students | TENANT_OWNER | error/failed-job | uz | Hostile | oracle-verified | R2026-07-16a | 2d8ddab3 | — | 0 |
| tenant.students/TENANT_OWNER/xss-longname-render | /[locale]/tenant/students | TENANT_OWNER | populated | uz | Hostile | oracle-verified | R2026-07-16a | 7ae7893f | — | 0 |
| tenant.students/TENANT_OWNER/csv-import-seat-boundary | /[locale]/tenant/students | TENANT_OWNER | quota-exceeded | uz | Nodira | oracle-verified | R2026-07-12a | 2d8ddab3 | — | 0 |
| tenant.students/TENANT_OWNER/csv-export | /[locale]/tenant/students | TENANT_OWNER | populated | uz | Hostile | oracle-verified | R2026-07-16a | 3a9a6d02 | F79 | 0 |
| tenant.materials.[id]/TENANT_OWNER/per-part | /[locale]/tenant/materials/[id] | TENANT_OWNER | populated | uz | Antisocial | oracle-verified | R2026-07-14b | a783868a | — | 0 |
| tenant.materials.[id]/TENANT_OWNER/failed-part | /[locale]/tenant/materials/[id] | TENANT_OWNER | error/failed-job | uz | Antisocial | interacted | R2026-07-14b | a783868a | O88 | 1 |
| tenant.materials.[id]/TENANT_LEARNER-active/role-guard | /[locale]/tenant/materials/[id] | TENANT_LEARNER-active | populated | uz | — | viewed | — | — | — | ∞ |
| impersonate/ADMIN/accept | /[locale]/impersonate | ADMIN | populated | uz | Hostile | oracle-verified | R2026-07-12a | c73f9371 | O81 | 0 |
| impersonate/ADMIN/browser-ui-flow | /users/[id]→/impersonate | ADMIN | populated | en | Hostile | oracle-verified | R2026-07-14a | c73f9371 | O85 | 0 |
| impersonate/ADMIN/replay-tamper | /[locale]/impersonate | ADMIN | error/failed-job | uz | Saboteur | oracle-verified | R2026-07-14b | c73f9371 | O81 | 0 |
| admin.dashboard/ADMIN/analytics-empty | /dashboard (:3001) | ADMIN | empty | en | Saboteur | oracle-verified | R2026-07-16a | c73f9371 | — | 0 |
| admin.dashboard/ADMIN/analytics-populated | /dashboard (:3001) | ADMIN | populated | en | Saboteur | oracle-verified | R2026-07-16a | c73f9371 | O92 | 0 |
| admin.analytics.8ep/ADMIN/days-fuzz | /admin/analytics/* | ADMIN | error/failed-job | en | Saboteur | oracle-verified | R2026-07-16a | c73f9371 | O92 | 0 |
| admin.content/ADMIN/flag-effect | /content (:3001) | ADMIN | populated | en | Hostile | oracle-verified | R2026-07-16a | c73f9371 | F78 | 0 |
| admin.content/ADMIN/content-detail | /content/[id] (:3001) | ADMIN | populated | en | — | viewed | — | — | — | ∞ |
| pricing/logged-out/cta | /[locale]/pricing | logged-out | populated | uz+ru | Nodira | oracle-verified | R2026-07-16a | aaaa2b9c | O80,O90 | 0 |
| pricing/INDIVIDUAL/cta | /[locale]/pricing | INDIVIDUAL | populated | uz | Nodira | oracle-verified | R2026-07-16a | aaaa2b9c | O90 | 0 |
| pricing/TENANT_OWNER/cta | /[locale]/pricing | TENANT_OWNER | populated | uz | Nodira | oracle-verified | R2026-07-16a | aaaa2b9c | O90 | 0 |
| tenant.dashboard/TENANT_OWNER/info-dense-stats | /[locale]/tenant/dashboard | TENANT_OWNER | populated | uz | Nodira | oracle-verified | R2026-07-16a | 7ae7893f | — | 0 |
| learner.dashboard/TENANT_LEARNER-active/info-dense-stats | /[locale]/learner/dashboard | TENANT_LEARNER-active | populated | uz | Aziza | oracle-verified | R2026-07-16a | 7ae7893f | O91 | 0 |
| terms/logged-out/render | /[locale]/terms | logged-out | populated | uz | — | viewed | — | — | — | ∞ |
| dashboard/INDIVIDUAL/typebadge | /[locale]/dashboard | INDIVIDUAL | populated | uz | — | viewed | — | — | — | ∞ |
| dashboard/INDIVIDUAL/i18n-ru-en | /[locale]/dashboard | INDIVIDUAL | locale{ru,en} | ru | Dilnoza | oracle-verified | R2026-07-14a | 1ac3af69 | F80 | 0 |
| learner.dashboard/TENANT_LEARNER-active/must-change-pw | /[locale]/learner/dashboard | TENANT_LEARNER-active | mustChangePassword | uz | Aziza | oracle-verified | R2026-07-14a | 13a93172 | O84 | 0 |
