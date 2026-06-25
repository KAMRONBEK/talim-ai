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
**Priority:** P0 · **Last verified:** 2026-06-25 on `claude/visual-qa`

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
| EC4 | Email-less kid logs in by **username** | Resolves `username@students.talim.local`, succeeds | ⬜ | — | — |
| EC5 | Kid with `mustChangePassword` | Forced to change-password screen before workspace | ⬜ | — | — |
| EC6 | Email with leading/trailing spaces | Trimmed, login succeeds | ⬜ | — | — |
| EC7 | Email differing only in case | Case-insensitive match, succeeds | ⬜ | — | — |
| EC8 | Rate limit after N failed attempts | Clear "too many attempts" message, not a 500 | ⏭️ | — | needs 30 attempts; deferred |
| EC9 | XSS/SQL payload in fields | Escaped, no execution, generic error | ✅ | — | XSS-escape verified |
| EC10 | Very long inputs (10k chars) | Rejected gracefully, no crash | ⬜ | — | — |
| EC11 | Locale switch then login | Lands in the chosen locale, not default | ⬜ | — | — |
| EC12 | Logged-in user revisits `/login` | Redirected to their home, not shown the form | ⬜ | — | — |
| EC13 | Session expiry mid-session | Bounced to `/login`, return-after-login honoured | ⬜ | — | — |
| EC14 | Submit with empty fields | Native required validation, no network call | ⬜ | — | — |

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
- [ ] US-IND-03 Summary (markdown, KaTeX, proper Uzbek output)
- [ ] US-IND-04 Quiz generate → MC/short → check → submit → retry
- [ ] US-IND-05 Podcast generate + player
- [ ] US-IND-06 Chat: streamed, scoped-to-material, sources, seeding from selection, visual tutor (Manim/Desmos/mermaid)
- [ ] US-IND-07 Dashboard grid / empty / search / thumbnails

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
- [ ] US-LEARNER-01 Sees **only assigned** materials (isolation)
- [ ] US-LEARNER-02 Take quiz / game, see own progress
- [ ] US-LEARNER-03 **Deactivated → content access lost immediately** (S1 isolation)
- [ ] US-LEARNER-04 Cannot upload / cannot reach owner tools (role guard)

### ADMIN (3001)
- [ ] US-ADMIN-01 Tutor-requests: approve + set seat limit → org + ACTIVE subscription
- [ ] US-ADMIN-02 Users / tenants / content / generated / subscriptions / usage / audit

### XCUT (cross-cutting)
- [ ] US-XCUT-01 i18n: every user-facing string in uz/en/ru, no hardcoded leaks (Uzbek-first)
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
| … | | | *(backfill F1–F14 here)* | | |
