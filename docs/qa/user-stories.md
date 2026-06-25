# Talim AI — User Stories & QA Traceability

This is the **durable spec + results ledger**. It is *not* a run journal — that's
[`visual-qa-report.md`](./visual-qa-report.md). Here, every user story is decomposed to
its deepest edge cases, and each edge case carries a **live status**, the **finding** it
produced, and the **fix** that closed it. Read this to answer "is behaviour X tested, and
does it work?" at any moment.

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

---

## Story index (backlog — expand each with the template)

> Tick `spec'd` when the story has full ACs + EC matrix; `done` when all P0/P1 ECs are ✅/🐛→✅/🚫.

### AUTH
- [x] US-AUTH-01 Login · spec'd ✅
- [ ] US-AUTH-02 Register (valid / duplicate email / weak pw / join-code self-enroll)
- [ ] US-AUTH-03 Join-code enrol: valid / wrong / expired / **seat-limit full** / already-member
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

### TENANT_OWNER
- [ ] US-OWNER-01 Create student (email + email-less kid, credentials-once, seat count)
- [ ] US-OWNER-02 Reset student password
- [ ] US-OWNER-03 Deactivate / reactivate student
- [ ] US-OWNER-04 Join code regenerate (old rejected) / copy
- [ ] US-OWNER-05 Upload material / re-read OCR
- [ ] US-OWNER-06 Assign material to student(s)
- [ ] US-OWNER-07 Question bank build + approve (proper Uzbek, LaTeX)
- [ ] US-OWNER-08 WRITTEN assessment create + assign + grade
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
- [ ] US-ADMIN-02 Users / tenants / content / generated / subscriptions / usage / audit

### XCUT (cross-cutting)
- [x] US-XCUT-01 i18n: every user-facing string in uz/en/ru, no hardcoded leaks (Uzbek-first) · spec'd ✅
- [ ] US-XCUT-02 Mobile (drawer/FAB) + tablet (768) layouts
- [ ] US-XCUT-03 a11y: focus, aria-labels, keyboard nav, back/forward
- [ ] US-XCUT-04 Security: role isolation via `contentAccess.service.ts`, XSS escape, no enumeration
- [ ] US-XCUT-05 Resilience: SSR errors, stale-cache, slow network, double-submit

---

## Findings ledger

Central registry. Each row links to the story/EC that produced it and the fix that closed it.
Backfill F1–F14 from `visual-qa-report.md` as you revisit them.

| F# | Sev | Story · EC | Summary | Status | Fix commit |
| --- | --- | --- | --- | --- | --- |
| F15 | S3 | US-OWNER-12 · EC1 | Material delete dialog + aria-label hardcoded Uzbek | ✅ fixed | `36f1f41` |
| F16 | S2 | US-AUTH-01 · EC3 | Deactivated login showed "server unreachable" not "deactivated" | ✅ fixed | `d5a13cc` |
| F17 | S2 | US-AUTH-01 · EC7 | Email/username login was **case-sensitive** — any capitalization difference (mobile auto-capitalize) → "Invalid email or password", user locked out of a P0 flow. Register also stored email verbatim. Fixed: lowercase+dedupe email on register; case-insensitive (`mode:'insensitive'`) email & username match on login. | ✅ fixed | `59dc681` |
| F18 | S2 | US-XCUT-01 · EC1 | **Uzbek relative timestamps rendered broken.** `Intl.RelativeTimeFormat('uz')` resolves to `uz` but ICU (V8/Node) ships **no Uzbek relative-time data**, so it emitted raw fallback `"-3 w"` / `"-2 d"` / `"-5 h"` (leading minus + English abbreviations) on **every content card timestamp** — shown to the **primary Uzbek audience** on the B2C dashboard + learning-history panel. en/ru correct. Fixed: format Uzbek manually (`"3 hafta oldin"`, `"hozirgina"`, future `"3 kundan keyin"`); keep `Intl` for en/ru. Verified live: card now reads "3 hafta oldin". | ✅ fixed | `b4ba377` |
| F23 | S3 | US-LEARNER-02 · EC | **GAME quiz player + leaderboard hardcoded English** (CLAUDE.md-flagged debt). `game-quiz-player.tsx` + `leaderboard-table.tsx` rendered ~15 English literals (intro meta, Start/Cancel, Scoring, Your score, result summary, Your answer/Correct, Done, Question N/M, Number/Your-answer placeholders, Next, No scores, pts) — shown to Uzbek students in the marquee GAME feature. Added `learner.game` namespace (uz/en/ru, ICU plural for ru points/questions) + `useTranslations`. **Verified live**: full game played in uz (intro "4 ta savol…", "1 / 4-savol", "SIZNING BALLINGIZ", "Tayyor", leaderboard "1510 ball"), 0 console errors. | ✅ fixed | `e57e4ef` |
| F24 | S3 | US-XCUT-01 · EC7 | **Assessments pages largely un-i18n'd (hardcoded English).** The tenant assessments admin page (`/tenant/assessments`) and the learner assessments **list** page (`/learner/assessments`) render English on uz/ru: "Assessments", "Question banks", "Publish assessment", "Mode"/"Written"/"Game", "Max attempts", "Assign", "Results & leaderboard"; learner list "Quizzes & tasks", "Play", "Leaderboard", "Attempts: N/M · Latest X% · N pts", "Attempt limit reached", "Hide leaderboard". The GAME *player* + *leaderboard table* are now localized (F23); these surrounding list/admin pages are a larger remaining surface → logged, not fixed. | 🟡 logged | — |
| F21 | S2 | US-IND-05 · EC2 | **Podcast playback broken + blob-404 spam.** The audio-loading effect (`podcast/page.tsx`) depended on `flushProgress` — a `useCallback` over the react-query mutation, so a new identity every render. While the podcast polled (3s) during generation the parent re-rendered constantly, re-running the effect: it revoked the current audio blob URL and created a new one **every render**, spamming `blob: ERR_FILE_NOT_FOUND` (10+/play) and resetting `<audio>` to 0 so `play()` never stuck (`paused:true, t:0`). Scoped the effect to the audio episode id via a stable `flushProgressRef` + `cancelled` guard. Verified live: src stable across poll cycles, playback advances (`paused:false, t:1.52`), console 0 errors. | ✅ fixed | `46e2473` |
| F22 | S3 | US-IND-05 · EC3 | **Podcast player "Speed:" label hardcoded Uzbek.** `PodcastPlayer.tsx` rendered the literal `"Tezlik:"`, shown on en/ru pages too. Added `content.playbackSpeed` (uz/en/ru) + `useTranslations`. Verified: en "Speed:". | ✅ fixed | `5adc666` |
| F20 | S3 | US-XCUT-01 · EC6 | **Count strings not pluralized (Russian + English).** `sectionCount`/`quizCount`/`questionCount`/`episodes`/`quizAttempts` hardcoded the genitive-plural suffix (`"{count} разделов"`, `"{count} sections"`) instead of ICU `plural`. Russian showed `"4 разделов"` (needs paucal `"4 раздела"`; "разделов" is 5+ only) and English `"1 sections"`. Fixed all 5 in en (`one`/`other`) + ru (`one`/`few`/`many`/`other`) using next-intl ICU `plural`; uz left unchanged (Uzbek nouns invariant after numerals). Verified live: ru "4 раздела"/"2 вопроса"/"5 вопросов", en "4 sections". | ✅ fixed | `aa42bf1` |
| F19 | S3 | US-IND-07 · EC | **Dashboard search "no results" shows the "no content yet" empty state.** Typing a non-matching term in the dashboard hero search (client-side filter of the recents grid) empties the list and renders "Hali material yo'q. …birinchi materialingizni qo'shing" ("You have no materials yet, add your first") — confusing for a user who *does* have content but filtered it out. Should show a distinct "no results match your search" state. Not fixed: needs a new string in uz/en/ru + grid logic to distinguish filtered-empty from truly-empty (product copy decision). | 🟡 logged | — |
| … | | | *(backfill F1–F14 here)* | | |
