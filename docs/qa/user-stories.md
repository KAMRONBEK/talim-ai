# Talim AI — User Stories & QA Traceability

This is the **durable spec + results ledger**. It is *not* a run journal — that's
[`visual-qa-report.md`](./visual-qa-report.md). Here, every user story is decomposed to
its deepest edge cases, and each edge case carries a **live status**, the **finding** it
produced, and the **fix** that closed it. Read this to answer "is behaviour X tested, and
does it work?" at any moment.

> **Backlog expansion:** [`user-stories-expansion.md`](./user-stories-expansion.md) holds **76**
> additional deep stories (~1,470 edge cases) mined from a full code read — AI video, slides,
> assessments, the admin panel, the multi-tenant isolation matrix, a11y, background jobs, the
> quota matrix and cascade-deletes. Promote stories from there into this ledger as they are
> verified. That pass also surfaced **90 suspected bugs** (its own ledger); the confirmed +
> fixed ones are recorded below as **F32–F39**.

---

## How to read this

- **Story** = one slice of value for one role: `US-<AREA>-<n>`. Areas: `AUTH`, `IND`
  (individual/B2C), `OWNER` (tenant owner), `LEARNER` (tenant learner), `ADMIN`, `XCUT`
  (cross-cutting: i18n, a11y, mobile, security).
- **Acceptance criteria (AC)** = the happy-path contract, Given/When/Then.
- **Edge cases (EC)** = every negative path, boundary, race, and "what if" we can think of.
  *This is where the value is* — the deeper the list, the better the QA. Add ECs as you
  discover them; an EC that "can't happen" still gets logged with reasoning.
- **Finding** = link to an `F<n>` row in the [Findings ledger](#findings-ledger).
- **Fix** = the commit SHA that closed it (so the result is auditable from git).

### Status legend
| Symbol | Meaning |
| --- | --- |
| ✅ | Tested, passes |
| ❌ | Tested, fails → must have a linked `F#` |
| 🟡 | Partially tested / works with caveat |
| 🐛→✅ | Failed, finding logged, **fix verified** |
| ⏭️ | Deferred (with reason) |
| ⬜ | Not yet tested |
| 🚫 | N/A by design (record *why*) |

### Severity (for findings)
`S1` blocker (data loss, security, role-isolation breach, crash) ·
`S2` major (flow broken, wrong result) · `S3` minor (cosmetic, copy, untranslated) ·
`S4` polish.

---

## Story template (copy this for each new story)

```markdown
### US-<AREA>-<n>: <short title>
**As a** <role>, **I want** <goal>, **so that** <benefit>.
**Routes/code:** <url(s)> · <key files>
**Priority:** P0/P1/P2 · **Last verified:** <date> on <branch/commit>

**Acceptance criteria**
- AC1 — Given <state>, When <action>, Then <result>.
- AC2 — …

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | … | … | ⬜ | — | — |

**Notes / open questions**
- …
```

---

## Worked examples (the depth to aim for)

### US-AUTH-01: Email/password login
**As a** registered user, **I want** to log in, **so that** I reach my role's workspace.
**Routes/code:** `/[locale]/login` · `apps/api .../auth` · role redirect in web middleware.
**Priority:** P0 · **Last verified:** 2026-06-25 on `59dc681` (run 3: EC4/6/7/10/11/12/14)

**Acceptance criteria**
- AC1 — Given valid credentials, When I submit, Then I land on my role's home
  (INDIVIDUAL→`/dashboard`, LEARNER→`/learner/dashboard`, OWNER→`/tenant/dashboard`,
  ADMIN→`/login` on 3001→dashboard).
- AC2 — Given I was deep-linked while logged out, When I log in, Then I return to that link.
- AC3 — The session persists across reload and the active locale is preserved.

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Wrong password | "Invalid email or password" (not "server unreachable") | 🐛→✅ | F2 | — |
| EC2 | Unknown email | Same generic message as EC1 (no user enumeration) | ✅ | — | — |
| EC3 | **Deactivated** account logs in | 403 → "account deactivated" message, not "server unreachable" | 🐛→✅ | F16 | `d5a13cc` |
| EC4 | Email-less kid logs in by **username** | Resolves `username@students.talim.local`, succeeds | ✅ | — | `teststudent1`→/learner/dashboard, 200 |
| EC5 | Kid with `mustChangePassword` | Forced to change-password screen before workspace | ⬜ | — | — |
| EC6 | Email with leading/trailing spaces | Trimmed, login succeeds | ✅ | — | `"  qa-owner@…  "` trims, logs in |
| EC7 | Email/username differing only in case | Case-insensitive match, succeeds | 🐛→✅ | F17 | `59dc681` |
| EC8 | Rate limit after N failed attempts | Clear "too many attempts" message, not a 500 | ⏭️ | — | needs 30 attempts; deferred |
| EC9 | XSS/SQL payload in fields | Escaped, no execution, generic error | ✅ | — | XSS-escape verified |
| EC10 | Very long inputs (10k chars) | Rejected gracefully, no crash | ✅ | — | 10k email/pw → 401, no 500 |
| EC11 | Locale switch then login | Lands in the chosen locale, not default | ✅ | — | uz selected → /uz/tenant/dashboard |
| EC12 | Logged-in user revisits `/login` | Redirected to their home, not shown the form | ✅ | — | bounces to /learner/dashboard (brief hydration flash) |
| EC13 | Session expiry mid-session | Bounced to `/login`, return-after-login honoured | ⬜ | — | — |
| EC14 | Submit with empty fields | Native required validation, no network call | ✅ | — | native "Please fill out this field."; no /auth/login call |

**Notes / open questions**
- Register has **no confirm-password field** → password-mismatch EC is 🚫 N/A (logged in run 1).

### US-OWNER-12: Delete a material
**As a** tenant owner, **I want** to delete a material, **so that** stale content is removed
and unassigned from students.
**Routes/code:** `/tenant/materials` · delete dialog component.
**Priority:** P1 · **Last verified:** 2026-06-25 on `claude/visual-qa`

**Acceptance criteria**
- AC1 — Given a material, When I delete and confirm, Then it's removed and its assignments drop.
- AC2 — A confirmation dialog appears before any destructive action.

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Delete dialog copy + delete aria-label | Translated per locale (was hardcoded Uzbek) | 🐛→✅ | F15 | `36f1f41` |
| EC2 | Delete a material **assigned** to N students | Assignments removed, students no longer see it | ⬜ | — | — |
| EC3 | Cancel the dialog | Nothing deleted, dialog closes | ⬜ | — | — |
| EC4 | Delete material mid-generation (podcast/quiz job running) | No orphaned job / graceful handling | ⬜ | — | — |
| EC5 | Delete then a learner is mid-chat on it | Learner's access revoked cleanly, no crash | ⬜ | — | — |
| EC6 | Another owner's material (cross-tenant) via crafted ID | 403 via `contentAccess.service.ts`; never deletable | ⬜ | — | **S1 — isolation** |
| EC7 | Double-click delete / double submit | Single delete, no duplicate error | ⬜ | — | — |

### US-LEARNER-01: Sees only assigned materials (multi-tenant isolation)
**As a** tenant learner, **I want** to see only the materials my tutor assigned me, **so that** my
classmates' and other orgs' content stay private.
**Routes/code:** `/learner/dashboard` · `GET /content`, `GET /content/:id(/*)` · `contentAccess.service.ts` (`assertCanAccessContent`, `buildContentListWhere`).
**Priority:** P0 (S1 isolation) · **Last verified:** 2026-06-25 on `4a0a57a` (live, run 4)

**Acceptance criteria**
- AC1 — The dashboard + `GET /content` return only content assigned to *me* while my membership is active.
- AC2 — Any per-record access to content I'm not assigned returns 404 (no existence leak), via the central guard.

**Edge cases & negative paths** — verified live with each learner's real bearer token (crafted `fetch`).
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Assigned learner dashboard | Shows only assigned content (1 article) | ✅ | — | `teststudent1`: 1 assigned |
| EC2 | `GET /content/:id` for **own assigned** content | 200 (control) | ✅ | — | — |
| EC3 | `GET /content/:id` for **B2C** content (`tenantId=null`) via crafted id | 404 "Content not found" | ✅ | — | cross-boundary blocked |
| EC4 | `GET /content/:id` for **another student's** content in the **same tenant** (unassigned) | 404 — never leaks | ✅ | — | **S1**: `teststudent2`→`teststudent1`'s id = 404 |
| EC5 | `GET /content/:id/file` (sub-resource) for unauthorized content | 404 (sub-paths guarded too) | ✅ | — | — |
| EC6 | `GET /content/:id` for a garbage / nonexistent id | 404, no crash | ✅ | — | — |
| EC7 | `GET /content` list as an **unassigned** learner | `contents:0` (empty) | ✅ | — | `teststudent2`: 0 |
| EC8 | UI navigate to an unauthorized content URL | Redirect to `/learner/dashboard`, no hang/leak | ✅ | — | F8 fix holds |
| EC9 | Cross-tenant learner via crafted id (other org) | 404 | ⬜ | — | other tenants have no content yet |
| EC10 | Deactivated mid-session then access (same token) | 404/403 immediately (not at JWT expiry) | ✅ | — | live: content 200→404, list→0, `/learner` 403; reactivate restores |
| EC11 | **Unassigned mid-view** (workspace open, owner revokes the ContentAssignment) | Access lost immediately on the same token; open page redirects to `/learner/dashboard` on next action, no hang/leak | ✅ | — | run 13 live: deleted assignment → content 200→**404**/file 404/list→0 (no JWT wait); reload → clean redirect to dashboard (F8 holds mid-session); restored |

**Notes / open questions**
- The guard keys on a `ContentAssignment` for *this* learner **and** an active membership — same-tenant-unassigned and cross-boundary both correctly 404.

### US-LEARNER-04: Cannot reach owner/admin tools (role guard)
**As the** platform, **I want** a learner blocked from owner/admin routes, **so that** privilege escalation is impossible.
**Routes/code:** `/tenant/*` (`requireTenantOwner`), `/admin/*` (`requireRole('ADMIN')`), web RoleGuard.
**Priority:** P0 (S1) · **Last verified:** 2026-06-25 on `4a0a57a` (live, run 4)

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Learner → `GET /tenant/content` / `/tenant/students` | 403 Forbidden | ✅ | — | both 403 |
| EC2 | Learner → `GET /admin/users` / `/admin/tenants` | 403 Forbidden | ✅ | — | both 403 |
| EC3 | Learner UI navigate to `/tenant/dashboard` | Redirect to `/learner/dashboard` | ✅ | — | — |
| EC4 | Learner own routes `/learner/assessments`, `/usage/me` | 200 (control) | ✅ | — | — |
| EC5 | Learner upload via B2C workspace topbar | No upload control rendered (incl. hidden file input) | ✅ | — | F7+F13 fixed prior runs |

### US-AUTH-03: Join-code enrolment + seat limits
**As a** student, **I want** to self-enrol in my tutor's class with a join code, **so that** I get their materials — but never past the paid seat limit.
**Routes/code:** `/[locale]/register` (+joinCode) · `POST /auth/join-class` · `joinTenantByCode` · `assertTenantQuota('STUDENT')`.
**Priority:** P0 (billing boundary) · **Last verified:** 2026-06-25 on `4978bb3` (run 5)

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Valid join code at register | Enrols as TENANT_LEARNER in that org | ✅ | — | run 2 (qa-joincode) |
| EC2 | Seat limit full — **enforcement** | Enrol blocked, 402 QUOTA_EXCEEDED (no over-enrol past paid seats) | ✅ | — | both `/register`+joinCode and `/join-class` call `assertTenantQuota('STUDENT')` |
| EC3 | Seat-full **error message** | "Seat limit reached", not "Upload limit reached" | 🐛→✅ | F26 | `4978bb3` |
| EC4 | Seat-full via **register** (account side-effect) | No orphaned account; clean failure | ❌ | F27 | — (structural, logged) |
| EC5 | Already an active member re-joins | Idempotent (no extra seat consumed) | ✅ | — | code: returns early if `existing.active` |
| EC6 | Owner tries to join own/other class | 400 "Tutors cannot join a class" | ✅ | — | code-verified guard |
| EC7 | Reactivating an inactive membership | Consumes a seat (re-checks quota) | ✅ | — | code: `if (!existing?.active) assertTenantQuota` |

### US-IND-05: Podcast — generate + player
**As an** individual, **I want** an AI voice podcast of my content with a working player, **so that** I can listen.
**Routes/code:** `/[locale]/content/[id]/podcast` · `components/podcast/PodcastPlayer.tsx` · `generatePodcast` job.
**Priority:** P1 · **Last verified:** 2026-06-25 on `5adc666` (run 5, qa-individual PDF, en/dark)

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | INDIVIDUAL "Create podcast" → generation | Episodes stream in (per section), Ready badge, TTS audio | ✅ | — | 2 episodes generated, ep1 Ready 2:31 |
| EC2 | Play an episode while/after generating | Audio plays, position advances; no blob churn / console spam | 🐛→✅ | F21 | `46e2473` |
| EC3 | Player "Speed:" label localized | en "Speed:", not hardcoded "Tezlik:" | 🐛→✅ | F22 | `5adc666` |
| EC4 | Learner views podcast page | Info message, **no** Create button (server-blocked) | ✅ | — | F12 (prior run) holds |
| EC5 | Episode list duration vs player duration | Should match | 🟡 | — | list "2:31" vs player "2:16" — minor estimate mismatch, not fixed |
| EC6 | Speed buttons 0.75/1/1.25/1.5x, ±15s, seek | All adjust playback | ⬜ | — | controls present; play verified, fine-controls not each clicked |

### US-IND-03 / 04 / 06: B2C workspace — Summary, Quiz, Chat (PDF)
**As an** individual, **I want** AI summary, quizzes, and a region-scoped tutor on my PDF, **so that** I can study it.
**Routes/code:** `/[locale]/content/[id]` · `/quiz/[id]` · chat panel · `components/learning/*`, `components/quiz/*`.
**Priority:** P0 · **Last verified:** 2026-06-25 on `b4ba377` (run 5, qa-individual PDF "Ven diagrammasi 2-qism.pdf", uz)

**Edge cases & negative paths**
| # | Story · Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | IND-03 · Summary auto-generates on Xulosa toggle | Renders fluent proper-Uzbek summary (3 paras), persists to history | ✅ | — | accurate Venn/perimeter summary |
| EC2 | IND-03 · summary content quality | No raw dumps / hallucinated UI | 🟡 | — | one garbled source word "masquniyoq" (model/OCR artifact, not UI) |
| EC3 | IND-04 · Quiz generate from PDF | Valid MC + short-answer, proper Uzbek, good distractors | ✅ | — | 4 Qs (button said 5 — AI count variance) |
| EC4 | IND-04 · short-answer Check reveal | "To'g'ri!" + Uzbek explanation, **no `<div>`-in-`<p>` hydration error** | ✅ | — | F4 regression holds (console clean) |
| EC5 | IND-04 · submit → score → retry | "50% · 2/4 to'g'ri" + Qayta ishlash | ✅ | — | — |
| EC6 | IND-06 · **PDF marquee region → chat seed** | Drag region → "[Page 1] Tanlangan hudud" chip + Uzbek prompt; answer scoped to region (vision) | ✅ | — | pending since run 1 — now verified |
| EC7 | IND-06 · chat history persists across tab/view switch | Conversation retained when toggling Material/Xulosa & Learn/Tutor tabs | ✅ | — | — |

### US-XCUT-01: i18n — every user-facing string localized, Uzbek-first
**As an** Uzbek-first user, **I want** every string/date/number correctly localized in uz/en/ru, **so that** the product reads natively with no raw keys, English leaks, or broken formatting.
**Routes/code:** `apps/web/messages/{uz,en,ru}.json` · `lib/format-relative-time.ts` · any `Intl.*` / `toLocale*` call.
**Priority:** P1 · **Last verified:** 2026-06-25 on `b4ba377`

**Acceptance criteria**
- AC1 — Every visible string resolves in all 3 locales; no raw keys (`content.foo`), no hardcoded English/Uzbek leaking across locales.
- AC2 — Dates, relative times, numbers, and plurals render correctly **including Uzbek** (where ICU data is thin).

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Relative timestamp in **uz** (content card, history) | Uzbek words ("3 hafta oldin"), not raw "-3 w" | 🐛→✅ | F18 | `b4ba377` |
| EC2 | Relative timestamp in en/ru | "3 weeks ago" / "3 недели назад" | ✅ | — | Intl correct for en/ru |
| EC3 | `toLocaleDateString()` (no locale arg) on tenant progress/students/heatmap | Renders a valid date, but in **system** locale not app locale | 🟡 | — | works; not app-locale-aware (low pri) |
| EC4 | Material delete dialog + aria-label across locales | Translated (was hardcoded Uzbek) | 🐛→✅ | F15 | `36f1f41` |
| EC5 | Login/marketing strings in uz/ru | Fully translated, no English leak, layout holds | ✅ | — | verified runs 1–2 |
| EC6 | Count strings pluralized (ru paucal, en singular) | ICU plural per locale: ru "4 раздела", en "1 section" | 🐛→✅ | F20 | `aa42bf1` |

**Notes / open questions**
- ICU in V8/Node lacks Uzbek data for `RelativeTimeFormat` (and likely thin for `DateTimeFormat`/`PluralRules`) — any new `Intl`-based formatting for `uz` must be checked manually (see F18).

### US-IND-08: Usage limit → subscription promotion modal
**As** a FREE individual who hits a usage limit, **I want** a clear upgrade prompt **so that** I know how to unblock myself.
- **AC:** every quota-gated action returning 402 `QUOTA_EXCEEDED` (with `upgradePlanCode: INDIVIDUAL_PRO`) or 413 `PLAN_FILE_LIMIT` opens the single global promotion modal with a feature-specific headline; the hard 120 MB cap (`FILE_TOO_LARGE`) shows an **inline** message, not the modal (upgrading wouldn't lift it); tenant-owner / already-Pro limits show an inline message, not the individual modal (role + `upgradePlanCode` branch in `useLimitErrorHandler`).
- **EC matrix (verified run 7 — Playwright, qa-individual on FREE with daily limits temporarily set to 0):**
  - EC1 **UPLOAD** (dashboard upload) → modal "today's upload limit" ✅
  - EC2 **GENERATION** (practice quiz) → modal "today's AI generation limit" ✅
  - EC3 **PODCAST** (per-episode regenerate) → modal "today's podcast limit" ✅
  - EC4 **VIDEO** (generate part) → modal ✅ (the video controller checks GENERATION before VIDEO, so the headline reads "generation")
  - EC5 **TUTOR_MESSAGE** (chat send) → modal "today's tutor message limit"; empty assistant placeholder removed on error ✅
  - EC6 **PLAN_FILE_LIMIT** (30 MB file vs FREE 25 MB cap) → modal "too big for the Free plan" + "100 pages / 25 MB" ✅
  - EC7 **FILE_TOO_LARGE** (130 MB > 120 MB hard cap) → **inline** "maximum upload size is 120 MB", no modal ✅
  - EC8 (logic) tenant-owner / already-Pro → inline message, no individual modal (no self-serve Pro path)
- **Files:** `lib/limit-error.ts`, `hooks/useLimitErrorHandler.ts`, `store/useUpgradeModal.ts`, `components/account/{global-upgrade-modal,upgrade-dialog}.tsx`, `lib/pricing.ts`, the wired pages/hooks (upload/youtube/quiz/summary/video/podcast/chat). See FEATURES.md §6.8.

---

## Story index (backlog — expand each with the template)

> Tick `spec'd` when the story has full ACs + EC matrix; `done` when all P0/P1 ECs are ✅/🐛→✅/🚫.

### AUTH
- [x] US-AUTH-01 Login · spec'd ✅
- [ ] US-AUTH-02 Register (valid / duplicate email / weak pw / join-code self-enroll)
- [x] US-AUTH-03 Join-code enrol: valid / wrong / **seat-limit full** / already-member · spec'd ✅ · seat-limit enforced (both paths); F26 fixed, F27 logged (run 5)
- [ ] US-AUTH-04 Reset password (request → email/link → set → re-login)
- [ ] US-AUTH-05 Logout (clears session, redirect, back-button can't re-enter)
- [ ] US-AUTH-06 Become-tutor request → admin approval → role unlock

### INDIVIDUAL (B2C)
- [ ] US-IND-01 Upload PDF → processing → READY → workspace (+ OCR scanned-PDF ladder)
- [ ] US-IND-02 Add YouTube → transcript → READY
- [x] US-IND-03 Summary (markdown, KaTeX, proper Uzbek output) · spec'd ✅ · PDF summary verified (run 5)
- [x] US-IND-04 Quiz generate → MC/short → check → submit → retry · spec'd ✅ · PDF quiz verified (run 5)
- [x] US-IND-05 Podcast generate + player · spec'd ✅ · generation + playback verified (run 5); F21/F22 fixed
- [x] US-IND-06 Chat: streamed, scoped-to-material, sources, seeding from selection, visual tutor · spec'd ✅ · **PDF marquee seed verified (run 5)**; transcript-seed+mermaid+KaTeX (run 2)
- [x] US-IND-07 Dashboard grid / empty / search / thumbnails · search filter verified (run 5, F19 logged)
- [x] US-IND-08 Usage limit → subscription promotion modal (upload / gen / podcast / video / tutor + plan-file cap) · spec'd ✅ · all 7 cases verified live (run 7); F31 fixed
- [x] US-IND-19 Slides deck — DeckPlayer render + nav · **live render verified (run 13)** (5-slide deck, prev/next/fullscreen/progress/aria-live); **F57 focus-ring + F60 Regenerate-no-op fixed**. Note: decks are **per-locale** (uz showed the generate-empty-state — by design, like podcast/video)

### TENANT_OWNER
- [ ] US-OWNER-01 Create student (email + email-less kid, credentials-once, seat count)
- [ ] US-OWNER-02 Reset student password
- [ ] US-OWNER-03 Deactivate / reactivate student
- [ ] US-OWNER-04 Join code regenerate (old rejected) / copy
- [ ] US-OWNER-05 Upload material / re-read OCR
- [ ] US-OWNER-06 Assign material to student(s) · F58 fixed (run 13): multi-assign now continues on a per-learner failure + shows error
- [ ] US-OWNER-07 Question bank build + approve (proper Uzbek, LaTeX)
- [ ] US-OWNER-08 WRITTEN assessment create + assign + grade · F56 fixed (run 13): assigning a DRAFT assessment now blocked (400)
- [ ] US-OWNER-09 GAME assessment (timer, speed points, streaks, leaderboard)
- [ ] US-OWNER-10 Progress: per-student + class, post-submit update
- [ ] US-OWNER-11 Billing / seat-limit display
- [ ] US-OWNER-12 Delete material · spec'd ✅
- [ ] US-OWNER-13 Settings / org rename

### TENANT_LEARNER
- [x] US-LEARNER-01 Sees **only assigned** materials (isolation) · spec'd ✅ · done (P0 ECs green)
- [x] US-LEARNER-02 Take quiz / game, see own progress · GAME played end-to-end in uz (run 5); F23 fixed (player+leaderboard i18n)
- [x] US-LEARNER-03 **Deactivated → content access lost immediately** (S1 isolation) · login-side (F16) + live mid-session (US-LEARNER-01·EC10) ✅
- [x] US-LEARNER-04 Cannot upload / cannot reach owner tools (role guard) · spec'd ✅ · done

### ADMIN (3001)
- [ ] US-ADMIN-01 Tutor-requests: approve + set seat limit → org + ACTIVE subscription
- [x] US-ADMIN-02 Users / tenants / content / generated / subscriptions / usage / audit · user-detail + **subscription patch + audit** verified (run 5); F25 fixed (credential autofill)
- [x] US-ADMIN-04 Tenant detail — org/sub editor, members table (XSS-escaped, long-name wrap), usage-vs-limits · verified live (run 13)
- [x] US-ADMIN-05 Content moderation — **Retry** (FAILED→PROCESSING→READY recovered + `content.retry_job` audit) + **Delete** (native confirm → 204 → live removal + `content.delete` audit) · verified live (run 13, closes Runs 7–11 deferral); F52 holds
- [x] US-ADMIN-06 Usage & costs — per-user spend table + 7d/30d/90d range toggle (refetches `?days=`) · verified live (run 13)
- [x] US-ADMIN-07 Audit log — newest-first, all mutation types + from/to metadata · re-validated (run 13)

### XCUT (cross-cutting)
- [x] US-XCUT-01 i18n: every user-facing string in uz/en/ru, no hardcoded leaks (Uzbek-first) · spec'd ✅
- [ ] US-XCUT-02 Mobile (drawer/FAB) + tablet (768) layouts
- [ ] US-XCUT-03 a11y: focus, aria-labels, keyboard nav, back/forward · F48/F49 (run 9); **F55 mobile-Sheet focus-trap + F57 deck focus-ring fixed (run 13)**
- [ ] US-XCUT-04 Security: role isolation via `contentAccess.service.ts`, XSS escape, no enumeration
- [ ] US-XCUT-05 Resilience: SSR errors, stale-cache, slow network, double-submit

---

## Findings ledger

Central registry. Each row links to the story/EC that produced it and the fix that closed it.
Backfill F1–F14 from `visual-qa-report.md` as you revisit them.

| F# | Sev | Story · EC | Summary | Status | Fix commit |
| --- | --- | --- | --- | --- | --- |
| F64 | S2 | US-IND-22 · EC | **AI tutor ignored chat history — follow-up questions got a canned "please clarify".** Asking an in-scope question, then a follow-up like *"koproq tuwunting, chizib tushuntiring"* ("explain more, draw it") or *"oxirgi yechilgan masalni visual tushuntirib bering"* ("explain the last solved problem visually") returned the static **"Savolingizni biroz aniqlashtirib bera olasizmi?"** clarification instead of an answer. **Root cause:** the scope gate `classifyTutorScope` (`lib/tutor-scope.ts`) runs *before* the tutor LLM and was **stateless** — it saw only the current message + its RAG context, never the conversation, so anaphoric follow-ups had no referent → `needs_clarification` → controller short-circuits with the canned reply; the tutor (which *does* get history) never ran. **Also found:** `chat.controller.ts` fetched history with `orderBy: asc, take: 20` = the **20 oldest** messages, so long sessions lost recent memory. **Fix:** thread the recent (refusal/clarification-stripped) turns into both the LLM classifier (+ explicit follow-up instruction) and the heuristic fallback (`looksLikeFollowUp`); fetch the most-recent 20 chronologically. Smoke test extended with both reported follow-ups (now `direct`). Verified live via real `/chat/stream`: in-scope Q → answer; follow-up → 509-char answer referencing *"yuqoridagi diagramma"* (not the clarification). | 🐛→✅ | `da1174c` |
| F63 | S2 | US-IND-06 · EC | **Selecting a PDF region opened a duplicate Learn/AI-tutor panel on desktop.** `handleExcerpt` (`content/[id]/page.tsx`) called `setPanelOpen(true)` unconditionally on a marquee region-select; the `ContentLearnPanelSheet` (mobile Learn drawer) is rendered at every breakpoint, so on desktop it slid open **over** the already-visible `ContentLearnPanel` — two identical Learn panels. (First seen as a non-repro observation in Run 2.) Gated `setPanelOpen(true)` to mobile only (`matchMedia('(max-width: 767px)')`), mirroring the existing `?panel=chat` effect; on desktop the region now just seeds the visible panel's AI-Tutor tab. Verified live (1440px): marquee select → 0 dialogs, no backdrop, AI-Tutor tab active, excerpt chip seeded. | 🐛→✅ | `d52558f` |
| F60 | S3 | US-IND-19 · EC4 | **Slide-deck "Regenerate" was a silent no-op once a deck existed.** `createSlides` (slides.controller.ts) short-circuited to the cached READY deck unconditionally, so the Regenerate button (`generate.mutate`) returned the same deck (`cached:true`) and never regenerated. Added a `regenerate` flag that skips the cache short-circuit; the button passes it. Verified live: control (no flag) → `cached:true`; `regenerate:true` → `cached:false`, fresh 5-slide deck in 37s. (The audience-cache-key part — `@@unique([contentId,locale,scopeKey])` lacks `audience`, and there is no audience selector in the UI — is a separate migration-bearing enhancement, deferred.) | 🐛→✅ | `a5680a6` |
| F59 | S2 | US-IND-24 · EC1 | **Quiz generation that returns 0 questions / FAILS spun forever — no FAILED state.** The `Quiz` model has **no `status` field**, so a 0-question or failed `generateQuiz` job had nowhere to persist FAILED; `useQuiz` polled until `questions.length` (never, on failure) and `QuizCard`/quiz page rendered the "generating…" spinner **indefinitely**. **Fixed (no-migration):** `isQuizGenerationStale` — 0 questions + older than the 120s generation window → flips to a "Quiz generation failed — go back and try again" state (uz/en/ru) + a re-render timer; self-corrects when questions arrive and never false-flags a still-generating quiz. Verified live: backdated empty quiz → failed state; fresh empty quiz → "generating"; deleted both. (A persisted `Quiz.status` remains the ideal robust fix — needs a migration, still logged as the enhancement.) | 🐛→✅ | `a3d2be3` |
| F58 | S2 | US-OWNER-06 · EC6 | **Multi-assign aborted silently on one failing learner.** `assign-students-panel.tsx` `handleAssign` awaited each assignment in a loop with **no try/catch** — if one learner rejected (e.g. deactivated since the panel loaded — a stale-cache race; backend `assignContent` 404s on an inactive membership) the whole loop threw, skipping the rest, with **no error toast** and the selection cleared/button stuck. Now each assignment is independent; failed ids stay selected for retry and an inline `assign.partialError` (uz/en/ru, ICU plural) shows. Verified live: selected a student → deactivated via API → Assign → "Couldn't assign to 1 student. Please try again." + student stayed selected. | 🐛→✅ | `f9e8652` |
| F57 | S2 | US-XCUT-03 · EC8 | **Slide-deck player had no visible keyboard focus ring.** `DeckPlayer.tsx` focusable carousel root used `outline-none` with no `focus-visible` replacement (and the prev/next/fullscreen buttons had none) — keyboard users got no focus indicator (WCAG 2.4.7). Added `focus-visible:ring` (inset primary on the root, offset ring on buttons). Verified live on the 5-slide deck: keyboard focus renders a 2px inset primary ring `rgb(119,81,236)`. | 🐛→✅ | `a3bcd85` |
| F56 | S2 | US-OWNER-08 · EC6 | **A DRAFT assessment could be assigned.** `assessment/assessments.ts` `assignAssessment` checked only existence, not `status` — a DRAFT is filtered out of the learner's PUBLISHED-only list (`learner.ts`) and 404s on submit, so an owner could create a **dead assignment with no signal**. Now 400 "Assessment must be published before it can be assigned". Verified live: flip to DRAFT → assign 400; PUBLISHED control → 201; restored. | 🐛→✅ | `1be7528` |
| F55 | S2 | US-XCUT-03 · a11y | **Mobile Sheet drawer was not a real modal dialog.** Hand-rolled `packages/ui/components/sheet.tsx` (Menyu/Learn drawers, tenant/dashboard sidebars) had **no `role=dialog`/`aria-modal`, no initial focus, no focus trap (Tab leaked to the page behind the backdrop), no Escape-to-close, no focus restore, no scroll-lock** — confirmed live (Tab → background logo; Escape no-op). Added full dialog semantics + Tab-trap-with-wrap + Escape + focus-restore + scroll-lock + `aria-labelledby` from the first heading. Verified live (375px): focus moves in, Tab wraps inside, Escape closes + restores focus to trigger, body scroll locked/unlocked. | 🐛→✅ | `b433ea4` |
| F54 | S3 | US-XCUT-02 · tablet | Marketing navbar links pill `md:flex` overflowed at 768px and **clipped the "Get started" CTA**; gated to `lg:flex` so the bar shows logo+toggle+Kirish+Boshlash at tablet (run 11). | 🐛→✅ | `c520bb6` |
| F53 | S3 | US-XCUT-02 · mobile | Marketing **hero clipped at 390px** — the hero grid lacked a base `grid-cols-1`, so the mobile column sized to the product card's max-content (419px in a 342px container), clipping the headline/subtitle/card (all 3 locales; `overflow-hidden` hid the scroll). Added `grid-cols-1` (run 11). | 🐛→✅ | `4d5652a` |
| F52 | S2 | US-ADMIN-05 · audit | **`POST /admin/contents/:id/retry-job` wrote no audit row** (delete-content/delete-generated do) — re-enqueueing a stuck job was invisible in the audit log. Added `content.retry_job` audit + a `req.user` guard. Verified live. | 🐛→✅ | `dbf9f4e` |
| F51 | S2 | US-ADMIN-03 · audit | **`PATCH /admin/users/:id` did not audit non-role edits.** Only role changes wrote `user.role_change`; a name / `preferredLocale` / the sensitive plaintext `adminPasswordNote` edit persisted with NO audit row — breaking "every admin action recorded". Now also writes `user.update` (field names only, never the note value). Verified live: role-change/reset-pw/subscription/delete already audited; name+note edit → `user.update`. | 🐛→✅ | `d3bcd3c` |
| F48 | S2 | US-XCUT-03 · a11y | **Two `<select>` on `/tenant/assessments` had no accessible name** (axe `select-name`, critical); added `aria-label` from each section title. Re-audit 2→0. | 🐛→✅ | `0d51248` |
| F49 | S3 | US-XCUT-03 · a11y | **Dashboard content-card thumbnail link had no discernible text** (axe `link-name`); added `aria-label={content.title}`. Re-audit 1→0. | 🐛→✅ | `0d51248` |
| F50 | S3 | US-XCUT-03 · a11y | **Active sidebar nav fails color-contrast** (`text-primary` on `bg-primary/10`, < 4.5:1); app-wide design-system decision → logged. | 🟡 logged | — |
| F46 | S2 | US-AUTH-04/05 · session | **No session revocation on password change / logout.** Tokens are stateless 7-day JWTs with no `tokenVersion`/denylist, so changing the password (or logging out) does NOT invalidate existing tokens — confirmed live: old token still 200s on `/auth/me` after a password change. A leaked/stolen token survives a reset for the full token lifetime (logout is client-side only). **Fix (structural, shared with F45):** add a `User.tokenVersion`, embed it in the JWT, bump on password/role change, reject stale versions in `authMiddleware`. Needs auth-path + perf review. | 🟡 logged | — |
| F45 | S2 | US-AUTH-06 · approval | **Stale JWT after a role change (tutor approval).** Admin approval flips `User.role` INDIVIDUAL→TENANT_OWNER in the DB, and `/auth/me` (DB-reloaded) returns OWNER so the web routes to `/tenant/dashboard` — but the user's existing JWT still encodes `role:INDIVIDUAL`, so **every `/tenant/*` API call 403s until they log out and back in** (`authMiddleware` only backfills role for legacy tokens). Confirmed live: approve → `/auth/me` OWNER, `/tenant/students` with old token **403**, re-login → 200. **Fix (structural, NOT auto-applied):** have `me()` reissue a fresh token when the DB role ≠ the JWT role and store it in `session-sync` (or add a `tokenVersion`); needs auth-path review + testing. | 🟡 logged | — |
| F44 | S3 | US-OWNER-01 · concurrency | **Concurrent create-student raced to a 500.** Two simultaneous identical creates (double-click) both passed the `findUnique` pre-checks then collided on the unique email/username constraint; the Prisma **P2002 was uncaught → 500**. Now caught → **409** "Username already taken". Verified: 3 parallel creates 201/500/500 → 201/409/409. (Sequential dup + case-variant already returned clean 409s.) | 🐛→✅ | `27f6ac6` |
| F43 | S2 | US-AUTH-02 · EC13 | **Orphaned account on register-with-invalid-join-code** (broadened F27 from seat-full to ANY join failure). `register()` created the user + FREE sub before `joinTenantByCode`, so an invalid code 404'd after the account existed; the email was then stuck on retry. Pre-validate the code's tenant exists before `user.create`. Verified live: invalid code → 404, no account, re-register succeeds. | 🐛→✅ | `0379da8` |
| F42 | S3 | US-LEARNER-06 · EC6 | **Forced password change could be satisfied with the same password.** `changePassword` had no new≠current check, so a `mustChangePassword` student could "change" to the tutor-set secret and clear the flag without rotating. Now 400 "New password must be different from the current password". Verified live. | 🐛→✅ | `0169859` |
| F41 | S3 | US-IND-10 · EC15 | **Upload-error toast showed hardcoded English "Upload failed" on uz/ru.** `useFileUpload` fell back to a literal `'Upload failed'`; the dashboard quick-action + learning-topbar callers don't pass a localized message (only `UploadCard` does), so non-English users saw English on every failed upload. Defaulted the fallback to `t('content.uploadFailed')` inside the hook. Verified live (uz): "Yuklash amalga oshmadi. Qayta urinib ko'ring." | 🐛→✅ | `a80ddad` |
| F40 | S3 | US-IND-10 · EC22 | **Upload picker still offered PowerPoint after F35 rejected it.** `FILE_UPLOAD_ACCEPT = '.pdf,.ppt,.pptx'` invited users to pick a `.ppt/.pptx` the server now 400s — a UI/server mismatch. Narrowed `accept` to `.pdf`. | 🐛→✅ | `a80ddad` |
| F32 | S2 | US-IND-25 · podcast | **A single per-episode podcast regenerate failure marked the WHOLE podcast FAILED** — the shared Bull `failed` handler ignored `episodeId` and forced `status:FAILED`, destroying an otherwise-READY podcast whose other episodes were intact. Now episode-scoped: recompute status from surviving audio (READY if any episode still has audio). | 🐛→✅ | `e0a8846` |
| F33 | S2 | US-OWNER-11 · billing | **TRIALING tenant subscription was fully locked out** — `requireActiveTenantSubscription` 402'd every non-ACTIVE status, so a trial org couldn't upload / add students / generate. TRIALING now counts as active access; PAST_DUE/CANCELED still block. | 🐛→✅ | `e0a8846` |
| F34 | S2 | US-LEARNER-06 | **`mustChangePassword` was not enforced** — surfaced only as a *dismissible* welcome banner, so a student could use the whole app on a temporary password. Added a learner-shell route gate forcing `/learner/settings` until changed (store flag cleared on success). Verified live: flagged student bounced to settings (stable, no loop); normal learners unaffected. | 🐛→✅ | `15acc73` |
| F35 | S2 | US-IND-01 · upload | **PowerPoint (.ppt/.pptx) uploads ALWAYS failed** — accepted by multer, then `processContent` routed `SLIDE` through `pdf-parse` (PDF-only), which throws on a pptx ZIP (no extractor exists). Now rejected at the upload boundary with a clear 400 ("export to PDF and upload that"). | 🐛→✅ | `e0a8846` |
| F36 | S3 | US-IND-23 · chat | **Chat mid-stream server error rendered the raw English "Stream failed"** (un-localized on uz/ru) and didn't persist (ghost message on reload). Now flagged → routed through the outer catch (removes the optimistic bubbles) → ChatWindow surfaces the localized chat error + restores the composer. | 🐛→✅ | `15acc73` |
| F37 | S2 | US-ADMIN-03 · sub | **Admin cancel of an individual subscription rewrote `planId`→FREE**, so a later re-ACTIVATE returned FREE (the paid plan was lost); the tenant path kept it. CANCELED already gets free-plan limits at read time, so now only the status is written. | 🐛→✅ | `e0a8846` |
| F38 | S2 | US-IND-20 · OCR | **`POST /content/:id/ocr-region` (paid vision OCR) had no rate limit** (unlike `/reparse`) — a cost-abuse vector. Added `reparseRateLimit` (access was already guarded by `blockLearnerMutations` + `assertCanAccessContent`). | 🐛→✅ | `e0a8846` |
| F39 | S2 | US-OWNER-09 · GAME | **GAME leaderboard speed-points are computed from client-supplied per-question `timings`** (trusted), so a learner can POST `timings:0` to force `speedFactor=1.0` and inflate points. A correct fix needs a server-measured clock (persist a per-attempt/served timestamp) → logged, not fixed. | 🟡 logged | — |
| F31 | S3 | US-IND-08 | **Usage-limit errors mostly didn't surface the upgrade modal.** Only file uploads (PLAN_FILE_LIMIT) opened it; daily quota errors (UPLOAD/GENERATION/PODCAST/VIDEO/TUTOR_MESSAGE) failed silently or with ad-hoc inline text — the tutor stream threw an unhandled rejection (empty assistant bubble left behind), and video/podcast/quiz/summary had no or partial 402 handling. Built a unified `classifyLimitError` + role-aware `useLimitErrorHandler` + one global `useUpgradeModal`/`GlobalUpgradeModal` (mounted in `providers.tsx`) and wired every quota-gated call site. Self-serve INDIVIDUAL limits → modal; tenant / top-plan / hard 120 MB cap → inline. Verified all 7 cases live (run 7). | ✅ fixed | _pending commit (this session)_ |
| F30 | S3 | US-IND-05 · EC | **Podcast per-episode regenerate (+ overall retry) gave no error feedback.** The new per-episode "Qayta urinish" button (and the stuck/failed retry button) called the regenerate/create mutation but never surfaced its rejection — a 402 quota (FREE plan, podcast quota 1/1 already spent by the bulk generation) returned silently, so the button looked like it did nothing. Added `classifyGenerationError` → visible header message ("Podkast cheklovi tugadi {used}/{limit}" for quota; plan/generic otherwise). Verified via Playwright: FREE regenerate → 402 → "Podkast cheklovi tugadi (1/1)." | ✅ fixed | `b861405` |
| F15 | S3 | US-OWNER-12 · EC1 | Material delete dialog + aria-label hardcoded Uzbek | ✅ fixed | `36f1f41` |
| F16 | S2 | US-AUTH-01 · EC3 | Deactivated login showed "server unreachable" not "deactivated" | ✅ fixed | `d5a13cc` |
| F17 | S2 | US-AUTH-01 · EC7 | Email/username login was **case-sensitive** — any capitalization difference (mobile auto-capitalize) → "Invalid email or password", user locked out of a P0 flow. Register also stored email verbatim. Fixed: lowercase+dedupe email on register; case-insensitive (`mode:'insensitive'`) email & username match on login. | ✅ fixed | `59dc681` |
| F18 | S2 | US-XCUT-01 · EC1 | **Uzbek relative timestamps rendered broken.** `Intl.RelativeTimeFormat('uz')` resolves to `uz` but ICU (V8/Node) ships **no Uzbek relative-time data**, so it emitted raw fallback `"-3 w"` / `"-2 d"` / `"-5 h"` (leading minus + English abbreviations) on **every content card timestamp** — shown to the **primary Uzbek audience** on the B2C dashboard + learning-history panel. en/ru correct. Fixed: format Uzbek manually (`"3 hafta oldin"`, `"hozirgina"`, future `"3 kundan keyin"`); keep `Intl` for en/ru. Verified live: card now reads "3 hafta oldin". | ✅ fixed | `b4ba377` |
| F29 | S3 | US-XCUT-01 · EC7 | **Learner progress page hardcoded English.** 7 strings (Progress / My progress / "Your activity and assigned materials." / Learning streak / "{n} days" / Average quiz / empty-state copy) shown verbatim on uz/ru. Added `learner.progress` namespace (uz/en/ru), reused `assignedMaterials`+`streakDays`, wired `useTranslations`. Verified live: uz page zero English leaks ("TARAQQIYOT" / "Mening taraqqiyotim" / "O'rganish ketma-ketligi" / "1 kun"). **Remaining learner-area i18n debt (logged, not fixed):** learner Settings page, learner assessments **list** page (F24), tenant `/tenant/*` pages. The 3 highest-traffic learner pages (dashboard F28, progress F29, GAME player F23) are now localized. | ✅ fixed | `65e2b73` |
| F28 | S3 | US-XCUT-01 · EC7 | **Learner dashboard hardcoded English** (every student's landing page, Uzbek-first). ~11 strings leaked to uz/ru: stat labels (Assigned/Streak/Avg quiz), streak "N days", "Your teacher will assign materials here", Tasks section (title/"View all"/"N questions · used/max attempts"), and the "Continue where you left off" card (title/"N% complete"/"Continue learning") + "Your school" fallback. Added `learner.*` keys (uz/en/ru, ICU plural for streak/questions) + wired via the existing `useTranslations('learner')`. Verified live: uz dashboard has **zero** English leaks. | ✅ fixed | `295cdc0` |
| F26 | S3 | US-AUTH-03 · EC | **Seat-limit-full reported as "Upload limit reached".** When a tenant's student seat limit is hit (owner adding a student, or a learner self-enrolling via join code), `subscription/tenant.ts` threw `QuotaExceededError('UPLOAD', …)` because `QuotaFeature` had no `STUDENT` member — so the API/UI showed the misleading "Upload limit reached" (`feature:UPLOAD`) for a full class. Added a `STUDENT` QuotaFeature + "Seat limit reached" message; threw it from the tenant STUDENT branch. Verified live: full-class register → 402 `{message:"Seat limit reached", feature:"STUDENT"}`. | ✅ fixed | `4978bb3` |
| F27 | S2 | US-AUTH-03 · EC | **Orphaned account when register-with-join-code hits a full class.** `POST /auth/register` creates the user **before** calling `joinTenantByCode`, so when the class is seat-full the join throws 402 *after* the account already exists. The user sees "Seat limit reached" and assumes registration failed, but their account was created as a plain **INDIVIDUAL** (verified: login as the email succeeds, role INDIVIDUAL, tenantId null) — they're not in the class, and retrying the same email now hits "Email already registered". Fix is structural (validate the join code + seat quota *before* creating the user, or make create+join atomic) → logged, not fixed. | 🟡 logged | — |
| F25 | S2 | US-ADMIN-02 · EC | **Admin user-detail credential fields silently browser-autofilled.** On `/users/[id]`, the "Password note (backfill)" and "Set new password" inputs had no `autoComplete` guard, so Chrome **silently pre-filled the operator's own saved login** (`admin@talim.local` / `Talim-655ed15296ab`) into them on every page load (verified `:autofill = true`); the "Recorded password" display even reflected the autofilled note, making it look like the *target* user had that password. Clicking "Set password"/"Save note" would then overwrite the target user's password with the admin's own — a credential-leak + silent password-change. Fixed: `autoComplete="off"` on the note, `autoComplete="new-password"` on the set-password input. Verified live: both fields now empty, `:autofill = false`. | ✅ fixed | `73e41c9` |
| F23 | S3 | US-LEARNER-02 · EC | **GAME quiz player + leaderboard hardcoded English** (CLAUDE.md-flagged debt). `game-quiz-player.tsx` + `leaderboard-table.tsx` rendered ~15 English literals (intro meta, Start/Cancel, Scoring, Your score, result summary, Your answer/Correct, Done, Question N/M, Number/Your-answer placeholders, Next, No scores, pts) — shown to Uzbek students in the marquee GAME feature. Added `learner.game` namespace (uz/en/ru, ICU plural for ru points/questions) + `useTranslations`. **Verified live**: full game played in uz (intro "4 ta savol…", "1 / 4-savol", "SIZNING BALLINGIZ", "Tayyor", leaderboard "1510 ball"), 0 console errors. | ✅ fixed | `e57e4ef` |
| F24 | S3 | US-XCUT-01 · EC7 | **Assessments pages largely un-i18n'd (hardcoded English).** The tenant assessments admin page (`/tenant/assessments`) and the learner assessments **list** page (`/learner/assessments`) render English on uz/ru: "Assessments", "Question banks", "Publish assessment", "Mode"/"Written"/"Game", "Max attempts", "Assign", "Results & leaderboard"; learner list "Quizzes & tasks", "Play", "Leaderboard", "Attempts: N/M · Latest X% · N pts", "Attempt limit reached", "Hide leaderboard". The GAME *player* + *leaderboard table* are now localized (F23); these surrounding list/admin pages are a larger remaining surface → logged, not fixed. | 🟡 logged | — |
| F21 | S2 | US-IND-05 · EC2 | **Podcast playback broken + blob-404 spam.** The audio-loading effect (`podcast/page.tsx`) depended on `flushProgress` — a `useCallback` over the react-query mutation, so a new identity every render. While the podcast polled (3s) during generation the parent re-rendered constantly, re-running the effect: it revoked the current audio blob URL and created a new one **every render**, spamming `blob: ERR_FILE_NOT_FOUND` (10+/play) and resetting `<audio>` to 0 so `play()` never stuck (`paused:true, t:0`). Scoped the effect to the audio episode id via a stable `flushProgressRef` + `cancelled` guard. Verified live: src stable across poll cycles, playback advances (`paused:false, t:1.52`), console 0 errors. | ✅ fixed | `46e2473` |
| F22 | S3 | US-IND-05 · EC3 | **Podcast player "Speed:" label hardcoded Uzbek.** `PodcastPlayer.tsx` rendered the literal `"Tezlik:"`, shown on en/ru pages too. Added `content.playbackSpeed` (uz/en/ru) + `useTranslations`. Verified: en "Speed:". | ✅ fixed | `5adc666` |
| F20 | S3 | US-XCUT-01 · EC6 | **Count strings not pluralized (Russian + English).** `sectionCount`/`quizCount`/`questionCount`/`episodes`/`quizAttempts` hardcoded the genitive-plural suffix (`"{count} разделов"`, `"{count} sections"`) instead of ICU `plural`. Russian showed `"4 разделов"` (needs paucal `"4 раздела"`; "разделов" is 5+ only) and English `"1 sections"`. Fixed all 5 in en (`one`/`other`) + ru (`one`/`few`/`many`/`other`) using next-intl ICU `plural`; uz left unchanged (Uzbek nouns invariant after numerals). Verified live: ru "4 раздела"/"2 вопроса"/"5 вопросов", en "4 sections". | ✅ fixed | `aa42bf1` |
| F19 | S3 | US-IND-07 · EC | **Dashboard search "no results" shows the "no content yet" empty state.** Typing a non-matching term in the dashboard hero search (client-side filter of the recents grid) empties the list and renders "Hali material yo'q. …birinchi materialingizni qo'shing" ("You have no materials yet, add your first") — confusing for a user who *does* have content but filtered it out. Should show a distinct "no results match your search" state. Not fixed: needs a new string in uz/en/ru + grid logic to distinguish filtered-empty from truly-empty (product copy decision). | 🟡 logged | — |
| … | | | *(backfill F1–F14 here)* | | |


---

# Coverage-expansion additions (2026-07-12) — reservations, observations ledger, index

## B.1 — Findings-ledger reservation (insert as a note above the ledger table + reserved rows)

> **Reserved block F76–F99** for the coverage-expansion pass (US-IND-26→34, US-LEARNER-14→18,
> US-OWNER-18→25, US-ADMIN-08b/10/11, US-XCUT-22→24). Claim numbers **in order** as findings are
> confirmed via the §E self-verification protocol; do not reuse F1–F75. A finding is only assigned
> an F-number after reproduce-twice + evidence-bundle + skeptic pass. Everything unverified or
> preference-level goes to the **Observations ledger (`O<n>`)** below, not here.

| F# | Sev | Story · EC | Summary | Status | Fix commit |
| --- | --- | --- | --- | --- | --- |
| F76 | S3 | US-OWNER-20 · due-date | Assign due-date hint copy (uz/en/ru) + `assessment/shared.ts:168` schema comment both said the date "does not block submission", but `submitLearnerAssessment` (`learner.ts:97`) hard-**403s** late submits for WRITTEN + GAME. Reproduced live (past dueAt → 403). Corrected copy + comment to match enforcement. | 🟢 fixed | R18 (branch) |
| F77 | S3 | US-OWNER-18 · assign | `assignAssessment` (`assessments.ts:133-136`) does `if (existing) continue` — re-assigning an already-assigned learner silently no-ops (`201 {assignments:[]}`), so a **due date / content-scope set on re-assign is dropped**, and (no unassign route) the due date can't be changed once assigned. Needs a product decision on upsert semantics. | 🟡 logged | — |
| F78 | S3 | US-ADMIN-11 · EC3 | Flagging generated media is **label-only** — `GeneratedMediaReview{status:FLAGGED}` is written + shown in admin `/generated` but an exhaustive grep finds **zero** consumers on any learner/serving path, so a FLAGGED podcast/quiz/slideshow is still fully served. (Predicted by the expansion pass.) | 🟡 logged | — |
| F79 | S3 | US-OWNER · csv-export | Students-roster CSV export escaped only RFC-4180 (quote/comma/newline), **not** formula injection (CWE-1236): a student name / `@username` starting with `= + - @ TAB CR` executes as a formula in Excel/Sheets. Names are user-controlled (self-enroll / owner / CSV import). Prefixed formula-leading cells with `'`; verified live end-to-end. | 🟢 fixed | R18 (branch) |
| F80 | S3 | US-XCUT · i18n-ru | `ru.json` `becomeTutorPromo` + `readyToLearnSubtitle` (B2C dashboard) were **Russian written in Latin transliteration** ("Upravlyayte uchenikami…", "Dobavte istochnik…") instead of Cyrillic — garbled/off-brand for the secondary-priority language. Deep 3-file sweep confirmed only these 2 (key-parity 1287/1287/1287, 0 missing). Corrected to Cyrillic; verified live on `/ru/dashboard`; typecheck trio green. | 🟢 fixed | R19 (branch) |
| F81 | S4 | US-IND · podcast | Podcast (audio) transcript click-to-seek hint read "**Videoning** shu joyiga o'tish…" (says *video* on an `<audio>` player) — the shared `TranscriptPanel` (podcast + video viewer) hardcoded one `transcriptClickToSeek` key = "video" in all 3 locales. Added `mediaKind='video'|'audio'` prop (default video → video viewer unchanged) + `transcriptClickToSeekAudio` (uz/en/ru); `PodcastPlayer` passes `audio`. Verified live ("Audioning…"); typecheck trio green; key-parity 1288³. Was O83. | 🟢 fixed | R20 (branch) |
| F82–F99 | — | *(reserved — claim in order)* | — | ⬜ | — |

**High-probability finding candidates flagged during this expansion** (each needs the §E bundle before it earns an F#):
- Impersonated session is unrestricted + non-revocable after exit (US-ADMIN-08b·EC16) — **S1** hypothesis.
- FLAGGED media not actually hidden from learners (US-ADMIN-11·EC3) — **S2** or product-gap.
- B2C/tenant flashcards POST lacks `enforceQuota` → free generation (US-IND-28·EC17) — **S2**.
- `shared.ts:168` "informational only" comment contradicts `learner.ts` 403 due-date enforcement (US-OWNER-20) — pin, then S3 doc fix.
- ORDERING untouched-initial-order as a free point (US-LEARNER-14·EC7) — **S2** candidate, pin first.
- Forged `responseMs` inflates GAME leaderboard (US-LEARNER-16·EC4) — ties existing F39.
- Analytics empty-DB divide-by-zero + 429 on rapid refresh (US-ADMIN-10·EC2/EC5) — **S2**.

## B.2 — Observations ledger (`O<n>`) — NEW section, place after the Findings ledger

> **Observations (`O<n>`)** capture non-defect signals: enhancements, preferences, one-off
> non-reproducible oddities, and low-confidence Uzbek-fluency doubts for morning human review.
> They are **not** findings (no F#) and never block a run close. **Mandatory re-triage each run:**
> an `O<n>` that becomes reproducible with a named oracle + evidence bundle is promoted to an `F<n>`
> (this closes the F63 "dismissed as artifact → real bug" failure). Enhancements stay observations.

| O# | Kind | Story · EC | Note | Run seen | Re-triage status |
| --- | --- | --- | --- | --- | --- |
| O80 | uz-fluency-doubt | US-XCUT-01 | Generated content + app-wide uz UI strings use ASCII apostrophe `U+0027` in `o'`/`g'` where Uzbek orthography wants `U+02BB` (`oʻ`/`gʻ`). Mirrors source PDF + `messages/uz.json` convention → product-wide decision, morning human review. | R18 | open |
| O81 | security-hardening | US-ADMIN-08b | Impersonation tokens are **not single-use** — stateless 30-min JWT, no server-side nonce, so a token replays for its whole window (verified: 2nd identical request → 200). Deliberate stateless tradeoff; true single-use needs jti tracking. | R18 | open |
| O82 | media-metadata | US-IND · podcast | Podcast episode-row duration under-estimates the real audio. **R20 confirmed with a named oracle:** episode 1 stored `durationSec`=93s ("1:33") vs the loaded `<audio>.duration`=103s ("1:43", readyState=4 = ground truth), ~11% short; player time is correct, only the list label is off. Root cause = mp3 byte-length≈ms estimate at synthesis (drifts on VBR/ID3/padding). Fix is structural (probe decoded duration post-synthesis) → **deferred to `docs/PLANS.md`**. | R19 | R20: confirmed → PLANS (structural) |
| O83 | copy | US-IND · podcast | Podcast transcript click-to-seek hint said "Videoning" on an audio podcast. | R19 | R20: **promoted to F81 (fixed)** |
| O84 | flaky-suspect | US-LEARNER · billing | `GET /billing/me` returned a one-off **500** on a fresh learner's first dashboard load, then self-healed (browser retry 200; 8/8 curl 200; **4/4 fresh-account first-calls 200**). Non-reproducible → transient (likely API-process saturated finishing a podcast TTS Bull job; API==worker). Not elevated. | R19 | open (transient-confirmed) |
| O85 | security-UX | US-ADMIN-08b | Impersonated learner session shows **no "you are impersonating" banner** — an admin acting as a user has no in-app indicator (session correct + audited). A persistent banner + one-click exit would reduce acting-under-identity-unaware risk. Enhancement. | R19 | open |
| O86 | UX | US-LEARNER · deactivation | A learner deactivated **mid-session** (valid JWT) sees the assigned list silently empty with **no "your account was deactivated" message** — only the login path (F16) explains it. | R19 | open |
| O87 | perf | US-IND · practice | Structured-type practice generation (DROPDOWN_CLOZE+MATCHING+ORDERING ×10, whole-material) took **~130s** — much slower than SHORT_ANSWER (~35s); SSE kept the UI honest (no stuck spinner) but it's a long wait. | R19 | open |
| O88 | UX | US-OWNER · material-media | A podcast episode with a missing `audioPath` renders as "Tayyorlanmoqda" (Preparing) — indistinguishable from an in-flight generation; there is **no per-episode FAILED/error affordance** (episodes have no status column; readiness derives from `audioPath`). Only bites if one episode's TTS drops audio while the podcast row stays READY. State was induced artificially (nulled audioPath) → speculative. | R20 | open (low-confidence) |
| O89 | docs | US-XCUT · i18n | `apps/web/CLAUDE.md` §2 warns `game-quiz-player.tsx`/`leaderboard-table.tsx` "still contain hardcoded English strings" — **stale**: both are now `useTranslations`-driven (68× / 4×) and render fully localized (uz verified C3; ru/en chrome clean C5). Doc nit only. | R20 | open (docs) |

## B.3 — Story index rows (tick under each area in the backlog index)

### INDIVIDUAL (B2C) — add
- [ ] US-IND-26 Practice generator v2 (count × types × depth, Mixed default, fill-to-count) · P0
- [ ] US-IND-27 Fill-to-count guarantee + per-type count variance · P0
- [ ] US-IND-28 SRS flashcard session (SM-2, 4-level, Again re-queue, state-leak guard) · P0
- [ ] US-IND-29 In-practice flashcards · P0
- [ ] US-IND-30 Elo-KT mastery (up/down, live update, streaks, concurrency) · P1
- [ ] US-IND-31 Study-mode toggle (semantics + persistence) · P1
- [ ] US-IND-32 Text-selection Ask-AI seed (desktop-vs-mobile, F63 guard) · P1
- [ ] US-IND-33 Section-rail hierarchy nav · P1
- [ ] US-IND-34 Podcast transcript sync (click-seek, rescale, legacy fallback) · P1

### TENANT_OWNER — add
- [ ] US-OWNER-18 Mastery-by-topic on tenant progress · P1
- [ ] US-OWNER-19 Assessment builder — all 8 types round-trip · P0
- [ ] US-OWNER-20 Due-date enforcement matrix (server-side 403) · P0
- [ ] US-OWNER-21 GAME-live lifecycle (schedule→go-live→end-live, concurrent learner) · P0
- [ ] US-OWNER-22 Messaging (owner side) + IDOR · P0
- [ ] US-OWNER-23 CSV import (valid/malformed/dup/seat-limit) · P0
- [ ] US-OWNER-24 CSV export escaping / formula-injection · P0
- [ ] US-OWNER-25 Material detail + per-part generate/retry/fail · P1

### TENANT_LEARNER — add
- [ ] US-LEARNER-14 Structured question players + grading truth-tables + a11y · P0
- [ ] US-LEARNER-15 GAME live banner + `?play` deep-link · P0
- [ ] US-LEARNER-16 GAME structured types under timer + timeout races · P0
- [ ] US-LEARNER-17 Quiz review / strict result breakdown · P0
- [ ] US-LEARNER-18 Messaging (learner side) + IDOR · P0

### ADMIN (3001) — add
- [ ] US-ADMIN-08b Impersonation lifecycle + token-abuse matrix · P0 (S1)
- [ ] US-ADMIN-10 Analytics dashboard (8 endpoints, empty-DB, fuzz, 429) · P1
- [ ] US-ADMIN-11 Approve/flag effects visible to end users + content detail · P0

### XCUT (cross-cutting) — add
- [ ] US-XCUT-22 KaTeX in every player · P1
- [ ] US-XCUT-23 `/terms` + `/pricing` i18n + CTA-by-role · P2
- [ ] US-XCUT-24 TypeBadge i18n on content grids · P2
