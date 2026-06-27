# Talim AI — QA User-Story Expansion (backlog)

This is a **deep-read expansion** of [`user-stories.md`](./user-stories.md): 77 new/deepened
stories with ~1468 edge cases, mined by 9 area specialists + 1 completeness critic
reading the actual codebase against [`../FEATURES.md`](../FEATURES.md). Every edge case starts ⬜
(not-yet-tested). Merge into `user-stories.md` after ID reconciliation; this file is the working backlog.

> **✅ IDs reconciled.** All 76 story IDs are globally unique — 20 intra-annex collisions were
> renumbered (e.g. MEDIA's video/slides → `US-IND-18/19`; the data-lifecycle/jobs/quota XCUT
> stories → `US-XCUT-11..13`; critic cross-seam stories → `US-XCUT-14..20`). Stub-fills
> (`US-AUTH-02`, `US-OWNER-01`…) intentionally reuse the canonical backlog numbers they complete;
> stories that **deepen** an existing one (e.g. `US-OWNER-12`, `US-IND-23` chat) keep/extend that number.

> **⚠ Suspected findings.** While reading code, the specialists flagged **90 suspected real bugs**
> (0×S1, 30×S2, 20×S3). These are
> **unverified code-read hypotheses** — see the ledger at the end. Triage before acting.

## Contents

- **AUTH — register / reset / logout / become-tutor / session & JWT**
- **B2C INGEST — PDF/SLIDE upload, OCR ladder, YouTube, processing job**
- **B2C MEDIA — summary / quiz / chat+Manim / podcast / VIDEO / SLIDES / extras**
- **TENANT_OWNER — students, materials, assignment, settings**
- **ASSESSMENTS & GAMES — banks / WRITTEN / GAME / attempts / results / leaderboard**
- **ADMIN PANEL & BILLING — approvals, users, tenants, content, usage, audit, seats**
- **TENANT_LEARNER — forced password change, settings, read-path, progress**
- **XCUT QUALITY — i18n, a11y, mobile/tablet**
- **XCUT SAFETY — isolation matrix, security, resilience, jobs, quota matrix, data-lifecycle**
- **CRITIC — cross-seam stories the area passes missed**
- **Suspected findings ledger (unverified)**

---


<!-- ===== AREA: auth ===== -->
## Area: Auth lifecycle (register, reset, logout, become-tutor, session)

> Continues the AUTH backlog. AUTH-01 (login) and AUTH-03 (join-code + seats) are already
> deep-spec'd in `docs/qa/user-stories.md`; this file fills the bare stubs
> **US-AUTH-02 / 04 / 05 / 06** and adds **US-AUTH-07 (session/JWT)**, **US-AUTH-08
> (rate limits)**, **US-AUTH-09 (register-tenant + role-write boundaries)**.
> Code read for these: `apps/api/src/controllers/auth.controller.ts`,
> `apps/api/src/routes/auth.routes.ts`, `apps/api/src/middleware/{auth,rate-limit}.middleware.ts`,
> `apps/api/src/services/tutorRequest.service.ts`,
> `apps/api/src/services/tenant/{organization.ts(joinTenantByCode),students.ts,shared.ts}`,
> `apps/web/app/[locale]/(auth)/{login,register}/page.tsx`,
> `apps/web/components/{session-sync,auth-guard,role-guard}.tsx`,
> `apps/web/components/account/{password-card,become-tutor-card}.tsx`,
> `apps/web/components/learner/student-welcome-banner.tsx`,
> `apps/web/hooks/{useAccount,useTutorRequest}.ts`, `apps/web/store/useAuthStore.ts`,
> `apps/web/lib/api.ts`.

---

### US-AUTH-02: Register a new individual account (+ optional class join code)
**As a** new visitor, **I want** to create an account by email + password (optionally with a class
join code), **so that** I get a B2C workspace — or land in my tutor's class if I have a code.
**Routes/code:** `/[locale]/register` · `POST /auth/register` (`authWriteRateLimit`) ·
`auth.controller.ts register()` (`registerSchema`: email `.email()`, password `.min(8)`,
name `.min(1).optional()`, joinCode `.min(4).max(12).optional()`, `role: z.never()`, `.strict()`) ·
`joinTenantByCode()` · web `register/page.tsx`.
**Priority:** P0

**Acceptance criteria**
- AC1 — Given a unique, valid email + ≥8-char password, When I submit, Then a `INDIVIDUAL` user +
  ACTIVE FREE subscription is created, a token is returned (201), and I land on `/dashboard`.
- AC2 — Given I also enter a valid join code, When I submit, Then I am enrolled as
  `TENANT_LEARNER` in that org and land on `/learner/dashboard`.
- AC3 — Email is normalized (trim + lowercase) so capitalization never forks one person into two
  accounts; a duplicate email returns 409 "Email already registered".

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Happy path, no join code | 201, INDIVIDUAL + FREE ACTIVE sub, lands `/dashboard` | ⬜ | — | — |
| EC2 | Duplicate email (exact) | 409 "Email already registered"; no second account | ⬜ | — | — |
| EC3 | Duplicate email differing only in **case/whitespace** (`Foo@x.com ` vs `foo@x.com`) | 409 — `findFirst` uses `mode:'insensitive'`, register lowercases+trims first | ⬜ | — | — |
| EC4 | Password 7 chars (under min) | Server 400 (Zod `.min(8)`); web also blocks via `minLength={8}` native validation → no network call | ⬜ | — | — |
| EC5 | Password exactly 8 chars (boundary) | Accepted | ⬜ | — | — |
| EC6 | Password with spaces / unicode / emoji | Accepted verbatim (not trimmed) and bcrypt-hashed; later login with same string works | ⬜ | — | bcrypt truncates >72 bytes — see EC7 |
| EC7 | Very long password (>72 bytes, e.g. 200 chars) | **bcrypt silently truncates at 72 bytes** — register succeeds, but only first 72 bytes matter on login. No crash; document behaviour | ⬜ | — | **possible silent-truncation surprise** |
| EC8 | Malformed email (`a@`, `a b@x.com`, no `@`) | 400 Zod email error; web `type=email` native-blocks | ⬜ | — | — |
| EC9 | Empty name | Allowed — `name` optional; stored null (web marks input `required` so UI blocks, but API accepts omitted) | ⬜ | — | web/API mismatch (UI stricter) |
| EC10 | Name 200+ chars | Accepted (no max on name in registerSchema) — verify no layout break echoing it | ⬜ | — | no max-length guard |
| EC11 | Extra/unknown body field (e.g. `role:'ADMIN'`, `isAdmin:true`) | 400 — schema is `.strict()` and `role: z.never()`; **privilege-escalation attempt rejected** | ⬜ | — | **S1 verify** |
| EC12 | Valid join code at register | Enrolled as TENANT_LEARNER, role flipped, lands `/learner/dashboard` (web posts uppercased code) | ⬜ | — | overlaps AUTH-03·EC1 |
| EC13 | **Invalid** join code at register (no such tenant) | `joinTenantByCode` throws 404 *after* `user.create` already ran → **orphaned INDIVIDUAL account** created; user sees "Invalid join code" and assumes signup failed, but retry hits "Email already registered" | ⬜ | — | **S2 — broadens F27 beyond seat-full to ANY join failure** |
| EC14 | Join code = own/owner's code edge, or `role!==INDIVIDUAL` path | At register the user is brand-new INDIVIDUAL so `ownerId===userId` impossible; covered by AUTH-03 for join-class | ⬜ | — | 🚫 N/A at register |
| EC15 | Seat-full join code at register | 402 STUDENT QUOTA after account create → orphaned INDIVIDUAL (F27) | ⬜ | F27 | logged |
| EC16 | Join code shorter than 4 / longer than 12 chars | Zod `joinCode.min(4).max(12)` → 400 before any user create (good — no orphan in this case) | ⬜ | — | — |
| EC17 | Join code with lowercase letters | Web uppercases (`toUpperCase()`); `joinTenantByCode` also uppercases → matches | ⬜ | — | — |
| EC18 | Join code with surrounding spaces / mixed | Trimmed+uppercased both client and server | ⬜ | — | — |
| EC19 | Double-submit (rapid double Enter / button click) | Button `disabled={loading}`; but two near-simultaneous requests could both pass duplicate-check before either commits → **2 accounts or unique-constraint 500**. Verify single account, graceful 409 | ⬜ | — | **race: no DB unique pre-write lock; check email unique constraint exists** |
| EC20 | Already-logged-in user visits `/register` | Redirected to `getPostLoginPath(user.role)`; form not shown (`if (!mounted || token) → Loading…`) | ⬜ | — | — |
| EC21 | Network failure / API down on submit | Inline `registerFailed` (or server message) shown; `loading` cleared in `finally`; no infinite spinner | ⬜ | — | — |
| EC22 | Slow network (3s) | Button shows `registering…` disabled state throughout; no double POST | ⬜ | — | — |
| EC23 | 401 from `/auth/register` | `api.ts` interceptor treats `/auth/register` as auth-entry-point → does NOT global-logout/redirect; inline error preserved | ⬜ | — | regression guard for F2-style |
| EC24 | XSS/SQL payload in name/email | Stored/escaped; React escapes on render; generic validation error, no execution | ⬜ | — | — |
| EC25 | i18n: register strings + error copy in uz/en/ru | All localized (`auth.*` namespace); server messages are English-only (e.g. "Email already registered") — surfaced verbatim regardless of locale | ⬜ | — | **server error strings not localized — S3** |
| EC26 | a11y: tab order name→email→password→joinCode→submit, labels bound (`htmlFor`), error announced | Focus order correct; error `<p>` should be `aria-live`/linked to form (currently plain text) | ⬜ | — | error not in aria-live region |
| EC27 | Mobile keyboard auto-capitalizes email | `autoCapitalize` not set on register email input (login has `none`); but server lowercases so still matches | ⬜ | — | minor: add autoCapitalize=none |
| EC28 | FREE plan row missing in DB (seed not run) | 500 "FREE plan not configured. Run the plan seed" — explicit, not a generic crash | ⬜ | — | — |
| EC29 | Rate limit: 41st write in 15min from one IP | 429 "Too many requests…" (authWriteRateLimit 40/15min, shared with change-pw/tutor-request/join) — a 40+ student classroom self-registering behind one NAT could trip it | ⬜ | — | **S2 — classroom NAT register cap (login limiter exempts success, this one does not)** |

**Notes / open questions**
- Register has **no confirm-password field** → mismatch EC is 🚫 N/A.
- F27 root cause is structural: `register()` does `user.create` *then* `joinTenantByCode` — any
  failure in the join (invalid code EC13, seat-full EC15) leaves an orphaned INDIVIDUAL. Atomic
  fix = validate code + quota before create, or wrap in one transaction.

---

### US-AUTH-04: Change password + tutor/admin reset + forced first-login change
**As a** user (incl. an email-less kid on a tutor-issued temp password), **I want** to change my
password, **so that** I control my own credentials; **and** a tutor/admin can reset mine if I'm locked out.
**Routes/code:** `PATCH /auth/me/password` (`authWriteRateLimit`) · `auth.controller.ts
changePassword()` (`changePasswordSchema`: currentPassword `.min(1)`, newPassword `.min(8)`) ·
`account/password-card.tsx` · `useChangePassword` · tutor reset
`tenant/students.ts resetStudentPassword()` + `createStudent()` (`mustChangePassword`) · admin reset
(`/admin/users/:id` set-password) · `student-welcome-banner.tsx` (`user.mustChangePassword`).
**Priority:** P0

**Acceptance criteria**
- AC1 — Given correct current password + ≥8-char new password, When I submit, Then the hash is
  updated, `mustChangePassword` is cleared, `adminPasswordNote` is nulled, and 200 `{ok:true}`.
- AC2 — Given a tutor resets a student, Then a 12-char temp password is issued **once**,
  `mustChangePassword=true` is set, and the student must use it next login.
- AC3 — Given `mustChangePassword=true`, the student is nudged to change it on first login.

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Correct current + valid new | 200, hash updated, can log in with new, old rejected | ⬜ | — | — |
| EC2 | Wrong current password | 400 "Current password is incorrect"; no change | ⬜ | — | — |
| EC3 | New password = current password (reuse) | **Accepted today — no `newPassword !== currentPassword` guard** (`auth.controller.ts:221-242`). Decide: allow (document) or 400 "choose a different password" | ⬜ | — | **likely gap: password reuse allowed** |
| EC4 | New password 7 chars | 400 Zod `.min(8)`; web `minLength={8}` native-blocks | ⬜ | — | — |
| EC5 | New password exactly 8 | Accepted (boundary) | ⬜ | — | — |
| EC6 | Empty current password | 400 Zod `.min(1)` (and web `required`) | ⬜ | — | — |
| EC7 | **Min-length inconsistency** | Self-change requires `min(8)`, but tutor-set student password is `min(6)` (`shared.ts createStudentSchema password.min(6)`); a 6–7 char tutor-set password can't be re-entered as a *new* password — confusing for kids | ⬜ | — | **S3 — inconsistent password policy across surfaces** |
| EC8 | **Forced-change flow NOT enforced** | `mustChangePassword` only renders a **dismissible** `StudentWelcomeBanner` (CTA → `/learner/settings`); there is **no route gate** forcing the change. AUTH-01·EC5 expects "Forced to change-password screen before workspace" — not implemented; a kid can dismiss and use everything on a temp password | ⬜ | — | **S2 — forced first-login change missing; banner is skippable** |
| EC9 | After change, `mustChangePassword` cleared + banner gone next `/auth/me` | SessionSync refreshes `user`; banner hides (`Boolean(user.mustChangePassword)` false) | ⬜ | — | — |
| EC10 | After change, `adminPasswordNote` nulled | Support/admin no longer sees a stale plaintext note (regression: F25 area) | ⬜ | — | — |
| EC11 | Tutor reset → temp password shown once | 12-char `crypto.randomUUID().slice(0,12)`; `mustChangePassword=true`; not retrievable again from list | ⬜ | — | — |
| EC12 | Tutor reset for a **cross-tenant** student id | 404 "Student not found" — `findFirst` scoped by `tenantId` (isolation) | ⬜ | — | **S1 verify** |
| EC13 | Admin set-password on `/admin/users/:id` | Overwrites target hash; F25 fixed autofill (note `autoComplete=off`, set-pw `new-password`) so admin's own creds aren't injected | ⬜ | F25 | `73e41c9` |
| EC14 | Old session/token after password change | **Stateless JWT — old tokens stay valid up to 7d** (no revocation/`tokenVersion`). A leaked token survives a password change | ⬜ | — | **S2 — no session invalidation on password change** |
| EC15 | Double-submit change form | Button `disabled={isPending}`; single PATCH; idempotent result | ⬜ | — | — |
| EC16 | Network error on change | `password-card` catches → shows `account.password.error`; fields not cleared so user can retry | ⬜ | — | — |
| EC17 | Success message + field clear | On success: inputs cleared, `success` message, `onSuccess()` dismisses onboarding flag | ⬜ | — | — |
| EC18 | Unauthorized (no token) PATCH | 401 Unauthorized (route `authMiddleware`) | ⬜ | — | — |
| EC19 | Email-less kid changes pw (username login) | Works — `currentPassword` is the temp; after change can log in by username with new pw | ⬜ | — | — |
| EC20 | Rate limit on `/auth/me/password` | Shares `authWriteRateLimit` (40/15min) | ⬜ | — | — |
| EC21 | i18n: `account.password.*` (title/desc/current/new/save/saving/success/error) in uz/en/ru | All localized; verify learner-settings page too | ⬜ | — | — |
| EC22 | a11y: labels bound, password fields `type=password`, message announced | Labels `htmlFor`; message plain `<p>` (no aria-live) | ⬜ | — | — |
| EC23 | XSS in password field | Hashed, never rendered; safe | ⬜ | — | — |
| EC24 | No "reset password by email" exists (forgot-password) | There is **no public forgot-password/email-link flow** — only authed self-change + tutor/admin reset. A locked-out INDIVIDUAL with a forgotten password has **no self-serve recovery** | ⬜ | — | **S2 — missing forgot-password for B2C; AUTH backlog item "email/link" is unimplemented** |

**Notes / open questions**
- The backlog "US-AUTH-04 Reset password (request → email/link → set → re-login)" implies an email
  reset flow that **does not exist in code**. Either build it or re-scope the story to
  authed-change + tutor/admin reset (EC24).

---

### US-AUTH-05: Logout (clears session, redirect, no back-button re-entry, multi-tab)
**As a** signed-in user, **I want** logging out to fully end my session, **so that** the next
person on the device can't reach my data via back button or another tab.
**Routes/code:** `store/useAuthStore.ts logout()` (`persist` key `talim-auth` → localStorage) ·
`role-guard.tsx` / `auth-guard.tsx` (redirect to `/login` when `!token`) · `api.ts` 401 interceptor.
**Priority:** P1

**Acceptance criteria**
- AC1 — Given I click logout, When it fires, Then Zustand `user`+`token` are nulled and the
  persisted `talim-auth` localStorage entry reflects null.
- AC2 — After logout I am redirected to `/login` and any guarded route bounces me back to `/login`.
- AC3 — The browser **Back** button cannot re-enter an authed page (guard re-evaluates).

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Click logout from learner/owner/individual shell | `token=null`, redirect `/login` | ⬜ | — | — |
| EC2 | Persisted storage after logout | `talim-auth` becomes `{user:null,token:null}` (note: key is **not removed**, just nulled) | ⬜ | — | — |
| EC3 | Back button to a guarded page after logout | `AuthGuard`/`RoleGuard` see `!token` → `router.replace('/login')`; brief "Loading…" then login | ⬜ | — | — |
| EC4 | Forward button / bfcache restore of authed page | Page may flash from bfcache; guard effect must re-run on restore and redirect (verify no stale authed render persists) | ⬜ | — | **verify bfcache doesn't show authed content** |
| EC5 | **Multi-tab logout desync** | `useAuthStore` persist has **no `storage`-event listener**; logging out in tab A nulls A's in-memory store + localStorage, but **tab B keeps its in-memory token** and can keep calling the API until it reloads or gets a 401 | ⬜ | — | **S2 — multi-tab logout does not propagate; other tab stays authed** |
| EC6 | API call after logout (stale in-flight request) | 401 → `api.ts` interceptor logout+redirect (belt-and-suspenders) | ⬜ | — | — |
| EC7 | Logout then immediately log in as a **different** user | New `setAuth`; but react-query cache (tenant/tutor-request/contents) from prev user may be stale — SessionSync invalidates only `['contents']`; other keys could leak briefly | ⬜ | — | **S3 — cross-user cache bleed without full reload** |
| EC8 | Logout while a mutation (upload/generate) is in flight | In-flight request completes or 401s; no crash; UI returns to login | ⬜ | — | — |
| EC9 | Locale preserved on logout redirect | Redirect via `@/i18n/navigation` keeps `[locale]`; `api.ts` 401 path uses `getApiLocale()` for `/{locale}/login` | ⬜ | — | — |
| EC10 | Admin token persisted in this app | Login/RoleGuard detect `role==='ADMIN'` → `logout()` + bounce to `/login` with `adminNotAllowed` (anti-loop) | ⬜ | — | — |
| EC11 | No logout control reachable to leak token in DOM | Token lives in JS memory + localStorage only; not in a cookie; XSS would expose it (localStorage is JS-readable) — note as security property | ⬜ | — | localStorage token = XSS-exfiltratable (design tradeoff) |
| EC12 | i18n: logout button label in uz/en/ru | Localized in sidebar/header | ⬜ | — | — |
| EC13 | a11y: logout reachable by keyboard, focus moves to login form after redirect | Focus management on redirect (verify focus not lost) | ⬜ | — | — |
| EC14 | Mobile drawer logout | Logout in mobile sidebar sheet works + closes drawer | ⬜ | — | — |

---

### US-AUTH-06: Become-tutor request → admin approval → role unlock
**As an** individual learner, **I want** to request a tutor account and have an admin approve it
with a seat limit, **so that** my role flips to TENANT_OWNER and tutor tools unlock.
**Routes/code:** `POST /auth/upgrade-to-tenant` (`authMiddleware`,`authWriteRateLimit`) +
`GET /auth/tutor-request` · `tutorRequest.service.ts` (`createTutorRequest`/`approveTutorRequest`/
`rejectTutorRequest`, status `PENDING|APPROVED|REJECTED`) · `applyAdminRoleChange` (creates
tenant + ACTIVE sub) · web `become-tutor-card.tsx` + `useTutorRequest` · admin
`/admin/tutor-requests`.
**Priority:** P0

**Acceptance criteria**
- AC1 — Given an INDIVIDUAL submits orgName (2–120 chars), When created, Then a PENDING
  `TutorRequest` exists (201) and the card shows the PENDING state.
- AC2 — Given an admin approves (optional seatLimit 1–100000), Then the user becomes TENANT_OWNER
  with a tenant + ACTIVE subscription and (if set) the seat limit; request → APPROVED.
- AC3 — Given an admin rejects (optional note), Then request → REJECTED and the user may re-request.

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | INDIVIDUAL submits valid request | 201 PENDING; card switches to "pending" message; form hidden | ⬜ | — | — |
| EC2 | orgName 1 char (under min) | 400 Zod `.min(2)`; web also disables submit when `orgName.trim().length < 2` | ⬜ | — | — |
| EC3 | orgName exactly 2 / exactly 120 (boundaries) | Accepted; 121 → 400 `.max(120)` | ⬜ | — | — |
| EC4 | Note > 1000 chars | 400 Zod `.max(1000)` | ⬜ | — | — |
| EC5 | orgName whitespace-only ("   ") | Trimmed → effectively empty; `.min(2)` runs **before** trim in schema so "   " (3 spaces) passes Zod then `.trim()` stores ""; verify stored orgName isn't blank | ⬜ | — | **possible blank orgName via spaces** |
| EC6 | Duplicate request while one is PENDING | 409 "You already have a pending tutor request." | ⬜ | — | — |
| EC7 | Re-request **after REJECTED** | Allowed — `createTutorRequest` only blocks on PENDING; new PENDING created; card shows rejected→form | ⬜ | — | — |
| EC8 | Re-request **after APPROVED** (already owner) | 400 "Only individual learners can request a tutor account." (role no longer INDIVIDUAL) | ⬜ | — | — |
| EC9 | TENANT_LEARNER calls upgrade-to-tenant | 400 "Only individual learners…" (role guard in service) | ⬜ | — | — |
| EC10 | Unauthenticated call | 401 Unauthorized (route `authMiddleware`) | ⬜ | — | — |
| EC11 | **Role flips mid-session (approval) but JWT is stale** | After approve, DB `role=TENANT_OWNER`, but the user's existing **JWT still encodes `role:INDIVIDUAL`** (auth.middleware only backfills role for *legacy* tokens). `/auth/me` returns OWNER (web routes them to `/tenant/dashboard`), but every `/tenant/*` API call uses the JWT role → **403 until they re-login or the 7-day token expires** | ⬜ | — | **S2 — approved tutor sees tenant UI but API 403s; needs forced re-login or token refresh on role change** |
| EC12 | SessionSync after approval | `GET /auth/me` updates stored `user.role` to OWNER (does **not** reissue token unless `legacyToken`) → UI/API role mismatch per EC11 | ⬜ | — | links EC11 |
| EC13 | Admin approve seatLimit = 0 | 400 — `approveSchema seatLimit.min(1)` (0 would lock the org out of adding students) | ⬜ | — | — |
| EC14 | Admin approve seatLimit null/omitted | Uses plan default seat limit; tenant created with default | ⬜ | — | — |
| EC15 | Admin approve seatLimit = 100001 | 400 `.max(100000)` | ⬜ | — | — |
| EC16 | Approve an already-decided (APPROVED/REJECTED) request | 400 "Request already decided" | ⬜ | — | — |
| EC17 | **Two admins approve same PENDING request concurrently** | Status check `if (request.status !== 'PENDING')` is **not transactional** — both may pass, calling `applyAdminRoleChange` twice → duplicate tenant create / unique-constraint 500 / double seat. Verify idempotency or a DB-level guard | ⬜ | — | **S2 — approval race not guarded by transaction** |
| EC18 | Approve a nonexistent requestId | 404 "Request not found" | ⬜ | — | — |
| EC19 | Reject with note | REJECTED + note stored (or keeps existing note if blank); user can re-request | ⬜ | — | — |
| EC20 | Reject already-decided | 400 "Request already decided" | ⬜ | — | — |
| EC21 | Non-admin hits `/admin/tutor-requests/*` | 403 (admin router `requireRole('ADMIN')`) | ⬜ | — | **S1 isolation** |
| EC22 | `GET /auth/tutor-request` returns latest by createdAt | Card shows latest status (rejected vs pending vs none) | ⬜ | — | — |
| EC23 | BecomeTutorCard renders for non-INDIVIDUAL | Returns `null` (role guard) — owners/learners/admins never see it | ⬜ | — | — |
| EC24 | Network/500 on submit | Card catches → shows server message or `becomeTutor.error`; button re-enabled | ⬜ | — | — |
| EC25 | Double-submit request | Button `disabled={requestTutor.isPending || orgName<2}`; single POST; second would 409 PENDING anyway | ⬜ | — | — |
| EC26 | Rate limit (authWriteRateLimit) on repeated submits | 429 after 40/15min (shared budget) | ⬜ | — | — |
| EC27 | i18n: `becomeTutor.*` (title/desc/pending/rejected/labels/submit/submitting/error) uz/en/ru | Localized; server 400/409 strings are English-only and surfaced verbatim | ⬜ | — | server strings not localized (S3) |
| EC28 | a11y: orgName/note labels bound, error announced, submit reachable by keyboard | Verify focus + aria | ⬜ | — | — |
| EC29 | XSS in orgName/note | Escaped on render in admin panel + card; stored trimmed | ⬜ | — | — |
| EC30 | Approved tutor's prior INDIVIDUAL content after role flip | What happens to their B2C content (`tenantId=null`)? Verify it's still owner-only / not auto-migrated to tenant; access still resolves | ⬜ | — | data-lifecycle check |

**Notes / open questions**
- EC11/EC12 (stale-JWT-role) is the highest-value finding here: the whole "role unlock" UX is
  visible (web reads role from `/auth/me`) but the **authorization** layer reads role from the JWT,
  so the unlock isn't actually effective server-side until re-login. Confirm live and decide
  re-issue-token-on-role-change vs force-logout.

---

### US-AUTH-07: Session / JWT lifecycle (expiry, tamper, deleted user, refresh, return-after-login)
**As the** platform, **I want** sessions to expire, refuse forged/stale tokens, and recover the
user's intended destination after re-login, **so that** auth is secure and the UX is seamless.
**Routes/code:** `auth.middleware.ts authMiddleware` (`jwt.verify`, legacy-role backfill,
tenantId resolve) · `auth.controller.ts signToken` (`expiresIn:'7d'`) + `me()` (reissue only when
`legacyToken`) · `components/session-sync.tsx` (`GET /auth/me`) · `api.ts` 401 interceptor.
**Priority:** P0 (security)

**Acceptance criteria**
- AC1 — A valid, unexpired token authenticates; payload `{userId,email,role,tenantId?}` attaches as
  `req.user`.
- AC2 — An expired/forged/malformed token → 401 "Invalid or expired token"; web logs out + redirects
  to `/login`.
- AC3 — `SessionSync` refreshes the stored `user` from `/auth/me` whenever a token exists.

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Valid token | 200; `req.user` populated; protected routes work | ⬜ | — | — |
| EC2 | Expired token (>7d) | `jwt.verify` throws → 401 "Invalid or expired token" | ⬜ | — | — |
| EC3 | Tampered signature (alter payload) | 401 — signature check fails | ⬜ | — | **S1** |
| EC4 | `alg:none` / forged header | `jwt.verify` with HS secret rejects → 401 | ⬜ | — | **S1 verify alg-confusion blocked** |
| EC5 | Malformed token ("Bearer xxx", non-JWT) | 401 "Invalid or expired token" | ⬜ | — | — |
| EC6 | Missing `Authorization` header | 401 "Unauthorized" (no Bearer prefix) | ⬜ | — | — |
| EC7 | `Authorization` without `Bearer ` prefix (e.g. raw token) | 401 "Unauthorized" (`startsWith('Bearer ')` fails) | ⬜ | — | — |
| EC8 | **Token for a deleted user** (non-legacy token has role) | authMiddleware does **NOT** re-check user existence for non-legacy tokens → passes; downstream queries may return empty/404 but auth itself doesn't 401. `me()` does 404. Other routes vary | ⬜ | — | **S3 — deleted-user token not rejected at middleware (users are soft-deactivated, not hard-deleted, so low impact)** |
| EC9 | Legacy token (no `role` claim) | Loads user, backfills role, sets `req.legacyToken`; `me()` reissues a modern token | ⬜ | — | — |
| EC10 | Legacy token for a now-deleted user | `findUnique` null → 401 Unauthorized (legacy path *does* check) | ⬜ | — | inconsistency vs EC8 |
| EC11 | Owner/learner token **without** `tenantId` claim | Middleware resolves+attaches via `resolveTenantIdForUser` | ⬜ | — | — |
| EC12 | Deactivated learner with still-valid token hits content | Middleware passes (JWT valid) but `contentAccess`/`requireActiveLearner` 403/404 immediately — access gated by membership, not token (US-LEARNER-01·EC10) | ⬜ | — | links isolation guard |
| EC13 | Session expiry **mid-session** in web | API 401 → `api.ts` interceptor `logout()` + `window.location.href='/{locale}/login'` | ⬜ | — | — |
| EC14 | **Return-after-login** after expiry redirect | `api.ts` hard-redirects to `/{locale}/login` with **no `?from`/return param**, and `login/page.tsx` redirects to `getPostLoginPath(role)` (role home), **not** the deep link. AUTH-01·AC2 claims deep-link return — verify whether it actually works through the 401 path or only the AuthGuard path | ⬜ | — | **possible gap: 401-triggered logout loses intended destination** |
| EC15 | SessionSync 401 (token already invalid on mount) | `.catch(()=>{})` swallows; but the request 401 also trips `api.ts` interceptor → logout+redirect | ⬜ | — | verify no redirect loop |
| EC16 | SessionSync refreshes role/locale after server-side change | Stored `user` updated (e.g. role flip EC11 of AUTH-06, locale change) | ⬜ | — | — |
| EC17 | Token issued before `tenantId` existed, owner just created | Middleware resolves tenantId each request (lazy) | ⬜ | — | — |
| EC18 | Clock skew (token `iat` slightly future) | jsonwebtoken default tolerance; verify no false 401 | ⬜ | — | edge |
| EC19 | Concurrent requests during token refresh | `me()` reissue only on legacy; no refresh-token rotation race for modern tokens | ⬜ | — | — |
| EC20 | Very large/garbage Bearer value (10k chars) | 401, no crash/DoS | ⬜ | — | — |
| EC21 | Password changed elsewhere, old token still used | Old token valid up to 7d (no `tokenVersion`) — links AUTH-04·EC14 | ⬜ | — | **S2 no revocation** |
| EC22 | `JWT_SECRET` rotation (ops) | All existing tokens 401 at once → mass logout; expected but note operational impact | ⬜ | — | ops note |

**Notes / open questions**
- No refresh-token / rotation: tokens are 7-day bearer with no server-side revocation. Password
  change, logout-everywhere, and role change all share the "stale JWT" limitation
  (AUTH-04·EC14, AUTH-05·EC5, AUTH-06·EC11, EC21).

---

### US-AUTH-08: Rate limiting on auth endpoints
**As the** platform, **I want** auth endpoints bounded against brute-force/spam, **so that** a NAT'd
classroom still logs in while password-guessing and signup-spam are capped.
**Routes/code:** `rate-limit.middleware.ts` (`loginRateLimit` 30/15min `skipSuccessfulRequests`;
`authWriteRateLimit` 40/15min) on `/auth/{register,upgrade-to-tenant,join-class,me/password}` and
`/auth/login` · `app.set('trust proxy', 1)` (real client IP behind nginx).
**Priority:** P1

**Acceptance criteria**
- AC1 — After 30 **failed** logins in 15min from one IP, further attempts get 429 "Too many failed
  attempts…"; **successful** logins don't count (whole NAT class can sign in).
- AC2 — After 40 auth-write requests in 15min from one IP, further get 429 "Too many requests…".

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | 30 wrong-password logins then 31st | 429 (login limiter); message localized? server message is English JSON | ⬜ | — | deferred in AUTH-01·EC8 (needs volume) |
| EC2 | 30 failures then a **correct** login (within window) | Succeeds — `skipSuccessfulRequests` only counts failures; verify a good cred still passes after near-limit failures | ⬜ | — | — |
| EC3 | Classroom (40 students) self-register behind one NAT IP | 40th ok, 41st 429 on register (`authWriteRateLimit` shared across register/change-pw/tutor/join) — a real class > 40 students can't all self-enroll in one 15min window | ⬜ | — | **S2 — write limiter not NAT-aware like login limiter** |
| EC4 | Single user changes password + requests tutor + joins class rapidly | All draw from the same 40/15min bucket | ⬜ | — | — |
| EC5 | `trust proxy` correctness | Limiter keys on real `X-Forwarded-For` client IP, not nginx IP (else whole platform shares one bucket) | ⬜ | — | **S1 if misconfigured — verify per-client keying behind nginx** |
| EC6 | 429 response shape | `{ message: '…' }` JSON, `standardHeaders` rate-limit headers present, `legacyHeaders:false` | ⬜ | — | — |
| EC7 | Limiter is in-process | `express-rate-limit` default memory store ⇒ **per-process**, not shared across API instances; multi-instance deploy weakens the cap | ⬜ | — | **S3 — memory store not shared (matches admin-rate-limit note)** |
| EC8 | 429 surfaced in web login/register UI | Login maps non-401/403 status → `serverError` (generic) — a 429 shows "server error", not "too many attempts" | ⬜ | — | **S3 — 429 not distinctly messaged in UI** |
| EC9 | Window reset after 15min | Counter resets; user can retry | ⬜ | — | — |
| EC10 | i18n of limiter messages | Server messages English-only regardless of `Accept-Language` | ⬜ | — | S3 |

---

### US-AUTH-09: register-tenant endpoint + role-write/normalization boundaries
**As the** platform, **I want** tenant accounts never self-created and identity normalization to be
collision-proof, **so that** the manual-activation model and account uniqueness hold.
**Routes/code:** `POST /auth/register-tenant` → `registerTenant()` (always 403) ·
`auth.controller.ts register()` email normalization · `tenant/students.ts` username uniqueness vs
`auth.controller.ts login()` case-insensitive username match.
**Priority:** P1

**Acceptance criteria**
- AC1 — `POST /auth/register-tenant` always returns 403 "Tenant accounts are created by platform
  admins" (no self-serve tenant creation).
- AC2 — Email is the canonical identity (lowercased, trimmed, insensitively unique); username is the
  alternate identity for email-less kids and must be collision-proof against login matching.

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | `POST /auth/register-tenant` (any body) | 403, no account created (note: route has **no** rate limiter, unlike `/register`) | ⬜ | — | — |
| EC2 | register-tenant with crafted role/admin fields | Still 403 before any parsing | ⬜ | — | — |
| EC3 | **Username case-collision** | `createStudent` checks `findUnique({where:{username}})` (case-**sensitive**), but `login()` matches username `mode:'insensitive'` via `findFirst`. So "Ali" and "ali" can both be created, yet login by "ali" resolves ambiguously to whichever `findFirst` returns | ⬜ | — | **S2 — username uniqueness (case-sensitive) inconsistent with login (case-insensitive) → ambiguous login / lockout** |
| EC4 | Synthetic email collision | Email-less kid → `${username.toLowerCase()}@students.talim.local`; two usernames differing only in case map to the **same** synthetic email → `user.email` unique constraint 500 on the second | ⬜ | — | **S2 — case-variant usernames collide on synthetic email** |
| EC5 | Username 2 chars (under min) | 400 — `createStudentSchema username.min(3)` | ⬜ | — | — |
| EC6 | Username 3 / 40 chars (boundaries) | Accepted; 41 → 400 `.max(40)` | ⬜ | — | — |
| EC7 | Username with `@` or spaces | Verify schema regex/charset (does it allow `@`? if so it could masquerade as an email at login since login branches on `includes('@')`) | ⬜ | — | **check username charset vs login `@` branch** |
| EC8 | Real student email collides with `@students.talim.local` domain | A real email at that domain could collide with a synthetic kid email — unlikely but verify domain reserved | ⬜ | — | edge |
| EC9 | Login identifier with `@` resolves email branch; without `@` resolves username branch | Confirmed in `login()` — a username containing `@` would wrongly hit the email branch | ⬜ | — | links EC7 |
| EC10 | Email stored mixed-case pre-F17 (legacy data) | Login `mode:'insensitive'` still matches; register dedupe `insensitive` | ⬜ | F17 | `59dc681` |

**Notes / open questions**
- EC3/EC4/EC7 are a cluster: username identity normalization is weaker than email's. Email is
  trim+lowercase+insensitive-unique; username is trim-only + case-sensitive-unique but
  case-insensitive at login. Recommend lowercasing usernames at creation (mirroring email) to close
  the collision/ambiguity gaps.

---


<!-- ===== AREA: ingest ===== -->
## Area: B2C ingest: PDF/SLIDE upload, OCR, YouTube, processing job

> Scope: the INDIVIDUAL (B2C) content-ingestion surface — `POST /content/upload`,
> `POST /content/youtube`, `POST /content/:id/retry`, `POST /content/:id/reparse`,
> `POST /content/:id/ocr-region`, `GET /content/:id/file`, the `process-content` Bull
> job, and the web upload / status-gate / PDF-reader components.
> Continues IND numbering from the existing backlog (US-IND-01..08 exist) — **new stories start at US-IND-09**.
> US-IND-01 / US-IND-02 stubs in the backlog index are subsumed and deepened by US-IND-09..16 below.
>
> **Real error contracts (from code), reused across stories:**
> - Multer oversize → **413** `{ code:'FILE_TOO_LARGE', maxFileSizeMb:120 }` (`error.middleware.ts:106`).
> - Multer wrong type → **400** `{ message:'Only PDF and slide files are allowed' }` (filter `upload.middleware.ts:17`).
> - Plan page/size cap → **413** `{ code:'PLAN_FILE_LIMIT', maxPages, maxFileSizeMb, pages, fileSizeMb, upgradePlanCode }`.
> - Daily quota → **402** `{ code:'QUOTA_EXCEEDED', feature, used, limit, upgradePlanCode }` (UPLOAD/GENERATION on ingest routes).
> - Cross-tenant / not-visible content → **404** via `assertCanAccessContent` (no existence leak).
> - YouTube bad URL → **400** `{ message:'Invalid YouTube URL' }`.
> - Blob fetch (`authenticatedBlob.ts`) carries HTTP `status` on `BlobFetchError`; 4xx = permanent (no retry).

---

### US-IND-09: Upload a PDF → processing → READY → workspace
**As an** INDIVIDUAL, **I want** to upload a PDF and have it ingested into a study workspace, **so that** I can read it and use AI summary/quiz/podcast/tutor.
**Routes/code:** `/[locale]/dashboard` → `POST /content/upload` · `content.controller.ts:124` (`uploadContent`) · `useFileUpload.tsx` · `UploadCard.tsx` · `processContent.job.ts` · `useContent.ts` (`useUploadContent`, `useContents` poll) · `content-status-gate.tsx`.
**Priority:** P0

**Acceptance criteria**
- AC1 — Given a valid text-layer PDF under plan caps, When I upload it, Then API returns **201** with `status:'PENDING'`, the card is prepended to the dashboard grid, and the list polls every 3s until it flips to `READY`.
- AC2 — Given the job runs, When extraction + chunk/embed + section generation succeed, Then `Content.status` transitions `PENDING → PROCESSING → READY` and the detail page renders the reader (not the processing card).
- AC3 — Given READY content, When I open `/content/[id]`, Then `content-status-gate` returns null and the PDF reader (`ContentStage`) loads the file blob.

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Happy path, small text PDF (1–3 pages) | 201 PENDING → polls → READY; reader renders | ⬜ | — | — |
| EC2 | Upload while not authenticated (token expired) | 401 → axios interceptor logs out + redirects to `/{locale}/login`; no orphan content | ⬜ | — | — |
| EC3 | Optimistic card vs server: `prependContentToLists` shows card immediately, then `invalidateContentLists` reconciles | No duplicate card, no flash of "no materials" | ⬜ | — | — |
| EC4 | List poll lifecycle: `useContents` `refetchInterval` only fires while `listHasProcessing` | Polling stops once all READY (no infinite 3s polling) | ⬜ | — | — |
| EC5 | Detail-page poll: `useContent` polls 3s only for PENDING/PROCESSING | Stops at READY/FAILED; no battery drain | ⬜ | — | — |
| EC6 | Chunks ≤ 3 (tiny PDF) | `assertQuota('GENERATION')` mid-job is **skipped** (`chunks.length > 3` guard, job:65) — tiny doc never blocked | ⬜ | — | — |
| EC7 | Section generation succeeds but slide pre-gen fails | Content still **READY** (slide gen is best-effort try/catch, job:85-102); no FAILED | ⬜ | — | — |
| EC8 | Upload, then immediately navigate to `/content/[id]` while PENDING | Processing card with cycling steps shown; auto-flips to reader on READY (detail poll) | ⬜ | — | — |
| EC9 | Two browser tabs open on dashboard, upload in tab A | Tab B's poll surfaces the new card within 3s (or on focus refetch) | ⬜ | — | — |
| EC10 | Title = original filename incl. unicode / emoji / very long name | Stored verbatim as `title`; renders without layout break or XSS | ⬜ | — | — |
| EC11 | Filename with path separators (`../../etc`) | `storageService.save` uses `path.basename` (storage:31) — traversal stripped; safe | ⬜ | — | — |
| EC12 | Upload succeeds but Redis/queue down (`contentQueue.add` throws) | Content row already created PENDING but never processed → stuck PENDING forever; user sees perpetual processing card | ⬜ | — | **S2 — orphan PENDING if `add` fails after `create`** |
| EC13 | i18n: processing/READY/error copy in uz/en/ru | All keys resolve (verified present: `processing`, `failed`, `pdfLoading`); no raw keys | ⬜ | — | — |
| EC14 | a11y: upload button keyboard-reachable, `aria-disabled` while pending, hidden input `sr-only` | Focusable, screen-reader announces "Uploading…" state | ⬜ | — | — |
| EC15 | Mobile/tablet: upload card + processing animation layout | No overflow; FAB/drawer upload entry works at 375/768 | ⬜ | — | — |

**Notes / open questions**
- EC12: `uploadContent` does `prisma.content.create({status:PENDING})` then `await contentQueue.add(...)` — if the queue add rejects, the response 201 is never sent (handler throws → 500) but the PENDING row persists with no job. There is no reconciler/sweeper. Worth confirming live with Redis stopped.

---

### US-IND-10: Upload validation, size & plan-cap boundaries
**As the** platform, **I want** uploads rejected with the right structured error for size/page/type violations, **so that** quota/plan gating and the upgrade modal behave correctly and bad files don't crash the worker.
**Routes/code:** `upload.middleware.ts` (multer 120 MB + fileFilter) · `content.controller.ts:124-168` (plan gating via `getFileLimitsForUser`) · `error.middleware.ts:99-118` · `pdf.service.ts:28` (`getPdfPageCount`).
**Priority:** P0 · **Last verified:** 2026-06-28 on `claude/visual-qa` (EC8/EC9/EC15/EC22)

**Acceptance criteria**
- AC1 — Given a file > 120 MB, When uploaded, Then multer rejects with **413** `{code:'FILE_TOO_LARGE', maxFileSizeMb:120}` and the web shows an **inline** message (not the upgrade modal — upgrading won't lift the hard cap).
- AC2 — Given a file over the *plan* page/size cap (e.g. FREE 100 pages / 25 MB) but under 120 MB, When uploaded, Then **413** `{code:'PLAN_FILE_LIMIT', maxPages, maxFileSizeMb, pages, fileSizeMb, upgradePlanCode}` opens the global promotion modal.
- AC3 — Given a non-PDF file (incl. PowerPoint, post-F35), When uploaded, Then **400** `Only PDF files are supported. Please export PowerPoint (.ppt/.pptx) to PDF and upload that.`

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Exactly 120 MB (== `UPLOAD_MAX_MB`) | Accepted (multer limit is strict `>`); 120.01 MB rejected 413 FILE_TOO_LARGE | ⬜ | — | boundary |
| EC2 | 130 MB PDF | 413 FILE_TOO_LARGE inline, **no** modal (matches US-IND-08·EC7) | ⬜ | — | — |
| EC3 | FREE-plan 30 MB / 120-page PDF (under hard cap, over plan cap) | 413 PLAN_FILE_LIMIT → modal "exceeds your plan", shows "100 pages / 25 MB" | ⬜ | — | — |
| EC4 | Exactly at plan cap (== maxPagesPerFile, == maxFileSizeMb) | **Accepted** — gate is strict `>` (`overSize`/`overPages` use `>`, controller:142-144) | ⬜ | — | boundary |
| EC5 | 0-byte file | multer accepts (no min); `getPdfPageCount`→null; saved; job: `pdfParse` on empty buffer throws → **FAILED** | ⬜ | — | confirm FAILED not 500 |
| EC6 | Non-PDF disguised as `.pdf` (e.g. `.txt`/`.zip` renamed) | fileFilter **passes** (allows any `*.pdf` name, mw:23); `isPdf=true`; `getPdfPageCount`→null→gating skipped; job `pdfParse` throws → **FAILED** | ⬜ | — | — |
| EC7 | Real PDF with wrong mimetype (`application/octet-stream`) but `.pdf` name | Accepted (name suffix), processes normally | ⬜ | — | — |
| EC8 | **`.pptx` PowerPoint** upload | **400** `Only PDF files are supported…` at the upload boundary — verified live: server curl 400 + uz UI toast. (Was: accepted by fileFilter then **always FAILED** at ingest — no PPTX extractor.) | 🐛→✅ | F35 | `e0a8846` |
| EC9 | `.ppt` legacy PowerPoint | Same as EC8 — rejected **400** at upload (was FAILED at ingest). | 🐛→✅ | F35 | `e0a8846` |
| EC10 | Image file `.png`/`.jpg` renamed `.pdf` | fileFilter passes on name; job pdfParse throws → FAILED | ⬜ | — | — |
| EC11 | Password-protected / encrypted PDF | `getPdfPageCount`→null (pdfParse catch); **plan page-cap silently bypassed**; job: pdfParse on encrypted throws → FAILED | ⬜ | — | **S3 — page-cap bypass for encrypted/corrupt** |
| EC12 | Corrupt/truncated PDF (valid header, broken body) | `getPdfPageCount`→null; job extraction fails → FAILED; clear FAILED screen | ⬜ | — | — |
| EC13 | Scanned PDF with 500 pages on FREE (no text layer) | `getPdfPageCount` returns real count → 413 PLAN_FILE_LIMIT if > cap; but if pdfParse can't read pages, null → bypass (see EC11) | ⬜ | — | — |
| EC14 | Multi-file select (multiple files in picker) | `useFileUpload` reads `files?.[0]` only — silently uploads **first** file, ignores rest; no error/notice | ⬜ | — | **S3 — silent drop of extra files** |
| EC15 | Wrong-type rejection copy | Localized `content.uploadFailed` toast in the active locale (uz "Yuklash amalga oshmadi…"). **Was** hardcoded English "Upload failed" via the dashboard quick-action + topbar callers. | 🐛→✅ | F41 | `a80ddad` |
| EC16 | Quota-exceeded user uploads 120 MB | Whole file buffered into memory (multer memory storage) **before** `enforceQuota` returns 402 — resource cost on a blocked user | ⬜ | — | **S4 — quota checked after full buffering** |
| EC17 | Double-buffer cost: `getPdfPageCount` (controller) + job both run `pdfParse` on full buffer | Large PDF parsed twice in memory; acceptable but noted | ⬜ | — | — |
| EC18 | Upload with no file part (`req.file` undefined) | 400 `No file uploaded` (controller:127) | ⬜ | — | — |
| EC19 | Upload as TENANT_OWNER to `/content/upload` | Blocked by `blockIndividualContentForOwner` (owners must use `/tenant/content`) | ⬜ | — | role boundary |
| EC20 | Upload as TENANT_LEARNER | Blocked by `blockLearnerMutations` (learners can't upload) | ⬜ | — | role boundary |
| EC21 | TENANT_OWNER plan caps (`getFileLimitsForTenant`) differ from individual | Correct limits applied per role branch (controller:134-137) | ⬜ | — | — |
| EC22 | File picker `accept` attribute | `.pdf` only — picker no longer offers `.ppt/.pptx` (was `.pdf,.ppt,.pptx`, inviting a type the server 400s post-F35). | 🐛→✅ | F40 | `a80ddad` |

---

### US-IND-11: Scanned-PDF OCR ladder (Mistral-OCR → poppler → vision)
**As an** INDIVIDUAL, **I want** a scanned/image PDF (no text layer) still ingested, **so that** I can study a photographed textbook.
**Routes/code:** `pdf.service.ts` `extractPdfText:380` ladder → `ocrViaOpenRouter` (Mistral-OCR) → `rasterizeAndOcrPdf` (pdftoppm + gpt-4o-mini vision) → `extractWithOpenAI` (whole-file vision). Env: `OPENROUTER_API_KEY`, `OPENAI_API_KEY`, `OCR_MAX_PAGES`, `OCR_CONCURRENCY`.
**Priority:** P1

**Acceptance criteria**
- AC1 — Given a scanned PDF and `OPENROUTER_API_KEY` set, When ingested, Then Mistral-OCR (file-parser plugin) transcribes verbatim and text is read from `annotations[].file.content`.
- AC2 — Given OpenRouter fails/returns empty, When ingested, Then it falls back to local `pdftoppm` rasterize + per-page vision OCR; if that fails, to whole-file OpenAI vision.
- AC3 — Given no text could be extracted by any rung, Then the job throws → content **FAILED**.

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Scanned PDF, OpenRouter configured, base64 ≤ 30 MB | One `ocrRequestOnce`; verbatim text returned, sections built, READY | ⬜ | — | — |
| EC2 | Large scan (base64 > 30 MB cap) | `ocrViaOpenRouter` splits into page batches (`pdfseparate`+`pdfunite`) each < 18 MB raw; concatenated in page order | ⬜ | — | — |
| EC3 | Single-page PDF whose base64 > 30 MB | `pageCount ≤ 1` → can't split → one `ocrRequestOnce` → OpenRouter 413 error body → throws → falls to local rasterize | ⬜ | — | — |
| EC4 | OpenRouter returns transient 429/502 | `ocrRequestOnce` retries 3× with backoff (honours `retry-after`); only then falls back | ⬜ | — | — |
| EC5 | OpenRouter HTTP 200 with `error` body (code 413 content cap) | Surfaced as throw → caught in `extractPdfText` → falls to local OCR (warn logged) | ⬜ | — | — |
| EC6 | `OPENROUTER_API_KEY` unset | Skips rung 1 entirely; goes straight to `rasterizeAndOcrPdf` | ⬜ | — | — |
| EC7 | `pdftoppm` not installed (ENOENT) | `runPdftoppm` rejects → `rasterizeAndOcrPdf` throws → falls to `extractWithOpenAI` whole-file | ⬜ | — | — |
| EC8 | Scan exceeds `OCR_MAX_PAGES` | Only first N pages OCR'd; warn logged "OCR'd first N of M"; content READY but **truncated** — later pages silently missing | ⬜ | — | **S3 — silent page truncation, no user notice** |
| EC9 | A single page fails to OCR mid-batch | That page skipped (try/catch per page, pdf:166-177), others retained; partial text | ⬜ | — | — |
| EC10 | `pdftoppm` hangs on a malformed page | SIGKILL after 120 s (`PDFTOPPM_TIMEOUT_MS`) → batch rejects → fallback; worker not hung | ⬜ | — | — |
| EC11 | All rungs return empty (blank/white scan) | `extractWithOpenAI` throws `No text could be extracted` → FAILED | ⬜ | — | — |
| EC12 | Both `OPENROUTER_API_KEY` and `OPENAI_API_KEY` unset | Rung-2/3 throw "OPENAI_API_KEY is required" → FAILED with config-hint message | ⬜ | — | — |
| EC13 | Mixed PDF: some pages have text, some scanned | `extractWithPdfParse` returns non-empty (any text) → **OCR ladder never runs**; scanned pages lost (text layer present but partial) | ⬜ | — | **S3 — partial-text PDF skips OCR for image pages** |
| EC14 | Temp-dir cleanup on success & on throw | `rm(dir, recursive)` in `finally` (pdf:181) — no temp leak even on failure | ⬜ | — | — |
| EC15 | Usage metering: OCR records `PDF_PARSE` events per rung | `recordUsage` fires with correct model id (`openrouter:...+mistral-ocr` / `gpt-4o-mini`) | ⬜ | — | — |
| EC16 | Arabic/Quranic verses in scan | Verbatim (no re-diacritization); OCR_INSTRUCTION forbids reconstruction | ⬜ | — | language-policy |
| EC17 | Concurrency: `OCR_CONCURRENCY` batch sizing | Pages OCR'd in bounded batches; memory/disk stay bounded for 200-page book | ⬜ | — | — |

---

### US-IND-12: process-content job lifecycle, failure & retry
**As the** platform, **I want** the ingest job to set correct statuses and be safely retryable, **so that** transient failures recover and deleted content doesn't crash the worker.
**Routes/code:** `processContent.job.ts` · `content.controller.ts:192` (`retryContent`) · `content.controller.ts:44` (`reparseContent`) · `rag.service.ts:106` (`storeChunksWithEmbeddings` — `DELETE FROM Chunk` first) · `queue.service.ts` (`cancelContentJobs`).
**Priority:** P0

**Acceptance criteria**
- AC1 — Given the job throws anywhere, When it fails, Then status is set to `FAILED` via **`updateMany`** (so a deleted-mid-ingest content doesn't throw P2025 and mask the real error, job:107).
- AC2 — Given FAILED content, When I click Retry, Then `POST /content/:id/retry` re-queues it (status→PENDING) only if `status==='FAILED'`, charging GENERATION quota; re-running clears prior chunks (no duplicates).
- AC3 — Given retry on content whose source file/URL is gone, Then 400 with a specific message (not a silent re-fail).

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Content deleted while PROCESSING | Job catch uses `updateMany` → no P2025; deleted row stays gone | ⬜ | — | — |
| EC2 | Content deleted right before the **success** `prisma.content.update({READY})` (job:78, an `update`) | `update` throws P2025 → caught → `updateMany FAILED` (0 rows) → re-throw → job-failed log; no crash but noisy | ⬜ | — | **S4 — success-path uses `update` not `updateMany`** |
| EC3 | Retry a non-FAILED content (READY/PROCESSING) | 400 `Only failed content can be retried` (controller:196) | ⬜ | — | — |
| EC4 | Retry a FAILED **YouTube** with null url | 400 `YouTube URL missing` (controller:200) | ⬜ | — | — |
| EC5 | Retry a FAILED **PDF** with null storagePath (file purged) | 400 `File no longer available — please upload again` (controller:202) | ⬜ | — | — |
| EC6 | Retry but file deleted from disk (storagePath set, file gone) | Job `storageService.get` → ENOENT throws → FAILED again; user loops | ⬜ | — | confirm clean FAILED |
| EC7 | Retry clears stale chunks | `storeChunksWithEmbeddings` runs `DELETE FROM "Chunk" WHERE contentId` first → **no duplicate embeddings** on retry | ⬜ | — | verified rag:111 |
| EC8 | Retry quota exhausted (GENERATION at limit) | `assertQuota` in `retryContent` (controller:205) → 402 QUOTA_EXCEEDED before re-queue | ⬜ | — | — |
| EC9 | Double-click Retry | Button `disabled={retryContent.isPending}` (status-gate:61); single re-queue | ⬜ | — | — |
| EC10 | Concurrent retry from two tabs | Second hits 400 (status already PENDING, not FAILED) — idempotent-ish | ⬜ | — | — |
| EC11 | Mid-job GENERATION re-assert (job:65-71) | If user's GENERATION quota got exhausted between upload-accept and job run, an **already-accepted** upload FAILS at the redundant in-job assertQuota | ⬜ | — | **S3 — redundant mid-job quota can fail accepted upload** |
| EC12 | Embeddings succeed but `generateContentSections` throws | Catch → FAILED; chunks exist but no sections; retry re-runs whole pipeline (chunks re-DELETE'd) cleanly | ⬜ | — | — |
| EC13 | Partial ingest: sections built but `autoGenerateSectionDecks` throws | Content still READY (best-effort); decks regenerate on demand | ⬜ | — | — |
| EC14 | `chunkText` yields 0 chunks (empty extracted text) | `storeChunksWithEmbeddings` deletes then inserts nothing; sections gen on 0 chunks; READY but empty workspace | ⬜ | — | confirm graceful empty state |
| EC15 | Job processes a `contentId` whose row vanished before PROCESSING update | `findUnique`→null → throws `Content ... not found` → job-failed log; no status row to update | ⬜ | — | — |
| EC16 | Unsupported content type reaches job (neither YOUTUBE w/url, PDF, SLIDE, nor storagePath) | Throws `No content source available` / `Unsupported content type` → FAILED | ⬜ | — | — |
| EC17 | `reparseContent` (manual re-read OCR) on non-PDF/SLIDE | 400 `Only PDF or slide documents can be re-read` (controller:48) | ⬜ | — | — |
| EC18 | `reparse` > 30 page-images submitted | Zod rejects (`reparseSchema` max 30) → 400 validation error | ⬜ | — | — |
| EC19 | `reparse` sets PROCESSING then OCR throws | Reverts to **FAILED** (controller:80-83) and re-throws | ⬜ | — | — |
| EC20 | `reparse` rate-limit | `reparseRateLimit` middleware caps re-read spam | ⬜ | — | — |

---

### US-IND-13: YouTube import → transcript → READY
**As an** INDIVIDUAL, **I want** to add a YouTube link and get its transcript ingested, **so that** I can study the video with AI tools.
**Routes/code:** `/[locale]/dashboard` → `POST /content/youtube` · `content.controller.ts:171` (`createYoutubeContent`) · `youtube.service.ts` (`extractYoutubeVideoId`, `extractYoutubeTranscript`, `generateYoutubeTranscript`) · `UploadCard.tsx` `YoutubeLinkForm` · `content-shared.ts` `loadOrBackfillTranscript`.
**Priority:** P0

**Acceptance criteria**
- AC1 — Given a valid YouTube watch/shorts/youtu.be URL with captions, When added, Then 201 PENDING; job fetches captions (`YOUTUBE_CAPTIONS`), stores `ContentTranscriptSegment`s, → READY.
- AC2 — Given a video with no captions, When ingested, Then it falls back to AI transcription (download audio → Whisper, `AI_TRANSCRIPTION`).
- AC3 — Given an invalid/non-YouTube URL, When submitted, Then **400** `Invalid YouTube URL` (no content created).

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | `youtube.com/watch?v=ID` with captions | Captions path, READY; transcript segments stored | ⬜ | — | — |
| EC2 | `youtu.be/ID`, `youtube.com/embed/ID`, `youtube.com/shorts/ID` | All matched by `extractYoutubeVideoId`; accepted | ⬜ | — | — |
| EC3 | `watch?v=ID&list=PL...` (video in playlist) | `v=` matched → single video ingested (playlist ignored) | ⬜ | — | — |
| EC4 | Playlist-only URL `youtube.com/playlist?list=...` | No `v=` → `extractYoutubeVideoId`→null → **400 Invalid YouTube URL** | ⬜ | — | — |
| EC5 | Non-YouTube but valid URL (`https://vimeo.com/123`) | Zod `.url()` passes; videoId null → 400 Invalid YouTube URL | ⬜ | — | — |
| EC6 | Non-URL string (`"hello"`) | Zod `.url()` fails → 400 validation error (before controller) | ⬜ | — | — |
| EC7 | Empty/whitespace URL | Form guards `!youtubeUrl.trim()` → no request; (server) zod would 400 | ⬜ | — | — |
| EC8 | Video with no captions → AI transcribe | `YoutubeTranscript.fetchTranscript` throws → caught → `generateYoutubeTranscript` (ytdl audio → Whisper) | ⬜ | — | — |
| EC9 | **Very long video** (>~30 min) no captions | `streamToBuffer` buffers whole audio in memory; Whisper has a 25 MB file limit → API rejects → job FAILED; OOM risk on huge audio | ⬜ | — | **S2 — no audio size/duration cap before Whisper** |
| EC10 | Private / members-only video | `ytdl` throws → `generateYoutubeTranscript` throws → FAILED screen w/ Retry | ⬜ | — | — |
| EC11 | Age-restricted video | `ytdl` typically throws (sign-in required) → FAILED | ⬜ | — | — |
| EC12 | Deleted / unavailable video | Captions throw + ytdl throws → FAILED | ⬜ | — | — |
| EC13 | Region-blocked video | ytdl/caption fetch fail → FAILED | ⬜ | — | — |
| EC14 | Livestream (active) | ytdl audio stream may never end / huge → timeout/OOM → FAILED; confirm no hung worker | ⬜ | — | **S3 — unbounded livestream stream** |
| EC15 | Captions exist but empty text after normalize | `text && segments.length>0` false → falls through to AI transcription | ⬜ | — | — |
| EC16 | No `OPENAI_API_KEY` + no captions | `generateYoutubeTranscript` throws `No transcript available` → FAILED | ⬜ | — | — |
| EC17 | Transcript backfill on first `GET /content/:id/transcript` | `loadOrBackfillTranscript` lazily fetches+stores if segments empty (shared:78) | ⬜ | — | — |
| EC18 | Duplicate YouTube URL added twice | Two separate Content rows (no dedup); both ingested, 2× quota | ⬜ | — | by-design? note |
| EC19 | Title omitted | Defaults to `YouTube Video <id>` (controller:182) | ⬜ | — | — |
| EC20 | Title with XSS payload | Stored verbatim; rendered escaped by React | ⬜ | — | — |
| EC21 | Double-submit YouTube form (Enter twice) | Button `disabled` while pending; but rapid double-Enter before re-render could create 2 rows | ⬜ | — | **S4 — possible double-create on fast double-submit** |
| EC22 | Quota exhausted (UPLOAD/GENERATION) on YouTube add | 402 QUOTA_EXCEEDED → upgrade modal (route `enforceQuota('UPLOAD','GENERATION')`) | ⬜ | — | — |
| EC23 | YouTube add as OWNER/LEARNER | OWNER blocked (use tenant route); LEARNER blocked (`blockLearnerMutations`) | ⬜ | — | role boundary |
| EC24 | `ytdl-core` broken by a YouTube change (common) | All no-caption videos FAIL until lib update; captions path still works | ⬜ | — | known fragility — note |

---

### US-IND-14: Content-status-gate UI (FAILED / processing screens)
**As an** INDIVIDUAL, **I want** a clear FAILED screen with retry/delete and a friendly processing screen, **so that** I understand and can act on ingest state.
**Routes/code:** `/[locale]/content/[id]` · `content-status-gate.tsx` (`ContentStatusGate`, `ProcessingCard`) · `useRetryContent` · `DeleteContentDialog`.
**Priority:** P1

**Acceptance criteria**
- AC1 — Given `status==='FAILED'`, Then a FAILED card shows with Retry + Delete (non-learners) + Back-to-library; Given learner, Then only Back (no retry/delete).
- AC2 — Given a non-READY non-FAILED status (PENDING/PROCESSING), Then the animated ProcessingCard shows cycling steps; Given READY, Then gate returns null and the reader renders.

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | FAILED screen, INDIVIDUAL | Retry + Delete + Back shown; copy localized (`failed`,`failedDesc`,`retry`,`backToLibrary`) | ⬜ | — | — |
| EC2 | FAILED screen, learner (`isLearner`) | Only Back-to-library (no retry/delete) | ⬜ | — | — |
| EC3 | Click Retry → success | Status→PENDING, detail poll resumes, ProcessingCard replaces FAILED card | ⬜ | — | — |
| EC4 | Retry → 402 quota | Quota error surfaced (modal/inline) — confirm `useRetryContent` doesn't swallow it silently | ⬜ | — | check error handling on retry mutation |
| EC5 | Retry → network error | Button re-enables; no stuck spinner | ⬜ | — | — |
| EC6 | Retry in-flight | Button shows `retrying` label + disabled | ⬜ | — | — |
| EC7 | Delete from FAILED screen, confirm | `DeleteContentDialog` → on delete `router.push(homePath)`; card removed from lists | ⬜ | — | — |
| EC8 | Cancel delete dialog | Nothing deleted, dialog closes, FAILED card remains | ⬜ | — | — |
| EC9 | ProcessingCard step cycler | `setInterval(1900ms)` rotates 3 steps; cleared on unmount (no leak) | ⬜ | — | — |
| EC10 | PENDING→READY transition while on processing screen | Detail-page `refetchInterval` flips to reader within 3s, no manual refresh | ⬜ | — | — |
| EC11 | Status enum the UI doesn't model (unknown string) | Falls into the processing branch (`status!=='READY' && !=='FAILED'`); shows generic processing — no crash | ⬜ | — | — |
| EC12 | i18n: all gate strings uz/en/ru | `processing`, `processingStepReading/Analyzing/Structuring`, `processingDesc` (ICU w/ `status`), `failed*`, `retry/retrying` — verified present | ⬜ | — | — |
| EC13 | a11y: FAILED ⚠️ emoji has no aria; Retry/Delete buttons keyboard-focusable; focus order | Buttons reachable; emoji decorative (should be `aria-hidden`) | ⬜ | — | check decorative emoji a11y |
| EC14 | Mobile layout of FAILED/processing card | Buttons stack (`sm:flex-row`); card `max-w-md` no overflow at 375 | ⬜ | — | — |
| EC15 | Cross-tenant/foreign content id in URL | `assertCanAccessContent`→404 upstream; gate never renders (page-level 404/redirect) | ⬜ | — | isolation |
| EC16 | `processingDesc` interpolates raw `status` (PENDING/PROCESSING) into copy | Confirm not a raw English enum leaking untranslated into uz/ru | ⬜ | — | possible raw-enum leak |

---

### US-IND-15: PDF reader blob load — spinner / stall-timeout / retry / abort
**As an** INDIVIDUAL, **I want** a large PDF to load with a spinner (not the slide deck), auto-retry transient failures, and abort on leave, **so that** a 93 MB scan on a flaky connection still opens or fails cleanly.
**Routes/code:** `content-stage.tsx:80-126` (blob effect) · `lib/authenticatedBlob.ts` (`fetchAuthenticatedBlob`, `BlobFetchError`, `stallTimeoutMs`) · `GET /content/:id/file` · `content-shared.ts:49` (`sendContentFile`).
**Priority:** P1

**Acceptance criteria**
- AC1 — Given a PDF is loading, Then a spinner + `pdfLoading` text shows (never the section/slide fallback) until the blob resolves.
- AC2 — Given no bytes arrive for 30 s (`stallTimeoutMs`), Then the fetch aborts; transient failures auto-retry up to `MAX_PDF_RETRIES` (2) with backoff; on final failure an error + Retry button shows.
- AC3 — Given a permanent failure (HTTP 4xx), Then it does **not** retry; Retry button shown.
- AC4 — Given the component unmounts mid-download, Then the fetch is aborted and the object URL revoked (no leak, no setState-after-unmount).

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | 93 MB PDF on slow-but-progressing link | Streamed read resets stall timer each chunk → never aborts while progressing; spinner until done | ⬜ | — | — |
| EC2 | Connection stalls mid-download (no bytes 30 s) | `armStall` fires `controller.abort()` → catch → retry (transient) | ⬜ | — | — |
| EC3 | All retries exhausted (3 total attempts) | `setPdfError(true)` → error copy + Retry button | ⬜ | — | — |
| EC4 | Retry button click | `setPdfReload(k+1)` re-runs effect (dep includes `pdfReload`); fresh attempt counter | ⬜ | — | — |
| EC5 | 404 from file endpoint (storagePath missing server-side) | `BlobFetchError status:404` → permanent → no retry → error screen | ⬜ | — | — |
| EC6 | **401 expired token** during blob fetch | status 401 → treated permanent → error screen **but raw `fetch` bypasses axios 401 interceptor** → no auto-logout/redirect; user stuck on error, not re-login | ⬜ | — | **S3 — 401 on blob doesn't trigger re-auth** |
| EC7 | 500 from file endpoint | status 500 → transient → retries → then error | ⬜ | — | — |
| EC8 | Unmount mid-download (navigate away) | `cancelled=true`, `activeController.abort()`, `clearTimeout`, revoke URL; no React state update warning | ⬜ | — | — |
| EC9 | Rapid section/tab switches re-triggering effect | Cleanup revokes prior URL before new fetch; no orphan blob URLs accumulate | ⬜ | — | — |
| EC10 | Resolved after unmount (race) | `if (cancelled) URL.revokeObjectURL(url); return;` — created URL revoked, no setState | ⬜ | — | — |
| EC11 | No token in store | `fetchAuthenticatedBlob` throws `Not authenticated` immediately → error screen | ⬜ | — | — |
| EC12 | `response.body` null (no streaming support) | Falls back to single `response.blob()` read (no stall protection) — older browsers | ⬜ | — | — |
| EC13 | Content-Type header missing on stream | Defaults `application/octet-stream` for the Blob; PDF.js may still sniff — confirm renders | ⬜ | — | — |
| EC14 | Server sends whole file via `res.send(buffer)` (no HTTP Range) | No partial/seek; whole 120 MB must transfer before render — stall window is the only guard | ⬜ | — | note — no range support |
| EC15 | Spinner vs deck race: effect sets `pdfUrl=null,pdfError=false` synchronously at start | Reader shows spinner, **not** `SectionReader` fallback, while loading (guarded by `isPdf && storagePath` branch) | ⬜ | — | — |
| EC16 | Two abort sources (unmount + stall) fire together | Both route through one `AbortController`; idempotent abort, single cleanup | ⬜ | — | — |
| EC17 | i18n: `pdfLoading`/`pdfLoadError`/`pdfRetry` uz/en/ru | Verified present in all three | ⬜ | — | — |
| EC18 | a11y: spinner has no text alternative besides visible label; Retry button focus | `Loader2` decorative + visible `pdfLoading` text; Retry keyboard-reachable | ⬜ | — | — |
| EC19 | Mobile: large PDF on cellular | Stall timeout may abort on genuinely slow mobile (<1 chunk/30s) → false-fail then retry | ⬜ | — | tune 30s for mobile? note |
| EC20 | Memory: object URLs revoked on every reload/unmount | No `blob:` URL leak across reloads (revoke in cleanup + cancelled branch) | ⬜ | — | — |

---

### US-IND-16: OCR a selected PDF region (marquee → text)
**As an** INDIVIDUAL, **I want** to marquee-select a region of a scanned PDF and OCR just that area, **so that** I can seed the tutor or copy text from an image page.
**Routes/code:** `POST /content/:id/ocr-region` · `content.controller.ts:268` (`ocrPdfRegion`) · `pdf.service.ts:450` (`extractRegionTextFromImage`) · `content-stage.tsx` `handlePdfExcerpt` · `ocrRegionSchema`.
**Priority:** P2

**Acceptance criteria**
- AC1 — Given a region image (data URL) of a PDF page, When posted, Then the API vision-OCRs it and returns `{text, page}`.
- AC2 — Given the content isn't a PDF the user can access, Then 404 via `assertCanAccessContent` + type check.

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Valid region of a scanned page | Returns OCR'd `text`; seeds chat with `[Page N]` chip (matches US-IND-06·EC6) | ⬜ | — | — |
| EC2 | Region OCR returns empty (blank area) | `extractRegionTextFromImage` throws `No text could be extracted from the selected region` → error to UI | ⬜ | — | — |
| EC3 | `page < 1` or non-int | Zod `ocrRegionSchema` rejects → 400 validation | ⬜ | — | — |
| EC4 | Empty `image` string | Zod `min(1)` rejects → 400 | ⬜ | — | — |
| EC5 | `image` with valid prefix but empty base64 | `imageBuffer.length===0` → 400 `Invalid image data` (controller:277) | ⬜ | — | — |
| EC6 | Malformed base64 | `Buffer.from(...,'base64')` yields garbage; OpenAI vision likely returns empty → 'No text...' error | ⬜ | — | — |
| EC7 | Non-PDF content id (YOUTUBE/SLIDE) | 404 `PDF content not found` (controller:273) | ⬜ | — | — |
| EC8 | Cross-tenant / foreign content id | 404 via `assertCanAccessContent` | ⬜ | — | isolation |
| EC9 | OCR-region on a **still-PROCESSING/FAILED** PDF | No `requireReady` check — region OCR allowed on any-status accessible PDF; works on raw page image regardless | ⬜ | — | confirm acceptable |
| EC10 | **No quota / no rate-limit** on ocr-region | Each call is an unmetered paid OpenAI vision request — abusable to burn cost (reparse has `reparseRateLimit`+GENERATION quota; ocr-region has neither) | ⬜ | — | **S3 — ocr-region uncapped/unmetered cost** |
| EC11 | Very large region image (multi-MB data URL) | Bounded by `express.json({limit:'10mb'})` → 413 if over; confirm clear error not crash | ⬜ | — | body-limit boundary |
| EC12 | Rapid repeated region selections (double-fire) | Each fires a request; confirm UI debounces / handles overlapping responses (last-wins) | ⬜ | — | — |
| EC13 | Region OCR while offline | Network error surfaced inline (`selectionHint`/chat), not a hang | ⬜ | — | — |
| EC14 | Usage metering | Records `PDF_PARSE` usage event for the region OCR | ⬜ | — | — |
| EC15 | i18n of `selectedArea` / `pdfNoTextInSelection` hint | uz/en/ru localized (US-IND-06 verified `[Page 1] Tanlangan hudud`) | ⬜ | — | — |

---

### US-IND-17: Dashboard upload entry points, duplicate & concurrent uploads
**As an** INDIVIDUAL, **I want** every upload entry point (dashboard card, hero, empty state, FAB) to work and handle duplicates/concurrency, **so that** adding content is reliable.
**Routes/code:** `/[locale]/dashboard/page.tsx` · `UploadCard.tsx` (`FileUploadField`, `YoutubeLinkForm`) · `useFileUpload.tsx` · `useUploadContent`/`useCreateYoutubeContent` (`useContent.ts`).
**Priority:** P2

**Acceptance criteria**
- AC1 — Given any upload entry point, When I pick a file/add a link, Then the same upload pipeline runs and the new card appears optimistically.
- AC2 — Given an upload is in flight, Then the control is disabled (no double-submit) and the file input is cleared after selection so re-selecting the same file re-fires `onChange`.

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Upload from dashboard card vs empty-state vs hero | All route through `useFileUpload`; consistent behaviour | ⬜ | — | — |
| EC2 | Re-select the **same** file after a failure | `e.target.value=''` (hook:26) lets the same file re-trigger `onChange` | ⬜ | — | — |
| EC3 | Click select while pending | `openFilePicker` no-ops when `uploadMutation.isPending`; input `disabled` | ⬜ | — | — |
| EC4 | Upload same file twice (sequential) | Two Content rows created (Date.now() dirs differ); no dedup — 2× processing/quota | ⬜ | — | by-design note |
| EC5 | Concurrent uploads (file + YouTube link nearly simultaneously) | Both prepend; `invalidateContentLists` reconciles; no lost card | ⬜ | — | — |
| EC6 | Upload error sets inline message; next attempt clears it | `setError(null)` at start of each attempt (hook:29) | ⬜ | — | — |
| EC7 | Plan/quota error from upload | Routed via `useLimitErrorHandler` → modal (upgradeable) or inline (hard cap); `error` only inline fallback | ⬜ | — | US-IND-08 link | 
| EC8 | Accept attr restricts picker to `.pdf,.ppt,.pptx` | Native picker filters; but user can still "All files" → server fileFilter is the real gate | ⬜ | — | — |
| EC9 | Empty grid vs filtered-empty after upload | New card appears; confirm not stuck on "no materials" empty state (relates F19 search-empty) | ⬜ | — | — |
| EC10 | Optimistic card for a content that then FAILS | Card flips to FAILED state via poll; not stuck "processing" | ⬜ | — | — |
| EC11 | Upload then immediate delete (before READY) | `useDeleteContent` optimistic-removes; `cancelContentJobs` cancels pending job server-side | ⬜ | — | — |
| EC12 | a11y: file input `sr-only` but labelled by visible button | Screen reader announces button; input reachable via button click | ⬜ | — | — |
| EC13 | Mobile FAB / drawer upload | Touch-friendly (`touch-manipulation`); picker opens; no double-tap double-upload | ⬜ | — | — |
| EC14 | i18n: `selectFile`/`uploading`/`uploadFailed`/`youtubeLink`/`addLink`/`linkFailed` uz/en/ru | All present; no English leak in uz/ru | ⬜ | — | — |

---

## Suspected bugs found while reading the ingest code

1. **SLIDE (`.pptx`/`.ppt`) uploads always FAIL ingest.** `upload.middleware.ts:18-22` explicitly allows PowerPoint mimetypes and `uploadContent` assigns `ContentType.SLIDE`, but `processContent.job.ts:53-54` routes SLIDE through `extractPdfText` → `pdf.service.ts:22 extractWithPdfParse` (`pdf-parse`), which throws on a non-PDF ZIP. There is no PPTX text extractor anywhere, so every slide upload ends `FAILED`. (S2 — advertised file type can't be ingested.)

2. **YouTube AI-transcription has no audio size/duration cap.** `youtube.service.ts:109-123` (`streamToBuffer`/`extractYoutubeAudio`) buffers the entire audio into memory and sends it to Whisper (`generateYoutubeTranscript:147-154`) with no chunking. OpenAI transcription rejects files > 25 MB, so any longer video (≈>20-30 min) without captions FAILS; a livestream/very-long video also risks OOM in the API-cum-worker process. (S2.)

3. **`POST /content/:id/ocr-region` is unmetered and unrate-limited.** `content.controller.ts:268` performs a paid OpenAI vision OCR with **no** quota check and **no** rate limiter, unlike `reparse` (which has `reparseRateLimit` + `assertQuota('GENERATION')`, routes:40 / controller:53). A user can spam region OCR to burn API cost. (S3.)

4. **Plan page-cap silently bypassed for encrypted/corrupt PDFs.** `pdf.service.ts:28-31 getPdfPageCount` returns `null` when `pdf-parse` can't read the PDF; `content.controller.ts:143-144` then computes `overPages=false` (pages null), so an encrypted/over-page-limit PDF passes the FREE page cap and is accepted (only to FAIL later in the job). (S3.)

5. **Redundant mid-job GENERATION quota can FAIL an already-accepted upload.** The upload route already runs `enforceQuota('UPLOAD','GENERATION')`, yet `processContent.job.ts:65-71` calls `assertQuota('GENERATION')` again mid-pipeline (when `chunks.length>3`). If the user's daily GENERATION quota is exhausted between upload-accept and job execution (e.g. via concurrent generation), the content FAILS after acceptance with no clear cause. (S3.)

6. **PDF blob 401 doesn't trigger re-auth.** `authenticatedBlob.ts` uses raw `fetch`, bypassing the axios `401` interceptor that logs out + redirects to `/login`. `content-stage.tsx:107-115` treats 401 (expired token) as a permanent failure and just shows the PDF error screen — the user is stranded instead of being sent to re-login. (S3.)

7. **Orphan PENDING content if `contentQueue.add` rejects.** `uploadContent`/`createYoutubeContent` create the `Content` row (`status:PENDING`) **before** `await contentQueue.add(...)` (controller:157-167 / 178-188). If Redis is down / `add` throws, the row persists as PENDING with no job and no sweeper, so the user sees a perpetual processing card. (S2 if Redis blips.)

8. **Multi-file selection silently drops extras.** `useFileUpload.tsx:25` reads `files?.[0]` only; selecting N files uploads the first and silently ignores the rest with no notice. (S3 UX.)

---


<!-- ===== AREA: media ===== -->
## Area: B2C workspace media: summary/quiz/chat/podcast + VIDEO + SLIDES + extras

> New + deepened user stories for the INDIVIDUAL (B2C) content workspace AI surface.
> Continues the `US-IND-<n>` numbering (existing deep stories: IND-03 summary, IND-04 quiz,
> IND-05 podcast, IND-06 chat, IND-07 dashboard, IND-08 usage-limit modal). Stories below are
> **net-new** (IND-09…IND-13) or **deepen** an existing story (IND-14 chat, IND-15 quiz,
> IND-16 podcast fine-controls). All statuses start ⬜ Not-yet-tested.
>
> Code read for this pass (anchors): `apps/api/src/controllers/{video,slides,podcast,quiz,chat,summary,content}.controller.ts`,
> `apps/api/src/jobs/{generateVideo,generatePodcast,generateQuiz,renderManim}.job.ts`,
> `apps/api/src/routes/content.routes.ts`, `apps/api/src/controllers/content-shared.ts`,
> `apps/web/app/[locale]/content/[id]/{video,slides}/page.tsx`,
> `apps/web/components/deck/{NarratedVideoPlayer,DeckPlayer}.tsx`, `components/podcast/PodcastPlayer.tsx`,
> `components/chat/ChatWindow.tsx`, `store/useChatStore.ts`,
> `apps/web/hooks/{useVideo,useSlides,useTranscript,usePodcast,useChat}.ts`.

---

### US-IND-18: AI Video — per-section narrated slideshow ("parts")
**As an** individual, **I want** to generate and play a narrated video lesson per section of my content, **so that** I can watch an auto-advancing presentation with a teacher voice instead of reading.
**Routes/code:** `/[locale]/content/[id]/video` · `GET/POST /content/:id/video` · `GET /content/:id/video/segments/:index/audio` · `video.controller.ts` · `generateVideo.job.ts` · `useVideo.ts` · `NarratedVideoPlayer.tsx` · `TeacherMascot.tsx`.
**Priority:** P1

**Acceptance criteria**
- AC1 — Given a READY content with sections, When I open the Video tab and click "Generate" (or "Generate part"), Then the API returns 202 `{video.status:'GENERATING'}`, the page polls every 4s, and on READY it renders `NarratedVideoPlayer` with the section's deck + per-slide narration audio.
- AC2 — Given a multi-section content, When I switch the "parts" pills, Then each section is an independent video keyed by `scopeKey=sectionId`; generating one part never rebuilds another.
- AC3 — Given a generated video, When I press play, Then segment audio streams from `/segments/:index/audio` (pinned to the video's own `locale` + `sectionId`), the global timeline advances, chapter ticks render, and the mascot lip-syncs to live amplitude.
- AC4 — Generation draws on BOTH the monthly `GENERATION` budget and the `VIDEO` cap (controller asserts GENERATION first, then VIDEO).

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Generate a part on a single-section content (`hasParts=false`) | EmptyState shows generic "Generate", scopeKey resolves to first section id (or `full`), one video built | ⬜ | — | — |
| EC2 | Generate, then while GENERATING click "Regenerate" again (double-click) | **Video controller has NO 409/in-progress guard** (unlike podcast): a second `regenerate:true` POST re-enqueues a duplicate job and **re-charges GENERATION+VIDEO quota** → 2 jobs race on the same `segments` row | ⬜ | **suspected bug** | — |
| EC3 | Generate while at `VIDEO` cap (FREE) | 402 `QUOTA_EXCEEDED` → upgrade modal (IND-08·EC4: headline reads "generation" because GENERATION is checked first) | ⬜ | — | — |
| EC4 | Generate while at GENERATION cap but VIDEO available | 402 on the GENERATION assert (first) → modal; no video row mutated to GENERATING | ⬜ | — | verify the existing row isn't flipped to GENERATING before the quota throw |
| EC5 | TTS fails for SOME slides (partial) | Job stores those segments with `audioPath:null`/`hasAudio:false`; player falls back to a **timed** advance for silent slides (interval keeps the global bar moving); status READY if `audioCount>0` | ⬜ | — | — |
| EC6 | TTS fails for ALL slides | `audioCount===0` → status `FAILED`; page must NOT show the empty "Generate" state on a FAILED video — verify it shows a retry/error path, not a silent dead end | ⬜ | — | video page has no explicit FAILED branch — only ready/generating/loading/learner/empty; a FAILED video falls to EmptyState → looks ungenerated |
| EC7 | Worker process killed mid-job (no `failed` event fires) | Status stuck `GENERATING` forever → `useVideo` polls every 4s indefinitely (no max-poll cap, unlike useSlides) | ⬜ | **suspected bug** | — |
| EC8 | Video READY but its slide deck still fetching | `readyAwaitingDeck` → "preparing visuals" state, never the "Generate" empty state | ⬜ | — | — |
| EC9 | Segment audio fetch for an `index` with no audio | `GET /segments/:index/audio` → 404 "Segment audio not found" | ⬜ | — | — |
| EC10 | Segment audio fetch for out-of-range `index` (e.g. 999) | `parseSegments().find` misses → 404 | ⬜ | — | — |
| EC11 | Segment audio fetch with non-numeric `:index` (`NaN`) | `Number.parseInt('abc')=NaN`, no segment matches → 404 (no crash) | ⬜ | — | — |
| EC12 | Cross-tenant crafted contentId on `GET /video` or `/segments/:index/audio` | `assertCanAccessContent` → 404 (no leak) — both GET video metadata and segment audio go through the guard | ⬜ | — | **S1 isolation** |
| EC13 | TENANT_LEARNER opens Video tab | `assertCanGenerate` blocks POST; page shows `notAvailableLearner`; no Generate/Regenerate buttons (`isLearner` gate) | ⬜ | — | — |
| EC14 | Generate on a non-READY (PROCESSING) content via crafted POST | `assertCanAccessContent(..,{requireReady:true})` → 404 | ⬜ | — | — |
| EC15 | Regenerate a READY video (happy) | Row reset (`status:GENERATING, script:null, durationSec:null, segments:undefined`), job rebuilds, quota charged again | ⬜ | — | — |
| EC16 | Player: seek before any clip loaded (drag scrubber at t=0) | `pendingSeekRef` stashes offset; applied on `onLoadedMetadata`; no crash, no NaN currentTime | ⬜ | — | — |
| EC17 | Player: real audio duration ≠ server `durationSec` estimate | Timeline rescales when `onLoadedMetadata` measures real duration (≥0.05s delta) — playhead may visibly jump on first load of each clip | ⬜ | — | cosmetic; estimate is `max(4, words/150*60)` |
| EC18 | Player: press play with Web Audio unavailable / blocked | `ensureAudioGraph` try/catch → mascot idles, audio still plays | ⬜ | — | — |
| EC19 | Player: keyboard ←/→ on the seek slider | Seeks ±5s on the global timeline; `role="slider"` + `aria-valuetext` time label present | ⬜ | — | a11y |
| EC20 | Player: reach the end (`onEnded` on last segment) | `playing=false`, playhead pinned to `totalDur`; prev/next disabled appropriately | ⬜ | — | — |
| EC21 | Switch parts pill mid-playback | `key={sectionId}` remounts player → audio stops, new part loads from index 0; blob of old part revoked on unmount | ⬜ | — | verify no blob 404 spam (cf. F21 podcast) |
| EC22 | Locale switch after generating in uz | Video is keyed `(contentId,locale,scopeKey)`; switching to en shows NO video (none for en) → empty/Generate state; uz video intact | ⬜ | — | per-locale generation; expected |
| EC23 | Labels (play/pause/seek/prev/next/fullscreen/part) in uz/ru/en | All from `video.*` namespace; no English leak; `part`/`partEmptyTitle` ICU `{n}` interpolates | ⬜ | — | i18n |
| EC24 | Fullscreen toggle + Esc | Enters/exits via `requestFullscreen`/webkit fallback; ResizeObserver re-fits 1280×720 stage; state tracked on `fullscreenchange` | ⬜ | — | — |
| EC25 | Mobile/tablet: parts bar overflow + 1280×720 scale-to-fit | Parts pills `overflow-x-auto`; stage scales by `min(w/1280,h/720)`; controls wrap | ⬜ | — | mobile |
| EC26 | Two browser tabs generate the same part concurrently | Both pass the cached check (no row yet), both assert quota, both create/update + enqueue → duplicate jobs (no unique-in-flight lock) | ⬜ | **suspected bug** | — |

**Notes / open questions**
- "AI video" is a browser-rendered narrated slideshow — there is **no server-side MP4** (no ffmpeg). The Video tab `storagePath` on `ContentVideo` is unused for narrated videos (only `segments` JSON matters). Confirm the deleteContent cleanup of `video.storagePath` is a no-op for these.
- The job auto-generates the slide deck if missing by calling `generateAndStoreSlideDeck` **directly** (bypassing the slides controller's `GENERATION` quota) — acceptable since the video already charged GENERATION+VIDEO, but means a video generation also materializes a deck for free under the Slides tab.

---

### US-IND-19: Slides deck — generate + DeckPlayer navigation
**As an** individual, **I want** an AI slide deck of my content with a real presentation player, **so that** I can flip through key points like a lecture.
**Routes/code:** `/[locale]/content/[id]/slides` · `GET/POST /content/:id/slides` · `slides.controller.ts` · `slides.service.ts` · `useSlides.ts` · `DeckPlayer.tsx` · `Slide.tsx` · `DeckMarkdown.tsx`.
**Priority:** P1

**Acceptance criteria**
- AC1 — Given a READY content, When I click "Generate" on the Slides tab, Then a deck is generated **synchronously** (no 202/job) and `DeckPlayer` renders with keyboard + click navigation; a cached READY deck is returned without spending `GENERATION` quota.
- AC2 — Given a deck was auto-generated at ingest, When I open the tab, Then `useSlides` polls (5s, capped ~8 empty polls / 3 fetch errors) until the deck appears, then renders it.
- AC3 — DeckPlayer supports ←/→/Space/PageUp/PageDown/Home/End keyboard nav, click tap-zones, a progress bar, fullscreen, and an `aria-live` slide-progress announcement.

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Generate is synchronous & slow (big deck) | Request blocks until the deck is built (no 202) — verify no client timeout / the button shows `generating` spinner the whole time; a 30s+ generation must not appear hung | ⬜ | — | unlike video/quiz/podcast, slides has no background job |
| EC2 | Generate at `GENERATION` cap (FREE) | 402 → upgrade modal (IND-08); `genError` stays null on upgradeable, inline otherwise | ⬜ | — | — |
| EC3 | Cached READY deck re-requested | `getSlideDeck` returns `{status:READY, deck}` → `cached:true`, **no quota spent** | ⬜ | — | — |
| EC4 | Regenerate an existing deck | `useGenerateSlides` POSTs again — but controller short-circuits on existing READY deck and returns it **cached** → **"Regenerate" does nothing (no fresh deck, no quota)** | ⬜ | **suspected bug** | controller has no `regenerate`/`audience`-changed branch; the Slides page Regenerate button is effectively a no-op once a deck exists |
| EC5 | Generate with a different `audience` (kids/students/tutors) after a deck exists | Same as EC4 — cached READY deck returned, the new audience is ignored | ⬜ | **suspected bug** | `slidesBodySchema` accepts `audience` but cache check ignores it |
| EC6 | TENANT_LEARNER opens Slides tab with no own-locale deck | `getSlides` falls back to `getReadySlideDeckAnyLocale` (default-locale deck pre-gen'd at ingest) so the learner isn't left on raw text | ⬜ | — | — |
| EC7 | TENANT_LEARNER opens Slides, no deck in ANY locale | `notAvailableLearner` centered message; no Generate button (`isLearner` gate + `assertCanGenerate` server-block) | ⬜ | — | — |
| EC8 | Deck never generated, polling exhausts (8 empty polls) | Polling stops; falls to EmptyState/Generate; no infinite poll | ⬜ | — | — |
| EC9 | Poll hits persistent 403/404 (3 fetch failures) | `fetchFailureCount>=3` stops the poll | ⬜ | — | — |
| EC10 | Cross-tenant crafted contentId on GET/POST slides | `assertCanAccessContent` → 404 | ⬜ | — | **S1 isolation** |
| EC11 | DeckPlayer keyboard nav when an input/textarea is focused | Handler early-returns (ignores typing in inputs/contentEditable) | ⬜ | — | — |
| EC12 | DeckPlayer keyboard nav when embedded (not focused, not fullscreen) | Keys ignored unless deck focused or fullscreen, so it never steals page scroll | ⬜ | — | a11y |
| EC13 | Next on last slide / Prev on first slide (standalone, no `onPastEnd`/`onBeforeStart`) | Buttons + tap-zones `disabled` at bounds; no wrap-around | ⬜ | — | — |
| EC14 | Single-slide deck (`total===1`) | `index+1/total` = "1 / 1"; both arrows disabled; progress bar full | ⬜ | — | boundary |
| EC15 | Empty deck (`slides:[]`) | `deck.slides[index]` undefined → `DeckPlayer` returns null → page shows blank player area (no crash) — verify it doesn't render an empty broken frame | ⬜ | — | check service can't persist a 0-slide READY deck |
| EC16 | `Home`/`End` keys | Jump to first/last slide with correct slide-in direction | ⬜ | — | — |
| EC17 | Fullscreen via webkit (Safari) | `webkitRequestFullscreen`/`webkitExitFullscreen` fallbacks; `webkitfullscreenchange` tracked | ⬜ | — | cross-browser |
| EC18 | `prefers-reduced-motion` | Slide-in animation gated by `motion-safe:` — verify no animation when reduced motion set | ⬜ | — | a11y |
| EC19 | DeckMarkdown content with KaTeX/markdown in a slide body | Renders math/markdown without hydration error (`<div>`-in-`<p>`) | ⬜ | — | cf. F4 family |
| EC20 | i18n: `deck.*` labels (prev/next/fullscreen/slideProgress) + `slides.*` (subtitle/generating/empty) in uz/ru | All localized; `slideProgress` ICU `{index}/{total}` | ⬜ | — | i18n |
| EC21 | Mobile: tap zones (18% left/right) vs reading the slide | Tapping center doesn't advance; left/right edges navigate; verify no accidental skips on scroll | ⬜ | — | mobile |
| EC22 | aria-live region announces slide change | `sr-only` polite region updates "Slide X of N" on each move | ⬜ | — | a11y/screen-reader |

---

### US-IND-20: Content viewing extras — file stream, transcript, OCR region seed, learning-history
**As an** individual, **I want** to view/download my raw file, read a YouTube transcript, OCR a PDF region into chat, and see my learning history, **so that** the workspace is a complete study surface.
**Routes/code:** `GET /content/:id/file` · `GET /content/:id/transcript` · `POST /content/:id/ocr-region` · `GET /content/:id/learning-history` · `content.controller.ts` · `content-shared.ts` · `useTranscript.ts` · `learning-history-panel.tsx` · `TranscriptPanel.tsx` · `pdf-area-selection.ts` · `PdfViewer.tsx`.
**Priority:** P1

**Acceptance criteria**
- AC1 — Given a PDF content, When the PdfViewer requests `/file`, Then the API streams `application/pdf` inline (auth-guarded via `assertCanAccessContent`).
- AC2 — Given a YouTube content, When I open the transcript panel, Then `/transcript` returns ordered `ContentTranscriptSegment`s (or backfills them) and clicking a segment seeks the video / seeds chat.
- AC3 — Given a PDF, When I marquee-select a region, Then `POST /ocr-region` returns OCR'd text for that region which seeds a scoped chat prompt (vision).

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | `GET /file` for content with no `storagePath` (e.g. YouTube) | 404 "File not available" | ⬜ | — | — |
| EC2 | `GET /file` cross-tenant crafted id | `assertCanAccessContent` → 404 | ⬜ | — | **S1 isolation** |
| EC3 | `GET /file` very large PDF (e.g. 100 MB) | `sendContentFile` buffers the WHOLE file into memory (`storageService.get` → `res.send(buffer)`); **no HTTP Range/206 support** → no partial streaming, high memory per request | ⬜ | **suspected bug (perf)** | — |
| EC4 | `POST /ocr-region` by INDIVIDUAL who has exhausted GENERATION quota | **OCR region has NO `assertQuota`/`assertCanGenerate` guard** (route only has `blockLearnerMutations`); the vision/OCR model call runs unmetered-against-quota even at the cap (usage is recorded for billing but not gated) | ⬜ | **suspected bug** | route `content.routes.ts:32` has no `enforceQuota` |
| EC5 | `POST /ocr-region` by TENANT_LEARNER (assigned PDF) | `blockLearnerMutations` blocks the POST (learners may only GET + PATCH /progress) → 403 | ⬜ | — | confirm learner is blocked here |
| EC6 | `POST /ocr-region` on a non-PDF content (YouTube) | `content.type !== 'PDF'` → 404 "PDF content not found" | ⬜ | — | — |
| EC7 | `POST /ocr-region` with empty/garbage base64 (`image:"data:image/png;base64,"`) | `imageBuffer.length===0` → 400 "Invalid image data" | ⬜ | — | — |
| EC8 | `POST /ocr-region` with `page < 1` or non-int page | `ocrRegionSchema` (page int min 1) → 400 zod | ⬜ | — | — |
| EC9 | `POST /ocr-region` with a huge image (near express 10mb json limit) | >10mb body → 413 from `express.json`; just under → processed (no schema size cap on `image`) | ⬜ | — | unbounded image string within 10mb |
| EC10 | OCR returns empty/whitespace text (blank region) | Returns `{text:'', page}` → chat seed should handle empty gracefully (no empty "[Page N]" prompt that confuses the tutor) | ⬜ | — | — |
| EC11 | `GET /transcript` for a PDF (no segments) | Returns empty transcript / backfill no-op; TranscriptPanel hidden or shows empty state | ⬜ | — | — |
| EC12 | `GET /transcript` triggers backfill (`loadOrBackfillTranscript`) on first view | Segments materialized + returned; second call served from DB | ⬜ | — | — |
| EC13 | `GET /transcript` cross-tenant crafted id | guard → 404 | ⬜ | — | **S1 isolation** |
| EC14 | `GET /learning-history` empty (new content, no activity) | Returns empty history; panel shows empty state, not a crash | ⬜ | — | — |
| EC15 | `GET /learning-history` relative timestamps in uz | Uzbek words via manual formatter (cf. F18), not raw "-3 w" | ⬜ | — | i18n |
| EC16 | Marquee region selection on a rotated/scaled PDF page | `pdf-area-selection.ts` maps client coords → page coords correctly; OCR'd region matches the visual selection | ⬜ | — | — |
| EC17 | Region select → chat seed → tutor answer scoped to region (vision path) | Seeds "[Page N] Tanlangan hudud" chip + Uzbek prompt; `selectedImage` sent to chat (vision) — cf. IND-06·EC6 | ⬜ | — | — |
| EC18 | Download/open raw file on mobile | `Content-Disposition: inline` — verify mobile browser renders inline vs forces download; filename preserved | ⬜ | — | mobile |
| EC19 | `getContentFile` filename with quotes/special chars | `Content-Disposition` filename uses `path.basename` unescaped — verify no header injection from a crafted title (storagePath is server-generated, low risk) | ⬜ | — | — |
| EC20 | Concurrent OCR-region requests (rapid marquee drags) | Each is an independent AI call; no debounce server-side → spam possible (ties to EC4 unmetered cost) | ⬜ | — | — |

---

### US-IND-21: B2C dashboard — grid, search, empty/no-results, thumbnails, sort
**As an** individual, **I want** my content dashboard to handle empty, populated, searched, and no-results states cleanly, **so that** I can find my materials.
**Routes/code:** `/[locale]/dashboard` · `GET /content` (`buildContentListWhere`) · `dashboard/page.tsx` · `contexts/dashboard-search.tsx` · `components/content/ContentList.tsx` · `UploadCard.tsx`.
**Priority:** P2

**Acceptance criteria**
- AC1 — Given content exists, When I view the dashboard, Then a grid of cards renders with title, type, relative time, and a status badge.
- AC2 — Given I type in the hero search, When results match, Then the grid filters client-side; When none match, a distinct "no results" state shows (not the "no content yet" empty state).

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Truly empty (0 content) | "Hali material yo'q… birinchi materialingizni qo'shing" empty state + upload CTA | ⬜ | — | — |
| EC2 | Search term matches nothing (user HAS content) | Should show "no results match" — currently shows the **"no content yet"** empty state (F19, logged) → confusing | ⬜ | F19 | — |
| EC3 | Search is case/locale-insensitive | Typing "VEN" matches "Ven diagrammasi"; Cyrillic/Latin handled | ⬜ | — | — |
| EC4 | Content in PROCESSING / FAILED status on the grid | Card shows the right badge (processing spinner / failed); clicking opens the status gate, not a broken workspace | ⬜ | — | — |
| EC5 | Mixed content types (PDF / YouTube / slides) thumbnails | Each renders the correct type icon/thumbnail; no broken image | ⬜ | — | — |
| EC6 | Many items (e.g. 50+) — pagination or scroll | Verify the grid doesn't fetch/render unbounded; `GET /content` returns all for the user (no server pagination) → perf with large libraries | ⬜ | — | — |
| EC7 | Sort order | `GET /content` default order (createdAt desc?) consistent; newest first | ⬜ | — | — |
| EC8 | Relative time on cards in uz/en/ru | Uzbek manual formatter (F18); en/ru via Intl | ⬜ | — | i18n |
| EC9 | A TENANT_OWNER hits `/dashboard` | `DashboardShell` gates to INDIVIDUAL → redirect to `/tenant/dashboard` | ⬜ | — | role guard |
| EC10 | Stale cache after delete/upload | After delete, `['contents']` invalidated → card disappears; after upload, new card appears (optimistic or refetch) | ⬜ | — | — |
| EC11 | Search input clears | Clearing the term restores the full grid | ⬜ | — | — |
| EC12 | Very long title in a card | Truncates (no overflow); full title on hover/title attr | ⬜ | — | — |
| EC13 | Loading skeleton on first paint | Shows skeleton/loading, not a flash of the empty state, before `GET /content` resolves | ⬜ | — | loading state |
| EC14 | Keyboard nav of the grid (Tab/Enter) | Cards are reachable + activatable by keyboard | ⬜ | — | a11y |
| EC15 | Mobile: 1-col grid + FAB upload | Grid collapses to single column; upload accessible | ⬜ | — | mobile |

---

### US-IND-22: B2C settings — profile, password, locale, theme
**As an** individual, **I want** to edit my profile, change my password, and set locale/theme, **so that** the app fits me.
**Routes/code:** `/[locale]/dashboard/settings` · `PATCH /auth/me` / password-change endpoint · `components/account/{profile-card,password-card}.tsx` · `useAccount.ts` · theme via `next-themes` · locale via `@/i18n/navigation`.
**Priority:** P2

**Acceptance criteria**
- AC1 — Given I edit my name, When I save, Then `GET /auth/me` (session-sync) reflects it across the app.
- AC2 — Given I change my password, When I submit the current + new password, Then it succeeds and subsequent logins use the new password.
- AC3 — Locale + theme switches persist and apply app-wide.

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Change password with wrong current password | Clear "current password incorrect" error, not a 500 | ⬜ | — | — |
| EC2 | New password too weak / too short | Validation error (min length), no submit | ⬜ | — | — |
| EC3 | New == current password | Allowed or rejected — define + verify consistent behaviour | ⬜ | — | — |
| EC4 | Double-submit password change | Single change; button disabled while pending | ⬜ | — | double-submit |
| EC5 | Profile name empty / whitespace-only | Rejected with validation; trims | ⬜ | — | — |
| EC6 | Profile name with XSS payload | Stored escaped; renders inert in topbar/cards | ⬜ | — | security |
| EC7 | Locale switch from settings | URL re-prefixes (e.g. `/uz/…`→`/en/…`); content queries resync (`useLocaleContent`); `preferredLocale` persisted server-side | ⬜ | — | i18n |
| EC8 | Theme toggle (light/dark/system) | `next-themes` applies; no hydration flash; persists across reload | ⬜ | — | — |
| EC9 | Password autofill leakage | Inputs guarded (`autoComplete="new-password"`/`off`) so the browser doesn't silently inject saved creds (cf. F25 admin) | ⬜ | — | **check — same class as F25** |
| EC10 | Settings strings in uz/en/ru | `dashboard.settings.*` fully localized; no English leak | ⬜ | — | i18n |
| EC11 | Save with no network | Error surfaced inline; form state preserved | ⬜ | — | network |
| EC12 | Session-sync after name change | `components/session-sync.tsx` refreshes stored user; topbar updates without manual reload | ⬜ | — | — |
| EC13 | Keyboard + screen-reader labels on inputs | Each field has an associated label; errors `aria-describedby` | ⬜ | — | a11y |
| EC14 | Mobile layout of cards | Cards stack; inputs full-width; no overflow | ⬜ | — | mobile |

---

### US-IND-23: Chat / AI tutor — DEEPEN (streaming, abort, sources, Manim, scope, long convo, render)
**As an** individual, **I want** the AI tutor to stream answers scoped to my material, render visuals, and recover from every failure mode, **so that** I can trust it for study.
**Routes/code:** `/[locale]/content/[id]/chat` · `POST /chat/stream` (SSE) · `GET /chat/content/:id/messages` · `GET /chat/visual/manim/:jobId/asset` · `chat.controller.ts` · `tutor-tools.ts` · `tutor-scope.ts` · `tutor-graph-intent.ts` · `renderManim.job.ts` · `useChatStore.ts` · `ChatWindow.tsx` · `components/chat/*` (`ManimVideo`, `MermaidDiagram`, `DesmosGraph`, `TutorChart`, `GeoGebraEmbed`, `HtmlSandbox`, `TutorMessageContent`).
**Priority:** P0 (deepens IND-06)

**Acceptance criteria**
- AC1 — Streamed SSE answer renders token-by-token; on `[DONE]` the assistant message persists and `streaming=false`.
- AC2 — Out-of-scope / needs-clarification messages return a static localized response (no model call); refusals are filtered from later history.
- AC3 — Visual tool blocks (manim/desmos/mermaid/chart/geogebra/html) render in-message; manim renders async then patches the message ready/failed.

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | TUTOR_MESSAGE quota hit on send (FREE) | `POST /chat/stream` 402 BEFORE SSE → store catch removes the optimistic user+assistant bubbles, ChatWindow restores input + opens upgrade modal (IND-08·EC5) | ⬜ | — | — |
| EC2 | Mid-stream server error (model throws after headers flushed) | Controller writes `data:{"error":"Stream failed"}` then ends; client appends the **literal English "Stream failed"** to the assistant bubble (un-localized, leaks on uz/ru) AND it is **not persisted** server-side → vanishes on reload (ghost message) | ⬜ | **suspected bug** | — |
| EC3 | Navigate away / unmount mid-stream | `ChatWindow` effect calls `reset()` on contentId/locale change — but `streamMessage`'s `fetch` has **no AbortController**; the stream keeps reading in the background writing to a reset store (orphaned work, wasted tokens) | ⬜ | **suspected bug** | — |
| EC4 | Double-submit (Enter twice / click while streaming) | `isStreaming` guard + disabled textarea/button block a second send | ⬜ | — | double-submit |
| EC5 | Send message > model context after a very long convo | History is truncated to `take:20` newest messages — older context silently dropped; verify answers stay coherent and no error | ⬜ | — | — |
| EC6 | Switch locale mid-conversation | `getOrCreateSession` keys on `(userId,contentId,locale)` → a **new session per locale**; the prior-locale conversation is not shown (different session) | ⬜ | — | by-design but surprising; document |
| EC7 | `selectedImage` larger than 2,000,000 chars (big region) | `streamSchema` caps `selectedImage` at 2M chars → 400 zod before streaming | ⬜ | — | boundary |
| EC8 | `selectedExcerpt` > 4000 chars | Capped at 4000 → 400 zod | ⬜ | — | boundary |
| EC9 | Empty message (`message:''`) | `message.min(1)` → 400; ChatWindow also blocks empty `input.trim()` | ⬜ | — | — |
| EC10 | Out-of-scope question | `scopeDecision.route==='unrelated'` → static localized out-of-scope reply, no model spend; persisted as ASSISTANT | ⬜ | — | scope |
| EC11 | Ambiguous question | `needs_clarification` → static localized clarification reply | ⬜ | — | scope |
| EC12 | Prior refusal in history | `isTutorScopeRefusal` filters it from the messages sent to the model (doesn't poison context) | ⬜ | — | — |
| EC13 | Manim visual requested → render succeeds | `manim_enqueue` → job renders (MANIM_BIN) or SVG fallback; `replaceManimBlockInText` patches the stored message to `status:ready` + asset url; `ManimVideo` renders mp4/svg | ⬜ | — | — |
| EC14 | Manim render fails (bad script / timeout 120s) | Job catch builds a `failed` block, patches message `status:failed`; UI shows a failed-visual state (not a broken `<video>`); job still rethrows (logged) | ⬜ | — | — |
| EC15 | `GET /visual/manim/:jobId/asset` for another user's job | Authorized via `message.session.userId === me` → 404 if not mine | ⬜ | — | **S1 isolation** |
| EC16 | `GET .../asset` after Bull evicts the job (queried `0..200` recent) | `resolveManimAsset` finds no match → 404; the in-message url breaks for old messages | ⬜ | **suspected bug (lifecycle)** | manim asset url is only resolvable while the job stays in the recent 200 — old chat visuals 404 later |
| EC17 | Desmos graph block | Emits both `visual` and a `graph` event; `DesmosGraph` renders; serialized into message text | ⬜ | — | — |
| EC18 | Mermaid diagram with invalid syntax | `MermaidDiagram` catches parse error → shows fallback, no crash/whitescreen | ⬜ | — | render-validate |
| EC19 | KaTeX / markdown / code fences in answer | `TutorMessageContent` renders math + markdown with no `<div>`-in-`<p>` hydration error (cf. F4) | ⬜ | — | — |
| EC20 | HtmlSandbox / GeoGebra block | Renders sandboxed (iframe sandbox attrs); no script escape into the app | ⬜ | — | security |
| EC21 | Chat history persists across Material/Summary & Learn/Tutor tab switches | Retained (IND-06·EC7) — store reset only on contentId/locale change | ⬜ | — | — |
| EC22 | Cross-tenant crafted `contentId` in `POST /chat/stream` body | `assertCanAccessContent` → 404 before any session/model work | ⬜ | — | **S1 isolation** |
| EC23 | `GET /chat/sessions/:sessionId/messages` for another user's session | `findFirst({userId:me})` → 404 "Session not found" | ⬜ | — | **S1 isolation** |
| EC24 | Figures/sources: question about a diagram | `searchSimilarFigures` injects captioned-figure context so the tutor reasons over diagrams; verify scoped answer | ⬜ | — | — |
| EC25 | Slow network / streaming stalls | Tokens arrive slowly; UI keeps `streaming` cursor; `bottomRef` auto-scrolls; no premature "done" | ⬜ | — | network |
| EC26 | Malformed SSE chunk in the stream | Client `JSON.parse` try/catch skips it without breaking the stream | ⬜ | — | resilience |
| EC27 | Quick-action placeholder randomization | Placeholder picked from `chat.quickActions` (localized array); re-rolls per contentId/locale | ⬜ | — | i18n |
| EC28 | Region-seed + transcript-seed prompts | `inputSeed` populates the composer then `onInputSeedConsumed` clears the seed (no re-seed loop) | ⬜ | — | — |
| EC29 | Screen-reader: streaming message announced | Assistant streaming bubble should be `aria-live` polite (verify it isn't silent or over-announcing each token) | ⬜ | — | a11y |
| EC30 | Send fails, input restored, user edits & resends | After error, `setInput(message)` restores text; resend works; no duplicate user bubble (optimistic ones were removed) | ⬜ | — | — |

**Notes / open questions**
- EC2/EC3 are the two highest-value chat findings: the un-localized ghost "Stream failed" and the missing stream abort. Both are concrete code reads, not speculation.

---

### US-IND-24: Quiz — DEEPEN (0/partial generation, count variance, FAILED-vs-generating, retry, grading)
**As an** individual, **I want** quizzes that generate reliably, grade fairly, and never get stuck, **so that** I can self-test.
**Routes/code:** `/quiz/[id]` · `POST/GET /quiz/content/:contentId` · `GET /quiz/:id`, `/attempts`, `POST /:id/submit` · `quiz.controller.ts` · `generateQuiz.job.ts` · `useQuiz.ts` · `QuizCard.tsx` · `QuizResult.tsx`.
**Priority:** P0 (deepens IND-04)

**Acceptance criteria**
- AC1 — Generate enqueues a job (202), the UI polls, and questions appear; a matching cached quiz (same section/kind/style/count/locale with ≥1 question) is reused without spending quota.
- AC2 — Submit grades MULTIPLE_CHOICE (label/text resilient) + SHORT_ANSWER/NUMERIC (normalized / tolerance) and returns `correct/total/score`.

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | AI generates 0 questions | Job throws "No quiz questions generated" → quiz row persists with **0 questions and no status field** → indistinguishable from "still generating"; `submit` returns 400 "still being generated" **forever**; UI polls indefinitely | ⬜ | **suspected bug** | `Quiz` has no FAILED state (`formatQuiz` has no status) |
| EC2 | All questions dropped as parroting / all invalid (`created===0`) | Job throws "No valid quiz questions generated" → same stuck-forever state as EC1 | ⬜ | **suspected bug** | — |
| EC3 | AI returns fewer than requested `count` (e.g. asked 5, got 4) | Quiz created with 4; UI button may have said "5" → count variance (IND-04·EC3) — verify the result UI uses actual `questions.length` | ⬜ | — | — |
| EC4 | Some questions skipped (unanswerable MC), some kept | Job persists the valid ones, warns on skipped; quiz usable with `created>0` | ⬜ | — | — |
| EC5 | Retry after a failed generation | `createQuiz` finds the existing 0-question row, falls through, **re-charges GENERATION quota** and re-enqueues — verify retry works and isn't blocked by the cache check (`questions.length>0` is false so it proceeds) | ⬜ | — | — |
| EC6 | Generate at GENERATION cap | 402 → upgrade modal (IND-08·EC2) | ⬜ | — | — |
| EC7 | Submit a quiz that is still generating (0 questions) | 400 "Quiz is still being generated" (not a 0/0 = 0% attempt) | ⬜ | — | — |
| EC8 | MC answer submitted as a letter label ("B") | `resolveSubmittedAnswer` maps "B"→2nd option; graded correctly | ⬜ | — | — |
| EC9 | MC answer submitted as full option text with a label prefix ("B) ...") | `stripSubmittedOptionLabel` normalizes; matches | ⬜ | — | — |
| EC10 | NUMERIC answer with comma decimal ("3,5") | `replace(',','.')` → 3.5; within ±0.001 tolerance → correct | ⬜ | — | — |
| EC11 | NUMERIC answer non-numeric ("three") | `Number.isNaN` → incorrect (never crashes) | ⬜ | — | — |
| EC12 | SHORT_ANSWER with extra whitespace / case | `normalizeAnswer` (trim + collapse spaces + lowercase) → matches | ⬜ | — | — |
| EC13 | Blank answer on any open question | Never correct (`!answer.trim()` guard) | ⬜ | — | — |
| EC14 | Submit with `answers` missing some question ids | Missing → graded as blank/incorrect; total still = all questions; no crash | ⬜ | — | — |
| EC15 | Submit with `answers` for unknown question ids | Extra keys ignored (loop is over questions, not answers) | ⬜ | — | — |
| EC16 | Double-submit (double-click) | Creates **two** `QuizAttempt` rows (no idempotency guard) → progress updated twice | ⬜ | **suspected bug (minor)** | — |
| EC17 | `getLatestAttempt` re-grades against current questions | If questions changed since the attempt, re-evaluation may differ from stored score — verify consistency | ⬜ | — | — |
| EC18 | Cross-tenant crafted quizId on GET/submit | `assertQuizAccess` → `assertCanAccessContent` → 404 | ⬜ | — | **S1 isolation** |
| EC19 | INDIVIDUAL sees only own quizzes; learner sees content-scoped | `listQuizzesByContent` filters `userId` for INDIVIDUAL, content-wide otherwise | ⬜ | — | — |
| EC20 | `count` boundary (1 and 30) and over (31) | 1/30 accepted; 31 → 400 zod (`max(30)`) | ⬜ | — | boundary |
| EC21 | Quiz proper-Uzbek output + KaTeX in questions | Fluent Uzbek, math renders, no hydration error (IND-04·EC4 / F4) | ⬜ | — | i18n |
| EC22 | Section deleted/changed between create and job run | `getSectionContext` throws "Section not found" → job fails → EC1 stuck-state | ⬜ | — | lifecycle |
| EC23 | Retry/"Qayta ishlash" after submit | Resets answers, allows re-attempt; unlimited attempts for B2C (by design) | ⬜ | — | — |
| EC24 | Loading/empty state while polling for questions | Shows generating spinner, not an empty "0 questions" quiz | ⬜ | — | loading — tie to EC1 fix |

---

### US-IND-25: Podcast — DEEPEN (fine controls, multi-episode, per-episode regen, duration mismatch)
**As an** individual, **I want** precise playback controls and reliable per-episode (re)generation, **so that** I can listen exactly how I want.
**Routes/code:** `/[locale]/content/[id]/podcast` · `GET/POST /content/:id/podcast` · `POST /content/:id/podcast/episodes/:episodeId/regenerate` · `GET .../episodes/:episodeId/audio` · `podcast.controller.ts` · `generatePodcast.job.ts` · `usePodcast.ts` · `PodcastPlayer.tsx`.
**Priority:** P1 (deepens IND-05)

**Acceptance criteria**
- AC1 — Episodes generate per section, stream in as they finish, and play with speed (0.75/1/1.25/1.5x), ±15s, and seek controls.
- AC2 — A single episode can be regenerated manually (per-section "Qayta urinish") without rebuilding the others.

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Speed buttons 0.75/1/1.25/1.5x | Each updates `el.playbackRate` immediately (effect on `[playbackRate, audioUrl]`); active button highlighted | ⬜ | — | not each clicked in IND-05·EC6 |
| EC2 | −15s at t<15 / +15s near end | Clamped to `[0, duration]`; no negative/over-seek | ⬜ | — | boundary |
| EC3 | Drag seek slider | `onChange` sets `currentTime` + reports progress; works while playing and paused | ⬜ | — | — |
| EC4 | List-card duration vs player duration mismatch | List shows `durationSec = max(60, words/150*60)` estimate; player shows real audio duration → they differ (IND-05·EC5, F-IND-05-EC5) | ⬜ | 🟡 known | — |
| EC5 | Resume position restore | `initialPositionSec` applied once on `loadedmetadata` (`restoredRef`); not re-applied on rate change | ⬜ | — | — |
| EC6 | Multi-episode: play ep1, then ep2 | New `audioUrl` → `key={audioUrl}` remounts `<audio>`; `restoredRef` reset; speed re-applied | ⬜ | — | — |
| EC7 | Per-episode regenerate while another episode plays | `regenerateEpisode` sets the **whole podcast** `status:GENERATING` → page-level generating state may interrupt/relabel the currently-playing episode; verify playback isn't killed | ⬜ | **suspected bug (UX)** | controller flips podcast status globally |
| EC8 | Per-episode regenerate quota cost | `regenerateEpisode` calls `assertQuota('PODCAST')` → a single-episode regen consumes a **whole** PODCAST quota unit (same as a full create) | ⬜ | — | document; FREE = 1 ⇒ regen exhausts after one |
| EC9 | Per-episode regenerate at PODCAST cap | 402 → header message "Podkast cheklovi tugadi {used}/{limit}" (F30) | ⬜ | — | — |
| EC10 | Double-click full "Regenerate" (force) | `regenerate:true` bypasses the GENERATING 409 → wipes episodes + audio + re-enqueues; two rapid clicks can wipe/enqueue twice (job also deletes episodes at start) → race | ⬜ | **suspected bug** | — |
| EC11 | Create while GENERATING (non-force) | 409 "Podcast generation already in progress" | ⬜ | — | — |
| EC12 | Create when already READY (non-force) | 200 with status READY and **no `episodes` field** in the response — hook invalidates + refetches to get episodes | ⬜ | — | response shape differs from generating |
| EC13 | TTS fails for some episodes | Those episodes have `audioPath:null` (no play button / disabled); podcast READY if `audioCount>0`; per-episode retry available | ⬜ | — | — |
| EC14 | TTS fails for ALL episodes | `audioCount===0` → status FAILED; retry button + F30 error feedback | ⬜ | — | — |
| EC15 | Dialogue vs single-voice | `parsePodcastDialogue` → ≥2 turns uses `synthesizeDialogue` (two voices); else single voice | ⬜ | — | — |
| EC16 | Content with 0 sections | Job synthesizes a single "full" episode from all chunks | ⬜ | — | — |
| EC17 | `GET .../episodes/:episodeId/audio` for episode with no audio yet | 404 "Audio not found" | ⬜ | — | — |
| EC18 | Stream episode audio cross-tenant crafted contentId/episodeId | `assertCanAccessContent` + `episode.podcast.contentId` scope → 404 | ⬜ | — | **S1 isolation** |
| EC19 | Episode audio: no HTTP Range/206 | `streamEpisodeAudio` buffers whole mp3 → `res.send`; seeking works only because web fetches the full blob; large episodes load fully into memory | ⬜ | — | perf |
| EC20 | Playback during generation (blob churn) | Stable src across poll cycles, no `blob: ERR_FILE_NOT_FOUND` spam (F21 regression must hold) | ⬜ | — | F21 |
| EC21 | "Speed:" label localized | en "Speed:", ru, uz — not hardcoded "Tezlik:" (F22 holds) | ⬜ | — | F22 |
| EC22 | Episode list ICU plural ("N episodes") | en one/other, ru paucal, uz invariant (F20) | ⬜ | — | i18n |
| EC23 | Play button glyph (▶/⏸) accessibility | Verify an `aria-label` exists (currently a bare glyph button) — screen-reader names play/pause | ⬜ | **a11y gap** | PodcastPlayer play button has no aria-label, only "▶"/"⏸" text |
| EC24 | TENANT_LEARNER on podcast page | Info message, no Create/Regenerate (server `assertCanGenerate` + UI gate) — IND-05·EC4 | ⬜ | — | — |
| EC25 | Regenerate episode for a `sectionId` that no longer maps to a section | Job falls back to a synthetic "full" section (all chunks) — verify the episode rebuilds sensibly | ⬜ | — | lifecycle |
| EC26 | Mobile player layout | Controls (−15/play/+15, speed pills, seek) fit; no overflow on 360px | ⬜ | — | mobile |

**Notes / open questions**
- `durationSec` is a word-count estimate (`max(60, words/150*60)`); the real mp3 duration differs. To fully close F-IND-05-EC5 the job would need to measure the encoded audio duration.

---


<!-- ===== AREA: owner-mgmt ===== -->
## Area: Tenant owner: students, materials, assignment, settings

> Scope: the **TENANT_OWNER** (tutor / school-org admin) surface — student CRUD, password
> reset, deactivate/reactivate, class join-code, material upload / re-read (OCR) / retry / delete,
> content→student assignment, org settings. Backend anchors:
> `apps/api/src/controllers/{tenant,tenant-content}.controller.ts`,
> `apps/api/src/services/tenant/{students,assignments,organization,shared}.ts`,
> `apps/api/src/middleware/tenant.middleware.ts`, routes `apps/api/src/routes/tenant.routes.ts`
> (mounted at `/tenant`, gated by `authMiddleware, attachTenantId, requireTenantOwner`).
> Web anchors: `apps/web/app/[locale]/(tenant)/tenant/{students,students/[id],materials,materials/[id]/assign,settings,dashboard}/page.tsx`,
> `apps/web/hooks/{useTenant,useTenantContent}.ts`,
> `apps/web/components/tenant/{assign-students-panel,join-code-card,onboarding-checklist,activity-heatmap}.tsx`.
> Isolation is enforced via `assertTenantOwnsContent` (content) and `tenantId`-scoped Prisma
> queries (students/assignments); there is **no** central guard for student/assignment access —
> each service hand-scopes by `tenantId`, so every path is an IDOR surface worth probing.

---

### US-OWNER-01: Create a student (email, email-less kid, name-only)
**As a** tenant owner, **I want** to create a student account — with an email, or a username +
optional tutor-set password for email-less kids — **so that** every learner in my class can sign in
and I can hand them credentials shown once.
**Routes/code:** `/[locale]/tenant/students` · `POST /tenant/students` · `tenant.controller.createStudent` → `services/tenant/students.ts:createStudent` · zod `createStudentSchema` (`tenant/shared.ts`) · `assertTenantQuota(tenantId,'STUDENT')` · `useCreateTenantStudent` (`useTenant.ts`).
**Priority:** P0

**Acceptance criteria**
- AC1 — Given a name + email, When I submit, Then a `TENANT_LEARNER` user is created with a `LEARNER` membership in my tenant, a 12-char auto temp password is returned **once**, `mustChangePassword=true`, and the credentials dialog shows it.
- AC2 — Given a name + username (no email), When I submit, Then the user is created with `username` set and a synthetic email `<username.toLowerCase()>@students.talim.local`, the roster hides that synthetic email (shows `@username`), and the credentials dialog shows username + temp password.
- AC3 — Given a username + a tutor-set password, When I submit, Then `mustChangePassword=false` (tutor chose it) and that exact password is returned.
- AC4 — Creating a student increments seat usage; at seat cap the Add button is disabled and the server rejects with 402.
- AC5 — After success the roster (`['tenant','students']`) and billing/seat usage (`['billing','me']`) are invalidated and refetched.

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Submit with neither email nor username | Client blocks with `students.identifierRequired`; if bypassed, zod `.refine` → 400 "Provide an email or a username" | ⬜ | — | — |
| EC2 | Email-less kid → synthetic email format | `ali` → `ali@students.talim.local`; roster `email:null`, `username:'ali'` | ⬜ | — | — |
| EC3 | Username with uppercase (`Ali`) | username stored verbatim `Ali`, synthetic email lowercased `ali@students.talim.local`; login by `Ali` must still resolve (case-insensitive — see AUTH-01 EC7) | ⬜ | — | possible case mismatch between stored username & synthetic email |
| EC4 | **Username collision in *my* org** (re-use existing) | 409 "Username already taken" | ⬜ | — | — |
| EC5 | **Username collision across *another* tenant** | `findUnique({where:{username}})` is **global** → 409 even though it's a different org's kid; leaks cross-tenant username existence | ⬜ | — | **S3 — global username namespace; cross-tenant enumeration** (`students.ts:76`) |
| EC6 | Two owners both create username `ali` concurrently | Non-atomic check→create: second insert hits Prisma P2002 unique → currently **uncaught 500**, not a clean 409 | ⬜ | — | **S2 — race → 500** (`students.ts:76-129`) |
| EC7 | `Ali` requested while `ali` already exists | Username-taken check is case-sensitive (passes), but synthetic email `ali@…local` collides → falls to email path → confusing "Email already registered" 409 instead of "Username taken" | ⬜ | — | **S3 — misleading error** |
| EC8 | Email already used by an **active** member of my org | 409 "Student already exists in this organization" | ⬜ | — | — |
| EC9 | Email belongs to a **previously-removed** (inactive) member of my org | Reactivates membership, issues fresh temp password, returns it (quota re-asserted at top) | ⬜ | — | re-add path `students.ts:84-108` |
| EC10 | Email belongs to a user with **no** membership in my org (e.g. an INDIVIDUAL or another org's learner) | 409 "Email already registered" — cannot hijack an existing account into my tenant | ⬜ | — | verify no cross-tenant capture |
| EC11 | Email of an existing **INDIVIDUAL** account | 409 "Email already registered"; the INDIVIDUAL is NOT converted to my learner | ⬜ | — | **S1 if it converts** |
| EC12 | Invalid email format (`foo@`, `a b@c`) | zod `.email()` → 400, no user created | ⬜ | — | — |
| EC13 | Username too short (`ab`, <3) / too long (>40) | zod `.min(3).max(40)` → 400 | ⬜ | — | — |
| EC14 | Username with disallowed chars (`ali!`, spaces, unicode) | zod regex `^[a-zA-Z0-9._-]+$` → 400 | ⬜ | — | — |
| EC15 | Password too short (<6) / too long (>100) | zod `.min(6).max(100)` → 400 | ⬜ | — | — |
| EC16 | Name only (no email, no username) | Blocked — name alone is insufficient identifier (400) | ⬜ | — | — |
| EC17 | Name omitted entirely (email/username only) | Allowed; roster shows `—` / `@username`; `name:null` | ⬜ | — | — |
| EC18 | Leading/trailing whitespace in email/username/name/password | Trimmed before use (`body.username?.trim()`, `email?.trim()`); password trimmed in UI (`password.trim()`) | ⬜ | — | — |
| EC19 | Whitespace-only name (`"   "`) | UI sends `undefined` (trim→falsy); if raw API call with `"  "`, zod `.min(1)` passes → blank name stored | ⬜ | — | minor |
| EC20 | At **seat cap** — UI gate | Add button `disabled`, tooltip shows seat usage; no request fired | ⬜ | — | `atSeatCap` from `billing.usage.students` |
| EC21 | At seat cap — **server** enforcement (crafted/stale-UI call) | `assertTenantQuota` → 402 QUOTA_EXCEEDED "Seat limit reached"; `createError` shows it | ⬜ | — | seat boundary |
| EC22 | Seat cap **off-by-one** (used==limit-1, limit, limit+1) | exactly `limit` students creatable, the `limit+1`th blocked | ⬜ | — | boundary |
| EC23 | Seat-cap message is "Seat limit reached", not "Upload limit reached" | Correct feature copy (cf. F26 on join-class) | ⬜ | — | verify STUDENT feature messaging |
| EC24 | Credentials dialog shows temp password **once**; reopening Add does not re-show it | `credentials` reset to null on dialog reopen; never refetchable | ⬜ | — | — |
| EC25 | Copy button copies `username / password` (kid) or just `password` (email) | `navigator.clipboard.writeText`; graceful if clipboard API unavailable (no crash) | ⬜ | — | mobile/insecure-origin clipboard | 
| EC26 | Double-click "Create" / double-submit | Button `disabled` while `createStudent.isPending`; only one account created | ⬜ | — | verify single POST |
| EC27 | Network failure / 500 mid-create | `createError` shows fallback `students.createError`; form preserved; no phantom roster row | ⬜ | — | — |
| EC28 | Optimistic roster vs real | No optimistic insert — relies on invalidate; brief stale list until refetch | ⬜ | — | loading state |
| EC29 | Password input not masked | `<Input id="password">` has no `type="password"` → tutor-set password shown as plaintext | ⬜ | — | **S4 — a11y/shoulder-surf** |
| EC30 | i18n — dialog/labels/seat-usage string in uz/en/ru | `students.add/create/credentialsHint/emailOptional/usernameOptional/passwordOptional/seatUsage` all translated; `seatUsage` ICU with `limit:'∞'` when null | ⬜ | — | — |
| EC31 | a11y — Add dialog focus trap, labels bound (`htmlFor`), Esc closes, error announced | Focus moves into dialog, returns to trigger on close; `createError` should be `aria-live` | ⬜ | — | — |
| EC32 | Mobile layout — create dialog + roster card view | Dialog scrolls, inputs reachable; roster falls back to card grid `md:hidden` | ⬜ | — | — |
| EC33 | Role guard — INDIVIDUAL / LEARNER / ADMIN call `POST /tenant/students` | 403 (router `requireTenantOwner`; learner also `requireTenantOwner` fails) | ⬜ | — | — |
| EC34 | Owner with no `tenantId` resolved | 403 "Forbidden" (requireTenantOwner needs `tenantId`) | ⬜ | — | — |

**Notes / open questions**
- The re-add reactivation path (EC9) asserts quota **before** discovering the membership exists, so re-adding a removed student correctly consumes a seat — confirm seat accounting matches `listStudents`/billing.

---

### US-OWNER-02: Reset a student's password
**As a** tenant owner, **I want** to reset a student's password to a fresh temp value shown once,
**so that** a kid who forgot or leaked their password can sign in again and is forced to change it.
**Routes/code:** `/[locale]/tenant/students` (per-row "Reset") · `POST /tenant/students/:id/reset-password` · `tenant.controller.resetStudentPassword` → `students.ts:resetStudentPassword` · `useResetTenantStudentPassword`.
**Priority:** P1

**Acceptance criteria**
- AC1 — Given my own student, When I click Reset, Then a 12-char temp password is generated, `passwordHash` updated, `mustChangePassword=true`, and the dialog (mode `reset`) shows username + temp password once.
- AC2 — The student's old password stops working immediately; the new temp works and forces a change on next login.

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Reset a student that isn't mine (cross-tenant crafted `:id`) | `findFirst({tenantId,userId,role:'LEARNER'})` miss → 404 "Student not found"; never resets another org's kid | ⬜ | — | **S1 — IDOR** |
| EC2 | Reset a **deactivated** student | Succeeds (no `active` filter) — temp pw issued though student still can't access content until reactivated | ⬜ | — | confirm intended |
| EC3 | Reset an **email-based** student (real email, self-chosen pw) | Forces `mustChangePassword=true` even though they had a real password | ⬜ | — | intended? may annoy adult learners |
| EC4 | Garbage / nonexistent `:id` | 404, no crash | ⬜ | — | — |
| EC5 | `:id` of an **OWNER** membership or another role in my tenant | role filter `LEARNER` → 404 (can't reset co-owner/self) | ⬜ | — | — |
| EC6 | Reset dialog autofill guard (**F25**) | Browser does not autofill tutor's saved creds into the shown temp-password field; values are display-only text, not editable inputs | ⬜ | — | F25 — verify regression holds |
| EC7 | Double-click Reset (two requests) | Two resets → second temp pw is the live one; UI shows whichever resolves last; no crash | ⬜ | — | races: last-write-wins |
| EC8 | Reset while a credentials dialog from a prior Add is open | `dialogMode` switches to `reset`, `credentials` replaced; no stale Add state leak | ⬜ | — | shared dialog state |
| EC9 | Network failure | `resetPassword.mutate` onError — **no visible error handler** in page (only onSuccess) → silent failure, dialog never opens | ⬜ | — | **S3 — no error feedback on reset** (`students/page.tsx` reset onSuccess only) |
| EC10 | Copy credentials | Copies `username / password`; graceful when clipboard blocked | ⬜ | — | — |
| EC11 | Temp password never re-shown after dialog close | `credentials` cleared; cannot recover — tutor must reset again | ⬜ | — | — |
| EC12 | i18n — `students.resetPassword/reset/credentialsHint/copy/done` in 3 locales | Translated | ⬜ | — | — |
| EC13 | a11y — reset dialog focus + announce | Focus into dialog; password readable by screen reader (mono span) | ⬜ | — | — |
| EC14 | Role guard — LEARNER/INDIVIDUAL/ADMIN POST reset | 403 | ⬜ | — | — |
| EC15 | Mobile — Reset button in card view | Present and tappable (`md:hidden` card path) | ⬜ | — | — |

---

### US-OWNER-03: Deactivate / reactivate (and "delete") a student
**As a** tenant owner, **I want** to deactivate a student (freeing a seat and revoking content access
immediately) and reactivate them later, **so that** I manage my paid seats and a removed kid loses
access at once — not at JWT expiry.
**Routes/code:** `PATCH /tenant/students/:id` (`{active}`) · `DELETE /tenant/students/:id` (soft) · `students.ts:patchStudent`/`deleteStudent` · `usePatchTenantStudent` · gate via `requireActiveLearner` (`tenant.middleware.ts`) + `buildContentListWhere`/`assertCanAccessContent` (`contentAccess.service.ts`).
**Priority:** P0 (billing + access boundary)

**Acceptance criteria**
- AC1 — Given an active student, When I click Deactivate, Then `membership.active=false`; the student's `GET /content` returns empty and `GET /content/:id` 404 immediately (same token), and `requireActiveLearner` blocks `/learner/*` with 403 "Student account is deactivated".
- AC2 — Deactivation frees a seat (seat usage decrements); reactivation **re-consumes** a seat and re-checks quota.
- AC3 — Reactivation restores prior content access (assignments are preserved, not deleted).

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Deactivate → student mid-session loses content access immediately | `/content`→0, `/content/:id`→404, `/learner/*`→403; not deferred to token expiry | ⬜ | — | cf. LEARNER-01 EC10 |
| EC2 | Reactivate when **at seat cap** | `patchStudent` re-asserts `assertTenantQuota` → 402 QUOTA_EXCEEDED; stays inactive | ⬜ | — | `students.ts:157-159` |
| EC3 | Reactivate when seats available | Succeeds, seat consumed, billing invalidated | ⬜ | — | — |
| EC4 | **DELETE** `/tenant/students/:id` | Only **soft-deletes** (sets `active:false`) — does NOT delete the User, membership, assignments, progress, or quiz attempts | ⬜ | — | "delete" is a misnomer; verify no UI exposes hard delete |
| EC5 | After DELETE/deactivate, the kid's **ContentAssignments persist** | On later reactivation/re-add they silently regain all old materials | ⬜ | — | **S3 — stale assignments survive removal** (`deleteStudent` `students.ts:173-183`) |
| EC6 | Deactivated student still counts in roster `assignedCount`/avg | `listStudents` includes inactive memberships (no `active` filter) → roster shows them with `active:false` | ⬜ | — | confirm intended (no separate archive) |
| EC7 | Cross-tenant: PATCH another org's student id | `findFirst({tenantId,...})` miss → 404; cannot toggle another org's seat | ⬜ | — | **S1 — IDOR** |
| EC8 | Concurrent double reactivation (two tabs / double-click) | Both pass `assertTenantQuota` then both set active → **seat overshoot past limit** (check-then-act not atomic) | ⬜ | — | **S2 — seat race** (`students.ts:156-163`; same shape as joinTenantByCode) |
| EC9 | Double-click Deactivate then Reactivate fast | Toggles twice; final state = last click; billing usage eventually consistent after invalidate | ⬜ | — | no confirm dialog → easy misfire |
| EC10 | **No confirmation** on deactivate | `patchStudent.mutate({active:!s.active})` fires immediately — destructive (access loss) with no confirm | ⬜ | — | **S3 — UX: no confirm on access-revoking action** |
| EC11 | PATCH with `active` omitted, only `name` | Renames without touching seat; quota not re-checked | ⬜ | — | — |
| EC12 | PATCH `name` to empty/whitespace | zod `name.min(1)` (rename only when truthy `if (body.name)`); blank `name:""` fails min(1) → 400 | ⬜ | — | — |
| EC13 | PATCH a non-LEARNER membership id (owner self) | role filter → 404 (can't deactivate self/owner seat) | ⬜ | — | — |
| EC14 | Reactivate a student whose **org subscription is inactive** | Owner shell shows inactive-subscription banner; reactivation still allowed at API? verify quota source | ⬜ | — | — |
| EC15 | Deactivate, then learner takes an in-flight quiz / SSE chat | Next request 403/404; no crash; SSE stream closes cleanly | ⬜ | — | — |
| EC16 | i18n — `students.deactivate/reactivate/active/inactive` in 3 locales | Translated; Badge variant success/secondary | ⬜ | — | — |
| EC17 | a11y — toggle button has discernible name reflecting current state | "Deactivate"/"Reactivate" label updates; status conveyed beyond color (Badge text) | ⬜ | — | — |
| EC18 | Seat usage live-updates after toggle | `['billing','me']` invalidated → seat pill + Add-disabled gate refresh | ⬜ | — | — |
| EC19 | Mobile — deactivate in card view | Present; Badge shows active/inactive | ⬜ | — | — |
| EC20 | Role guard — LEARNER/INDIVIDUAL PATCH/DELETE student | 403 | ⬜ | — | — |

---

### US-OWNER-04: Regenerate the class join code
**As a** tenant owner, **I want** to regenerate my class join code (invalidating the old one),
**so that** a leaked code can be rotated and only people I share the new code with can self-enroll.
**Routes/code:** `/[locale]/tenant/students` (`JoinCodeCard`) + dashboard · `POST /tenant/join-code/regenerate` · `organization.ts:regenerateJoinCode` · `generateUniqueJoinCode` (`shared.ts`) · `useRegenerateJoinCode`.
**Priority:** P1 (enrolment security)

**Acceptance criteria**
- AC1 — Given my org, When I confirm Regenerate, Then a new unique 6-char code (alphabet `ABCDEFGHJKMNPQRSTUVWXYZ23456789`, no 0/O/1/I/L) replaces the old; the card shows the new code after invalidate.
- AC2 — The **old** code immediately fails at `POST /auth/join-class` and at register-with-joinCode (404 "Invalid join code").
- AC3 — A `confirm()` dialog gates the action (no accidental rotation).

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Confirm dialog cancelled | `confirm()` returns false → no request, code unchanged | ⬜ | — | — |
| EC2 | Old code rejected after regen | `findUnique({joinCode:OLD})` miss → 404 "Invalid join code" at join-class | ⬜ | — | — |
| EC3 | New code is unique across all tenants | `generateUniqueJoinCode` retries up to 12× on collision (6-char then 8-char) | ⬜ | — | collision retry path |
| EC4 | New code excludes confusable chars | No `0/O/1/I/L` ever in code | ⬜ | — | alphabet check |
| EC5 | Copy new code | Clipboard write; "Copied" state 1.5s then reverts; graceful if clipboard blocked | ⬜ | — | — |
| EC6 | Join code is **case-normalized** on enrol | `joinTenantByCode` uppercases+trims input — copying lowercase still enrols | ⬜ | — | — |
| EC7 | Double-click Regenerate | Button `disabled` while `regenerate.isPending`; one rotation | ⬜ | — | — |
| EC8 | Tenant created before join codes existed (null code) | `getTenantForOwner` backfills a code on first read; card shows it not `joinCode.none` | ⬜ | — | backfill `organization.ts:55-61` |
| EC9 | Students mid-enrolment with old code during rotation | In-flight `join-class` with old code after rotation → 404; already-enrolled members unaffected | ⬜ | — | — |
| EC10 | Network failure on regen | Mutation error; card keeps old code; no partial state | ⬜ | — | no visible error toast (verify) |
| EC11 | Cross-tenant: owner cannot regen another org's code | `regenerateJoinCode(ownerId)` scoped by `ownerId` → only own tenant | ⬜ | — | **S1** |
| EC12 | Role guard — LEARNER/INDIVIDUAL POST regenerate | 403 | ⬜ | — | — |
| EC13 | i18n — `joinCode.title/desc/copy/regenerate/regenerateConfirm/none` + `students.copied` in 3 locales | Translated incl. native `confirm()` text | ⬜ | — | — |
| EC14 | a11y — code displayed with wide letter-spacing | Readable by screen reader (no `aria-hidden`); confirm() is keyboard-accessible | ⬜ | — | — |
| EC15 | Mobile — card wraps (code + copy + regen) | `flex-wrap` keeps controls reachable | ⬜ | — | — |
| EC16 | Rapid repeated regen | Each yields a distinct code; seat/members unaffected | ⬜ | — | — |

---

### US-OWNER-05: Upload / re-read (OCR) / retry a tenant material
**As a** tenant owner, **I want** to upload PDFs/slides (or YouTube) as org materials and re-read a
scanned doc via vision OCR or retry a failed ingest, **so that** my class content is correctly
extracted and ready to assign.
**Routes/code:** `/[locale]/tenant/materials` · `POST /tenant/content/upload` (multer + `enforceQuota('UPLOAD','GENERATION')`), `/tenant/content/youtube`, `/tenant/content/:id/reparse` (`reparseRateLimit`), `/tenant/content/:id/retry` (`enforceQuota('GENERATION')`), `DELETE /tenant/content/:id` · `tenant-content.controller.ts` · `assertTenantOwnsContent` · `contentQueue` / `cancelContentJobs` · `useTenantContent.ts`.
**Priority:** P0

**Acceptance criteria**
- AC1 — Given a PDF/pptx ≤50 MB, When I upload, Then a `Content{tenantId=mine,status:PENDING}` is created, a `process-content` job is queued, and the list shows it processing→READY.
- AC2 — Given a READY/processed scanned PDF, When I re-read with rasterized page images, Then status→PROCESSING, vision OCR re-extracts text, chunks are re-ingested, figures captioned (best-effort), status→READY; a `GENERATION` quota is charged.
- AC3 — Given a FAILED material with its source still present, When I retry, Then status→PENDING and it re-queues; a YouTube item with missing URL or a file with missing `storagePath` is rejected up-front with an actionable error.

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Upload non-PDF/non-pptx (e.g. .docx, .png, .exe) | multer fileFilter rejects → 400/415; no content row | ⬜ | — | `upload.middleware` filter |
| EC2 | Upload >50 MB | multer limit → 413/400 "file too large"; no row | ⬜ | — | 50 MB multer cap |
| EC3 | Upload with no file part | `!req.file` → 400 "No file uploaded" | ⬜ | — | — |
| EC4 | `.pdf` name but wrong mimetype / mimetype pdf but not pdf bytes | Treated as PDF by name/mimetype; ingest job later marks FAILED if unparseable | ⬜ | — | — |
| EC5 | UPLOAD quota exhausted | `enforceQuota('UPLOAD','GENERATION')` → 402 QUOTA_EXCEEDED before handler | ⬜ | — | tenant plan caps |
| EC6 | YouTube invalid URL | `extractYoutubeVideoId` null → 400 "Invalid YouTube URL"; no row | ⬜ | — | — |
| EC7 | Reparse a YOUTUBE or non-PDF/SLIDE content | 400 "Only PDF or slide documents can be re-read" | ⬜ | — | `reparseContent:123` |
| EC8 | Reparse runs **inline** (not a background job) | Long synchronous OCR in the request; risk of nginx/gateway timeout on big docs; status left `PROCESSING` if the client aborts (only thrown errors set `FAILED`) | ⬜ | — | **S2 — inline OCR can strand status=PROCESSING** (`reparseContent:130-151`) |
| EC9 | Double reparse within rate window | `reparseRateLimit` throttles; verify the limit value and 429 copy | ⬜ | — | — |
| EC10 | Two concurrent reparses (different sessions) slipping the limiter | Both set PROCESSING, both `ingestText` → possible duplicate chunks unless ingest clears prior | ⬜ | — | verify `ingestText` replaces vs appends |
| EC11 | Reparse quota (GENERATION) exhausted | `assertQuota('GENERATION')` → 402; status untouched (asserted before PROCESSING set) | ⬜ | — | — |
| EC12 | Reparse error mid-OCR | catch sets status `FAILED`, rethrows → client sees 500-ish; figures/decks side-jobs skipped | ⬜ | — | — |
| EC13 | Retry a non-FAILED material (PENDING/PROCESSING/READY) | 400 "Only failed content can be retried" | ⬜ | — | `retryContent:157` |
| EC14 | Retry FAILED YouTube with null url | 400 "YouTube URL missing" (no re-queue of a doomed job) | ⬜ | — | — |
| EC15 | Retry FAILED file with missing `storagePath` | 400 "File no longer available — please upload again" | ⬜ | — | — |
| EC16 | Retry quota | `enforceQuota('GENERATION')` → 402 if exhausted | ⬜ | — | — |
| EC17 | Cross-tenant upload context (owner with two… N/A — single tenant) | `requireTenantId` ensures `tenantId` from owner | ⬜ | — | — |
| EC18 | Reparse / retry / delete **another org's** content id | `assertTenantOwnsContent(tenantId,id)` → 404; never touches other tenant material | ⬜ | — | **S1 — IDOR** |
| EC19 | Get file / transcript / ocr-region for non-owned content | `assertTenantOwnsContent` → 404 (and PDF/YT type checks → 404) | ⬜ | — | sub-resource guard |
| EC20 | ocr-region with empty/invalid base64 | `imageBuffer.length===0` → 400 "Invalid image data" | ⬜ | — | — |
| EC21 | Owner hits the **B2C** `/content/upload` instead | `blockIndividualContentForOwner` → 403 "Use /api/tenant/content…" (note legacy `/api/` in copy) | ⬜ | — | **S4 — stale `/api/` path in message** (`tenant.middleware:100`) |
| EC22 | Concurrent uploads of the same file | Two distinct Content rows + two jobs (no dedupe) | ⬜ | — | intended? |
| EC23 | Upload then immediately delete (mid-PENDING) | `cancelContentJobs` removes the queued job; storage + row deleted; no orphan worker run | ⬜ | — | overlaps US-OWNER-12 EC4 |
| EC24 | List shows per-status badges (PENDING/PROCESSING/READY/FAILED) + per-episode spinner | Live status; loading/empty/error states render | ⬜ | — | — |
| EC25 | i18n — upload/reparse/retry labels, status badges, error toasts in 3 locales | Translated | ⬜ | — | — |
| EC26 | a11y — file input labelled; drag-drop has keyboard fallback; progress announced | Accessible upload | ⬜ | — | — |
| EC27 | Mobile — upload card + material list | Responsive; file picker works on mobile Safari | ⬜ | — | — |
| EC28 | Role guard — LEARNER tries tenant upload | 403 (router `requireTenantOwner`) | ⬜ | — | — |

---

### US-OWNER-06: Assign / unassign a material to student(s)
**As a** tenant owner, **I want** to assign a material to one or many active students (and unassign),
**so that** each learner sees exactly the content I gave them and changes propagate to their view.
**Routes/code:** `/[locale]/tenant/materials/[id]/assign` · `AssignStudentsPanel` · `POST /tenant/assignments` / `DELETE /tenant/assignments` (`{contentId,learnerId}`) · `GET /tenant/content/:contentId/assignments` · `assignments.ts` · `useAssignContent`/`useUnassignContent`/`useContentAssignments`.
**Priority:** P0 (drives LEARNER-01 visibility)

**Acceptance criteria**
- AC1 — Given my content + my active student, When I assign, Then a `ContentAssignment{contentId,learnerId,assignedById}` upserts; assigning twice is idempotent (no dup, `update:{}`).
- AC2 — The assigned learner's `GET /content` / dashboard now includes it (LEARNER-01); unassign removes it from their list.
- AC3 — After assign/unassign, `['tenant','assignments',contentId]`, `['tenant','students']`, and `['contents']` are invalidated so the assign panel + roster `assignedCount` refresh.

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Assign to a **deactivated** student | `findFirst({...active:true})` miss → 404 "Student not found" (student exists but inactive) — misleading error | ⬜ | — | **S3 — wrong error for inactive student** (`assignments.ts:13-18`) |
| EC2 | Assign **another org's** content id | `findFirst({id,tenantId})` miss → 404 "Content not found" | ⬜ | — | **S1 — IDOR (content)** |
| EC3 | Assign my content to **another org's** learner id | membership `findFirst({tenantId,userId})` miss → 404 "Student not found" | ⬜ | — | **S1 — IDOR (learner)** |
| EC4 | Re-assign an already-assigned learner | `upsert` `update:{}` → idempotent; `assignedById`/`assignedAt` NOT refreshed | ⬜ | — | minor (stale assignedBy) |
| EC5 | Multi-select assign (panel loops `mutateAsync` sequentially) | Each runs in turn; only un-assigned ids POSTed (`!assignedIds.has`) | ⬜ | — | — |
| EC6 | One assign **fails mid-loop** (e.g. 402/404/network) | `handleAssign` has **no try/catch** → unhandled rejection; remaining selected not processed; `setSelected([])` not reached; partial assignment with no user-facing error | ⬜ | — | **S2 — partial multi-assign, no error surfaced** (`assign-students-panel.tsx:38-44`) |
| EC7 | Unassign a not-currently-assigned learner | `deleteMany` affects 0 rows → 204 idempotent | ⬜ | — | — |
| EC8 | Unassign → learner loses access | Their `/content` drops it; if mid-chat/quiz, next request 404 (LEARNER-01) | ⬜ | — | data-lifecycle |
| EC9 | Assign to many, learner count = 0 (no active students) | Panel shows empty-state `assign.noStudents`; nothing to submit | ⬜ | — | — |
| EC10 | Select-all assigns only un-assigned **active** students | `activeStudents.filter(!assigned)`; assigned rows disabled checkbox | ⬜ | — | — |
| EC11 | Search filter narrows list | Filters by name+email substring (lowercase); username **not** searched here (only name+email) | ⬜ | — | minor — kid w/ no name/email unsearchable |
| EC12 | Concurrent assign from two tabs | upsert idempotent — no duplicate `ContentAssignment` (unique `contentId_learnerId`) | ⬜ | — | — |
| EC13 | Double-click Assign submit | Button `disabled` while `assign.isPending`; loop still fires once | ⬜ | — | — |
| EC14 | Stale assignments cache after deactivating an assigned student | Roster `assignedCount` still counts? `listStudents` counts assignments regardless of active — verify invalidate keeps panel correct | ⬜ | — | — |
| EC15 | `listContentAssignments` returns synthetic emails for kids | `learner.email` shown raw — synthetic `@students.talim.local` could leak in the assignments view (roster hides it, this list may not) | ⬜ | — | **S4 — synthetic email leak in assignments list** (`assignments.ts:66`) |
| EC16 | Assign a non-READY (PENDING/FAILED) material | Allowed (no status check) → learner gets a not-yet-ready item; verify learner view handles non-READY | ⬜ | — | confirm intended |
| EC17 | i18n — `assign.title/desc/assigned/remove/submit/noStudents`, `assignSearch`, `assignSelectAll` in 3 locales | Translated | ⬜ | — | — |
| EC18 | a11y — checkboxes inside `<label>`, disabled state for assigned, keyboard toggle | Reachable; remove button labelled | ⬜ | — | — |
| EC19 | Mobile — assign panel (`max-w-lg`) | Stacks; checkboxes tappable | ⬜ | — | — |
| EC20 | Role guard — LEARNER POST/DELETE assignment | 403 | ⬜ | — | — |
| EC21 | Empty `contentId`/`learnerId` in body | zod `.min(1)` → 400 | ⬜ | — | — |
| EC22 | Assignment persists after material **delete** | Cascade removes assignments (US-OWNER-12 EC2); learner no longer sees it | ⬜ | — | cross-ref OWNER-12 |

---

### US-OWNER-12 (DEEPENED): Delete a material — cascade, mid-generation, IDOR, double-click
**As a** tenant owner, **I want** to delete a material, **so that** stale content is removed,
unassigned from students, its media files cleaned, and any running jobs cancelled.
**Routes/code:** `/[locale]/tenant/materials` (delete dialog) · `DELETE /tenant/content/:id` · `tenant-content.controller.deleteContent` · `cancelContentJobs` · `storageService.delete` · `delete-content-dialog.tsx`.
**Priority:** P1

**Acceptance criteria** (unchanged) — delete removes content + assignments; confirmation dialog gates it.

**Edge cases & negative paths** (extends the existing EC1–EC7)
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC2 | Delete a material **assigned to N students** | `Content.delete` cascades `ContentAssignment` rows (FK); all N students immediately lose it from `/content` | ⬜ | — | verify Prisma `onDelete: Cascade` on ContentAssignment |
| EC2b | Delete also cascades Chunks/Sections/Quizzes/Podcasts/Videos/Progress | All child rows removed; no orphan rows or pgvector embeddings | ⬜ | — | verify cascade coverage |
| EC3 | Cancel the dialog | Nothing deleted, dialog closes | ⬜ | — | — |
| EC4 | Delete **mid-generation** (podcast/quiz/process job running/queued) | `cancelContentJobs(id)` removes pending+active content/quiz/podcast jobs before delete; no orphaned worker run writing to a deleted content | ⬜ | — | races: job already mid-flight may still write then fail |
| EC4b | Audio/video files removed from storage | Episodes' `audioPath` + videos' `storagePath` + content `storagePath` deleted; best-effort, missing files don't crash | ⬜ | — | `deleteContent:183-202` |
| EC5 | Delete then a learner is mid-chat / mid-quiz on it | Learner's next request 404 via `assertCanAccessContent`; no crash, no leaked content | ⬜ | — | — |
| EC6 | **Cross-tenant** delete via crafted id (owner B's material) | `assertTenantOwnsContent(tenantId,id)` → 404; never deletable | ⬜ | — | **S1 — isolation** |
| EC7 | Double-click / double-submit delete | First deletes; second `assertTenantOwnsContent` → 404 (already gone); no duplicate 500 | ⬜ | — | verify dialog disables button |
| EC8 | Delete a material whose storage file already missing | `storageService.delete` best-effort; row still deleted; 204 | ⬜ | — | — |
| EC9 | Delete while reparse (inline) in progress | reparse holds status PROCESSING; delete races the inline OCR — verify no write-after-delete crash | ⬜ | — | cross-ref OWNER-05 EC8 |
| EC10 | i18n — delete dialog copy + aria-label (was hardcoded Uzbek, F15) | Translated per locale | ✅(F15) | F15 | `36f1f41` |

---

### US-OWNER-13: Org settings — rename + seat-limit display
**As a** tenant owner, **I want** to rename my organization and see my seat limit/usage and slug,
**so that** my class is correctly branded and I understand my paid capacity.
**Routes/code:** `/[locale]/tenant/settings` · `PATCH /tenant` (`{name}`) · `organization.ts:patchTenantForOwner` · `GET /tenant` (`getTenantForOwner`) · `usePatchTenant`/`useTenant` · `BillingSummaryCard` · `OnboardingChecklist`.
**Priority:** P2

**Acceptance criteria**
- AC1 — Given my org, When I edit the name and Save, Then `Tenant.name` updates and the header/sidebar reflect it after `['tenant']` invalidate; `slug` is shown read-only and is **not** changed by a rename.
- AC2 — Seat limit + usage are visible (billing summary); the join code, profile, and password cards are reachable from settings.

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Save empty name | `<Input required>` blocks; if bypassed, zod `name.min(1)` → 400; name unchanged | ⬜ | — | — |
| EC2 | Save whitespace-only name (`"   "`) | `patchTenantSchema.name` has **no trim** → `name:"   "` passes min(1) and is stored blank | ⬜ | — | **S4 — untrimmed org name** (`shared.ts:28-30`) |
| EC3 | Rename does NOT change slug | `patchTenantForOwner` updates only `name`; `slug` stable → existing share links/URLs hold | ⬜ | — | — |
| EC4 | Very long name (1k chars) | Stored (no max in schema); verify header/sidebar truncate, no layout break | ⬜ | — | no max length |
| EC5 | XSS/HTML in name (`<script>`) | Rendered as text (React escapes), no execution | ⬜ | — | — |
| EC6 | Seat limit `null` (unlimited) | Seat pill shows `∞`; Add never gated | ⬜ | — | — |
| EC7 | Seat usage reflects active members only | Deactivated kids excluded from `used`; matches `assertTenantQuota` accounting | ⬜ | — | cross-check students.ts quota |
| EC8 | Double-click Save | Button `disabled` while `patch.isPending`; one PATCH | ⬜ | — | — |
| EC9 | Save with no change | PATCH sends current name; idempotent update | ⬜ | — | — |
| EC10 | Network failure on Save | Mutation error; **no visible error toast** (page just `await mutateAsync` with no catch) → silent fail | ⬜ | — | **S3 — no error feedback on org rename** (`settings/page.tsx:27-30`) |
| EC11 | Name input pre-populates from tenant via `useEffect` | On load shows current name; if tenant updates elsewhere, effect re-syncs | ⬜ | — | — |
| EC12 | Cross-tenant: PATCH `/tenant` only affects own org | `findFirst({ownerId})` → owner's tenant only; no id param to spoof | ⬜ | — | **S1** — by-owner scoping |
| EC13 | Slug shown only when present | `tenant?.slug &&` guard; no `undefined:` render | ⬜ | — | — |
| EC14 | OnboardingChecklist reflects real counts | contents/students/hasAssessments drive steps; updates as data changes | ⬜ | — | — |
| EC15 | i18n — `settings.title/orgTitle/orgName/slug/save/accountTitle` in 3 locales | Translated | ⬜ | — | — |
| EC16 | a11y — org form label bound (`htmlFor=orgName`), Save reachable, error announced | Accessible form | ⬜ | — | — |
| EC17 | Mobile — settings stacks (`max-w-2xl`) | Sections stack; cards reachable | ⬜ | — | — |
| EC18 | Role guard — LEARNER/INDIVIDUAL GET/PATCH `/tenant` | 403 | ⬜ | — | — |
| EC19 | `getTenantForOwner` for owner with no tenant | 404 "Organization not found" | ⬜ | — | — |

---

### US-OWNER-14: Cross-tenant isolation — owner A vs owner B (consolidated IDOR matrix)
**As the** platform, **I want** owner A unable to read or mutate owner B's students, materials,
assignments, progress, or join code via crafted IDs, **so that** orgs stay fully isolated.
**Routes/code:** all `/tenant/*` · `tenant.controller`/`tenant-content.controller` · scoping via `tenantId`/`ownerId` filters + `assertTenantOwnsContent`.
**Priority:** P0 (S1)

**Acceptance criteria**
- AC1 — Every `/tenant/*` read/write is scoped to the caller's resolved `tenantId`/`ownerId`; a crafted foreign id yields 404 (no existence leak), never 200/partial.

**Edge cases & negative paths** — run live with owner A's bearer against owner B's real ids.
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | A: `PATCH /tenant/students/:Bid` | 404 "Student not found" | ⬜ | — | **S1** |
| EC2 | A: `DELETE /tenant/students/:Bid` | 404 (no soft-delete of B's seat) | ⬜ | — | **S1** |
| EC3 | A: `POST /tenant/students/:Bid/reset-password` | 404 (cannot harvest B's kid's password) | ⬜ | — | **S1 — credential theft surface** |
| EC4 | A: `GET /tenant/students/:Bid/progress` | 404 | ⬜ | — | **S1 — data leak** |
| EC5 | A: `POST /tenant/assignments {B-content,B-learner}` | 404 content | ⬜ | — | **S1** |
| EC6 | A: assign **A-content to B-learner** | 404 student (B-learner not in A's tenant) | ⬜ | — | **S1** |
| EC7 | A: assign **B-content to A-learner** | 404 content | ⬜ | — | **S1** |
| EC8 | A: `GET /tenant/content/:Bcontent/assignments` | 404 | ⬜ | — | **S1 — roster leak** |
| EC9 | A: `GET/DELETE /tenant/content/:Bid` (+ /file /transcript /reparse /retry /ocr-region /sections /podcast /video /slides) | 404 on every sub-path (`assertTenantOwnsContent`) | ⬜ | — | **S1 — sub-resource sweep** |
| EC10 | A: `POST /tenant/content/:Bid/reparse` | 404 (no OCR-charging B's content / no quota theft) | ⬜ | — | **S1** |
| EC11 | A cannot regen B's join code | `regenerateJoinCode(A.ownerId)` only touches A's tenant | ⬜ | — | **S1** |
| EC12 | A: `GET /tenant/content/:Bcontent/podcast/episodes/:epId/audio` | 404 — cannot stream B's generated media | ⬜ | — | **S1 — media leak** |
| EC13 | Username collision leak (cross-tenant) | Creating a username already used in B's org → 409 reveals existence (see OWNER-01 EC5) | ⬜ | — | **S3 — enumeration** |
| EC14 | A reuses a stale token after losing ownership | tenantId re-resolved each request; no access to B | ⬜ | — | — |
| EC15 | A crafts assessment/question-bank ids of B | 404 via tenant-scoped assessment service (cross-ref ASSESS area) | ⬜ | — | **S1** |

**Notes / open questions**
- Unlike content (which routes through `assertTenantOwnsContent` / `contentAccess.service`), the
  **student & assignment** paths hand-roll `prisma.*.findFirst({where:{tenantId,...}})`. They are
  correct today, but there is **no central guard** — any new `/tenant` route must repeat the
  `tenantId` scope or it becomes an IDOR. Flag for a shared `assertTenantOwnsLearner` helper.

---

### US-OWNER-15: Student roster — list, search, seat usage, activity columns
**As a** tenant owner, **I want** a roster of my students with assigned counts, last activity, avg
quiz score, and a search box, **so that** I can monitor my class at a glance.
**Routes/code:** `/[locale]/tenant/students` · `GET /tenant/students` (`listStudents`) · `useTenantStudents` · `formatStudentRow`.
**Priority:** P2

**Acceptance criteria**
- AC1 — The roster lists all LEARNER memberships (active + inactive) ordered by `joinedAt desc`, each with name, email-or-`@username`, `assignedCount`, `lastActivityAt`, `avgQuizScore`, active badge.
- AC2 — Search filters by name/email/username substring; seat usage pill shows `used/limit` (`∞` when null).

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Empty roster | Empty-state cell with icon + `students.desc` copy; no crash | ⬜ | — | — |
| EC2 | Loading state | "loading" row while query pending | ⬜ | — | — |
| EC3 | Query error (500/network) | Roster should show an error state — verify it doesn't render a blank/forever-loading table | ⬜ | — | no explicit error UI (verify) |
| EC4 | Email-less kid row | Shows `@username`, never the synthetic `@students.talim.local` | ⬜ | — | `formatStudentRow` hides synthetic email |
| EC5 | Search matches name OR email OR username | Substring, case-insensitive (`students/page.tsx` filter includes username) | ⬜ | — | — |
| EC6 | `assignedCount` only counts assignments to **my tenant's** content | `content:{tenantId}` scope in groupBy/count | ⬜ | — | — |
| EC7 | `avgQuizScore` only over **my tenant's** quizzes | `quiz:{content:{tenantId}}` scope; null when no attempts | ⬜ | — | — |
| EC8 | `lastActivityAt` from most recent `contentProgress` in my tenant | null when none; rendered via `toLocaleDateString()` (**system** locale, not app locale) | ⬜ | — | **S4 — date not app-locale-aware** (cf. XCUT-01 EC3) |
| EC9 | Large roster (N=200) | `listStudents` aggregates in 3 grouped queries (no N+1); table scrolls; verify perf | ⬜ | — | — |
| EC10 | Deactivated students appear with inactive badge | `active:false` rows shown (no archive filter) | ⬜ | — | — |
| EC11 | Avg quiz score rounding | `Math.round(avgQuizScore)%`; 0 vs null distinguished (`!= null`) | ⬜ | — | — |
| EC12 | i18n — column headers, seat pill, search placeholder, badges in 3 locales | Translated; `seatUsage` ICU plural/`∞` | ⬜ | — | — |
| EC13 | a11y — table headers `<th>`, row link to detail, search labelled | Accessible; mobile card grid mirrors columns | ⬜ | — | — |
| EC14 | Mobile — `md:hidden` card grid | Cards show name/email, badge, assigned/avg/lastActive; actions present | ⬜ | — | — |
| EC15 | Role guard — non-owner GET /tenant/students | 403 | ⬜ | — | — |

---


<!-- ===== AREA: assess ===== -->
## Area: Assessments & games: banks, WRITTEN, GAME, attempts, results, leaderboard

> Code anchors read for this spec:
> - API services: `apps/api/src/services/assessment/{shared,banks,assessments,learner,results}.ts`
> - API controller: `apps/api/src/controllers/assessment.controller.ts`
> - API routes: `apps/api/src/routes/tenant.routes.ts` (gated `authMiddleware, attachTenantId, requireTenantOwner`), `apps/api/src/routes/learner.routes.ts` (gated `…, requireTenantMember, requireActiveLearner`)
> - Web (owner): `apps/web/app/[locale]/(tenant)/tenant/assessments/page.tsx`
> - Web (learner): `apps/web/app/[locale]/(learner)/learner/assessments/page.tsx`, `components/learner/game-quiz-player.tsx`, `components/learner/leaderboard-table.tsx`
> - Hooks: `apps/web/hooks/useAssessments.ts`
>
> Key invariants observed in code (cited per-EC below):
> - Bank-question multiple-choice answerability guard (`isAnswerableMultipleChoice`, `shared.ts:96`) blocks unanswerable MC at **generate**, **patch/approve**.
> - `isCorrect` (`shared.ts:216`) treats blank/whitespace answers as wrong (so timer-expiry `''` and the NUMERIC `Number('')===0` trap can't score). NUMERIC uses `replace(',', '.')` and a ±0.001 tolerance.
> - `computeGamePoints` (`shared.ts:66`): `GAME_BASE_POINTS=1000`, `speedFactor = 0.5 + 0.5*(1 - rms/limitMs)` (0.5–1.0), `streakMult = 1 + min(max(streak-1,0),5)*0.1` (1.0–1.5). **`responseMs` is taken verbatim from the client `timings` payload.**
> - `createAssessment` (`assessments.ts:18`): requires every `questionId` to be `status:'APPROVED'` in this tenant; `secondsPerQuestion` is set to `body.secondsPerQuestion ?? 20` **only for GAME** (else null); `publish` → `PUBLISHED|DRAFT`.
> - Over-limit submit is rejected twice: a pre-count `>= maxAttempts → 409` and an in-`$transaction` re-count (`learner.ts:74,137`).
> - Leaderboard (`results.ts:6`): best attempt per learner, ordered `pointsTotal desc, score desc, durationMs asc`.

---

### US-OWNER-07: Build a question bank — create, AI-generate drafts, approve/reject/edit
**As a** tenant owner, **I want** to build a reusable question bank and curate AI-drafted questions (approve/reject/edit) with correct Uzbek + LaTeX, **so that** my assessments only ever use vetted, answerable questions.
**Routes/code:** `/[locale]/tenant/assessments` · `POST /tenant/question-banks`, `GET /tenant/question-banks`, `GET /tenant/question-banks/:bankId/questions`, `POST /tenant/question-banks/:bankId/generate` (`enforceQuota('GENERATION')`), `PATCH /tenant/question-banks/:bankId/questions/:questionId` · `services/assessment/banks.ts`, `shared.ts`, `lib/assessment-prompt.ts`, `lib/question-quality.ts`, `hooks/useAssessments.ts`.
**Priority:** P1

**Acceptance criteria**
- AC1 — Given an owner, When they create a bank (title required, topic optional), Then a bank appears with `questionCount=0`, `approvedCount=0` (`banks.ts:33`).
- AC2 — Given a bank, When they generate with a count/style/topic/contentId/sectionId, Then 1..N DRAFT questions are persisted; parroting + unanswerable-MC are silently dropped (`banks.ts:88,97`).
- AC3 — Given a DRAFT question, When they approve, Then `status=APPROVED` and it becomes selectable for an assessment; reject sets `REJECTED`.
- AC4 — Generated/edited content renders proper Uzbek prose and KaTeX/LaTeX in prompts and options.

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Create bank with empty title | `createBankSchema` min(1) → 400; UI `required` blocks submit, no network call | ⬜ | — | — |
| EC2 | Create bank, title only (no topic) | 201, `topic:null` (`banks.ts:36`) | ⬜ | — | — |
| EC3 | Title/topic with leading/trailing spaces or 1000+ chars | Stored verbatim (no trim/max) — check no layout break in sidebar; consider max-length | ⬜ | — | no server max on title — DoS/cosmetic |
| EC4 | Generate `count` boundaries: 0 / 1 / 30 / 31 | 0 and 31 → `generateSchema` min(1)/max(30) 400; UI hardcodes `count:12` so only API can hit these | ⬜ | — | UI never lets owner choose count (always 12) |
| EC5 | Generate when AI returns **0 valid** questions | `created:[]`, 201, list unchanged, **no message** that nothing was added | ⬜ | — | silent empty result — confusing UX |
| EC6 | Generate when AI returns garbage (missing prompt / no acceptableAnswers) | Skipped, `skipped++`, console.warn only; created<requested, **no UI signal** of partial drop | ⬜ | — | `banks.ts:90,117` |
| EC7 | Generate unanswerable MC (no option matches accepted answer) | Dropped at generate (`isAnswerableMultipleChoice` false → skip) — never persisted | ⬜ | — | `banks.ts:97` |
| EC8 | Generate with `contentId` not in tenant / cross-tenant | `getSectionContext`→ 404 "Content not found" (`shared.ts:193`) | ⬜ | — | **S1 isolation** — must 404 |
| EC9 | Generate with `sectionId` but section belongs to another content | 404 "Section not found" (`shared.ts:199`) | ⬜ | — | — |
| EC10 | Generate hits **GENERATION quota** (FREE/over limit) | 402 `QUOTA_EXCEEDED`; UI shows `generate.isError` inline message (`page.tsx:219`) — not the upgrade modal (owner ≠ self-serve) | ⬜ | — | confirm message localized in uz/ru |
| EC11 | Generate while a prior generate is in-flight (double-click) | Button `disabled={generate.isPending}`; second click suppressed — but each call charges quota+usage | ⬜ | — | — |
| EC12 | Generate on a bank in **another tenant** (crafted bankId) | `assertBank` scoped by tenantId → 404 "Question bank not found" (`shared.ts:185`) | ⬜ | — | **S1 isolation** |
| EC13 | Approve a DRAFT MC that became unanswerable via edit (options removed) | `patchQuestion` guard → 400 "Multiple-choice questions need at least 2 options and a correct answer…" (`banks.ts:149`) | ⬜ | — | — |
| EC14 | Edit acceptableAnswers to empty array `[]` | `patchQuestionSchema.acceptableAnswers.min(1)` → 400 (`shared.ts:34`) | ⬜ | — | — |
| EC15 | Change type SHORT_ANSWER→MULTIPLE_CHOICE without options | Guard 400 (finalOptions null) | ⬜ | — | `banks.ts:139,149` |
| EC16 | Approve → list refresh: bank sidebar `approvedCount` badge | **STALE** — `usePatchBankQuestion` only invalidates the questions list, not `['tenant','question-banks']`; badge `approvedCount/questionCount` does not update until full refetch | ⬜ | — | **suspected bug** — `useAssessments.ts:80` |
| EC17 | Generate → bank `questionCount` badge | Same stale-cache: `useGenerateBankQuestions` doesn't invalidate banks list (`useAssessments.ts:65`) | ⬜ | — | **suspected bug** |
| EC18 | Patch a questionId that isn't in this bank (crafted) | 404 "Question not found" (`banks.ts:134`) | ⬜ | — | — |
| EC19 | Reject then re-approve same question | Idempotent status flips; question re-selectable | ⬜ | — | — |
| EC20 | NUMERIC question with comma decimal accepted answer ("3,14") | Stored; grading later normalizes `,`→`.` (`shared.ts:223`) — verify approve keeps it | ⬜ | — | — |
| EC21 | LaTeX in prompt/options (`$\frac{1}{2}$`) | Persists raw; rendered via `RichText` in player; not double-escaped | ⬜ | — | — |
| EC22 | i18n: bank UI strings (eyebrow/title/styleMixed/approve/reject/genericError) in uz/ru | `tenant.assessments` namespace fully translated, no English leak | ⬜ | — | F24 logged this page largely un-i18n'd — re-verify |
| EC23 | a11y: style `<select>` has `aria-label`, approve/reject buttons reachable by keyboard | `aria-label={t('questionType')}` present (`page.tsx:206`); verify focus order + SR labels | ⬜ | — | — |
| EC24 | Mobile (375px): generate form `flex-col`, question cards wrap, action buttons not clipped | Layout holds | ⬜ | — | — |
| EC25 | Owner of org A loads bank list | Only org-A banks (`listBanks` where tenantId) — never another org's | ⬜ | — | **S1** |
| EC26 | Learner / INDIVIDUAL hits `POST /tenant/question-banks` | 403 (router `requireTenantOwner`) | ⬜ | — | role boundary |

**Notes**
- The owner UI never exposes the per-question **edit** form (only Approve/Reject) — editing prompt/answers is API-only via PATCH. Worth a product note: tutors can't fix a typo from the UI.

---

### US-OWNER-08: Compose, publish, assign & review a WRITTEN assessment
**As a** tenant owner, **I want** to assemble approved questions into a WRITTEN assessment, set max attempts, publish, assign to students, and review aggregate results, **so that** I can grade my class.
**Routes/code:** `/[locale]/tenant/assessments` · `POST /tenant/assessments`, `POST /tenant/assessments/:id/assign`, `GET /tenant/assessments/:id/results`, `GET /tenant/assessments/:id/leaderboard` · `services/assessment/{assessments,results}.ts`.
**Priority:** P1

**Acceptance criteria**
- AC1 — Given ≥1 APPROVED question selected, When publish, Then a `PUBLISHED` assessment is created with `mode=WRITTEN`, chosen `maxAttempts`, `secondsPerQuestion=null` (`assessments.ts:33`).
- AC2 — Given a published assessment, When assigned to active learners, Then each gets one `AssessmentAssignment` (deduped) and sees it in `/learner/assessments`.
- AC3 — Results table shows per-student submitted/not-yet, best score %, attempt count; leaderboard ranks best attempts.

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Publish with **0 questions selected** | `questionIds.min(1)` 400; UI button `disabled` when `selectedQuestions.length===0` | ⬜ | — | — |
| EC2 | Publish with a questionId that is **DRAFT/REJECTED** (crafted) | `createAssessment` requires `status:'APPROVED'`; mismatch → 400 "Invalid questions" (`assessments.ts:23`) | ⬜ | — | — |
| EC3 | Publish with a questionId from **another tenant's** bank | `bank:{tenantId}` filter excludes it → count mismatch → 400 | ⬜ | — | **S1 isolation** |
| EC4 | `maxAttempts` boundaries 0 / 1 / 5 / 6 | 0 and 6 → schema min(1)/max(5) 400; UI clamps input to 1..5 (`page.tsx:318`) | ⬜ | — | — |
| EC5 | `title` empty | schema min(1) 400; UI `required` | ⬜ | — | — |
| EC6 | Publish as DRAFT (`publish:false`) then assign | Assignment created (assign doesn't check status), but learner list filters `status:'PUBLISHED'` → learner sees nothing; submit → 404 (assessment not PUBLISHED) | ⬜ | — | **assigning a DRAFT silently does nothing for learner** (`assessments.ts` assign has no status guard; `learner.ts:14,66`) |
| EC7 | Assign with empty `learnerIds` | `assignAssessmentSchema.learnerIds.min(1)` 400; UI disabled | ⬜ | — | — |
| EC8 | Assign includes a **deactivated** student | `membership … active:true` not found → 400 "Invalid learner: <id>" → **whole assign request fails** (no partial assign) | ⬜ | — | one bad id rejects all — by design? verify |
| EC9 | Assign includes a learner from **another tenant** | Membership check fails → 400 (never cross-assigns) | ⬜ | — | **S1 isolation** |
| EC10 | Re-assign an already-assigned learner | Deduped — `existing` found → `continue`, no duplicate, no error (`assessments.ts:82`) | ⬜ | — | — |
| EC11 | Assign with `sectionId` but no `contentId` | 400 "contentId is required with sectionId" (`assessments.ts:65`) | ⬜ | — | — |
| EC12 | Assign with `contentId` cross-tenant | 404 "Content not found" (`assessments.ts:62`) | ⬜ | — | **S1** |
| EC13 | After assign, owner results/assessments list | **STALE** — `useAssignAssessment` invalidates **nothing**; `assignmentCount` and results learners don't refresh until manual refetch | ⬜ | — | **suspected bug** — `useAssessments.ts:154` (CLAUDE.md §4 rule) |
| EC14 | Results for assessment with no submissions yet | All learners "Not yet", bestScore "—", leaderboard hidden (`rows.length===0`) (`page.tsx:80`) | ⬜ | — | — |
| EC15 | Results for an assessment **not assigned to anyone** | `notAssigned` empty-row copy shown; questionCount still reported | ⬜ | — | — |
| EC16 | Results includes a learner who attempted but was later **deactivated/unassigned** | Leaderboard (all attempts) still lists them; results table lists only currently-assigned learners → mismatch between two tables | ⬜ | — | `results.ts:12` (leaderboard = all attempts) vs `:60` (results = assignments) |
| EC17 | Edit/reject a bank question **after** it's in a PUBLISHED assessment | Assessment serves the **mutated** question (link is by id, no snapshot); a REJECTED question is still shown to learners; already-graded attempts now mismatch their basis | ⬜ | — | **suspected bug — data lifecycle**: `learner.ts:66` fetches questions with no status filter |
| EC18 | Best-score selection when a learner has 2 attempts 40% then 90% | Results `bestScore=90`, attempts=2 (ordered pointsTotal/score desc) | ⬜ | — | `results.ts:50` |
| EC19 | Results/leaderboard for cross-tenant assessmentId (crafted) | `findFirst {id, tenantId}` → 404 "Assessment not found" | ⬜ | — | **S1** |
| EC20 | i18n: results table headers/status badges/leaderboard heading uz/ru | `tenant.assessments` keys translated | ⬜ | — | F24 — re-verify |
| EC21 | WRITTEN assessment with mixed types (MC + SHORT + NUMERIC) renders in learner form | radios for MC, inputs for SHORT/NUMERIC (`learner page WrittenForm`) | ⬜ | — | — |
| EC22 | Concurrent publish (double-submit of compose form) | Two assessments created (no idempotency) — duplicate; button `disabled` while pending mitigates | ⬜ | — | — |
| EC23 | `secondsPerQuestion` sent with WRITTEN mode | Ignored — forced null for non-GAME (`assessments.ts:33`) | ⬜ | — | — |
| EC24 | Mobile: compose + assign two-column grid stacks; long question labels wrap in scroll box | Layout holds (`max-h-72 overflow-y-auto`) | ⬜ | — | — |

---

### US-OWNER-09: GAME assessment — timer, speed-weighted points, streaks, leaderboard
**As a** tenant owner, **I want** to publish a GAME-mode assessment with a per-question timer that awards speed- and streak-weighted points and a class leaderboard, **so that** quizzing is competitive and engaging.
**Routes/code:** `/[locale]/tenant/assessments` (GAME branch) · `POST /tenant/assessments` (`mode:'GAME'`, `secondsPerQuestion`) · `computeGamePoints` (`shared.ts:66`) · `GET /tenant/assessments/:id/leaderboard` (`results.ts:6`).
**Priority:** P1

**Acceptance criteria**
- AC1 — Given GAME mode, When published, Then `secondsPerQuestion = provided ?? 20` (never null) and `mode='GAME'` (`assessments.ts:33`).
- AC2 — A correct answer scores `round(1000 · speedFactor · streakMult)`; faster + longer streak ⇒ more points; max per Q = 1000·1.0·1.5 = 1500.
- AC3 — Leaderboard ranks each learner's **best** attempt by `pointsTotal desc, score desc, durationMs asc`.

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | `secondsPerQuestion` boundaries 4 / 5 / 120 / 121 | 4 & 121 → schema min(5)/max(120) 400; UI clamps 5..120 (`page.tsx:332`) | ⬜ | — | — |
| EC2 | GAME published with **no** `secondsPerQuestion` | Defaults to 20 server-side; client player also `?? 20` — consistent | ⬜ | — | `assessments.ts:33`, `game-quiz-player.tsx:21` |
| EC3 | Submit fallback when `secondsPerQuestion` null (only WRITTEN) | `limitSec = secondsPerQuestion ?? 30`; for GAME never null so the `30` fallback is **dead code** for scoring; player uses `20` | ⬜ | — | note the 20-vs-30 inconsistency is latent (GAME always set) — `learner.ts:80` |
| EC4 | Points formula: instant correct answer (responseMs≈0), streak 1 | speedFactor=1.0, streakMult=1.0 → **1000** pts | ⬜ | — | — |
| EC5 | Points: answer at the buzzer (responseMs=limit), streak 1 | speedFactor=0.5 → **500** pts | ⬜ | — | — |
| EC6 | Points: 6th+ consecutive correct, instant | streakMult capped 1.5 → **1500** pts (cap holds at streak 6,7,…) | ⬜ | — | `shared.ts:74` |
| EC7 | Wrong answer mid-streak | streak resets to 0; next correct restarts streakMult at 1.0 | ⬜ | — | `learner.ts:115` |
| EC8 | Timer expiry submits `''` | `isCorrect('')` false (blank guard) → 0 pts, streak broken — never awards points for unanswered | ⬜ | — | `shared.ts:221` |
| EC9 | **Client-supplied `timings` trusted for points** | A learner can POST `timings[qid]=0` for every Q to force speedFactor=1.0 and inflate the leaderboard; server only clamps to [0,limit], never validates against real elapsed/server time | ⬜ | — | **suspected bug — leaderboard integrity (S2)**: `learner.ts:111`, `shared.ts:72` |
| EC10 | Missing `timings` entry for a correct Q | `responseMs ?? limitMs` → speedFactor 0.5 (worst) — honest but penalizes a missing-but-correct answer | ⬜ | — | `shared.ts:72` |
| EC11 | `durationMs` negative / huge / omitted | schema `min(0)`; omitted → null stored; used only as leaderboard tie-break (lower wins) | ⬜ | — | — |
| EC12 | Leaderboard tie: equal points | Tie-break by score desc, then `durationMs asc` — but **a learner who omitted durationMs (null) sorts how?** Prisma `asc` puts nulls — verify null ordering doesn't unfairly win/lose | ⬜ | — | `results.ts:15` — null durationMs ordering ambiguous |
| EC13 | Leaderboard mode-rendering | GAME rows show `pts` (`t('points')`); WRITTEN rows show `%` (`leaderboard-table.tsx:43`) | ⬜ | — | — |
| EC14 | **Self-highlight on leaderboard** | `LeaderboardTable` supports `highlightId` but **no caller passes it** (owner page nor learner page) → current learner never highlighted | ⬜ | — | **suspected bug** — `leaderboard-table.tsx:11`, callers `tenant page:83` / `learner page:20` |
| EC15 | `maxStreak` recorded | Best run length stored on attempt; surfaced in results (`resultSummary`) | ⬜ | — | `learner.ts:109` |
| EC16 | GAME with `maxAttempts>1`: best attempt wins leaderboard | `bestByUser` keeps first (highest pointsTotal) after order-by — confirm a worse later attempt can't replace it | ⬜ | — | `results.ts:18` |
| EC17 | GAME assessment with a single question | introMeta count=1 plural; player runs one Q; streakMult=1.0 max 1000 (or 1500? streak=1 only) | ⬜ | — | ICU plural for `introMeta`/`points` uz/ru |
| EC18 | Publish GAME then switch UI mode back to WRITTEN before submit | Local state only; published mode is whatever was sent — verify the `secondsPerQuestion` spinner only shows for GAME (`page.tsx:322`) | ⬜ | — | — |
| EC19 | i18n: `points`/`introMeta`/`resultSummary` ICU plurals in ru (paucal) and uz (invariant) | ru "1510 ball"/"2 вопроса"; uz invariant — verify (F23 fixed player+board) | ⬜ | — | — |
| EC20 | Owner views GAME leaderboard before anyone played | `rows:[]` → board hidden; results table all "Not yet" | ⬜ | — | — |

---

### US-OWNER-10: Assessment-driven progress — per-student & class, post-submit update
**As a** tenant owner, **I want** student assessment results to roll into per-student and class progress immediately after each submit, **so that** I see live mastery.
**Routes/code:** `/tenant/progress`, `/tenant/students/[id]` · `GET /tenant/assessments/:id/results` · `services/tenant/progress.ts`, `services/learningProgress.service.ts`, `results.ts` · learner submit invalidations (`useAssessments.ts:204`).
**Priority:** P1

**Acceptance criteria**
- AC1 — After a learner submits, their attempt count + best score appear in that assessment's results without a manual refresh on the learner side (learner list + leaderboard invalidated).
- AC2 — Class/per-student progress reflects the new attempt (LearningActivityDay / quiz averages) on next owner view.

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Learner submits → owner results page already open | Owner sees STALE results (no realtime/poll); requires refetch — confirm no socket; note staleTime 30s | ⬜ | — | — |
| EC2 | Owner results query while learner mid-attempt | Shows last completed attempt only (no in-progress attempt persisted) | ⬜ | — | — |
| EC3 | A learner with 0 attempts in per-student progress | Shown as not-submitted / 0, not crash/NaN | ⬜ | — | — |
| EC4 | Score averaging across WRITTEN + GAME assessments | Verify GAME `score` (% correct) is included consistently or excluded from quiz averages; no double counting with content quizzes | ⬜ | — | check `learningProgress.service` vs assessment attempts |
| EC5 | Deactivated student's past attempts in class average | Decide: included or excluded; must be consistent and documented | ⬜ | — | — |
| EC6 | Cross-tenant: owner A sees only org-A students' progress | All progress scoped by tenant | ⬜ | — | **S1** |
| EC7 | Per-student progress for a learnerId in another tenant (crafted) | 404/403 via tenant guard | ⬜ | — | **S1** |
| EC8 | i18n + date/number formatting on progress (uz) | No raw keys; uz relative dates correct (cf. F18) | ⬜ | — | — |
| EC9 | Empty class (no students) progress page | Clean empty state, no division-by-zero | ⬜ | — | — |
| EC10 | Many attempts (maxAttempts=5 × N learners) results aggregation perf | Single query groups by user; no N+1 blow-up | ⬜ | — | `results.ts:48` one query |

---

### US-OWNER-16: Assessment lifecycle — assign scope, unassign, delete, draft/publish transitions
**As a** tenant owner, **I want** clear, reversible control over who an assessment is assigned to and over its publish state, **so that** I can correct mistakes without leaking or stranding assessments.
**Routes/code:** `POST /tenant/assessments/:id/assign` · `assessments.ts`, `learner.ts` · `hooks/useAssessments.ts`.
**Priority:** P2

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | **No unassign endpoint exists** | Once assigned, a learner cannot be removed from an assessment via the API/UI | ⬜ | — | **gap** — no DELETE on assignment |
| EC2 | **No delete-assessment endpoint** | Published assessments can't be removed/retired; only grows | ⬜ | — | **gap** |
| EC3 | **No unpublish (PUBLISHED→DRAFT)** transition | Status enum supports DRAFT but no patch route to demote | ⬜ | — | gap |
| EC4 | Assign via `contentId`/`sectionId` scope vs direct `learnerIds` | Both stored on the assignment; verify learner-side visibility identical (list keys on learnerId only) | ⬜ | — | `assignments` carry content/section but `listLearnerAssessments` ignores them |
| EC5 | Assign same assessment to a learner twice in two requests | Idempotent (dedup `existing`) — no second seat/row | ⬜ | — | `assessments.ts:79` |
| EC6 | Concurrent assign of the same learner from two owner tabs | Possible duplicate row (no unique constraint on (assessmentId,learnerId)?) — verify schema unique; else race creates dup | ⬜ | — | check `AssessmentAssignment` unique |
| EC7 | Assign a learner who then gets deactivated | Assignment remains; learner loses access via `requireActiveLearner` (403 on /learner) | ⬜ | — | — |

---

### US-LEARNER-05: Take an assessment (WRITTEN + GAME) — attempts, timer, resume, integrity
**As a** tenant learner, **I want** to take my assigned WRITTEN and GAME assessments reliably (attempt limits honored, timer fair, results shown), **so that** my work counts correctly and I can't be cheated or locked out unfairly.
**Routes/code:** `/[locale]/learner/assessments` · `GET /learner/assessments`, `POST /learner/assessments/:id/attempts`, `GET /learner/assessments/:id/leaderboard` · `services/assessment/learner.ts`, `components/learner/game-quiz-player.tsx`.
**Priority:** P0 (S1 isolation + grading correctness)

**Acceptance criteria**
- AC1 — Learner sees only PUBLISHED assessments assigned to them while membership active (`learner.ts:14`).
- AC2 — Over-limit submit is blocked with 409 "Attempt limit reached" (pre-count + in-transaction re-count).
- AC3 — GAME: per-question timer counts down from `secondsPerQuestion`, auto-locks `''` on expiry, advances; final submit shows score/correct/streak.
- AC4 — Cross-tenant / unassigned assessmentId is never readable or submittable (403/404).

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Submit when `attemptCount === maxAttempts` | 409 "Attempt limit reached"; WRITTEN button shows `attemptLimit`, inputs disabled (`page.tsx:119`); GAME Play disabled | ⬜ | — | `learner.ts:75` |
| EC2 | Over-limit submit via **crafted API** (UI lock bypassed) | 409 enforced server-side (pre-count) | ⬜ | — | — |
| EC3 | **Concurrent** double-submit (two tabs) at attemptCount = max-1 | In-`$transaction` re-count should reject the 2nd; **but under READ COMMITTED two parallel txns can both read count<max before either inserts → both succeed, exceeding maxAttempts** (no unique/serializable guard) | ⬜ | — | **suspected bug — concurrency (S2)**: `learner.ts:137`; no `(assessmentId,userId,attemptIndex)` unique |
| EC4 | Double-click Submit (WRITTEN) | `submit.isPending` disables button; second click suppressed — but only client-side | ⬜ | — | — |
| EC5 | GAME timer reaches 0 with no answer | `lockAnswer('')` once (`lockedRef` guard), `''` graded wrong, advances/finishes | ⬜ | — | `game-quiz-player.tsx:45,54` |
| EC6 | GAME: answer then timer also fires (race) | `lockedRef.current` prevents double-lock for the same question | ⬜ | — | `:55` |
| EC7 | GAME mid-game **refresh/disconnect** | All state is React-local; refresh **loses the attempt entirely** — nothing submitted, attemptCount unchanged → learner can restart freely (escape hatch to avoid a bad score) | ⬜ | — | no server-side in-progress attempt / resume |
| EC8 | GAME submit network failure | `finish` catch → `alert(message)` then `onExit()`; attempt not recorded; can retry (if attempts remain) | ⬜ | — | `:80` |
| EC9 | GAME submit returns 409 (limit) at finish | alert shows server message, exits | ⬜ | — | — |
| EC10 | Submit answer for a questionId **not in** the assessment | Ignored — grading loops over assessment.questions only (extra keys dropped) | ⬜ | — | `learner.ts:102` |
| EC11 | Submit **missing** an answer for some questions | Missing → `''` → wrong; score reflects only answered (`body.answers[id] ?? ''`) | ⬜ | — | `:103` |
| EC12 | NUMERIC answer with comma decimal "3,14" vs accepted "3.14" | `replace(',', '.')` both → match within 0.001 | ⬜ | — | `shared.ts:223` |
| EC13 | NUMERIC with thousands separators "1,000" | becomes "1.000"=1.0 → likely mismatch; document numeric input rules | ⬜ | — | `shared.ts:223` (only first interpretation) |
| EC14 | NUMERIC correct answer is **0**, learner leaves blank | `''` blank-guard returns false → **not** scored (prevents `Number('')===0` false-positive) | ⬜ | — | `shared.ts:221` (explicit guard) |
| EC15 | SHORT_ANSWER case/space-insensitive match | `normalizeAnswer` trims+lowercases+collapses spaces → "  The  Cat " == "the cat" | ⬜ | — | `shared.ts:212` |
| EC16 | MULTIPLE_CHOICE: two options normalize identically | Selecting either matches; verify no ambiguous scoring | ⬜ | — | — |
| EC17 | Assessment **assigned but DRAFT** (owner published=false) | Not in learner list (filter PUBLISHED); direct submit → 404 | ⬜ | — | `learner.ts:14,66` |
| EC18 | Assessment **unassigned** to this learner (crafted id, same tenant) | `assertLearnerAssignment` → 403 "Assessment not assigned to you" on submit & leaderboard | ⬜ | — | **S1** — `shared.ts:231` |
| EC19 | **Cross-tenant** assessmentId (other org) submit/leaderboard | `assessment:{tenantId}` join in assignment lookup → 403 (never leaks other org) | ⬜ | — | **S1 IDOR** |
| EC20 | **Deactivated** learner opens `/learner/assessments` | `requireActiveLearner` → 403 "Student account is deactivated" (whole router) | ⬜ | — | F16-adjacent; verify list+submit both 403 |
| EC21 | Learner GETs `/tenant/assessments/...` (owner route) | 403 `requireTenantOwner` | ⬜ | — | role boundary |
| EC22 | Empty / no-questions assessment reaches learner | Can't create with 0 (schema min 1); if all questions rejected post-publish they still appear (EC17 OWNER-08); `total>0?` guards score=0; GAME player `!question` → renders null | ⬜ | — | `learner.ts:135`, player `:169` |
| EC23 | Duplicate assignment rows for same learner | `listLearnerAssessments` dedups by assessment id (`seen` set) → shows once | ⬜ | — | `learner.ts:29` |
| EC24 | Leaderboard while learner has no attempt | Returns rows from others; learner not present; self-highlight absent anyway (EC14 OWNER-09) | ⬜ | — | — |
| EC25 | WRITTEN result view after submit | Local `result` shows correct/total + per-Q acceptable answers + explanation; **not persisted** — leaving the page loses the detailed view (only leaderboard remains) | ⬜ | — | `page.tsx:31` local state |
| EC26 | GAME: change locale mid-game | Strings re-render (next-intl); timer/state preserved | ⬜ | — | — |
| EC27 | a11y: GAME timer is purely visual (color+`Xs`) | Screen-reader users get no countdown announcement / `aria-live`; MC option buttons keyboard-navigable | ⬜ | — | **a11y gap** — no `aria-live` on timer |
| EC28 | a11y: WRITTEN radios grouped by `name={assessmentId-questionId}` | Proper radio grouping; labels associated | ⬜ | — | `page.tsx:96` |
| EC29 | Mobile GAME player (375px) | MC grid `sm:grid-cols-2` → single column; progress bar + timer fit; input+Next row not clipped | ⬜ | — | — |
| EC30 | Very long answer string / 10k chars submitted | Graded (normalized) without crash; no server cap on answer length | ⬜ | — | record value length unbounded |
| EC31 | Learner submits with fabricated `timings` (all 0) | Inflated GAME points accepted (see OWNER-09 EC9) — same integrity hole from learner side | ⬜ | — | **suspected bug** |
| EC32 | Slow network: WRITTEN submit pending | Button disabled, spinner state; no double attempt | ⬜ | — | — |
| EC33 | Latest score/points badge after submit | `useSubmitLearnerAssessment` invalidates `['learner','assessments']` + that leaderboard → card shows updated attempts/latest | ⬜ | — | `useAssessments.ts:204` |
| EC34 | i18n: learner list strings (attempts/latest/play/leaderboard/attemptLimit/empty) uz/ru | `learner.assessments` namespace — F24 logged list page un-i18n'd; re-verify | ⬜ | — | — |
| EC35 | GAME `introMeta` plural for questions/seconds in uz/ru | Correct ICU plural (F23) | ⬜ | — | — |
| EC36 | GAME for an assessment whose `mode` is WRITTEN but learner forces Play | UI only shows Play for `isGame`; WRITTEN renders form — no GAME path for WRITTEN | ⬜ | — | `page.tsx:163` |

**Notes / open questions**
- Resume/anti-quit: because attempts persist only on submit, a learner can refresh out of a losing GAME with zero penalty. If that's undesirable, server needs an in-progress attempt record. Logged as product question.
- Leaderboard self-highlight (`highlightId`) is plumbed but never wired — quick fix, high student-visible value.

---


<!-- ===== AREA: admin-billing ===== -->
## Area: Admin panel + billing/seats + subscriptions

> Scope: `apps/admin` (port 3001, **no i18n**) + the `/admin/*` API surface + tenant/individual
> billing (`/billing/*`, `TenantShell` banner). Existing partial coverage: **US-ADMIN-02**
> (users/tenants/content/generated/subscriptions/usage/audit smoke; F25 fixed). All stories below
> are **new** (status ⬜ Not-yet-tested) unless they extend US-ADMIN-02. Numbering continues from the
> backlog: US-ADMIN-01 (tutor-request approve, listed but never spec'd), then 03→09, plus US-OWNER-11.
>
> **Anchors read:** `apps/api/src/controllers/admin/{users,tenants,content,analytics}.controller.ts`,
> `controllers/{admin-tutor-request,admin-audit}.controller.ts`,
> `services/{tutorRequest,adminUserRole}.service.ts`, `services/subscription/{user,tenant,admin,shared}.ts`,
> `services/admin/audit.service.ts`, `controllers/billing.controller.ts`,
> `routes/admin.routes.ts`, `middleware/admin-rate-limit.middleware.ts`,
> `apps/admin/hooks/useAdmin.ts`, `apps/admin/app/(admin)/{tutor-requests,users,users/[id],tenants/[id]}/page.tsx`,
> `apps/web/contexts/tenant-shell.tsx`, `hooks/useBilling.ts`.

---

### US-ADMIN-01: Approve a tutor request → org + ACTIVE subscription + seat limit
**As a** platform admin, **I want** to approve a learner's "become a tutor" request and set a seat
limit, **so that** they get a `TENANT_OWNER` org with an ACTIVE subscription, capped at the seats I sold.
**Routes/code:** `apps/admin /tutor-requests` · `POST /admin/tutor-requests/:id/approve` · `POST .../reject` ·
`tutorRequest.service.ts (approve/rejectTutorRequest)` · `adminUserRole.service.ts (applyAdminRoleChange → createTenantForOwner, ensureTenantSubscription)` · `tutor-requests/page.tsx` · `useApproveTutorRequest`/`useRejectTutorRequest`.
**Priority:** P0 (revenue + role unlock + billing boundary)

**Acceptance criteria**
- AC1 — Given a PENDING request, When I approve with no seat limit, Then the user becomes `TENANT_OWNER`, a `Tenant` is created (unique slug + joinCode), an **ACTIVE TENANT subscription** is created, seatLimit = plan default (null override), the request flips to `APPROVED` with `decidedById`/`decidedAt`, and an `tutor_request.approve` audit row is written.
- AC2 — Given a PENDING request, When I approve with seatLimit=N (1..100000), Then `tenant.seatLimit=N` and `assertTenantQuota('STUDENT')` enforces N going forward.
- AC3 — Given a PENDING request, When I reject (optionally with a note), Then status=`REJECTED`, note persisted, `tutor_request.reject` audited, and the user stays INDIVIDUAL.
- AC4 — The list shows PENDING first, then newest; filter by PENDING/APPROVED/REJECTED/All; pagination works.

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Approve a request that is already APPROVED/REJECTED | 400 "Request already decided"; no second tenant; UI shows `alert('Failed to approve')` | ⬜ | — | — |
| EC2 | Approve a non-existent / crafted `:id` | 404 "Request not found" | ⬜ | — | — |
| EC3 | seatLimit = 0 (type a 0 in the seat box) | 400 zod (`approveSchema` min(1)); **F-note:** seat input has no `min`/validation, so 0 reaches the API and only the server rejects — UI shows generic "Failed to approve", not "seat must be ≥1" | ⬜ | — | — |
| EC4 | seatLimit = -5 / 100001 / 2.5 (decimal) | 400 zod (`int().min(1).max(100000)`); decimal fails `.int()` | ⬜ | — | — |
| EC5 | seatLimit = "" (blank box) | Treated as undefined → plan default seat limit, ACTIVE sub still created | ⬜ | — | — |
| EC6 | seatLimit = non-numeric (paste "abc") | `type=number` blocks; if forced, `Number("abc")=NaN` → zod 400 | ⬜ | — | — |
| EC7 | **Double-click Approve** (or two admins approve same PENDING row concurrently) | Should be idempotent. **SUSPECTED BUG:** approve is **not transactional and has no atomic status guard** — both reads see PENDING, both run `applyAdminRoleChange`→`createTenantForOwner` → possible duplicate tenant / unique-slug crash / double subscription. Button `disabled={approve.isPending}` only guards one client. | ⬜ | — | — |
| EC8 | **Partial-failure re-approve** | If a prior approve created the tenant+role but crashed before `tutorRequest.update`, the request stays PENDING. Re-approving: `applyAdminRoleChange(userId, 'TENANT_OWNER'→'TENANT_OWNER')` returns `{tenantId:null}` early (fromRole===toRole), so **seatLimit is silently ignored** and the request is still marked APPROVED. Verify seat ends up correct. | ⬜ | — | — |
| EC9 | Approve when the user was already independently promoted to TENANT_OWNER (owns a tenant) | `applyAdminRoleChange` hits the `existingOwned` branch → reuses the tenant, ensures subscription, applies seatLimit. No duplicate org. | ⬜ | — | — |
| EC10 | Approve a request whose user was **deleted** | `applyAdminRoleChange` / `prisma.user.update` throws (user gone) → 500/404; request stays PENDING | ⬜ | — | — |
| EC11 | Reject already-decided request | 400 "Request already decided" | ⬜ | — | — |
| EC12 | Reject with no note | Keeps the original request note (`note ?? request.note`); status REJECTED | ⬜ | — | — |
| EC13 | Reject confirm dialog cancelled (`window.confirm`) | Nothing happens, no API call | ⬜ | — | — |
| EC14 | Rejected user re-requests become-tutor | Allowed (createTutorRequest only blocks an existing **PENDING** one) → new PENDING row; admin can approve the new one | ⬜ | — | — |
| EC15 | Approve creates org but **FREE plan / TENANT plan not seeded** | `ensureTenantSubscription`/`getFreePlan` throws 500 "… not configured"; partial state (role changed, no sub) | ⬜ | — | — |
| EC16 | `createTenantForOwner` slug collision (two orgs same orgName) | Slug must stay unique — verify suffixing/retry, not a 500 | ⬜ | — | — |
| EC17 | List filter status=APPROVED / REJECTED / All | Server `where.status`; ordering `status asc, createdAt desc`; pagination `page*pageSize >= total` disables Next | ⬜ | — | — |
| EC18 | Empty state (no requests for filter) | Distinct empty message, not a spinner; Prev/Next disabled | ⬜ | — | — |
| EC19 | Loading state on slow network | Spinner/skeleton; Approve/Reject disabled while `isPending` | ⬜ | — | — |
| EC20 | Approve audit metadata | `tutor_request.approve` row with `{tenantId, userId}`; reject row written too | ⬜ | — | — |
| EC21 | Approved owner immediately logs into web app | Lands `/tenant/dashboard`, no inactive-subscription banner (sub is ACTIVE) | ⬜ | — | — |
| EC22 | Non-admin token hits `POST /admin/tutor-requests/:id/approve` | 403 (router `requireRole('ADMIN')`) — privilege check independent of UI | ⬜ | — | — |
| EC23 | a11y: seat input + Approve/Reject buttons | Labels/aria for the per-row seat box (placeholder-only today → screen-reader name); keyboard reachable | ⬜ | — | — |

---

### US-ADMIN-03: Admin user management (create / role change / reset-pw / delete / patch subscription)
**As a** platform admin, **I want** full lifecycle control of any account, **so that** I can support
users, fix roles, and bill them — without leaking credentials or destroying orgs by accident.
**Routes/code:** `/users`, `/users/[id]` · `POST /admin/users`, `GET/PATCH/DELETE /admin/users/:id`, `POST /admin/users/:id/reset-password`, `PATCH /admin/users/:id/subscription` · `admin/users.controller.ts` · `adminUserRole.service.ts` · `subscription/user.ts` · `useAdmin.ts`.
**Priority:** P0 (credential safety + role isolation + data lifecycle)

**Acceptance criteria**
- AC1 — Create user (email+password≥8+role) → 201, FREE ACTIVE subscription auto-created, `adminPasswordNote` set to the plaintext, `user.create` audited; duplicate email → 409.
- AC2 — Patch role with proper org context applies `applyAdminRoleChange` atomically and audits `user.role_change`; name/locale/passwordNote patch persists.
- AC3 — Reset password (explicit or generate) sets `mustChangePassword`, mirrors plaintext into `adminPasswordNote`, returns `temporaryPassword`, audits `user.reset_password`.
- AC4 — Delete refuses (409) when the user owns an org unless `confirmCascade:true`; deletes + audits otherwise; cannot delete self.
- AC5 — Patch subscription (individual plans only) updates plan/status/period, audits `subscription.update`.

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Create user, duplicate email (case/space variants) | 409 "Email already registered"; **note** createUser does NOT lowercase/trim email (unlike register F17) — `Foo@x.com` vs `foo@x.com` could both be created and then break case-insensitive login. Verify. | ⬜ | — | — |
| EC2 | Create with password < 8 / invalid email / missing fields | 400 zod | ⬜ | — | — |
| EC3 | Create role=ADMIN via API (no UI for it) | Allowed (admin-gated) → a new admin exists; confirm "admins not self-registerable" still holds (only an existing admin can) | ⬜ | — | — |
| EC4 | Create when FREE plan unseeded | 500 "FREE plan not configured"; no orphan user (create is a single nested write — verify atomicity) | ⬜ | — | — |
| EC5 | Patch own admin role → non-ADMIN | 400 "Cannot change your own admin role" | ⬜ | — | — |
| EC6 | Patch role learner→owner with neither orgName nor tenantId | 400 zod refine ("orgName or tenantId required") | ⬜ | — | — |
| EC7 | Patch role owner→individual while still owning an org, no newOwnerId | 400 "Select a new owner before demoting" | ⬜ | — | — |
| EC8 | Demote owner→individual with valid newOwnerId (a member) | Ownership transferred, old owner membership deactivated, new owner role=TENANT_OWNER, audited | ⬜ | — | — |
| EC9 | Transfer ownership to a non-member / same user | 400 "New owner must be a member" / "Cannot transfer to the same user" | ⬜ | — | — |
| EC10 | Promote owner→ADMIN while owning an org | 400 "Reassign the owner before changing role" | ⬜ | — | — |
| EC11 | Patch only name / preferredLocale / adminPasswordNote (no role) | **SUSPECTED GAP:** these persist but are **NOT audited** (`writeAdminAuditLog` only runs on role change). Changing the sensitive `adminPasswordNote` leaves no audit trail. | ⬜ | — | — |
| EC12 | Patch with empty body `{}` | No-op update returns user; verify no crash (refine allows all-optional) | ⬜ | — | — |
| EC13 | Reset password generate=true | Returns 12-char `temporaryPassword`; note mirrored; `mustChangePassword=true`; target's next login forced to change-pw | ⬜ | — | — |
| EC14 | Reset with password<8 / neither password nor generate | 400 zod refine | ⬜ | — | — |
| EC15 | **F25 regression** — credential inputs autofill | "Password note"/"Set new password" fields must keep `autoComplete=off`/`new-password`; Chrome must not pre-fill the admin's own saved login | ⬜ | F25 | `73e41c9` |
| EC16 | Delete self | 400 "Cannot delete your own admin account" | ⬜ | — | — |
| EC17 | Delete owner without confirmCascade | 409 with "(N students, M materials) … confirmCascade: true"; UI retries with confirm (`/users/page.tsx`) | ⬜ | — | — |
| EC18 | Delete owner **with** confirmCascade | Whole org cascades (memberships/content/assessments/subscription); audit records `cascadedStudents`/`cascadedContent` counts; learners of that org lose access immediately | ⬜ | — | — |
| EC19 | Delete a plain INDIVIDUAL with content | Deletes; cascade of their content; audited | ⬜ | — | — |
| EC20 | Delete non-existent / crafted id | 404 "User not found" | ⬜ | — | — |
| EC21 | Patch subscription on a TENANT_OWNER user via `/users/:id/subscription` | `assertIndividualPlan` → 400 "Tenant owners use tenant billing" for paid plans; but a leftover personal FREE sub may still be patchable to FREE — verify it doesn't desync the real tenant billing | ⬜ | — | — |
| EC22 | Patch subscription status=CANCELED (individual) | **SUSPECTED DATA-LOSS:** `adminUpdateUserSubscription` rewrites `planId` → FREE on CANCELED, so re-activating later returns FREE, not the prior paid plan (the paid plan is forgotten). Compare with tenant path which keeps the plan. | ⬜ | — | — |
| EC23 | Patch subscription, no existing subscription row | 404 "Subscription not found" (user path won't auto-create here) | ⬜ | — | — |
| EC24 | Patch subscription unknown planCode | 400 "Unknown plan: X" | ⬜ | — | — |
| EC25 | Patch subscription currentPeriodEnd = null vs past date vs invalid string | null clears; non-datetime string → 400 zod (`.datetime()`); past date accepted (no future-guard) | ⬜ | — | — |
| EC26 | Two admins patch the same user concurrently | Last-write-wins; no lock — verify role-change races don't half-apply | ⬜ | — | — |
| EC27 | Users list search (email/name, insensitive) + role filter + pagination | Correct filtering; pageSize max 100; page≥1 | ⬜ | — | — |
| EC28 | adminPasswordNote rendered as copyable plaintext on list + detail | Intentional; must never appear without ADMIN gate; not logged/screenshotted | ⬜ | — | — |
| EC29 | Non-admin token → any `/admin/users*` | 403 | ⬜ | — | — |
| EC30 | Delete user mid-session (target is logged in on web) | Their next request 401s (user gone) → web logs out cleanly | ⬜ | — | — |
| EC31 | Learner whose only active membership is in a deleted org, patched back to INDIVIDUAL | `ensureIndividualSubscription` gives them a FREE sub; old learner memberships deactivated | ⬜ | — | — |

---

### US-ADMIN-04: Tenant management — seat limit, plan, status, period; members + usage
**As a** platform admin, **I want** to edit an org's name, plan, subscription status, period end, and a
custom seat limit, **so that** manual billing and seat caps reflect what the tutor paid for.
**Routes/code:** `/tenants`, `/tenants/[id]` · `GET/PATCH /admin/tenants/:id` · `admin/tenants.controller.ts` · `subscription/tenant.ts (adminUpdateTenantSubscription, assertTenantQuota, getTenantUsageVsLimits)` · `useUpdateTenant`.
**Priority:** P0 (billing + seat boundary)

**Acceptance criteria**
- AC1 — Patch seatLimit=N (1..100000) sets `tenant.seatLimit`; null clears → plan default; `assertTenantQuota('STUDENT')` uses `tenant.seatLimit ?? plan.maxStudents`.
- AC2 — Patch planCode (TENANT_STARTER/TENANT_GROWTH only), status, currentPeriodEnd updates the tenant subscription; `tenant.patch` audited with the body.
- AC3 — Detail shows owner, members (active/inactive), studentCount (active LEARNER only), contentCount, usage-vs-limits.

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | seatLimit = 0 | 400 zod (`min(1)`); schema comment explicitly forbids 0 (would lock out adding students) | ⬜ | — | — |
| EC2 | seatLimit below current **active** student count (e.g. set 2 when 10 enrolled) | Accepted; existing 10 keep access (not pruned), but new enroll/add blocked (`used >= limit`). **Edge:** over-provisioned tenant — no warning shown to admin. Verify UI surfaces "current students exceed new limit". | ⬜ | — | — |
| EC3 | seatLimit = "" (blank) in detail form | Sends `seatLimit:null` only if changed from stored → clears override to plan default | ⬜ | — | — |
| EC4 | seatLimit decimal / negative / > 100000 | 400 zod | ⬜ | — | — |
| EC5 | Patch planCode = an individual plan (FREE/INDIVIDUAL_PRO) | 400 zod (enum only TENANT_*); even if forced, service rejects non-TENANT kind | ⬜ | — | — |
| EC6 | Patch status=PAST_DUE / CANCELED / TRIALING | Status updates; effects: non-ACTIVE → `requireActiveTenantSubscription` 402 blocks owner uploads/students/generation; web `TenantShell` shows inactive banner (US-OWNER-11) | ⬜ | — | — |
| EC7 | Patch status=CANCELED then re-ACTIVE | **Note:** tenant path (unlike user path) does NOT reset plan to FREE on cancel; effectivePlanCode resolves FREE while CANCELED but planCode retained, so re-activating restores the paid plan. Verify this asymmetry with US-ADMIN-03·EC22. | ⬜ | — | — |
| EC8 | Patch status on a tenant that has **no subscription row** (and no planCode given) | `adminUpdateTenantSubscription` → 404 "Tenant subscription not found" — can't set status without first creating via planCode | ⬜ | — | — |
| EC9 | Patch planCode on a tenant with no subscription | Creates a new ACTIVE tenant subscription (create branch) | ⬜ | — | — |
| EC10 | Patch currentPeriodEnd in the past / null / invalid | null clears; invalid string 400; past accepted (manual billing, no guard) | ⬜ | — | — |
| EC11 | Patch name to empty / whitespace | 400 zod (`min(1)`); slug unchanged (only name editable) | ⬜ | — | — |
| EC12 | Patch with no fields | 400 zod refine "At least one field required" | ⬜ | — | — |
| EC13 | Patch non-existent / crafted tenant id | 404 "Tenant not found" | ⬜ | — | — |
| EC14 | studentCount counts only `role=LEARNER, active=true` | Inactive/deactivated students not counted toward seats | ⬜ | — | — |
| EC15 | `getTenantUsageVsLimits` throws (e.g. missing sub) on detail | `getTenant` wraps it in `.catch(()=>null)` → page still renders with null usage, no 500 | ⬜ | — | — |
| EC16 | Concurrent seat-limit edit + a student self-enrolls | Race: enroll checks `assertTenantQuota` against the value at enroll time; verify no over-enroll past a just-lowered limit | ⬜ | — | — |
| EC17 | Audit metadata leaks | `tenant.patch` stores the whole `body` (incl. seatLimit/plan/status) — verify no secret in metadata; readable in `/audit` | ⬜ | — | — |
| EC18 | List search by name/slug (insensitive), pagination | Correct; planCode/subscriptionStatus shown per row | ⬜ | — | — |
| EC19 | Tenant detail members table ordering | owner first (`role desc`), then by joinedAt desc; active/inactive badge correct | ⬜ | — | — |
| EC20 | Double-submit Save on detail | `useUpdateTenant.isPending` should disable; verify no duplicate patch / audit double-row | ⬜ | — | — |
| EC21 | After patch, list/subscriptions cache | `useUpdateTenant` invalidates `['admin','tenants',id]`, `['admin','tenants']`, `['admin','subscriptions']` — no stale seat/plan shown | ⬜ | — | — |
| EC22 | Owner's `/billing/me` after admin seat change | Reflects new `students.limit` (seatLimit ?? maxStudents) within `staleTime 60s` | ⬜ | — | — |

---

### US-ADMIN-05: Content & generated-media moderation (browse / delete / retry stuck job)
**As a** platform admin, **I want** to browse all uploads + AI artifacts platform-wide and delete or
retry them, **so that** I can clear stuck/abusive content and re-run failed ingestion.
**Routes/code:** `/content`, `/generated` · `GET /admin/contents`, `DELETE /admin/contents/:id`, `POST /admin/contents/:id/retry-job`, `GET /admin/generated`, `DELETE /admin/generated/:id` · `admin/content.controller.ts` · `cancelContentJobs`, `contentQueue`, `storageService`.
**Priority:** P1

**Acceptance criteria**
- AC1 — `GET /admin/contents` lists ALL content (no tenant scoping — admin sees every org + B2C), search by title, paginated.
- AC2 — Delete content cancels its queued/active jobs, deletes the storage object (best-effort), removes the row, and audits `content.delete`.
- AC3 — Retry is allowed only on `FAILED` content → status PENDING + re-enqueue.
- AC4 — Generated list (podcast/quiz/slideshow/summary) browsable per kind; delete removes the artifact (+ storage for slideshow) and audits `generated.delete`.

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Retry a content that is READY / PENDING / PROCESSING (not FAILED) | 400 "Only failed content can be retried" | ⬜ | — | — |
| EC2 | Retry a FAILED content | status→PENDING, `contentQueue.add({contentId})`, list invalidated; job re-runs to READY/FAILED | ⬜ | — | — |
| EC3 | **Retry not audited** | **SUSPECTED GAP:** `retryContentJob` writes NO `writeAdminAuditLog` (and never references `req.user`). Spec says "every admin action recorded" — re-enqueue is invisible in `/audit`. | ⬜ | — | — |
| EC4 | Retry a content whose underlying file/storagePath is gone | Re-enqueued job fails again → FAILED; verify no crash / infinite loop | ⬜ | — | — |
| EC5 | Double-click Retry | Two jobs enqueued for the same content; `useRetryContent` not disabled per-row? Verify no duplicate processing / racey status | ⬜ | — | — |
| EC6 | Delete content with running podcast/quiz job | `cancelContentJobs` removes pending/active jobs across content/quiz/podcast queues; no orphaned job | ⬜ | — | — |
| EC7 | Delete content storage failure | `storageService.delete().catch(()=>{})` swallows; DB row still deleted; no 500 | ⬜ | — | — |
| EC8 | Delete non-existent / crafted content id | 404 "Content not found" | ⬜ | — | — |
| EC9 | Delete an assigned tenant material | Cascade removes ContentAssignments → that org's learners lose it (cross-check US-OWNER-12·EC2) | ⬜ | — | — |
| EC10 | Delete generated podcast/quiz/summary that does **not** exist | **SUSPECTED BUG:** for `kind=podcast|quiz|summary`, controller calls `prisma.X.delete({where:{id}})` with NO existence check → Prisma P2025 bubbles as **500**, not a clean 404 (slideshow path DOES 404-check). Inconsistent. | ⬜ | — | — |
| EC11 | Delete generated with missing/invalid `kind` query param | 400 "kind query param required: podcast|quiz|slideshow|summary" | ⬜ | — | — |
| EC12 | Delete slideshow with storagePath | Storage object deleted (best-effort), row removed, audited | ⬜ | — | — |
| EC13 | Generated list `take:50` per kind, no pagination | Large datasets silently truncated to 50 newest/kind — verify UI doesn't imply "all"; no Next button | ⬜ | — | — |
| EC14 | Content list search empty result | Distinct empty state; Prev/Next disabled correctly | ⬜ | — | — |
| EC15 | Loading/error states on slow API | Skeleton/spinner; delete/retry disabled while pending; error toast/alert on failure | ⬜ | — | — |
| EC16 | Non-admin → any `/admin/contents*` or `/admin/generated*` | 403 | ⬜ | — | — |
| EC17 | Delete generated audit `targetType` | Set to the `kind` string (podcast/quiz/...), targetId = artifact id | ⬜ | — | — |
| EC18 | Retry burst (many FAILED) vs admin rate limit | 121st request in 60s → 429 "Too many admin requests" | ⬜ | — | — |

---

### US-ADMIN-06: Usage & cost metering (per-user spend, platform stats)
**As a** platform admin, **I want** per-user API spend over 7/30/90 days and platform KPIs, **so that** I
can watch cost and growth without a payment gateway.
**Routes/code:** `/usage`, `/dashboard` · `GET /admin/usage/summary?days=`, `GET /admin/stats/platform` · `admin/analytics.controller.ts` · `useAdminUsage`/`usePlatformStats`.
**Priority:** P2

**Acceptance criteria**
- AC1 — Usage summary groups `ApiUsageEvent` by user over the last `days`, summing input/output tokens + estimatedCostUsd + eventCount, sorted by cost desc.
- AC2 — Platform stats returns totals (users, signups 7d/30d, content by status, quizzes/podcasts/slideshows/summaries, est. spend, active users 30d).

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | days=0 / negative / >90 / non-numeric | 400 zod (`int().min(1).max(90)`); default 30 | ⬜ | — | — |
| EC2 | Usage rows for a deleted user | `userMap.get` miss → userEmail "unknown", userName null; no crash | ⬜ | — | — |
| EC3 | Tenant-attributed usage | `usageSummary` groups by `userId` only and hardcodes `tenantId:null` → tenant generation shows under the owner's user, not the org. Verify this is acceptable / documented. | ⬜ | — | — |
| EC4 | No events in window | Empty rows array; UI empty state, not a spinner | ⬜ | — | — |
| EC5 | estimatedCostUsd Decimal → Number coercion | Costs render as fixed-precision USD; no `NaN`/`[object]`; large sums don't lose precision egregiously | ⬜ | — | — |
| EC6 | Platform stats with zero data (fresh DB) | All counts 0, spend 0; no division/format error | ⬜ | — | — |
| EC7 | `activeUsersLast30Days` definition | = distinct userIds with content updated in 30d (not logins) — verify the KPI label matches the metric | ⬜ | — | — |
| EC8 | contentsByStatus sums to totalContents | PENDING+PROCESSING+READY+FAILED == totalContents (no other status leaks) | ⬜ | — | — |
| EC9 | Dashboard parallel queries vs rate limit | Dashboard fires stats + others; ensure a single page load stays < 120/60s per admin | ⬜ | — | — |
| EC10 | Non-admin → `/admin/usage/summary` or `/stats/platform` | 403 | ⬜ | — | — |
| EC11 | Numbers formatting (no i18n) | Admin is en-only; large numbers use a consistent grouping; no locale ambiguity | ⬜ | — | — |
| EC12 | Slow query on big dataset (groupBy + findMany) | Loading skeleton; no UI hang; reasonable timeout | ⬜ | — | — |

---

### US-ADMIN-07: Audit log — immutable, filterable, every admin action recorded
**As a** platform admin, **I want** an append-only log of admin mutations, **so that** sensitive actions
(role/password/subscription/delete) are attributable even after the actor or target is gone.
**Routes/code:** `/audit` · `GET /admin/audit-logs?page&pageSize&action&targetType` · `admin-audit.controller.ts` · `services/admin/audit.service.ts (writeAdminAuditLog/listAdminAuditLogs)` · `useAdminAuditLogs`.
**Priority:** P1 (compliance / forensics)

**Acceptance criteria**
- AC1 — Each audited mutation creates an `AdminAuditLog` row snapshotting `adminEmail`/`adminName` (so it survives admin deletion — FK is SetNull), `action`, `targetType`, `targetId`, JSON `metadata`, `createdAt`.
- AC2 — List is newest-first, paginated (pageSize ≤ 100), filterable by `action` and `targetType`.
- AC3 — There is **no update/delete endpoint** for audit rows (append-only).

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Inventory: which actions are audited | Audited: `user.create`, `user.role_change`, `user.reset_password`, `user.delete`, `subscription.update`, `tenant.patch`, `content.delete`, `generated.delete`, `tutor_request.approve`, `tutor_request.reject`, `UPGRADE_REQUESTED`. | ⬜ | — | — |
| EC2 | **Un-audited mutations** | **SUSPECTED GAP vs AC1:** `retryContentJob` (US-ADMIN-05·EC3), and `patchUser` name/locale/**adminPasswordNote** changes (US-ADMIN-03·EC11) write NO audit row — "every admin action recorded" is not actually true. | ⬜ | — | — |
| EC3 | Actor deleted after acting | Row keeps `adminEmail`/`adminName` snapshot; `adminUser` relation null; list falls back to snapshot | ⬜ | — | — |
| EC4 | `UPGRADE_REQUESTED` actor is a **non-admin INDIVIDUAL** | `requestUpgrade` writes an audit row with `adminUserId` = the requester. The `/audit` page shows a "user" as the actor of an "admin" log. Verify the action filter and that it's clearly a self-serve signal, not impersonation. | ⬜ | — | — |
| EC5 | Filter by action / targetType (unknown value) | Returns empty (no match); not an error | ⬜ | — | — |
| EC6 | pageSize > 100 / page < 1 / non-numeric | 400 zod (max 100, min 1, default 50/1) | ⬜ | — | — |
| EC7 | metadata JSON rendering | Renders arbitrary JSON safely (no XSS from injected metadata strings, e.g. org name with `<script>`); large metadata doesn't break layout | ⬜ | — | — |
| EC8 | Immutability | No API path mutates/deletes an audit row; confirm `AdminAuditLog` has no PATCH/DELETE route | ⬜ | — | — |
| EC9 | `writeAdminAuditLog` failure tolerance | `requestUpgrade` wraps create in `.catch(()=>undefined)` (best-effort); but the admin-mutation helpers `await` the audit write un-caught — if the audit insert fails, does the whole mutation 500 **after** the data change already committed? (audit is the last await in most handlers → mutation succeeds, response 500). Verify ordering/atomicity. | ⬜ | — | — |
| EC10 | Empty state (fresh DB) | "No audit entries" not a spinner | ⬜ | — | — |
| EC11 | Ordering ties (same createdAt ms) | Stable enough; newest-first holds | ⬜ | — | — |
| EC12 | Non-admin → `/admin/audit-logs` | 403 | ⬜ | — | — |
| EC13 | Sensitive metadata | Audit metadata must not contain plaintext passwords (reset-password row has no password in metadata — verify) | ⬜ | — | — |

---

### US-ADMIN-08: Admin authentication, role gate & rate limiting
**As the** platform, **I want** the admin panel + `/admin/*` API locked to ADMIN only and rate-limited,
**so that** non-admins can't reach operator tooling and a runaway client can't hammer the API.
**Routes/code:** `apps/admin /login` · `POST /auth/login` (shared) · `apps/admin components/auth-guard.tsx` · `routes/admin.routes.ts (authMiddleware, requireRole('ADMIN'), adminRateLimit)` · `admin-rate-limit.middleware.ts` · `middleware.ts` (locale-strip).
**Priority:** P0 (S1 isolation)

**Acceptance criteria**
- AC1 — Login on 3001 with a non-ADMIN account → immediate `logout()` + "This account is not authorized for admin access."
- AC2 — Every `(admin)` route re-checks `token && user.role==='ADMIN'` and redirects to `/login` otherwise.
- AC3 — `/admin/*` API independently enforces `requireRole('ADMIN')` (403) regardless of client.
- AC4 — `adminRateLimit` allows 120 req/60s per user, then 429.

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | INDIVIDUAL/OWNER/LEARNER logs into 3001 | Logged out + unauthorized message; never sees dashboard | ⬜ | — | — |
| EC2 | Valid admin token used directly against `/admin/users` from a script | 200 (control) | ⬜ | — | — |
| EC3 | OWNER token (valid JWT) → `/admin/users` | 403 (server `requireRole`) — UI gate bypass impossible | ⬜ | — | — |
| EC4 | Expired/invalid/garbage Bearer → `/admin/*` | 401 (authMiddleware) | ⬜ | — | — |
| EC5 | No Authorization header | 401 | ⬜ | — | — |
| EC6 | Legacy token without `role` claim, user IS admin | authMiddleware backfills role from DB; access granted | ⬜ | — | — |
| EC7 | Admin demoted to INDIVIDUAL mid-session (old token still has role=ADMIN) | **Edge:** JWT claims role=ADMIN until expiry → still passes `requireRole` until token expires (role not re-checked from DB each request unless legacy). Document the window; web client `session-sync` would correct UI but API trusts the claim. | ⬜ | — | — |
| EC8 | 121 requests in 60s from one admin | 429 "Too many admin requests"; resets after window | ⬜ | — | — |
| EC9 | Rate limit per-process only | In-memory `Map` → not shared across API instances; in prod multi-instance the effective limit is N×120. Documented limitation. | ⬜ | — | — |
| EC10 | Rate-limit key fallback | Keyed by `userId ?? req.ip ?? 'anonymous'`; behind nginx `trust proxy` must yield real IP for the anonymous fallback | ⬜ | — | — |
| EC11 | Locale-prefixed admin URL (`/en/users`) | `middleware.ts` strips locale → redirect to `/users`; no 404 | ⬜ | — | — |
| EC12 | 401 from API mid-session | `lib/api.ts` interceptor logs out + redirects to `/login` (admin store key `talim-admin-auth`) | ⬜ | — | — |
| EC13 | CORS from wrong origin (panel not on 3001 in dev) | Request CORS-blocked (allow-list only adds localhost:3001/3000 in non-prod) | ⬜ | — | — |
| EC14 | Login form: wrong password / unknown email | Generic invalid-credentials (shared `/auth/login`, no enumeration); `loginRateLimit` after 30 failed | ⬜ | — | — |
| EC15 | Deactivated admin (if such a flag) logs in | Verify behaviour (admins generally not deactivatable; document) | ⬜ | — | — |
| EC16 | a11y: login form, unauthorized message | Focusable, screen-reader announces the error; keyboard submit | ⬜ | — | — |

---

### US-ADMIN-09: Subscription status transitions & their access effects (cross-cutting)
**As the** platform, **I want** ACTIVE/PAST_DUE/CANCELED/TRIALING to gate access consistently across
individual + tenant, **so that** manual billing actually controls what works.
**Routes/code:** `subscription/{user,tenant,shared}.ts` · `resolveEffectivePlanCode`, `requireActiveTenantSubscription`, `getSubscriptionForUser` · enforced via `enforceQuota`/`assertQuota`/`assertTenantQuota`.
**Priority:** P0 (billing boundary)

**Acceptance criteria**
- AC1 — Individual: CANCELED → `getSubscriptionForUser` returns FREE limits (effectivePlanCode FREE) so a canceled Pro user falls back to FREE quotas, not zero access.
- AC2 — Tenant: any status ≠ ACTIVE (PAST_DUE/CANCELED/TRIALING) → `requireActiveTenantSubscription` throws 402 → owner uploads/students/generation blocked; web shows inactive banner.
- AC3 — Effective plan code drives upgrade prompts (FREE→INDIVIDUAL_PRO, TENANT_STARTER→TENANT_GROWTH).

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Individual ACTIVE Pro | Pro limits apply | ⬜ | — | — |
| EC2 | Individual PAST_DUE Pro | **Asymmetry:** user path only special-cases CANCELED (→FREE limits); PAST_DUE/TRIALING keep the **paid plan limits** (no downgrade, no block). Verify intended: a PAST_DUE individual still gets Pro quotas. | ⬜ | — | — |
| EC3 | Individual CANCELED | Limits fall back to FREE; effectivePlanCode FREE; upgrade prompt offered again | ⬜ | — | — |
| EC4 | Individual TRIALING | Treated as the plan's limits (no special handling) — verify a trialing user isn't accidentally blocked | ⬜ | — | — |
| EC5 | Tenant PAST_DUE | Owner `enforceQuota` → 402 "Tenant subscription required…"; cannot add student/upload/generate; **but read paths** (existing materials, viewing students) still work — verify only mutations blocked | ⬜ | — | — |
| EC6 | Tenant CANCELED | 402 on all quota'd actions; web banner shown; learners of that org — do they keep read access? (learner access keys on active membership + assignment, not tenant sub status) — verify learners aren't accidentally cut off by tenant cancel | ⬜ | — | — |
| EC7 | Tenant TRIALING | ≠ ACTIVE → 402 blocks owner actions. **Edge:** a "trial" tenant can't do anything — is TRIALING meant to be usable? Likely a gap (trial should allow usage). | ⬜ | — | — |
| EC8 | Tenant sub plan kind somehow not TENANT | `requireActiveTenantSubscription` 402 "planKind !== TENANT" | ⬜ | — | — |
| EC9 | Owner with no resolved tenantId (legacy token) hits `/billing/me` | `getBillingMe` falls through to the user-subscription branch → returns a personal FREE sub, misrepresenting the org. Verify owners always resolve tenantId. | ⬜ | — | — |
| EC10 | ADMIN role hits any `assertQuota` | Returns immediately (no quota) — admins unmetered | ⬜ | — | — |
| EC11 | Learner hits UPLOAD/GENERATION/VIDEO/PODCAST quota | 403 "Learners cannot upload or generate" (before any quota math) | ⬜ | — | — |
| EC12 | dayRange boundary (quota reset at local midnight) | Per-day quotas reset at local midnight; verify a generation at 23:59 vs 00:01 counts in the right day; server TZ assumption documented | ⬜ | — | — |
| EC13 | Concurrent generations racing a per-day limit | `used >= limit` read-then-act is not atomic → two concurrent requests at limit-1 could both pass (over-spend by 1). Document the race. | ⬜ | — | — |
| EC14 | Tenant STUDENT quota with seatLimit override vs plan maxStudents | `tenant.seatLimit ?? limits.maxStudents`; null seatLimit AND null maxStudents → unlimited (returns early) | ⬜ | — | — |
| EC15 | Quota error contract | 402 `{message, feature, used, limit, upgradePlanCode?}`; STUDENT feature → "Seat limit reached" (F26); upgradePlanCode null at top plan → inline, not modal (US-IND-08) | ⬜ | — | — |

---

### US-OWNER-11: Billing & seat display + inactive-subscription banner + request-upgrade
**As a** tenant owner, **I want** to see my plan, seat usage, and quotas, and be warned when my org is
inactive, **so that** I know what I can do and when to contact the admin.
**Routes/code:** `/[locale]/tenant/billing` · `GET /billing/me` (tenant branch) · `POST /billing/request-upgrade` · `contexts/tenant-shell.tsx` (banner) · `hooks/useBilling.ts` · `billing.controller.ts`.
**Priority:** P1

**Acceptance criteria**
- AC1 — Billing page shows the tenant subscription (plan/status/period) + usage-vs-limits: uploads(=content items, lifetime), generations, tutorMessages, videos, podcasts, students(=seatLimit), contentItems.
- AC2 — When `billing.subscription.status !== 'ACTIVE'`, `TenantShell` renders the warning banner on every tenant page: "Your organization subscription is not active. Uploads, students, and AI generation may be limited."
- AC3 — `POST /billing/request-upgrade` is INDIVIDUAL-only; tenant owners are told to upgrade via admin.

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Owner with ACTIVE sub | No banner; usage cards show real used/limit; students used = active LEARNER count, limit = seatLimit ?? maxStudents | ⬜ | — | — |
| EC2 | Owner with PAST_DUE/CANCELED/TRIALING | Banner shows on all `/tenant/*` pages (sticky under header) | ⬜ | — | — |
| EC3 | **Banner i18n** | **SUSPECTED BUG:** the banner text in `tenant-shell.tsx` is a **hardcoded English literal**, not `useTranslations` — leaks English to uz/ru (Uzbek-first). Should be a translated key (`tenant.*`). | ⬜ | — | — |
| EC4 | `billing.subscription` null (no sub yet) | `inactive = sub && status!=='ACTIVE'` → null sub is falsy → **no banner** even though the org has no active billing. Verify a sub-less owner isn't silently treated as fine. | ⬜ | — | — |
| EC5 | Banner timing / flash | `useBilling` staleTime 60s; on first load before data resolves, no banner flicker; after admin sets PAST_DUE, banner appears within staleTime/refetch | ⬜ | — | — |
| EC6 | Seat usage at/over limit | students used == limit → near-full indicator; over-limit (admin lowered seatLimit below count) shows used > limit gracefully (no negative "remaining") | ⬜ | — | — |
| EC7 | Owner `POST /billing/request-upgrade` | 400 "Only individual accounts can request a self-serve upgrade" | ⬜ | — | — |
| EC8 | INDIVIDUAL already Pro calls request-upgrade | `{ok:true, alreadyPro:true}` (no duplicate signal) | ⬜ | — | — |
| EC9 | INDIVIDUAL FREE calls request-upgrade | `{ok:true}` + best-effort `UPGRADE_REQUESTED` audit row (actor=requester); failure of audit insert swallowed | ⬜ | — | — |
| EC10 | Double-click request-upgrade | Multiple `UPGRADE_REQUESTED` rows (no dedupe) — admin sees duplicates; verify acceptable | ⬜ | — | — |
| EC11 | Unauthorized / no token → `/billing/me` | 401; web interceptor logs out | ⬜ | — | — |
| EC12 | Learner hits `/billing/me` | Falls to user branch → returns their FREE personal sub (no tenant data leak); verify a learner can't read the org's billing | ⬜ | — | — |
| EC13 | Usage numbers formatting across uz/en/ru | Counts pluralize correctly (ICU); dates (period end) render in app locale, not raw ISO | ⬜ | — | — |
| EC14 | Mobile/tablet | Banner wraps without overflow; usage cards stack at 768/375 | ⬜ | — | — |
| EC15 | a11y | Banner has appropriate role/aria (status/alert) so screen-readers announce inactive state; not color-only | ⬜ | — | — |
| EC16 | `getTenantUsageVsLimits` divergence: uploads vs contentItems | Both map to the same `getTenantContentCount` — billing shows uploads.used == contentItems.used; verify the page doesn't double-count or confuse the two cards | ⬜ | — | — |
| EC17 | Tenant generation/podcast/video counts are per-day | generations/videos/podcasts reset daily (dayRange); contentItems/students are lifetime/current — verify labels distinguish "today" vs "total" | ⬜ | — | — |

**Notes / open questions**
- Banner condition `billing?.subscription && status!=='ACTIVE'` means a tenant with **no subscription row** shows no warning (EC4) — likely should warn too.
- Owner billing trusts `req.user.tenantId`; a stale/legacy token without it silently shows individual FREE billing (EC9 of US-ADMIN-09).

---


<!-- ===== AREA: learner ===== -->
## Area: Tenant learner: settings, forced password change, take-assessment, progress

> Scope: the **TENANT_LEARNER** (student) experience depth. Existing deep stories
> (do not duplicate): `US-LEARNER-01` (sees only assigned — isolation), `US-LEARNER-02`
> (take quiz/game + own progress, i18n F23), `US-LEARNER-03` (deactivation → access lost),
> `US-LEARNER-04` (cannot reach owner/admin tools). New stories continue at **US-LEARNER-06**.
>
> Code anchors read for these stories:
> - API: `apps/api/src/routes/learner.routes.ts` (`requireTenantMember` + `requireActiveLearner`),
>   `apps/api/src/middleware/tenant.middleware.ts` (`blockLearnerMutations`, `requireActiveLearner`,
>   `requireTenantMember`), `apps/api/src/controllers/auth.controller.ts` (`changePassword`),
>   `apps/api/src/controllers/assessment.controller.ts`
>   (`listLearnerAssessments` / `submitLearnerAssessment` / `learnerAssessmentLeaderboard`),
>   `apps/api/src/services/assessment/learner.ts`, `apps/api/src/services/assessment/shared.ts`
>   (`isCorrect`, `computeGamePoints`, `assertLearnerAssignment`, `submitAssessmentSchema`,
>   `learnerDisplayName`), `apps/api/src/services/assessment/results.ts` (`getAssessmentLeaderboard`),
>   `apps/api/src/services/tenant/progress.ts` (`getLearnerSummary`, `computeStreakDays`).
> - Web: `apps/web/app/[locale]/(learner)/learner/{dashboard,progress,assessments,settings}/page.tsx`,
>   `apps/web/contexts/learner-shell.tsx`, `apps/web/components/learner/student-welcome-banner.tsx`,
>   `apps/web/components/learner/{game-quiz-player,leaderboard-table}.tsx`,
>   `apps/web/components/account/{password-card,profile-card,account-summary}.tsx`,
>   `apps/web/lib/onboarding.ts`.

---

### US-LEARNER-06: Forced password change on first login (`mustChangePassword` kid)
**As a** TENANT_LEARNER created email-less by a tutor (synthetic `username@students.talim.local`,
`mustChangePassword = true`), **I want** to be guided to set my own password on first login,
**so that** the tutor-set initial secret is rotated and my account is mine.
**Routes/code:** `/[locale]/learner/dashboard` (entry) · `/[locale]/learner/settings` (change form) ·
`components/learner/student-welcome-banner.tsx` · `lib/onboarding.ts` · `components/account/password-card.tsx` ·
API `POST /auth/change-password` (`auth.controller.ts changePassword`, sets `mustChangePassword:false`,
clears `adminPasswordNote`).
**Priority:** P1

**Acceptance criteria**
- AC1 — Given a learner with `mustChangePassword=true`, When they reach the learner workspace,
  Then the **student-welcome banner** is shown (server-flag driven, cross-device) with a CTA to settings.
- AC2 — Given the change-password form, When they submit a valid new password (≥8 chars) with the
  correct current password, Then the API returns `{ok:true}`, `mustChangePassword` is cleared,
  `adminPasswordNote` is nulled, and the banner no longer appears on next load.
- AC3 — Given the change succeeded, When `onSuccess` fires, Then `dismissOnboarding(user.id)` runs
  so the local per-device flag is also cleared.

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | `mustChangePassword` kid lands on workspace | Welcome banner visible (driven by `user.mustChangePassword`, not just localStorage) | ⬜ | — | — |
| EC2 | Kid **dismisses** banner WITHOUT changing password | **Spec gap:** banner is dismissible and there is **no route guard** in `learner-shell.tsx` — workspace stays fully usable with `mustChangePassword` still true. Expected (per product intent) = blocked/nagged until changed | ⬜ | **suspected bug — forced change not enforced** | — |
| EC3 | Same kid logs in on a **second device** after dismissing on first | Banner re-appears (server flag still true) — verifies server-driven, not just per-device localStorage | ⬜ | — | — |
| EC4 | New password < 8 chars | Native `minLength={8}` blocks submit client-side; if bypassed, API Zod `newPassword.min(8)` → 400 | ⬜ | — | — |
| EC5 | Current password wrong (kid forgot tutor-set pw) | API 400 "Current password is incorrect"; form shows generic `account.password.error` (note: card swallows server message into one generic string) | ⬜ | — | — |
| EC6 | New password == current password | Accepted (no equality check) — weak-rotation allowed; flag still cleared | ⬜ | possible policy gap (no "must differ" rule) | — |
| EC7 | Weak/common new password (e.g. "12345678") | Accepted — only length ≥8 enforced, no complexity/breached-list check | ⬜ | policy note (S4) | — |
| EC8 | Success message + flag clear, then revisit settings | Banner gone, PasswordCard still present for voluntary re-change | ⬜ | — | — |
| EC9 | Double-click "Save" | Button `disabled={changePassword.isPending}` prevents 2nd submit; only one PATCH/POST | ⬜ | — | — |
| EC10 | Network failure mid-change | `catch` sets generic error; password unchanged, flag still true, retry possible | ⬜ | — | — |
| EC11 | i18n — `learner.onboarding` (title/desc/cta/dismiss) + `account.password` in uz/en/ru | All translated; Uzbek default; no hardcoded English | ⬜ | — | — |
| EC12 | a11y — banner CTA + form labels | `Label htmlFor` bound to inputs; banner CTA is a real `<Button>` link; focusable, screen-reader announces | ⬜ | — | — |
| EC13 | Mobile layout of banner | `flex-col` on mobile → `sm:flex-row`; emoji avatar + buttons wrap, no overflow | ⬜ | — | — |
| EC14 | Email-less kid: `currentPassword` field shown even though no email | Form is identity-agnostic (uses JWT); works for synthetic-email kids | ⬜ | — | — |
| EC15 | Kid whose membership was **deactivated** between login and change | `/auth/change-password` is NOT behind `requireActiveLearner` (it's on `/auth`) → change may still succeed; verify intended (auth, not tenant-scoped) | ⬜ | confirm by design | — |
| EC16 | Token issued *before* change still carries no special claim | `mustChangePassword` is a DB/user field surfaced via `/auth/me` (`formatUser`), not in JWT → after change, `GET /me` reflects false on next fetch | ⬜ | — | — |
| EC17 | `adminPasswordNote` cleared on success | After change, admin/support tooling no longer surfaces the stale plaintext note for this user | ⬜ | — | — |
| EC18 | Whitespace-only new password "        " | `.min(8)` passes (8 spaces) — accepted as a valid password; bcrypt hashes it. Policy gap | ⬜ | policy note (S4) | — |

**Notes / open questions**
- **Likely real bug (EC2):** the product model (CLAUDE.md, memory `talim-b2b-product-model`) describes a
  `mustChangePassword` kid as forced to change before workspace; the implementation is only a *dismissible*
  banner with no guard in `contexts/learner-shell.tsx`. Decide: hard gate vs. soft nag.

---

### US-LEARNER-07: Learner account settings (profile, password, locale, theme) + no owner/upload surface
**As a** TENANT_LEARNER, **I want** to edit my display name, change my password, switch UI locale and
theme from settings, **so that** my account reflects me — but I must not see upload or tutor-tool controls.
**Routes/code:** `/[locale]/learner/settings` · `learner/settings/page.tsx` ·
`components/account/{profile-card,password-card,account-summary}.tsx` · `useLearnerSummary` ·
API `PATCH /auth/me` (`updateMeSchema`: `name`, `preferredLocale` enum uz/en/ru) · `POST /auth/change-password`.
**Priority:** P1

**Acceptance criteria**
- AC1 — Given the settings page, When loaded, Then it shows ProfileCard (name, read-only email),
  PasswordCard, and an AccountSummary with `summary.tenantName` (the student's school).
- AC2 — Given a name edit, When saved, Then `PATCH /auth/me` persists it and the auth store updates.
- AC3 — Given a locale switch, When chosen, Then the new locale persists across reloads/devices
  (server `preferredLocale`) and the URL `[locale]` segment follows.

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Empty name submit | `required minLength={1}` blocks; if bypassed, `name.min(1)` → 400 | ⬜ | — | — |
| EC2 | Name with only spaces "   " | Client `name.trim()` sends "" → server `min(1)` rejects 400; UI shows generic error | ⬜ | — | — |
| EC3 | Very long name (1000 chars) | No max on server (`z.string().min(1)`) — stored unbounded; check UI truncation in sidebar/header | ⬜ | possible missing max-length (S4) | — |
| EC4 | Emoji / RTL / combining chars in name | Stored + rendered safely (React escaping); no layout break | ⬜ | — | — |
| EC5 | `preferredLocale` = invalid value crafted in API body | Zod enum rejects → 400; only uz/en/ru accepted | ⬜ | — | — |
| EC6 | Locale switch persistence across devices | `preferredLocale` server-saved → reflected after fresh login elsewhere | ⬜ | — | — |
| EC7 | Email field for **email-less kid** | ProfileCard renders `user.email` only `if (user?.email)` — synthetic `username@students.talim.local` IS truthy, so the internal synthetic email is shown to the kid | ⬜ | minor leak of internal domain (S4) | — |
| EC8 | Learner tries to reach owner routes (`/tenant/...`) | Blocked: web RoleGuard + API `requireTenantOwner` 403 (see US-LEARNER-04); settings exposes **no** upload/assign/student/billing controls | ⬜ | — | — |
| EC9 | Learner crafts `PATCH /auth/me` with `role` field | `updateMeSchema` only allows `name`/`preferredLocale`; extra keys ignored (not `.strict()` — silently dropped, role unchanged) | ⬜ | verify role can't be escalated | — |
| EC10 | Double-submit profile save | `disabled={updateProfile.isPending}` → single request | ⬜ | — | — |
| EC11 | Network error on save | `catch` → generic `account.profile.error`; field retains edited value | ⬜ | — | — |
| EC12 | Theme toggle (if present in header) persists | Theme stored (localStorage/cookie) survives reload; respects system preference default | ⬜ | confirm theme control exists for learner | — |
| EC13 | `useLearnerSummary` 404 (no active membership) | AccountSummary `tenantName` undefined → graceful fallback, no crash | ⬜ | — | — |
| EC14 | i18n — `learner.settings.*` + `account.*` namespaces uz/en/ru | All 3 locales, eyebrow/title/desc/schoolTitle translated | ⬜ | — | — |
| EC15 | a11y — every input has bound `<Label htmlFor>`; tab order ProfileCard→PasswordCard | Keyboard-navigable; SR announces field names + success/error `<p>` | ⬜ | — | — |
| EC16 | Mobile — `max-w-2xl` single column, cards stack | No horizontal scroll on 360px | ⬜ | — | — |
| EC17 | Deactivated learner opens settings | `/learner/summary` 403 (deactivated) but `/auth/me` + change-password still work; verify graceful summary failure (no white screen) | ⬜ | — | — |

---

### US-LEARNER-08: Reads assigned content as a learner (read allowed, generation blocked)
**As a** TENANT_LEARNER, **I want** to open an assigned material and read its summary, listen to podcast,
watch video, view slides, and ask the AI tutor, **so that** I can study — but I cannot upload or trigger
new generation.
**Routes/code:** `/[locale]/content/[id]/{page,chat,podcast}` · `components/content/*` (read path) ·
API `/content/*` guarded by `blockIndividualContentForOwner` + `blockLearnerMutations`;
`contentAccess.service.ts assertCanAccessContent` (learner = assigned + active membership only).
**Priority:** P0

**Acceptance criteria**
- AC1 — Given an **assigned** READY material, When the learner opens it, Then summary/podcast/video/
  slides/sections and the tutor chat all render read-only.
- AC2 — Given any non-GET, non-`/progress`-PATCH write to `/content/*`, When a learner issues it,
  Then 403 "Learners cannot upload or generate content".
- AC3 — Given a learner crafts a **cross-tenant** or **unassigned** contentId, When they fetch/stream it,
  Then `assertCanAccessContent` throws 404 (not visible) — never another tenant's data.

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Open assigned READY content | All read tabs work; no upload/generate buttons rendered for learner role | ⬜ | — | — |
| EC2 | Learner POST to generate podcast/video/quiz on assigned content | 403 via `blockLearnerMutations` (method≠GET/PATCH) — "Learners cannot upload or generate content" | ⬜ | — | — |
| EC3 | Learner PATCH `/content/:id/progress` (mark section read) | **Allowed** — `blockLearnerMutations` permits PATCH only when path includes `/progress` | ⬜ | — | — |
| EC4 | Learner PATCH a **non**-`/progress` content path (e.g. rename) | 403 "Learners cannot modify content" | ⬜ | — | — |
| EC5 | Learner DELETE assigned content | 403 (method DELETE blocked) — cannot delete tutor material | ⬜ | — | — |
| EC6 | Crafted **unassigned** contentId in same tenant | 404 via `assertCanAccessContent` (not in `ContentAssignment`) | ⬜ | — | **S1 isolation** |
| EC7 | Crafted **cross-tenant** contentId | 404 (tenant mismatch) — no leak | ⬜ | — | **S1 isolation** |
| EC8 | Content assigned at **section scope** vs whole-content | Verify learner sees only the granted scope per assignment model; reading beyond granted section honors guard | ⬜ | confirm section-scoped read | — |
| EC9 | Content **unassigned mid-view** (tutor removes assignment while learner is reading) | Next API call (stream/progress/chat) 404/403 — access lost immediately, not at token expiry | ⬜ | — | — |
| EC10 | Learner **deactivated** mid-view | `buildContentListWhere` returns empty + `assertCanAccessContent` 404; tutor chat SSE + progress all denied | ⬜ | — | **S1 (US-LEARNER-03)** |
| EC11 | Content still `PROCESSING`/`FAILED` (not READY) | Read endpoints with `requireReady` → 404/409 appropriate; UI shows processing/failed state, no crash | ⬜ | — | — |
| EC12 | Assigned content has **no** podcast/video/summary generated yet | Learner sees empty/"not available" state (cannot self-generate); no broken player | ⬜ | — | — |
| EC13 | Partial media (podcast ep0 ready, ep1 failed) | Per-episode state shown; learner can play ready parts, sees failed indicator (no regen button for learner) | ⬜ | — | — |
| EC14 | AI tutor chat as learner on assigned content | `POST /chat/stream` allowed (GET-like SSE write? verify quota `TUTOR_MESSAGE` + role) — learner can ask; messages scoped to assigned content | ⬜ | confirm chat stream not blocked by `blockLearnerMutations` | — |
| EC15 | Tutor quota exhausted for learner's org | 402/quota error surfaced gracefully (whose quota — tenant's?) | ⬜ | — | — |
| EC16 | File stream (PDF/audio) of assigned content | Streams with CORS/range; cross-tenant file id → 404 | ⬜ | — | — |
| EC17 | i18n of read UI (uz/en/ru) on content pages | All controls translated; Uzbek default | ⬜ | — | — |
| EC18 | a11y — audio player, section nav keyboard-operable | Controls focusable/labelled; SR-friendly | ⬜ | — | — |
| EC19 | Mobile — content reading + chat layout | Responsive; bottom-nav not obscuring content | ⬜ | — | — |
| EC20 | Stale React Query cache after unassign | Learner's content list refetches; removed item disappears without manual reload | ⬜ | — | — |

---

### US-LEARNER-09: Learner progress page (streak / avg quiz / assigned, post-quiz update, empty)
**As a** TENANT_LEARNER, **I want** a progress page with my assigned-count, learning streak, average
quiz score and a "continue" card, **so that** I see how I'm doing.
**Routes/code:** `/[locale]/learner/progress` · `learner/progress/page.tsx` · `useLearnerSummary`
(`GET /learner/summary` → `getLearnerSummary`), `useContents` · `computeStreakDays`.
**Priority:** P1

**Acceptance criteria**
- AC1 — Given activity, When the page loads, Then assigned-count, `streakDays` (ICU plural),
  `avgQuizScore` (rounded %), and a "continue" progress card render from the summary.
- AC2 — Given no progress yet, When loaded, Then the empty state (`progress.emptyDesc` + 📈) shows
  instead of a continue card.
- AC3 — Given a learner finishes a quiz, When they return, Then `avgQuizScore` and streak reflect it
  (cache invalidated/refetched).

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Brand-new learner, zero activity | Empty state card; `avgQuizScore` → "—"; streak `count:0`; assigned uses `summary.assignedCount ?? contents.length` | ⬜ | — | — |
| EC2 | `streakDays` plural in ru (1 / 2 / 5 / 21) | ICU plural correct for Russian few/many; uz singular form; see F28/F29 | ⬜ | — | — |
| EC3 | `avgQuizScore` = 0 (all wrong) | Renders "0%" (not "—") — `!= null` check distinguishes 0 from null | ⬜ | — | — |
| EC4 | `avgQuizScore` fractional (e.g. 66.66) | `Math.round` → "67%" | ⬜ | — | — |
| EC5 | Summary loading | No skeleton — values fall back (`?? 0` / `?? contents.length`) before data arrives; verify no flash of wrong numbers | ⬜ | possible flash-of-zero (S4) | — |
| EC6 | `/learner/summary` 404 (deactivated/no membership) | `getLearnerSummary` throws 404 → query error; page must degrade (no crash; fallbacks render) | ⬜ | — | — |
| EC7 | `assignedCount` from summary vs `contents.length` mismatch | Prefer `summary.assignedCount`; only falls back to `contents.length` when summary missing | ⬜ | confirm no double-count confusion | — |
| EC8 | Streak across timezone/midnight boundary | `computeStreakDays` day-bucketing — verify a session at 23:59 vs 00:01 counts correctly (server tz vs user tz) | ⬜ | possible tz off-by-one (S3) | — |
| EC9 | Continue card `overallCoverage` 0 / 100 | ProgressBar renders 0% and 100% correctly; `Math.round` on label | ⬜ | — | — |
| EC10 | Post-game-quiz: does `avgQuizScore` include GAME/assessment attempts? | `getLearnerSummary` only averages `QuizAttempt` (per-content quizzes), NOT `AssessmentAttempt` — assessment scores excluded from avg | ⬜ | confirm intended (assessment≠quiz) | — |
| EC11 | Network failure on `useContents` | Assigned tile falls back to `summary.assignedCount`; page still renders | ⬜ | — | — |
| EC12 | i18n — `learner.progress.*` + `learner.assignedMaterials`/`streakDays`/`averageQuiz` uz/en/ru | All translated; Uzbek default | ⬜ | — | — |
| EC13 | a11y — `tabular-nums` stats, headings hierarchy h1→cards | Semantic headings; SR reads stat labels + values | ⬜ | — | — |
| EC14 | Mobile — `sm:grid-cols-3` collapses to 1 col | Stat cards stack cleanly on 360px | ⬜ | — | — |
| EC15 | Stale streak after activity in another tab | Refetch on focus surfaces updated streak | ⬜ | — | — |

---

### US-LEARNER-10: Take a WRITTEN assessment (learner POV — submit, grade, feedback)
**As a** TENANT_LEARNER, **I want** to answer an assigned written assessment and see per-question
feedback, **so that** I learn what I got right/wrong.
**Routes/code:** `/[locale]/learner/assessments` · `learner/assessments/page.tsx` (`WrittenForm`) ·
`useLearnerAssessments` (`GET /learner/assessments`), `useSubmitLearnerAssessment`
(`POST /learner/assessments/:id/attempts`) · API `submitLearnerAssessment` / `isCorrect` / `assertLearnerAssignment`.
**Priority:** P0

**Acceptance criteria**
- AC1 — Given an assigned PUBLISHED written assessment, When listed, Then it shows title, instructions,
  `attempts {used}/{max}`, latest score, and a per-question form (radio for MC, input for SHORT/NUMERIC).
- AC2 — Given answers submitted, When graded, Then 201 returns `{correct,total,results[]}` with per-question
  correct flag, submitted answer, acceptable answers (on wrong), and explanation.
- AC3 — Given `attemptCount >= maxAttempts`, When viewing, Then the form is `locked` (inputs disabled,
  button shows "attempt limit").

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Submit with some questions blank | Blank answers grade as **incorrect** (`isCorrect` returns false on `!answer.trim()`); form sends `'' ` for unanswered (`answers[q.id] ?? ''`) | ⬜ | — | — |
| EC2 | NUMERIC answer "0" when correct is 0 | Correct — but blank "" no longer false-matches 0 (guard in `isCorrect`); verify "0" trims non-empty | ⬜ | — | — |
| EC3 | NUMERIC with comma decimal "3,14" | `replace(',', '.')` both sides → matches 3.14 within 0.001 tolerance | ⬜ | — | — |
| EC4 | NUMERIC non-numeric "abc" | `Number(...)` NaN → incorrect, no crash | ⬜ | — | — |
| EC5 | SHORT_ANSWER case/space variance ("  Paris " vs "paris") | `normalizeAnswer` (trim+lowercase+collapse spaces) → correct | ⬜ | — | — |
| EC6 | MC answer not matching any option | Incorrect; UI radio only offers valid options so only craftable via API | ⬜ | — | — |
| EC7 | **Over-limit submit** (maxAttempts reached) | 409 "Attempt limit reached" — checked twice (pre-grade count + inside `$transaction`) | ⬜ | — | — |
| EC8 | **Concurrent double-submit** at `maxAttempts=1`, `prior=0` | **Race:** `count()` then `create()` in a read-committed `$transaction` — two parallel POSTs each see count 0 and both create → **maxAttempts exceeded**. No unique `(assessmentId,userId,attemptIndex)` constraint or row lock | ⬜ | **suspected bug — over-attempt race** | — |
| EC9 | Double-click "Submit" (single client) | `disabled={submit.isPending}` guards UI; server count guard backstops | ⬜ | — | — |
| EC10 | Submit to **unassigned** assessment (crafted id) | `assertLearnerAssignment` → 403 "Assessment not assigned to you" | ⬜ | — | **S1 isolation** |
| EC11 | Submit to **cross-tenant** assessment | `assessment:{tenantId}` scoping in assignment + `findFirst` → 403/404, never grades foreign data | ⬜ | — | **S1 isolation** |
| EC12 | Submit to DRAFT/unpublished assessment | `status:'PUBLISHED'` filter → 404 "Assessment not found" | ⬜ | — | — |
| EC13 | Assessment with **0 questions** | `total=0` → `score=0` (div-by-zero guarded `total>0?…:0`); 201 with empty results | ⬜ | — | — |
| EC14 | `answers` body with **extra** unknown questionIds | Only `assessment.questions` are graded; extra keys ignored | ⬜ | — | — |
| EC15 | `answers` value non-string (crafted) | Zod `z.record(z.string(), z.string())` → 400 on non-string values | ⬜ | — | — |
| EC16 | Result view shows acceptable answers only when wrong | `!r.correct && acceptableAnswers.length>0` → reveals; on correct, answers hidden (no spoiler) | ⬜ | — | — |
| EC17 | Explanation rendering (may contain markup) | Rendered as text in `<p>` (WrittenForm uses plain interpolation) — verify no XSS, consistent with game player `RichText` | ⬜ | inconsistency note (written=plain, game=RichText) | — |
| EC18 | Submit network failure | `catch` → error from `response.data.message` or `submitError`; answers retained, retry possible | ⬜ | — | — |
| EC19 | Stale `attemptCount` after submit (list not refetched) | After result shown, returning to list should reflect incremented attempt count + locked state | ⬜ | confirm invalidation of `useLearnerAssessments` | — |
| EC20 | Assessment **unassigned mid-attempt** (tutor revokes) | Submit then returns 403; in-progress answers lost gracefully (toast) | ⬜ | — | — |
| EC21 | Learner **deactivated mid-attempt** | `requireActiveLearner` on `/learner/*` → 403 "Student account is deactivated" on submit | ⬜ | — | **S1** |
| EC22 | Very long free-text answer (10k chars) | Accepted/graded without crash; stored in `AttemptAnswer.answer` | ⬜ | — | — |
| EC23 | i18n — `learner.assessments.*` (result/attempts/latest/acceptable/correctMark) uz/en/ru | All translated incl. ICU `{used}/{max}`, `{correct}/{total}` | ⬜ | — | — |
| EC24 | a11y — radio groups have shared `name`; inputs labelled by prompt | Keyboard selectable, SR groups options under question | ⬜ | — | — |
| EC25 | Mobile — long question list scroll + sticky submit | Form usable on 360px, submit reachable | ⬜ | — | — |

---

### US-LEARNER-11: Play a GAME quiz (timer, speed/streak points, submit)
**As a** TENANT_LEARNER, **I want** to play a timed GAME quiz with speed points and streaks,
**so that** assessment is engaging and competitive.
**Routes/code:** `/[locale]/learner/assessments` (`AssessmentCard` → `GameQuizPlayer`) ·
`components/learner/game-quiz-player.tsx` · API `submitLearnerAssessment` (mode GAME),
`computeGamePoints` (`GAME_BASE_POINTS=1000`, speedFactor 0.5–1.0, streakMult 1.0–1.5).
**Priority:** P1

**Acceptance criteria**
- AC1 — Given a GAME assessment, When "Play" is pressed (intro→playing), Then each question shows a
  countdown (`secondsPerQuestion`, default 20 client / 30 server) and advances on answer or timeout.
- AC2 — Given a correct answer, When timed, Then points = `round(1000 · speedFactor · streakMult)`,
  streak increments, and `maxStreak` is tracked; results screen shows total points + per-question +pts.
- AC3 — Given timer expiry, When it hits 0, Then `lockAnswer('')` submits a blank (incorrect, 0 pts,
  streak reset) and auto-advances.

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Answer all instantly | Max speedFactor≈1.0; streak builds → streakMult caps at 1.5 after 6 correct (`min(streak-1,5)*0.1`) | ⬜ | — | — |
| EC2 | Let timer expire on a question | `lockAnswer('')` → incorrect, 0 pts, streak resets, advances; no double-lock (`lockedRef`) | ⬜ | — | — |
| EC3 | Streak break then rebuild | streakMult resets to 1.0 on wrong, climbs again; `maxStreak` keeps the peak | ⬜ | — | — |
| EC4 | **Client-trusted timings** — crafted `timings[q]=0` + `durationMs=0` via API | **Cheat vector:** server uses `body.timings[id]` directly in `computeGamePoints` (clamped 0..limit) → 0ms gives max speedFactor; `durationMs` is leaderboard tiebreak — both fully client-controlled, no server-side timer | ⬜ | **suspected bug — leaderboard cheatable** | — |
| EC5 | `timings` omitted entirely | `responseMs ?? limitMs` → slowest speedFactor 0.5 (fair default) | ⬜ | — | — |
| EC6 | Negative or huge `responseMs` crafted | Clamped `min(max(rms,0),limitMs)` → bounded | ⬜ | — | — |
| EC7 | `secondsPerQuestion` null | Server `?? 30`, client `?? 20` — **mismatch**: client countdown 20s but server scores against 30s limit → speedFactor inflated/deflated vs displayed | ⬜ | inconsistency (S3) | — |
| EC8 | Submitting GAME while `locked` (attempts exhausted) | Play button `disabled={locked}` in card; server 409 backstop | ⬜ | — | — |
| EC9 | Concurrent GAME submits (two tabs) | Same over-attempt race as US-LEARNER-10·EC8 | ⬜ | **suspected bug** | — |
| EC10 | Submit failure mid-finish | `alert(...)` + `onExit()` — abrupt, attempt lost; verify message localized (`learner.game.submitError`) | ⬜ | — | — |
| EC11 | MC option with markup/LaTeX | Rendered via `RichText` (inline) — consistent rich rendering; no XSS | ⬜ | — | — |
| EC12 | Numeric/text answer trimmed before lock | `lockAnswer(textAnswer.trim())` — leading/trailing spaces stripped | ⬜ | — | — |
| EC13 | Single-question GAME | After answering, `index+1 == length` → `finish` immediately; results render | ⬜ | — | — |
| EC14 | Navigate away mid-game (browser back / bottom-nav) | In-progress state lost (no persistence); no zombie timers (interval cleared on unmount) | ⬜ | — | — |
| EC15 | Rapid double-tap an MC option | `lockedRef.current` guard prevents double-lock for the same question | ⬜ | — | — |
| EC16 | Timer visual <25% turns red | `pct<25 ? bg-destructive` color change; `Math.ceil(timeLeft)` seconds shown | ⬜ | — | — |
| EC17 | i18n — `learner.game.*` (intro/start/cancel/scoring/yourScore/resultSummary/questionProgress/points) uz/en/ru, ICU plural points/questions | All translated (F23 fixed); Uzbek default | ⬜ | — | — |
| EC18 | a11y — timer/announcements, option buttons focusable | Keyboard-playable; SR announces question progress + time (live region?) | ⬜ | possible missing aria-live on timer (S3) | — |
| EC19 | Mobile — `sm:grid-cols-2` MC buttons stack; large tap targets | Playable on 360px, no overflow | ⬜ | — | — |
| EC20 | Results screen point math vs server | Client shows `result.attempt.pointsTotal` (server-authoritative) — displayed total == server sum of `pointsAwarded` | ⬜ | — | — |
| EC21 | All answers wrong | pointsTotal 0, maxStreak 0; results all red ✗, leaderboard entry at bottom | ⬜ | — | — |

---

### US-LEARNER-12: Assessment leaderboard (ranking, self-highlight, privacy)
**As a** TENANT_LEARNER, **I want** to see the class leaderboard for an assigned assessment with my own
row highlighted, **so that** I see my standing.
**Routes/code:** `/[locale]/learner/assessments` (`Leaderboard` wrapper) · `components/learner/leaderboard-table.tsx` ·
`useLearnerLeaderboard` (`GET /learner/assessments/:id/leaderboard`) · API `getLearnerAssessmentLeaderboard`
→ `getAssessmentLeaderboard` (best-attempt-per-user, order `pointsTotal desc, score desc, durationMs asc`).
**Priority:** P1

**Acceptance criteria**
- AC1 — Given an assigned assessment, When "Leaderboard" is toggled, Then rows show rank badge
  (gold/silver/bronze for 1/2/3), display name, and points (GAME) or score% (WRITTEN).
- AC2 — Given multiple attempts per user, When ranked, Then only each user's **best** attempt counts.
- AC3 — Given the viewing learner appears on the board, When rendered, Then **their own row is
  highlighted** (`highlightId`).

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Viewing learner's own row highlight | **Self-highlight broken:** `LeaderboardTable` accepts `highlightId` but `learner/assessments/page.tsx` `Leaderboard` renders `<LeaderboardTable rows mode />` **without** passing `highlightId` (own `user.id` never threaded) → own row never highlighted | ⬜ | **suspected bug — self-highlight never wired** | — |
| EC2 | Leaderboard for **unassigned** assessment (crafted id) | `assertLearnerAssignment` → 403 "Assessment not assigned to you" | ⬜ | — | **S1 isolation** |
| EC3 | Leaderboard for **cross-tenant** assessment | `getAssessmentLeaderboard` scoped `where:{id,tenantId}` → 404; assignment guard also blocks | ⬜ | — | **S1 isolation** |
| EC4 | Empty board (no attempts yet) | `rows.length===0` → `learner.game.noScores` message, not a blank table | ⬜ | — | — |
| EC5 | Tie on points | Tiebreak `score desc` then `durationMs asc` — but `durationMs` is client-supplied (cheatable, see US-LEARNER-11·EC4) | ⬜ | linked cheat note | — |
| EC6 | Ranks beyond top-3 | Rank badge falls to neutral `bg-muted`; numbering continuous | ⬜ | — | — |
| EC7 | **Privacy** — peer display name | `learnerDisplayName = name ?? username ?? email` — a classmate with a real **email** but null name/username would have their **email exposed** to the whole class | ⬜ | **privacy leak (S3)** — email shown to peers | — |
| EC8 | Email-less kid on board | Falls back to `username` (no synthetic email leaked) — good | ⬜ | — | — |
| EC9 | WRITTEN vs GAME score column | `mode==='GAME'` shows `points`, else `score%` rounded — verify written board uses score% | ⬜ | — | — |
| EC10 | Leaderboard includes a **now-deactivated** student's attempts | Still listed (attempts persist) — confirm intended vs should be hidden | ⬜ | confirm policy | — |
| EC11 | Loading state | `isLoading` → `loadingLeaderboard` text; toggling off/on refetches | ⬜ | — | — |
| EC12 | Large class (100+ rows) | Renders without virtualization — check perf/scroll on mobile | ⬜ | perf note (S4) | — |
| EC13 | Stale board after own new attempt | Toggling leaderboard refetches; own improved score reflected | ⬜ | — | — |
| EC14 | i18n — rank/points/score, `learner.game.points` ICU plural ru | Correct plural; Uzbek default | ⬜ | — | — |
| EC15 | a11y — board is a list of divs, not a `<table>` | SR cannot navigate as a table; rank/name/score not associated semantically | ⬜ | a11y note (S3) | — |
| EC16 | Mobile — long names truncate vs wrap | Name + score stay on one row, no overflow on 360px | ⬜ | — | — |
| EC17 | Network/403 on leaderboard fetch | `useLearnerLeaderboard` error → `if (!data) return null` hides board silently (no error toast) | ⬜ | silent-failure note (S4) | — |

---

### US-LEARNER-13: Attempt limits, locking, and results re-view
**As a** TENANT_LEARNER, **I want** my attempt count enforced and my latest result viewable,
**so that** I can't game retries and can review feedback.
**Routes/code:** `/[locale]/learner/assessments` · `submitLearnerAssessment` (maxAttempts 1–5) ·
`listLearnerAssessments` (returns `attemptCount`, `latestScore`, `latestPoints`).
**Priority:** P1

**Acceptance criteria**
- AC1 — Given `maxAttempts` reached, When viewing, Then UI shows locked state (disabled play/submit,
  "attempt limit" label) and any new submit is 409.
- AC2 — Given prior attempts, When listed, Then `attemptCount`, latest score (and GAME latest points)
  are shown on the card.
- AC3 — `maxAttempts` is bounded 1–5 at creation (`createAssessmentSchema`), so the lock is meaningful.

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | `maxAttempts=1`, after first submit | Card `locked`; written form button "attempt limit", GAME play disabled | ⬜ | — | — |
| EC2 | `maxAttempts=5`, 5th attempt | 5th allowed, 6th → 409 | ⬜ | — | — |
| EC3 | Boundary: `attemptCount == maxAttempts` exactly | `>=` lock — exactly-at-limit is locked (no off-by-one) | ⬜ | — | — |
| EC4 | Concurrent submits to bypass limit | Over-attempt race (US-LEARNER-10·EC8) — **count check not atomic** | ⬜ | **suspected bug** | — |
| EC5 | `latestScore` shown only when not null | `latestScore != null` guard — fresh assessment shows no "latest" suffix | ⬜ | — | — |
| EC6 | GAME `latestPoints` shown only for GAME + non-null | `isGame && latestPoints != null` → points suffix | ⬜ | — | — |
| EC7 | Same assessment **assigned twice** (content + section scope) | `listLearnerAssessments` dedups via `seen` Set — appears once, attempts merged | ⬜ | — | — |
| EC8 | Best vs latest semantics | Card shows **latest** (most recent `submittedAt desc`), leaderboard uses **best** — verify learner understands the distinction | ⬜ | UX note | — |
| EC9 | Locked card still allows leaderboard view | Leaderboard toggle independent of lock | ⬜ | — | — |
| EC10 | Attempt count after a **failed/errored** submit | No attempt row created on grade error (create is inside the same flow) — count not falsely incremented | ⬜ | — | — |
| EC11 | i18n — `attemptLimit`, `attempts`, `latest`, `points` uz/en/ru | Translated; Uzbek default | ⬜ | — | — |
| EC12 | a11y — disabled buttons convey locked state | `disabled` + visible "attempt limit" label (not color-only) | ⬜ | — | — |
| EC13 | Mobile — locked card layout | Badge + disabled buttons wrap cleanly | ⬜ | — | — |

**Notes / open questions**
- The attempt-limit guard relies on a non-atomic `count → create` even inside `$transaction` (read-committed
  isolation, no unique constraint on attempt index) — a determined learner with two tabs/scripts may exceed
  `maxAttempts`. A `UNIQUE(assessmentId, userId, attemptIndex)` or `SELECT … FOR UPDATE`/serializable tx would close it.

---

## Suspected bugs found while reading code (for triage)

1. **Leaderboard self-highlight never wired** — `apps/web/app/[locale]/(learner)/learner/assessments/page.tsx`
   (`Leaderboard` component, ~line 16–20) renders `<LeaderboardTable rows={data.rows} mode={data.mode} />`
   with **no `highlightId`**, while `components/learner/leaderboard-table.tsx` supports it. The viewing
   learner's own row is never highlighted (the explicitly-requested self-highlight feature is dead).
   Fix: pass `highlightId={useAuthStore(s=>s.user)?.id}`.

2. **Forced password change is not enforced** — `apps/web/contexts/learner-shell.tsx` has no guard for
   `mustChangePassword`; `apps/web/components/learner/student-welcome-banner.tsx` `handleDismiss` lets the
   kid dismiss the nudge and use the full workspace with `mustChangePassword` still true. Product model says
   the kid is "blocked from workspace until changed". Current behaviour = soft, dismissible banner only.

3. **Over-attempt concurrency race** — `apps/api/src/services/assessment/learner.ts` `submitLearnerAssessment`
   (~line 72 pre-check and ~line 130 inside `$transaction`): both gates are `assessmentAttempt.count() >= maxAttempts`
   then `create()`. Under read-committed isolation with no row lock / unique attempt-index constraint, two
   concurrent POSTs at `maxAttempts=1` can each read count 0 and both insert → limit exceeded.

4. **GAME leaderboard is cheatable via client-trusted timings** — `apps/api/src/services/assessment/shared.ts`
   `computeGamePoints` consumes `body.timings[questionId]` and the tiebreak uses `body.durationMs`, both
   fully client-supplied with no server-side authoritative timer. A crafted `POST .../attempts` with
   `timings: {…: 0}` and `durationMs: 0` maximizes speed points and wins all ties.

5. **Possible peer-email exposure on leaderboard** — `apps/api/src/services/assessment/shared.ts:247`
   `learnerDisplayName = name ?? username ?? email`. A classmate whose `name` and `username` are both null but
   who has a real email would have that email shown to the whole class on the leaderboard.

6. **Client/server `secondsPerQuestion` default mismatch** — `game-quiz-player.tsx` defaults the countdown to
   `?? 20` while `assessment/learner.ts` scores against `secondsPerQuestion ?? 30`. When an assessment leaves
   `secondsPerQuestion` null, the displayed timer (20s) and the scoring limit (30s) disagree, skewing speed points.

---


<!-- ===== AREA: xcut-quality ===== -->
## Area: Cross-cutting quality: i18n, a11y, mobile/tablet

> New + deepened stories for the XCUT area. Existing deep stories: **US-XCUT-01** (i18n base —
> keep, but see US-XCUT-06/07/08 below which decompose it per-surface and per-formatter).
> Numbering continues from the area backlog (`US-XCUT-01..05` already listed). Stories below:
> **US-XCUT-02** (mobile/tablet), **US-XCUT-03** (a11y), **US-XCUT-06** (i18n string coverage
> per-surface), **US-XCUT-07** (i18n number/date/relative-time/plural formatting),
> **US-XCUT-08** (locale switch / persistence / API-locale sync). Status starts ⬜.
>
> Code anchors read for these: `lib/format-relative-time.ts`, `lib/pricing.ts`,
> `components/language-switcher.tsx`, `components/layout/{content-sidebar,learning-topbar,resizable-split}.tsx`,
> `components/deck/{DeckPlayer,Slide}.tsx`, `app/[locale]/(tenant)/tenant/students/page.tsx`,
> `components/account/{global-upgrade-modal,upgrade-dialog}.tsx`, `components/tenant/activity-heatmap.tsx`,
> `packages/ui/components/{sheet,dialog}.tsx`. Key symmetry verified: **709 keys, 0 asymmetric**
> across uz/en/ru (so coverage failures are *missing-call-site* / *hardcoded-literal*, not key-drift).

---

### US-XCUT-02: Mobile (≤640) + tablet (768) responsive layouts
**As a** learner/owner on a phone or tablet, **I want** every screen to reflow into a usable
single-column/drawer layout with no horizontal scroll and tappable targets, **so that** the
product is fully usable on the device most Uzbek students actually own.
**Routes/code:** all of `app/[locale]/*` · `components/layout/{content-sidebar,learning-topbar,resizable-split}.tsx` · `components/deck/DeckPlayer.tsx` · `app/[locale]/(tenant)/tenant/students/page.tsx` (desktop `<table>` vs mobile card grid) · `app/[locale]/content/[id]/page.tsx` (FAB) · `packages/ui/components/sheet.tsx`
**Priority:** P1

**Acceptance criteria**
- AC1 — Given a viewport ≤640px, When I open any page, Then content reflows to one column, the content sidebar collapses to a hamburger-triggered `Sheet` drawer, and there is no horizontal scrollbar.
- AC2 — Given the students page on mobile, When it renders, Then the desktop `<table>` (`hidden md:block`) is hidden and the card grid (`grid md:hidden`) is shown, presenting the same data.
- AC3 — Given the learning view (`ResizableSplit`) on mobile, When I open it, Then the AI-tutor panel is a drawer/FAB (not a side-by-side split that would be unusable narrow), and the split divider is hidden.
- AC4 — Interactive controls meet a ~44px touch target (`touch-manipulation` is used on the topbar menu + upload buttons).

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Content workspace at 375px (iPhone SE) | Sidebar becomes hamburger → `ContentSidebarSheet` (`md:flex` aside hidden, sheet on tap); no two-pane squeeze | ⬜ | — | — |
| EC2 | `ResizableSplit` at ≤640px | Split + drag divider is suppressed (the `min-w-0` panes can't honour `minLeft:320 + minRight:280 = 600px` under 640 → check `clampLeftWidth` degenerate branch `maxLeft < minLeft` returns full-width left, right pane collapses) | ⬜ | — | **suspect**: at <606px the right (tutor) pane is clamped to ~0 and unreachable; verify mobile uses drawer not split |
| EC3 | Students table on mobile | `<table>` hidden, card grid shown; every column (name/email/assigned/lastActive/avgQuiz/active) present in cards | ⬜ | — | — |
| EC4 | Students loading/empty state on **mobile** | Card grid path renders **no** loading skeleton and **no** empty-state (only the table branch handles `isLoading`/`length===0`); mobile shows a blank area while loading and nothing when zero students | ⬜ | — | **suspect bug** — `students/page.tsx` mobile `grid md:hidden` maps `filteredStudents` with no `isLoading`/empty guard |
| EC5 | Content detail FAB (AI tutor) on phone | FAB / `?panel=chat` shortcut visible only on mobile (`md:hidden` in learning-topbar); on desktop the permanent Learn-panel tab is used instead | ⬜ | — | — |
| EC6 | `DeckPlayer` (slides) on a 360px phone | 1280×720 stage scales down via `Math.min(w/1280,h/720)`; controls bar wraps without overflow; tap-zones (`w-[18%]` left/right) work for prev/next | ⬜ | — | — |
| EC7 | DeckPlayer fullscreen on iOS Safari | `requestFullscreen`/`webkitRequestFullscreen` are **undefined on generic elements** in iOS Safari → button silently no-ops (only `<video>` can go fullscreen on iPhone) | ⬜ | — | **suspect** — fullscreen toggle dead on iPhone; either hide the button or use a CSS-fullscreen fallback |
| EC8 | PDF viewer on mobile | PDF renders within viewport width, pinch-zoom works, no horizontal page scroll bleeding into app chrome; marquee region-select degrades or is disabled on touch | ⬜ | — | — |
| EC9 | GAME quiz player on a phone | Per-question timer, answer buttons, numeric keypad input all reachable; countdown not clipped; results screen scrolls | ⬜ | — | — |
| EC10 | Any modal (`DialogContent`, `UpgradeDialog`, students add/reset, delete dialog) on small screen | Fits within viewport with internal scroll; close (X) reachable; backdrop tap closes; no content cut off below the fold | ⬜ | — | — |
| EC11 | Long student name / long material title on mobile card | Truncates (`truncate`) or wraps; doesn't push layout wider than viewport | ⬜ | — | — |
| EC12 | Tablet 768px (the `md` breakpoint boundary) | At exactly 768px the layout flips to desktop (`md:` applies at ≥768); table shows, sidebar aside shows — verify no double-render of both table+cards at the boundary | ⬜ | — | — |
| EC13 | Tablet landscape vs portrait | Tenant dashboard / progress grids reflow 1→2→3 cols sanely; no orphaned single card row | ⬜ | — | — |
| EC14 | Horizontal scroll audit (each role home) | `document.scrollingElement.scrollWidth <= clientWidth` on dashboard, learner dashboard, tenant dashboard, students, progress, billing, content, quiz, deck | ⬜ | — | — |
| EC15 | Sticky learning-topbar at `h-14` on mobile | Stays pinned; search Input is `hidden lg:block` so it doesn't crowd; back-link `hidden sm:inline-flex` hidden on xs | ⬜ | — | — |
| EC16 | Sheet drawer width on phone | `w-[min(100%,16rem)]` → 16rem (256px) drawer, never wider than viewport; backdrop covers the rest | ⬜ | — | — |
| EC17 | Rotate device mid-session (orientation change) | `ResizeObserver` in `ResizableSplit`/`DeckPlayer` re-measures and re-clamps; no stuck zero-width pane or mis-scaled slide | ⬜ | — | — |
| EC18 | Mobile keyboard opens over a bottom-fixed input (chat composer) | Composer stays visible above the on-screen keyboard (uses `h-dvh`/`dvh` not `vh`); content scrolls, not the whole page | ⬜ | — | — |
| EC19 | Tap-target spacing students reset/deactivate buttons on mobile cards | Two adjacent `size="sm"` buttons have enough gap (`gap-2`) to avoid mis-taps | ⬜ | — | — |
| EC20 | Pinch-zoom not disabled | No `maximum-scale=1`/`user-scalable=no` in viewport meta (don't block zoom — WCAG 1.4.4) | ⬜ | — | — |

**Notes / open questions**
- `ResizableSplit` minimums (`minLeft 320 + minRight 280 + 6 = 606px`) exceed a 375–600px phone width → the
  split is degenerate on phones; confirm the learning view actually swaps to a stacked/drawer layout under `md`
  rather than rendering `ResizableSplit` (EC2).

---

### US-XCUT-03: Accessibility — focus management, ARIA, keyboard, screen-reader, contrast, reduced-motion
**As a** keyboard-only or screen-reader user, **I want** dialogs to trap+restore focus, every icon
control to have a name, full keyboard operability, and motion/contrast to respect my settings,
**so that** the platform is usable assistively and WCAG-compliant.
**Routes/code:** `packages/ui/components/{sheet,dialog}.tsx` · `components/account/upgrade-dialog.tsx` · `components/deck/DeckPlayer.tsx` · `components/layout/resizable-split.tsx` · `app/[locale]/(tenant)/tenant/students/page.tsx` · `components/tenant/activity-heatmap.tsx`
**Priority:** P1

**Acceptance criteria**
- AC1 — Given a modal/dialog/sheet opens, When it mounts, Then focus moves into it, Tab is trapped inside, Esc closes it, and on close focus returns to the trigger.
- AC2 — Every icon-only control exposes an accessible name (`aria-label`): deck prev/next/fullscreen, language `<select>`, topbar hamburger, dialog close.
- AC3 — Live regions announce dynamic changes: deck slide progress (`aria-live="polite"`); the `<select>` value change navigates.
- AC4 — `prefers-reduced-motion` suppresses non-essential animation (deck uses `motion-safe:` variants); color contrast meets AA in light **and** dark.

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Open `ContentSidebarSheet` (mobile drawer) and press **Esc** | Drawer closes | ⬜ | — | **suspect bug** — `packages/ui/sheet.tsx` has **no `keydown`/Esc handler**; only backdrop click closes |
| EC2 | Open the `Sheet` drawer — is focus trapped? | Tab should cycle within the drawer; focus should move to first focusable on open and **restore to the hamburger** on close | ⬜ | — | **suspect bug** — Sheet has **no focus trap, no initial-focus move, no focus restore**; Tab leaks to the page behind the backdrop |
| EC3 | `SheetContent` role/semantics | Panel should be `role="dialog"` + `aria-modal="true"` + `aria-labelledby` the `SheetTitle` | ⬜ | — | **suspect bug** — Sheet panel `<div>` has **no role/aria-modal/aria-labelledby**; SR users aren't told it's a dialog (title is `sr-only` but unlinked) |
| EC4 | Background scroll while Sheet/Dialog open | Body should be scroll-locked; background not scrollable behind the overlay | ⬜ | — | **suspect** — no `overflow:hidden` lock on `<body>` in sheet/dialog |
| EC5 | `UpgradeDialog` opens (any quota 402) — initial focus | Focus should move into the dialog (e.g. the close button or CTA); currently focus stays on the now-hidden trigger / body | ⬜ | — | **suspect** — `upgrade-dialog.tsx` sets `role="dialog" aria-modal` but does **not** move focus in, trap Tab, or handle Esc |
| EC6 | `UpgradeDialog` press **Esc** | Modal closes | ⬜ | — | **suspect bug** — no `onKeyDown`/Esc; only backdrop/X click closes |
| EC7 | `UpgradeDialog` `aria-labelledby` | Dialog labelled by its `<h2>` headline | ⬜ | — | **suspect** — `aria-modal` present but no `aria-labelledby`/`aria-label`; SR announces an unnamed dialog |
| EC8 | Deck root keyboard focus visibility | The `tabIndex={0}` carousel region has `outline-none` → **no visible focus ring** when tabbed to | ⬜ | — | **suspect a11y bug** — `DeckPlayer.tsx` root `outline-none` removes the keyboard focus indicator (WCAG 2.4.7) |
| EC9 | Deck arrow-key nav (←/→/Space/PageUp/PageDown/Home/End) | Advances/retreats/jumps slides; ignores keys when typing in input/textarea/contentEditable; only when deck focused or fullscreen | ⬜ | — | logic verified in code; needs live check |
| EC10 | Deck slide-progress announcement | `aria-live="polite"` `sr-only` reads "Slide N of M" (`deck.slideProgress`) on each change in the active locale | ⬜ | — | — |
| EC11 | Deck prev/next/fullscreen aria-labels localized | `t('prevSlide'/'nextSlide'/'enterFullscreen'/'exitFullscreen')` resolve per locale (keys exist in en.json L824–828) | ⬜ | — | — |
| EC12 | Deck tap-zone buttons not in tab order / SR | `aria-hidden` + `tabIndex={-1}` on the two `w-[18%]` overlay buttons → not announced, not focusable (correct) | ⬜ | — | code-verified ✅ |
| EC13 | `ResizableSplit` divider keyboard operability | `role="separator" aria-orientation="vertical" aria-label` present, but **not focusable and no key handlers** → keyboard users can't resize | ⬜ | — | **suspect a11y gap** — divider has no `tabIndex`/`aria-valuenow`/Arrow-key resize; pointer-only |
| EC14 | Students reset/deactivate buttons SR names | "Reset"/"Deactivate" come from text (`t('students.reset')` etc.) — fine; but the **deactivate toggle** gives no confirmation/announcement of the resulting state change | ⬜ | — | — |
| EC15 | Question-type / locale `<select>` labels | Language `<select>` has `aria-label={tCommon('language')}` ✅; verify any assessment question-type `<select>` also labelled | ⬜ | — | — |
| EC16 | `activity-heatmap` screen-reader access | 35 day-cells are **color-only** `<div>`s with a `title` but **no role/aria-label/text** → invisible to SR; active vs inactive conveyed by color alone (WCAG 1.4.1) | ⬜ | — | **suspect a11y bug** — `activity-heatmap.tsx` needs per-cell `aria-label` (date + active/inactive) and a list/grid role |
| EC17 | Reduced-motion: deck slide-in + fade-up + stagger | All deck animations use `motion-safe:` → suppressed under `prefers-reduced-motion`; verify no remaining unconditional `animate-*` | ⬜ | — | only 4 motion-safe refs found app-wide — audit other animated surfaces (spinners ok) |
| EC18 | Color contrast — `text-muted-foreground` on `bg-card` (light + dark) | Meets AA (4.5:1) for body, 3:1 for large; check the violet/marigold brand on white | ⬜ | — | — |
| EC19 | Color contrast — deck `text-white/85`, `text-white/40` index, gradient `bg-clip-text` stat numbers | Large display text ≥3:1 against hero/canvas; the `text-white/40` section index may fail | ⬜ | — | **suspect** — `text-white/40` on hero (Slide.tsx Section index) likely below 3:1 |
| EC20 | Form labels — students add dialog | Each `Input` has a matching `<Label htmlFor>` (name/email/username/password) ✅; required state for the identifier (email-or-username) is enforced in JS only, not announced | ⬜ | — | identifier-required error is `text-destructive <p>` with no `aria-live`/`aria-describedby` link to the inputs |
| EC21 | Skip-to-content link | First Tab on any page should expose a "skip to main content" link; landmark `<main>` present | ⬜ | — | **suspect gap** — grep found **no skip link** anywhere; keyboard users tab through full nav every page |
| EC22 | Heading order | Each page has a single `<h1>` and no skipped levels (deck slides use `<h2>`; students page `<h1>` then table `<th>`) | ⬜ | — | — |
| EC23 | Dialog close (X) only — students credentials view | After create, the credentials panel "Done" button closes; Esc should too (depends on `DialogContent` impl) | ⬜ | — | verify `packages/ui/dialog.tsx` Esc/trap behaviour (separate from Sheet) |
| EC24 | Toast/error announcements | `createError`, podcast/video generation errors surfaced as visible text — wrap in `role="alert"`/`aria-live` so SR users hear failures | ⬜ | — | — |
| EC25 | Focus restore after locale switch | Switcher does a full `window.location.assign` → page reloads, focus resets to top (acceptable, but unsaved focus context lost) | ⬜ | — | see US-XCUT-08 EC |

**Notes / open questions**
- The `Sheet` and `UpgradeDialog` are **hand-rolled** (not Radix) and lack the standard dialog a11y contract
  (focus trap + restore + Esc + role/labelledby + scroll-lock). The Radix-less `DialogContent` in
  `packages/ui/dialog.tsx` must be audited separately (EC23) — it may share the same gaps.

---

### US-XCUT-06: i18n — every user-facing surface localized (no raw keys, no English/Uzbek leaks, key symmetry)
**As an** Uzbek-first user, **I want** every screen — assessments, deck, students, video, slides,
billing, pricing — fully translated with no raw keys and no cross-locale leaks, **so that** the
product reads natively in uz/ru, not just en.
**Routes/code:** `apps/web/messages/{uz,en,ru}.json` · all pages/components using `useTranslations` · known debt: `components/learner/{game-quiz-player,leaderboard-table}.tsx` (F23 fixed), `/tenant/assessments` + `/learner/assessments` list (F24 logged), learner Settings, `/tenant/*` pages.
**Priority:** P1

**Acceptance criteria**
- AC1 — For every visible string on every surface, switching uz↔en↔ru changes the text; no raw key (`namespace.foo`) ever renders, no English literal leaks into uz/ru, no hardcoded Uzbek leaks into en/ru.
- AC2 — All three message files share the **same key set** (verified: 709 keys, 0 asymmetric) — so any missing translation is a *missing call site* or *hardcoded literal*, caught by manual surface sweep.

**Edge cases & negative paths**
| # | Surface · Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | **Tenant assessments admin** (`/tenant/assessments`) in uz/ru | No English leaks ("Assessments"/"Question banks"/"Publish"/"Mode"/"Written"/"Game"/"Max attempts"/"Assign"/"Results & leaderboard") | ⬜ | F24 | logged-not-fixed |
| EC2 | **Learner assessments list** (`/learner/assessments`) in uz/ru | "Quizzes & tasks"/"Play"/"Leaderboard"/"Attempts: N/M · Latest X% · N pts"/"Attempt limit reached"/"Hide leaderboard" localized | ⬜ | F24 | logged-not-fixed |
| EC3 | **Learner Settings** page in uz/ru | All labels translated (logged debt in F29) | ⬜ | F29 | partial |
| EC4 | **Deck/slides** chrome in uz/ru | `deck.*` (prevSlide/nextSlide/fullscreen/definition/recap/quickCheck/revealAnswer/slideProgress) localized; AI-generated slide *body* text is in the content language (not UI-localized — by design) | ⬜ | — | distinguish chrome (i18n) vs generated content (content-lang) |
| EC5 | Deck `Cover` "{n} min" suffix | `⏱ {estimatedMinutes} min` — the literal **"min"** is hardcoded in `Slide.tsx` (Cover) → leaks English into uz/ru | ⬜ | — | **suspect** — hardcoded "min" on cover slide |
| EC6 | Deck `Callout` fallback label | `slide.title ?? slide.variant` falls back to the **raw enum** ("tip"/"warning"/"note"/"key"/"example") when title absent → untranslated technical token shown | ⬜ | — | **suspect** — callout variant enum leaks as visible label |
| EC7 | **Students** page in uz/ru | nav/title/desc/seatUsage/add/columns/reset/deactivate/credentials all via `t('students.*')` ✅; verify seat ∞ and ICU plurals | ⬜ | — | — |
| EC8 | **Video** page (`/content/[id]/video`) chrome in uz/ru | Generate/retry/part labels, status badges localized | ⬜ | — | — |
| EC9 | **Billing** (`/tenant/billing`) in uz/ru | Plan/seat/status/usage strings localized; manual-activation note translated | ⬜ | — | — |
| EC10 | **Pricing** (`/pricing` + `UpgradeDialog`) in uz/ru | `pricing.*` + `account.billing.upgrade.*` localized; feature spec lines `tp(s.key, s.values)` resolve with interpolated values | ⬜ | — | — |
| EC11 | Raw-key audit (any locale) | No string matching `^[a-z]+\.[a-zA-Z.]+$` rendered (would indicate a missing key at a call site using a namespace that lacks it) | ⬜ | — | run live DOM scan per page |
| EC12 | Dynamic/runtime-built keys | Any `t(\`prefix.${var}\`)` (e.g. `tp(\`period.${p}\`)`, `tp(\`plans.pro\`)`) — verify every possible `var` value has a key in all 3 files | ⬜ | — | enumerate period/plan/variant unions |
| EC13 | Pluralized counts per locale | `sectionCount`/`quizCount`/`questionCount`/`episodes`/`quizAttempts` use ICU `plural` (F20 fixed: ru one/few/many, en one/other, uz invariant) | ✅ | F20 | aa42bf1 |
| EC14 | Interpolation argument leaks | Strings with `{used}/{limit}`, `{count}`, `{index}/{total}`, `{pct}`, `{total}` render the value, never the literal `{name}` token, in all 3 locales | ⬜ | — | — |
| EC15 | RTL / long-word overflow (ru) | Russian strings are ~30% longer — buttons/badges/nav don't clip or wrap-break layout (e.g. "Results & leaderboard" → "Результаты и таблица лидеров") | ⬜ | — | — |
| EC16 | Server-side error messages localized | API errors surfaced verbatim in the UI (`apiError(err, fallback)`) — the **fallback** is localized, but the API `message` may be English/server-locale; confirm `Accept-Language`/`locale` query is honoured server-side or the fallback is used | ⬜ | — | **suspect** — `students/page.tsx` shows raw `err.response.data.message` which may not be localized |
| EC17 | Marketing landing in uz/ru | `landing.*` fully translated, no English leak, layout holds (verified runs 1–2) | ✅ | — | — |
| EC18 | Theme toggle / locale labels | `theme.*` and `locales.*` (uz/en/ru native names) render in each locale | ⬜ | — | — |
| EC19 | Empty/loading/error state copy | "Loading…", empty-state, and error copy on every list (students/materials/assessments/progress) localized, not hardcoded | ⬜ | — | — |
| EC20 | Mixed-locale content vs chrome | A learner whose UI is `ru` viewing an Uzbek-language material: chrome ru, material body uz — no forced translation of content; summary/quiz generated in content language per language policy | ⬜ | — | — |

**Notes / open questions**
- Key symmetry is perfect (0 asymmetric), so the remaining risk is **(a)** hardcoded literals in newer components
  (deck "min"/callout-enum, EC5/EC6), **(b)** un-wired pages (assessments lists F24), and **(c)** server-supplied
  error strings (EC16).

---

### US-XCUT-07: i18n — number, currency, date, relative-time, and plural formatting correctness
**As an** Uzbek-first user, **I want** dates, numbers, money, relative times, and plurals to render
in **my app locale** (not the OS locale) and to be grammatically correct including Uzbek (where ICU
data is thin), **so that** timestamps and counts read natively.
**Routes/code:** `lib/format-relative-time.ts` · `lib/pricing.ts` (`formatUzs`) · `app/[locale]/(tenant)/tenant/students/page.tsx` · `app/[locale]/(tenant)/tenant/progress/page.tsx` · `components/tenant/activity-heatmap.tsx`
**Priority:** P1

**Acceptance criteria**
- AC1 — Relative timestamps render in the app locale: Uzbek manually ("3 hafta oldin"), en/ru via `Intl.RelativeTimeFormat` (F18 fixed).
- AC2 — Dates and numbers use the **app** locale, not the browser/OS locale.
- AC3 — Plural-sensitive counts use ICU plural rules per locale.

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Uzbek relative time, past | "3 hafta oldin", "hozirgina" at 0, never raw "-3 w" (F18) | ✅ | F18 | b4ba377 |
| EC2 | Uzbek relative time, **future** dates | `formatUzbek` future branch: "3 kundan keyin", "3 haftadan keyin", "5 soatdan keyin" — grammatically correct suffix concatenation | ⬜ | — | code looks correct; needs a future-dated record to verify live |
| EC3 | en/ru relative time | `Intl.RelativeTimeFormat` "3 weeks ago" / "3 недели назад" with `numeric:'auto'` ("yesterday"/"вчера") | ✅ | F18 | — |
| EC4 | Relative time at unit boundaries | 59min→"daqiqa", 60min→"1 soat"; 23h→"soat", 24h→"1 kun"; 6d→"kun", 7d→"1 hafta"; rounding via `Math.round` (e.g. 1.6 days → "2 kun") | ⬜ | — | verify rounding (e.g. 36h rounds to "2 kun" / "2 days") |
| EC5 | Relative time exactly "now" / sub-second | `absMs < 1000` → uz "hozirgina", en/ru `rtf.format(0,'second')` → "now"/"сейчас" | ⬜ | — | — |
| EC6 | Invalid / null date passed to `formatRelativeTime` | `new Date('garbage')` → `NaN` getTime → `diffMs` NaN → loop falls through to `'second'` branch → uz `formatUzbek(NaN,...)` → `Math.abs(NaN)=NaN`, `NaN===0` false → "NaN soniya oldin" | ⬜ | — | **suspect bug** — no NaN/invalid-date guard; could render "NaN soniya oldin" |
| EC7 | `toLocaleDateString()` **no locale arg** — students lastActive (×2) | Renders a valid date but in the **OS/browser locale**, not the app locale (uz user on an en-US OS sees US M/D/Y) | ⬜ | — | known XCUT-01·EC3 — extend: students page L172 + L240 |
| EC8 | `toLocaleDateString()` — tenant progress page L69 | Same OS-locale leak on the progress table's lastActivity | ⬜ | — | XCUT-01·EC3 surface |
| EC9 | `toLocaleDateString()` — heatmap cell `title` | Tooltip date in OS locale, not app locale; also only in `title` (not SR-accessible) | ⬜ | — | XCUT-01·EC3 + a11y (US-XCUT-03·EC16) |
| EC10 | `formatUzs` thousands grouping | `value.toLocaleString('en-US').replace(/,/g,' ')` → "119 000" (thin-space groups) — deterministic regardless of OS locale ✅; but `'en-US'` hardcoded means it won't honour a locale that groups differently | ⬜ | — | intentional (so'm style); fine but document |
| EC11 | `formatUzs` with non-integer / negative | Decimals/negatives from pricing config — verify config is integer so'm; negative never passed | ⬜ | — | — |
| EC12 | Currency suffix placement per locale | `{price} {currency} {perMonth}` — uz/ru word order for "so'm/oyiga" reads naturally (not "$/month" English order) | ⬜ | — | — |
| EC13 | ru plural — points / questions / sections | one (1 ball/вопрос), few (2–4 балла/вопроса), many (5–20 баллов/вопросов), other; 0 → many; 21→one; 22→few; 25→many | ⬜ | F20 | spot-check 1/2/5/21/22/25 |
| EC14 | en plural — "1 section" vs "N sections" | one/other correct; never "1 sections" (F20) | ✅ | F20 | aa42bf1 |
| EC15 | uz count strings | Uzbek nouns invariant after numerals — "4 bo'lim", "1 bo'lim" both singular form (no plural suffix) — correct by leaving uz unpluralized | ⬜ | F20 | — |
| EC16 | Seat usage "∞" limit | `t('students.seatUsage',{limit: seats.limit ?? '∞'})` — unlimited renders "used/∞" in all locales; `0` limit shows "N/0" not "∞" | ⬜ | — | — |
| EC17 | Percent formatting | `${Math.round(avgQuizScore)}%` — `%` glyph fine cross-locale; ru sometimes spaces "50 %" but app uses "50%" consistently | ⬜ | — | — |
| EC18 | Large numbers in leaderboard ("1510 ball") | Grouping for 1000+ scores; ru "1 510 баллов" vs uz "1510 ball" — verify consistency with `formatUzs`/plain | ⬜ | — | — |
| EC19 | Timezone of dates | `new Date(iso).toLocaleDateString()` uses the browser timezone — a late-night activity may show the wrong calendar day vs server (UTC) | ⬜ | — | **suspect** — TZ-boundary off-by-one on lastActive / heatmap day bucketing |
| EC20 | Heatmap day bucketing uses `toISOString().slice(0,10)` (UTC) but cells built from local `new Date()` | The active-day Set is keyed UTC while the grid is keyed off local "today" → near-midnight a day can mis-highlight | ⬜ | — | **suspect bug** — UTC `days` set vs local cell dates mismatch in `activity-heatmap.tsx` |

**Notes / open questions**
- ICU in Node/V8 lacks Uzbek `RelativeTimeFormat` data (F18) and is likely thin for `DateTimeFormat`/`PluralRules`
  for `uz` — any new `Intl`-based uz formatting must be checked manually.
- The `toLocaleDateString()` OS-locale leak appears on **4 surfaces** (students ×2, progress, heatmap) — a single
  shared `formatDate(date, appLocale)` helper would fix all four (and enable a Uzbek manual fallback if needed).

---

### US-XCUT-08: Locale switch, persistence, and API-locale sync
**As a** user, **I want** switching language to take effect everywhere (UI + server-generated text),
persist across sessions, and not corrupt my place, **so that** my language choice is honoured end-to-end.
**Routes/code:** `components/language-switcher.tsx` · `lib/locale-api.ts` · `lib/api.ts` (Accept-Language + `locale` query) · `components/locale-sync.tsx` · `i18n/{routing,navigation,request}.ts` · `middleware.ts` · `PATCH /auth/me {preferredLocale}`
**Priority:** P1

**Acceptance criteria**
- AC1 — Selecting a locale rewrites the URL prefix (`/uz/…`→`/en/…`), persists `preferredLocale` server-side (if logged in), and updates `Accept-Language`/`locale` on subsequent API calls.
- AC2 — Default locale is `uz`, `localePrefix:'always'` so every URL is prefixed.
- AC3 — The chosen locale survives reload and post-login redirect.

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Switch locale on the **same** locale | `if (next === locale) return` — no-op, no navigation/PATCH | ✅ | — | code-verified |
| EC2 | Switch locale mid-form (unsaved students add / chat draft) | `window.location.assign` does a **full page reload** → all unsaved client state (form inputs, chat composer, scroll, open dialogs) is **lost** | ⬜ | — | **suspect UX bug** — full nav discards in-flight state; task explicitly wants "locale switch mid-flow keeps state" |
| EC3 | Switch locale while logged out | No token → skips `PATCH /auth/me`; still navigates + `setApiLocale` | ✅ | — | code-verified (`if (token)`) |
| EC4 | `PATCH /auth/me` fails (offline/500) | `.catch(()=>{})` swallows error → UI still switches locale; server preference not saved (silent divergence next login) | ⬜ | — | acceptable but silent; consider toast |
| EC5 | Deep path with query/hash | `getPathname({href: pathname, locale: next})` preserves the path — verify query string (`?section=…&panel=chat`) and hash survive the locale rewrite | ⬜ | — | **suspect** — `usePathname()` may drop search params on the locale-rewrite |
| EC6 | API `locale` propagation after switch | `setApiLocale(next)` then subsequent `api` calls send the new `Accept-Language` + `locale` query → server-generated summaries/quizzes come back in the new language | ⬜ | — | verify the in-flight request uses new locale, not the pre-switch one |
| EC7 | `locale-sync` re-validates content | On locale change, `useLocaleContent`/`components/locale-sync.tsx` invalidate content queries so cached uz summaries refetch in en | ⬜ | — | — |
| EC8 | Stored `preferredLocale` vs URL locale conflict | User saved `ru` server-side but opens an `/uz/...` deep link → which wins? URL prefix should win for that request; preference applies on plain `/` entry | ⬜ | — | — |
| EC9 | Invalid locale in URL (`/de/dashboard`) | `middleware` `next-intl` matcher rejects/redirects to default `uz` (or 404) — no crash, no raw key explosion | ⬜ | — | — |
| EC10 | Locale persists across reload | After switch + F5, app stays in chosen locale (URL prefix carries it; no flash back to uz) | ⬜ | — | — |
| EC11 | Post-login redirect keeps locale | Login in `en` → `getPostLoginPath(role)` lands on `/en/...` not `/uz/...` (AUTH-01·EC11 holds) | ✅ | — | — |
| EC12 | Switcher keyboard/SR | `<select aria-label={language}>` operable by keyboard, announces options (native select) ✅; option labels are native locale names (`locales.uz/en/ru`) | ✅ | — | — |
| EC13 | Compact vs full switcher | `compact` variant (topbar) and full variant render same options; both wired to `handleChange` | ⬜ | — | — |
| EC14 | Rapid double-switch (uz→en→ru fast) | Each `window.location.assign` supersedes; only the last navigation lands; no race leaving Accept-Language out of sync with URL | ⬜ | — | — |
| EC15 | Switch during an in-flight generation (podcast/quiz job) | Job already enqueued in old locale finishes in old locale; new requests use new locale — partial bilingual output acceptable; verify no crash on the polling component after reload | ⬜ | — | — |
| EC16 | `dev` soft-switch webpack note | Comment says full nav avoids webpack chunk errors on soft locale switches in dev — confirm prod also uses full nav (it does, unconditionally) | ⬜ | — | — |

**Notes / open questions**
- The full-reload locale switch (EC2/EC5) is the main UX risk: it's robust (no chunk errors, clean API-locale reset)
  but **destroys unsaved state and may drop query params**. If "keep state across switch" is a requirement, the
  switcher needs a soft `router.replace` with `next-intl` navigation + query preservation instead of
  `window.location.assign`.

---


<!-- ===== AREA: xcut-sec ===== -->
## Area: Security, multi-tenant isolation matrix, resilience, jobs, quota, data-lifecycle

> New cross-cutting stories US-XCUT-04 … US-XCUT-11. All statuses start ⬜ (not yet tested).
> Derived from the real code, not imagination — anchors: `contentAccess.service.ts`,
> `middleware/{auth,tenant,quota,rate-limit,admin-rate-limit,error}.middleware.ts`,
> `services/subscription/{shared,user,tenant}.ts`, `services/usage.service.ts`,
> `services/queue.service.ts`, `jobs/*`, `routes/{content,tenant,chat,quiz,summary,learner}.routes.ts`,
> `controllers/{podcast,video,slides,chat,admin/content}.controller.ts`, `prisma/schema.prisma`,
> `apps/web/lib/{queryClient,authenticatedBlob}.ts`, `apps/api/src/index.ts`.

**Test-fixtures referenced below** (reuse, don't recreate): `qa-owner` (TENANT_OWNER, org A), a second
owner `qa-owner-B` (org B) — **create if missing** for cross-tenant tests, `teststudent1`/`teststudent2`
(LEARNERs in org A, ts1 assigned content C1, ts2 unassigned), `qa-individual` (INDIVIDUAL, B2C content
C0 with `tenantId=null`), `admin@talim.local` (ADMIN). Most ECs are **executed live with each actor's
real bearer token via crafted `fetch`** — the same technique already proven in US-LEARNER-01.

---

### US-XCUT-04: Multi-tenant isolation matrix — every content sub-resource + assessment endpoint
**As the** platform, **I want** every content and assessment access path to flow through
`contentAccess.service.ts` so that **no** crafted/guessed ID ever leaks another tenant's, another
student's, or a B2C user's data, **so that** isolation is provably airtight (S1).
**Routes/code:** `GET/POST/DELETE /content/:id/*`, `/tenant/content/:id/*`, `/chat/*`, `/quiz/*`,
`/summary/*`, `/learner/assessments/*`, `/tenant/assessments/*` · `assertCanAccessContent` /
`assertCanMutateContent` / `assertCanGenerate` / `assertTenantOwnsContent` / `buildContentListWhere` ·
`tenant.middleware.ts` (`blockIndividualContentForOwner`, `blockLearnerMutations`, `requireActiveLearner`).
**Priority:** P0 (S1 isolation)

**Acceptance criteria**
- AC1 — For every `:id` sub-resource, a content ID the caller may not access returns **404** ("Content not found"), never 200 and never a 403 that confirms existence — verified for cross-tenant, same-tenant-unassigned, and B2C(`tenantId=null`) crafted IDs.
- AC2 — Mutation/generation paths additionally enforce role: owners are pushed off `/content/*` (403 "Use /api/tenant/content…"), learners are blocked from any non-GET/non-`/progress`-PATCH (403).
- AC3 — Every sub-resource ID nested under a content (`episodeId`, `segment index`, `sectionId`, `quizId`, `bankId`, `assessmentId`, manim `jobId`) is re-scoped to its parent so a *valid-but-foreign* nested ID under an *accessible* parent still 404s.

**The matrix.** For EVERY row below, run the request **as each persona** with a crafted ID and assert the Expected. Personas: **(a) cross-tenant owner** (owner B → org A content), **(b) same-tenant unassigned learner** (ts2 → ts1's content), **(c) B2C user** (qa-individual → a tenant content id), **(d) owner → B2C content** (qa-owner → C0 `tenantId=null`), **(e) the rightful owner/learner** = control (200).

**Edge cases & negative paths**
| # | Scenario (endpoint × persona) | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | `GET /content/:id` — control (qa-individual own C0) | 200 | ⬜ | — | — |
| EC2 | `GET /content/:id` — owner B → org A id | 404 (owner B routed to tenant path; B2C guard `tenantId:null` excludes it) | ⬜ | — | — |
| EC3 | `GET /content/:id` — qa-individual → tenant content id | 404 (`tenantId:null` filter) | ⬜ | — | — |
| EC4 | `GET /content/:id/sections` — ts2 → ts1's content | 404 via `assertCanAccessContent` | ⬜ | — | — |
| EC5 | `GET /content/:id/sections/:sectionId` — foreign sectionId under own content | section not found / 404 (sectionId re-scoped to content) | ⬜ | — | **AC3** |
| EC6 | `GET /content/:id/file` — cross-tenant/unassigned | 404, file bytes never streamed | ⬜ | — | — |
| EC7 | `GET /content/:id/transcript` — unauthorized | 404 | ⬜ | — | — |
| EC8 | `GET /content/:id/summary` (`/summary/:contentId`) — unauthorized | 404 | ⬜ | — | — |
| EC9 | `POST /summary/:contentId` — learner | 403 (`blockLearnerMutations`, POST) | ⬜ | — | — |
| EC10 | `GET /content/:id/podcast` — unauthorized | 404 | ⬜ | — | — |
| EC11 | `GET /content/:id/podcast/episodes/:episodeId/audio` — **valid episode of a DIFFERENT content** but `:id` is one you CAN access | 404 — controller `findFirst {id:episodeId, podcast:{contentId}}` re-scopes episode to the content (verified in code: podcast.controller.ts:175) | ⬜ | — | **AC3 IDOR** |
| EC12 | `POST /content/:id/podcast/episodes/:episodeId/regenerate` — learner | 403 (`blockLearnerMutations`) | ⬜ | — | — |
| EC13 | `GET /content/:id/video` / `GET /content/:id/video/segments/:index/audio` — cross-tenant; also foreign segment index under own content | 404 (segment `.find(index)` on the content's own video — video.controller.ts:160-169) | ⬜ | — | **AC3 IDOR** |
| EC14 | `GET /content/:id/slides` — unauthorized | 404 | ⬜ | — | — |
| EC15 | `POST /content/:id/slides` / `POST /content/:id/video` / `POST /content/:id/podcast` — owner (qa-owner) on B2C path | 403 "Use /api/tenant/content…" (`blockIndividualContentForOwner` at router level) | ⬜ | — | — |
| EC16 | `GET /chat/content/:contentId/messages` — ts2 → ts1's content | 404 via `assertCanAccessContent` in controller (chat.controller.ts:104) | ⬜ | — | — |
| EC17 | `POST /chat/stream {contentId}` — unauthorized content | 404 before any token/AI spend (assertCanAccessContent at top) | ⬜ | — | — |
| EC18 | `GET /chat/sessions/:sessionId/messages` — **another user's sessionId** | empty/404 — session `findFirst {id, userId:self}` (chat.controller.ts:125) | ⬜ | — | **AC3 IDOR** |
| EC19 | `GET /chat/visual/manim/:jobId/asset` — **another user's jobId** | 404 "Asset not found" — message re-scoped to `session.userId=self` (chat.controller.ts:143-147) | ⬜ | — | **AC3 IDOR** |
| EC20 | `GET /quiz/:id` — quiz of unauthorized content | 404/403 (controller must assert content access for the quiz's content) | ⬜ | — | verify controller scopes via content |
| EC21 | `POST /quiz/:id/submit` — TENANT_LEARNER | **403** (`blockLearnerMutations` blocks POST) — learners take quizzes via `/learner/assessments`, NOT `/quiz`. Confirm this is intended product behaviour | ⬜ | — | design Q |
| EC22 | `POST /quiz/content/:contentId` (generate) — owner on B2C path | 403 (router `blockIndividualContentForOwner`? quiz.routes has only `blockLearnerMutations`) — **verify owners can't generate B2C quizzes**; if not blocked, content access still scopes to B2C `tenantId:null` → 404 | ⬜ | — | verify |
| EC23 | `GET /tenant/content/:id` — owner B → org A id | 404 (`requireTenantOwner` + `assertCanAccessContent` scopes to `user.tenantId`) | ⬜ | — | **S1** |
| EC24 | `DELETE /tenant/content/:id` — owner B → org A id | 404, content untouched | ⬜ | — | **S1** |
| EC25 | `GET /tenant/content/:id/file` — owner B → org A | 404 | ⬜ | — | — |
| EC26 | `GET /tenant/content/:id/...` (every sub-resource: sections/transcript/podcast/video/slides/progress) — owner B → org A | 404 each | ⬜ | — | — |
| EC27 | `GET /tenant/students/:id/progress` — owner B → org A studentId | 404/403 (student must belong to caller's tenant — verify controller scopes by tenantId) | ⬜ | — | **S1 IDOR** |
| EC28 | `PATCH /tenant/students/:id` / `DELETE` / `POST /reset-password` — owner B → org A studentId | 404/403, no mutation | ⬜ | — | **S1 IDOR** |
| EC29 | `POST /tenant/assignments {contentId, learnerId}` — owner B assigns org A content to org A learner | 404/403 (both content + learner must be in caller's tenant) | ⬜ | — | **S1 IDOR** |
| EC30 | `GET /tenant/assessments/:assessmentId/results` / `/leaderboard` — owner B → org A assessmentId | 404/403 (assessment scoped to `tenantId`) | ⬜ | — | **S1 IDOR** |
| EC31 | `POST /tenant/assessments/:assessmentId/assign` — owner B → org A assessmentId | 404/403 | ⬜ | — | — |
| EC32 | `GET /tenant/question-banks/:bankId/questions` / `POST /:bankId/generate` — owner B → org A bankId | 404/403 (bank scoped to tenant) | ⬜ | — | **S1 IDOR** |
| EC33 | `PATCH /tenant/question-banks/:bankId/questions/:questionId` — foreign questionId under own bank | 404 (question re-scoped to bank) | ⬜ | — | **AC3** |
| EC34 | `GET /learner/assessments/:assessmentId/leaderboard` — ts1 → an assessment NOT assigned to ts1 | 404/403 (assessment must be assigned to this learner in active tenant) | ⬜ | — | **S1 IDOR** |
| EC35 | `POST /learner/assessments/:assessmentId/attempts` — ts1 submitting to a foreign/unassigned assessment | 404/403, no attempt row written | ⬜ | — | **S1** |
| EC36 | `POST /learner/assessments/:assessmentId/attempts` — **deactivated** ts1 (active=false) | 403 "Student account is deactivated" (`requireActiveLearner`) | ⬜ | — | — |
| EC37 | `GET /content` list — owner | 403 "Use /api/tenant/content…" (`buildContentListWhere` throws for owner) | ⬜ | — | — |
| EC38 | `GET /content` list — unassigned/deactivated learner | `{contents:[]}` empty (no active membership ⇒ `{id:{in:[]}}`) | ⬜ | — | — |
| EC39 | `GET /content` list — learner who SWITCHED tutors (former assignments survive) | only CURRENT tenant's assigned content (tenant-scoped `getAssignedContentIds`) | ⬜ | — | — |
| EC40 | XSS payload `<img src=x onerror=alert(1)>` as content title / chat message / student name | stored escaped; rendered inert in all 3 web apps (react auto-escapes); no execution | ⬜ | — | — |
| EC41 | SQL-ish payload `'; DROP TABLE users;--` in search (`?search=`) / login email | parameterised by Prisma; no error, treated as literal (admin content search uses `contains` mode insensitive) | ⬜ | — | — |
| EC42 | Garbage / non-cuid `:id` (e.g. `../../etc/passwd`, very long, unicode) on any `:id` route | 404 (no Prisma crash, no path traversal into storage) | ⬜ | — | — |
| EC43 | `assertCanAccessContent` with `requireReady:true` on a PROCESSING/FAILED own content (sub-resource generate) | 404 "Content not found or not ready" (not a confusing 500) | ⬜ | — | — |

**Notes / open questions**
- The central guard is consistently applied; the per-row work is proving each **sub-resource controller** actually calls it (the streaming/IDOR ones EC11/13/18/19 are code-verified to re-scope nested IDs — those are the highest-value rows).
- EC27–EC32 depend on tenant student/assessment controllers scoping by `req.user.tenantId`; these are **not** routed through `contentAccess.service.ts` (that guard is content-only) — confirm each does its own tenant scoping (a likely soft spot for IDOR).

---

### US-XCUT-09: Auth boundary — JWT tamper/forge/expire, deleted/deactivated user, legacy token, role escalation
**As the** platform, **I want** the JWT/auth layer to reject every forged, stale, or privilege-mismatched token, **so that** a stolen/old/crafted token can't impersonate or escalate.
**Routes/code:** `middleware/auth.middleware.ts` (`authMiddleware`, `requireRole`), `resolveTenantIdForUser`, web `lib/api.ts` 401 interceptor, `store/useAuthStore.ts` (persist `talim-auth`).
**Priority:** P0 (S1)

**Acceptance criteria**
- AC1 — No `Authorization` header / non-`Bearer` scheme ⇒ 401 "Unauthorized".
- AC2 — Tampered signature, wrong-secret forge, malformed, or expired token ⇒ 401 "Invalid or expired token" (generic; no detail leak).
- AC3 — The embedded `role` is authoritative for routing but **role mismatch with reality** must not grant access the DB role wouldn't (content/tenant guards re-derive from DB membership/ownership).

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | No header | 401 "Unauthorized" | ⬜ | — | — |
| EC2 | `Authorization: <token>` (missing `Bearer `) | 401 (startsWith check) | ⬜ | — | — |
| EC3 | `Bearer ` + empty/garbage | 401 "Invalid or expired token" | ⬜ | — | — |
| EC4 | Token signed with a DIFFERENT secret (forge) | 401 (verify fails) | ⬜ | — | — |
| EC5 | Valid token with `exp` in the past | 401 "Invalid or expired token" | ⬜ | — | — |
| EC6 | Tamper payload `role:"ADMIN"` but re-sign impossible (no secret) | 401 — can't forge without `JWT_SECRET` (min 32 chars) | ⬜ | — | — |
| EC7 | **Deleted user**, still-valid NON-legacy token → `GET /content` | empty list (cascade removed content) — but **no 500** | ⬜ | — | — |
| EC8 | **Deleted user**, valid token → `GET /billing/me` or `GET /usage/me` | **SUSPECTED BUG**: `getSubscriptionForUser` auto-creates a Subscription for a non-existent userId → FK violation → 500 (should be 401). See suspectedBugs. | ⬜ | — | — |
| EC9 | Deleted user → `GET /auth/me` | 401/404 → web 401 interceptor logs out + redirects `/login` | ⬜ | — | — |
| EC10 | **Deactivated** learner, valid token → `/learner/*` | 403 "Student account is deactivated" (`requireActiveLearner` re-checks DB) | ⬜ | — | — |
| EC11 | Deactivated learner, valid token → `GET /content/:id` (assigned) | 404 (guard re-checks active membership, not JWT) | ⬜ | — | — |
| EC12 | Legacy token (no `role`) for a user whose role CHANGED since issue | backfills CURRENT role from DB (auth.middleware:37-44) | ⬜ | — | — |
| EC13 | Legacy token for a DELETED user | 401 "Unauthorized" (user load returns null) | ⬜ | — | — |
| EC14 | Owner token missing `tenantId` (legacy) | `resolveTenantIdForUser` backfills owner's tenant; if owner has no tenant ⇒ tenantId stays undefined ⇒ `requireTenantOwner` 403 | ⬜ | — | — |
| EC15 | Learner token with `tenantId` of a tenant they were REMOVED from | `resolveTenantIdForUser` returns the ACTIVE membership's tenant (or null) — stale tenantId in token doesn't grant access; guards re-check | ⬜ | — | — |
| EC16 | INDIVIDUAL token → `/tenant/*` | 403 (`requireTenantOwner`) | ⬜ | — | — |
| EC17 | INDIVIDUAL token → `/admin/*` | 403 (`requireRole('ADMIN')`) | ⬜ | — | — |
| EC18 | Owner token → `/admin/*` | 403 | ⬜ | — | — |
| EC19 | Web: 401 from any call → store cleared, hard-redirect to `/{locale}/login`, locale preserved | ⬜ | — | — |
| EC20 | Token in `localStorage` (`talim-auth`) survives reload; logout clears it; back-button after logout can't re-enter (guard bounces) | ⬜ | — | — |
| EC21 | Very long token (100k chars) | 401, no crash/DoS | ⬜ | — | — |
| EC22 | No token-revocation list exists — a token stays valid until `exp` even after logout/password-change | **document**: known design (no server session); password reset should arguably rotate. Log as open question | ⬜ | — | — |

---

### US-XCUT-10: Network boundary — CORS allow-list, rate limits, payload caps, helmet
**As the** platform, **I want** CORS, rate-limiting, and body/upload caps correct, **so that** unknown origins are blocked, brute-force/abuse is bounded, and oversized payloads can't DoS.
**Routes/code:** `index.ts` (helmet, CORS, `express.json({limit:'20mb'})`), `rate-limit.middleware.ts` (`loginRateLimit` 30/15m skip-success, `authWriteRateLimit` 40/15m, `reparseRateLimit` 8/60m), `admin-rate-limit.middleware.ts` (120/60s in-memory), `upload.middleware.ts` (50 MB / PDF+pptx).
**Priority:** P1

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Request with `Origin: https://evil.com` | CORS rejected (`callback(new Error(...))`) → browser blocks; server logs | ⬜ | — | — |
| EC2 | Allowed origin (`localhost:3000`/`3001` in dev, `CORS_ORIGIN` list in prod) | allowed, `credentials:true` | ⬜ | — | — |
| EC3 | **No `Origin` header** (curl, mobile, server-to-server) | allowed (`!origin` ⇒ true) — document: CORS does not protect against non-browser clients (by design; auth still required) | ⬜ | — | — |
| EC4 | `CORS_ORIGIN` with trailing spaces / empty segments | trimmed + filtered (Set build) — no accidental `''` allow | ⬜ | — | — |
| EC5 | 31 failed logins in 15 min from one IP | 31st → 429 "Too many failed attempts" (only FAILED count — `skipSuccessfulRequests`) | ⬜ | — | needs 30 attempts (deferred like AUTH-01·EC8) |
| EC6 | A whole NATed classroom logging in SUCCESSFULLY past 30 | all succeed (successful logins skipped) — the documented design intent | ⬜ | — | — |
| EC7 | 41 register/password-change/tutor-request/join-class in 15 min | 41st → 429 (`authWriteRateLimit`) | ⬜ | — | — |
| EC8 | 9 re-read (OCR) triggers in 60 min | 9th → 429 "Too many re-read requests" (`reparseRateLimit` 8/hr) — bounds paid vision spend | ⬜ | — | — |
| EC9 | 121 `/admin/*` calls in 60s by one admin | 121st → 429 "Too many admin requests"; a SECOND admin unaffected (keyed by userId) | ⬜ | — | — |
| EC10 | adminRateLimit across 2 API instances / restart | limit is **per-process, in-memory** — resets on restart, not shared (documented). Log as scaling caveat | ⬜ | — | — |
| EC11 | `POST` JSON body > 20 MB | 413 (express.json limit) — not a 500 | ⬜ | — | — |
| EC12 | Upload file > 50 MB (multer) | 413 `FILE_TOO_LARGE` "maximum upload size is 50 MB" (`MulterError LIMIT_FILE_SIZE` → error.middleware:106) | ⬜ | — | — |
| EC13 | Upload wrong mimetype (.exe/.png/.docx) | 400 "Only PDF and slide files are allowed" | ⬜ | — | — |
| EC14 | Upload with unexpected field name / too many parts | 400 "Upload error: …" `UPLOAD_ERROR` (generic MulterError branch) | ⬜ | — | — |
| EC15 | `trust proxy = 1` — client IP comes from first `X-Forwarded-For` hop | rate limiter keys on real client IP behind nginx (spoofing beyond 1 hop ignored) | ⬜ | — | — |
| EC16 | helmet headers present but CSP/CORP/COEP disabled (asset streaming) | `X-Frame-Options`/`X-Content-Type-Options` etc set; cross-origin audio/pdf still streamable to web origin | ⬜ | — | — |
| EC17 | OPTIONS preflight from allowed vs blocked origin | allowed → 204 with CORS headers; blocked → no allow headers | ⬜ | — | — |

---

### US-XCUT-05: Resilience — SSR/hydration, stale react-query cache, slow/offline network, double-submit, concurrency
**As a** user on a flaky network / two tabs / two devices, **I want** the web app to stay correct, **so that** I never see stale data, hangs, duplicate writes, or hydration crashes.
**Routes/code:** `apps/web/lib/queryClient.ts` (`staleTime 30s`, `retry 1`), `lib/authenticatedBlob.ts` (stall-timeout streamed blob), hooks invalidation rules (CLAUDE.md §4), `RoleGuard`/`session-sync`, shells.
**Priority:** P1

**Acceptance criteria**
- AC1 — Auth-dependent pages render a "Loading…" placeholder until Zustand `persist` hydrates (no SSR/CSR text mismatch / no hydration error in console).
- AC2 — After any mutation, the affected query keys are invalidated so lists/progress/leaderboards never show stale data (CLAUDE.md invalidation contract).
- AC3 — A stalled media download is aborted by `stallTimeoutMs` (timer resets per chunk) while a slow-but-progressing one is not.

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Hard reload of `/learner/dashboard` before hydration | "Loading…" placeholder, then content; **no** hydration mismatch error (RoleGuard `useAuthHydrated`) | ⬜ | — | — |
| EC2 | Direct deep-link while logged out | RoleGuard → `/login`; after login returns to deep link (AUTH-01·AC2) | ⬜ | — | — |
| EC3 | Stale cache: delete a material in tab A, switch to tab B's open materials list | B refetches on focus / invalidation; deleted item gone within `staleTime`; no ghost row | ⬜ | — | — |
| EC4 | Assign content to a student → student's `/learner/dashboard` open in another tab | owner-side invalidates `['tenant','assignments',id]`,`['tenant','students']`,`['contents']`; learner sees it after refetch (not instantly — cross-user) | ⬜ | — | — |
| EC5 | Submit a GAME attempt → leaderboard open elsewhere | `useSubmitLearnerAssessment` invalidates learner list + that assessment leaderboard; rank updates | ⬜ | — | — |
| EC6 | Slow network (throttle 3G) loading podcast episode audio | shows loading; `fetchAuthenticatedBlob` streams; progress bar advances; no premature abort | ⬜ | — | — |
| EC7 | **Stalled** connection mid-audio (bytes stop) with `stallTimeoutMs` set | aborts after the window; surfaces a transient `BlobFetchError` (status undefined) ≠ a permanent 4xx | ⬜ | — | — |
| EC8 | Permanent 404 on a blob (deleted episode) | `BlobFetchError(status:404)` — caller treats as permanent, no infinite retry | ⬜ | — | — |
| EC9 | Offline entirely | queries fail gracefully (retry:1 then error UI), no white screen; reconnect refetches | ⬜ | — | — |
| EC10 | Component unmount mid-blob-fetch | external `signal` aborts the in-flight transfer; no setState-after-unmount warning | ⬜ | — | — |
| EC11 | Double-click "Delete material" | single DELETE (button disabled while pending) — verify (US-OWNER-12·EC7) | ⬜ | — | — |
| EC12 | Double-click "Generate podcast"/"Create quiz" | single job enqueued (mutation `isPending` guards button) — verify no duplicate Podcast/Quiz rows | ⬜ | — | — |
| EC13 | Double-submit a quiz/assessment (rapid Enter) | one attempt recorded; second is rejected or idempotent — verify | ⬜ | — | — |
| EC14 | Two owners edit org settings concurrently (last-write-wins) | no crash; last PATCH wins; the other's stale view refetches | ⬜ | — | — |
| EC15 | Owner assigns + another owner unassigns same content/student concurrently | consistent final state; unique `(contentId,learnerId)` prevents dup assignment rows | ⬜ | — | — |
| EC16 | `retry:1` masks a transient 500 then succeeds | user sees brief load, then data (no error flash) | ⬜ | — | — |
| EC17 | `staleTime 30s`: a value changed server-side <30s ago not refetched on remount | acceptable per config; mutations must invalidate to force-refresh (don't rely on staleTime for fresh-after-write) | ⬜ | — | — |
| EC18 | Token expires mid-session while polling (podcast generation 3s poll) | next poll 401 → interceptor logs out → `/login` (no infinite 401 loop) | ⬜ | — | — |
| EC19 | Podcast page re-renders constantly during generation poll | audio blob URL stays STABLE across poll cycles, no `blob: ERR_FILE_NOT_FOUND` spam (F21 regression guard) | ⬜ | — | — |
| EC20 | Optimistic UI on a mutation that then 402/403s | UI rolls back; error surfaced (no phantom item left — cf. F31 empty assistant bubble) | ⬜ | — | — |

---

### US-XCUT-11: Background jobs — lifecycle, failure, retry, orphans, partial generation, Redis down
**As the** platform, **I want** Bull jobs (process-content / generate-quiz / generate-podcast / generate-video / render-manim) to handle every failure cleanly, **so that** content never gets stuck, no orphan job mutates deleted content, and partial output degrades gracefully.
**Routes/code:** `services/queue.service.ts` (`cancelContentJobs`), `jobs/*`, admin `POST /admin/contents/:id/retry-job` (`retryContentJob`), `POST /content/:id/retry` + `POST /tenant/content/:id/retry`.
**Priority:** P1

**Acceptance criteria**
- AC1 — A failed ingest sets `Content.status=FAILED` (via `updateMany`, so a concurrently-deleted content doesn't mask the error); the web shows the FAILED screen with retry/delete (non-learner).
- AC2 — Deleting content removes its pending/delayed jobs across content/quiz/podcast/video queues; an ACTIVE (locked) job is skipped (not an error) and its writes to now-deleted content are harmless.
- AC3 — Partial media generation (some episodes/segments fail TTS) → status READY if ≥1 asset produced, FAILED if zero.

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Upload → process-content happy path | PROCESSING → extract → chunk → embed → sections → READY; slide decks pre-generated best-effort | ⬜ | — | — |
| EC2 | PDF extract throws (corrupt/encrypted PDF) | caught → `updateMany status=FAILED` → job 'failed' logs; FAILED screen with retry | ⬜ | — | — |
| EC3 | YouTube transcript unavailable | FAILED, clear status; retry possible | ⬜ | — | — |
| EC4 | `No content source` (no url, no storagePath) | throws → FAILED (not a silent stuck PENDING) | ⬜ | — | — |
| EC5 | Generation quota hit mid-ingest (`chunks>3` → `assertQuota('GENERATION')` throws at job:70) | content → FAILED even though UPLOAD already consumed — verify the FAILED screen explains; **note**: upload quota spent on a failed READY | ⬜ | — | — |
| EC6 | Delete content WHILE process-content is ACTIVE (locked) | `cancelContentJobs` skips the locked job (`.catch(()=>undefined)`); job later writes to deleted content → `updateMany` no-ops; no P2025 crash | ⬜ | — | — |
| EC7 | Delete content with WAITING quiz/podcast/video jobs | those jobs removed (no orphan run); no generated rows for the gone content | ⬜ | — | — |
| EC8 | render-manim job not cancelled on content delete | manim queue is NOT in `CONTENT_QUEUES` (it's chat-scoped by jobId/messageId) — confirm a manim job for a deleted chat message degrades (asset orphaned but inaccessible via IDOR guard) | ⬜ | — | — |
| EC9 | Podcast: all episodes' TTS fail (`audioCount=0`) | podcast status FAILED | ⬜ | — | — |
| EC10 | Podcast: some episodes succeed, some TTS fail | status READY (`audioCount>0`); failed episodes have `audioPath:null` (per-episode loading/retry UI) | ⬜ | — | — |
| EC11 | Podcast **per-episode regenerate** where script-gen throws (AI/quota error) | **SUSPECTED BUG**: queue `'failed'` handler (generatePodcast.job:219-228) sets the WHOLE podcast `status=FAILED` even though other episodes still have audio — the in-handler `withAudio` recompute (job:97-103) only runs if execution reaches the TTS try/catch; a throw in `generateChatCompletion` skips it. See suspectedBugs. | ⬜ | — | — |
| EC12 | Podcast content has 0 sections | synthesizes a single "full" episode from max chunk index (job:117-135) | ⬜ | — | — |
| EC13 | generate-quiz job fails | quiz marked failed/empty; web shows error, retry available; no half-written QuizQuestions visible | ⬜ | — | — |
| EC14 | generate-video partial (some segments no audio) | `hasAudio` flag per segment; player tolerates missing-audio segments | ⬜ | — | — |
| EC15 | Admin `POST /admin/contents/:id/retry-job` on a non-FAILED content | 400 "Only failed content can be retried" | ⬜ | — | — |
| EC16 | Admin retry-job on FAILED content | status→PENDING, re-enqueued; eventually READY | ⬜ | — | — |
| EC17 | Admin retry-job spam (re-add while one queued) | verify no duplicate concurrent process jobs corrupt sections/chunks (job regenerates sections + drops stale decks each run) | ⬜ | — | — |
| EC18 | **Redis down** at boot | job processors register but queue connection errors; API still serves reads — verify a clear error, not a crash loop | ⬜ | — | — |
| EC19 | Redis down at upload time | upload row created PENDING, `contentQueue.add` fails → content stuck PENDING forever — verify behaviour/UX (is there a stuck-job recovery?) | ⬜ | — | — |
| EC20 | Job retried by Bull's own retry (transient) | idempotent: re-running process-content regenerates sections, deletes stale decks, re-embeds — no duplicate Chunk rows accumulate (verify `storeChunksWithEmbeddings` replaces) | ⬜ | — | — |
| EC21 | Stuck content (PROCESSING for >N min, worker died) | no automatic timeout exists — content stays PROCESSING; web shows processing screen indefinitely. Log as gap (no stuck-job reaper) | ⬜ | — | — |
| EC22 | recordUsage write fails (DB blip) | swallowed + logged (`usage.service:47`) — never fails the user action, but usage under-counts (quota under-charge). Log as acceptable trade-off | ⬜ | — | — |

---

### US-XCUT-12: Quota matrix — every feature × plan × role → correct 402/413 contract + role-aware upgrade
**As the** platform, **I want** every quota-gated feature to return the exact error contract with the right `feature`, `used`, `limit`, and **role-aware** `upgradePlanCode`, **so that** the web can show the correct upgrade/inline message.
**Routes/code:** `quota.middleware.ts` (`enforceQuota`), `subscription/{user,tenant,shared}.ts` (`assertQuota`/`assertTenantQuota`), `error.middleware.ts` (`QuotaExceededError`→402, `PlanFileLimitError`→413, `FILE_TOO_LARGE`→413), `config/usage-pricing.ts`.
**Priority:** P0 (billing boundary)

**Acceptance criteria**
- AC1 — 402 body = `{message, code:'QUOTA_EXCEEDED', feature, used, limit, upgradePlanCode}`; 413 plan-cap = `{code:'PLAN_FILE_LIMIT', maxPages, maxFileSizeMb, pages, fileSizeMb, upgradePlanCode}`; 413 hard cap = `{code:'FILE_TOO_LARGE', maxFileSizeMb}` (no upgradePlanCode — upgrading won't lift it).
- AC2 — `upgradePlanCode`: INDIVIDUAL FREE→`INDIVIDUAL_PRO`; INDIVIDUAL non-FREE→`null`; tenant `TENANT_STARTER`→`TENANT_GROWTH`; tenant top/other→`null`. ADMIN role bypasses all quotas.
- AC3 — `limit==null` ⇒ unlimited (no 402); per-day features reset at local midnight (`dayRange`); tenant UPLOAD is **lifetime total** (`maxContentItems`), not per-day; STUDENT uses `tenant.seatLimit ?? maxStudents`.

**Feature × role matrix** (each cell: set the relevant plan limit low/0, trigger, assert contract)
| # | Feature · role · trigger | Expected | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | UPLOAD · INDIVIDUAL FREE · upload past `maxUploadsPerDay` | 402 feature `UPLOAD`, `upgradePlanCode:INDIVIDUAL_PRO` | ⬜ | — | — |
| EC2 | UPLOAD · INDIVIDUAL PRO (`maxUploadsPerDay:null`) | unlimited, no 402 | ⬜ | — | — |
| EC3 | UPLOAD · TENANT_OWNER · past `maxContentItems` (LIFETIME) | 402 `UPLOAD` (counts ALL tenant content, not today's) | ⬜ | — | — |
| EC4 | GENERATION · INDIVIDUAL FREE · quiz/summary/section/slideshow gen past `maxGenerationsPerDay` | 402 `GENERATION` (sum of QUIZ_GEN+SECTION_GEN+SUMMARY_GEN+SLIDESHOW_GEN counts) | ⬜ | — | — |
| EC5 | GENERATION · TENANT_OWNER · question-bank `POST /generate` past day limit | 402 `GENERATION`, `upgradePlanCode` per tenant plan | ⬜ | — | — |
| EC6 | VIDEO · INDIVIDUAL FREE · create video past `maxVideosPerDay` | 402 `VIDEO`; **note** B2C video controller checks GENERATION *before* VIDEO (video.controller:122 then 126) → headline may read "generation" (matches US-IND-08·EC4) | ⬜ | — | — |
| EC7 | PODCAST · INDIVIDUAL FREE · create podcast past `maxPodcastsPerDay` | 402 `PODCAST` | ⬜ | — | — |
| EC8 | PODCAST · INDIVIDUAL FREE · **per-episode regenerate** after 1 podcast exists | 402 `PODCAST` — `getPodcastCount` counts the existing Podcast row (1≥1), so FREE can't regenerate at all (matches F30 "Podkast cheklovi tugadi (1/1)"). Confirm intended | ⬜ | — | — |
| EC9 | TUTOR_MESSAGE · INDIVIDUAL FREE · chat past `maxTutorMessagesPerDay` | 402 `TUTOR_MESSAGE`; empty assistant placeholder removed on error (F31) | ⬜ | — | — |
| EC10 | TUTOR_MESSAGE · **TENANT_LEARNER** · chat | **SUSPECTED BUG**: assertQuota only blocks UPLOAD/GEN/VIDEO/PODCAST for learners; TUTOR_MESSAGE falls through to `getSubscriptionForUser(learnerId)` which **auto-creates a personal FREE Subscription** and gates by FREE plan — NOT the tenant plan. A student in a paid org is throttled by a phantom personal FREE cap, and a Subscription row is silently created per student. See suspectedBugs. | ⬜ | — | — |
| EC11 | TUTOR_MESSAGE · TENANT_OWNER · chat past tenant `maxTutorMessagesPerDay` | 402 (tenant-scoped count of `TUTOR_CHAT`) | ⬜ | — | — |
| EC12 | STUDENT · TENANT_OWNER · add student / learner self-enrol past `seatLimit` | 402 `STUDENT` "Seat limit reached" (NOT "Upload limit" — F26); `tenant.seatLimit` overrides plan `maxStudents` | ⬜ | — | — |
| EC13 | STUDENT · seatLimit=0 | every add → 402 immediately | ⬜ | — | — |
| EC14 | STUDENT · reactivate an inactive membership at the cap | 402 (reactivation re-checks quota — AUTH-03·EC7) | ⬜ | — | — |
| EC15 | Any quota · ADMIN role | bypassed (`assertQuota` returns early for role ADMIN) | ⬜ | — | — |
| EC16 | Learner direct `POST /content/upload` or `/youtube` (UPLOAD/GENERATION) | 403 "Learners cannot upload or generate content" — but learner is ALSO blocked earlier by `blockLearnerMutations`; the assertQuota learner branch is defence-in-depth | ⬜ | — | — |
| EC17 | TENANT_OWNER whose tenant subscription is **not ACTIVE** (admin set PAST_DUE/CANCELED) · any tenant quota check | 402 "Tenant subscription required. Contact admin to activate your organization." (`requireActiveTenantSubscription`) — blocks add-student, upload, generate | ⬜ | — | — |
| EC18 | TENANT_OWNER whose tenant sub plan is INDIVIDUAL-kind (misconfig) | 402 same message (`planKind !== 'TENANT'` guard) | ⬜ | — | — |
| EC19 | INDIVIDUAL with **CANCELED** subscription | effective limits = FREE plan limits; `upgradePlanCode:INDIVIDUAL_PRO` (resolveEffectivePlanCode→FREE) | ⬜ | — | — |
| EC20 | INDIVIDUAL with **PAST_DUE** subscription (paid plan) | **keeps paid-plan limits** — only CANCELED downgrades to FREE (user.ts:38). Confirm intended for manual billing; PAST_DUE individual not throttled | ⬜ | — | — |
| EC21 | PLAN_FILE_LIMIT · FREE · 30 MB file vs FREE 25 MB cap | 413 `PLAN_FILE_LIMIT`, modal "too big for the Free plan" + page/MB caps (US-IND-08·EC6) | ⬜ | — | — |
| EC22 | PLAN_FILE_LIMIT · file with > `maxPagesPerFile` pages | 413 `PLAN_FILE_LIMIT` with `pages`/`maxPages` populated | ⬜ | — | — |
| EC23 | FILE_TOO_LARGE · >50 MB (multer hard cap) | 413 `FILE_TOO_LARGE`, inline message, **no** modal/upgradePlanCode (US-IND-08·EC7) | ⬜ | — | — |
| EC24 | Boundary used == limit-1 (one slot left) | succeeds; the NEXT call (used==limit) → 402 (`>=` comparison) | ⬜ | — | — |
| EC25 | Quota reset at local midnight | a 402 at 23:59 clears at 00:00 (dayRange = local-midnight→now); verify TZ (server local time) doesn't double-count across DST | ⬜ | — | — |
| EC26 | Concurrent generations racing the same last slot (two tabs) | possible OVER-grant: `assertQuota` reads count then handler records usage — no atomic reserve, so two simultaneous calls can both pass at used==limit-1. Log as known race (low sev; per-day buckets) | ⬜ | — | — |
| EC27 | Web role-awareness: tenant-owner / already-Pro 402 | inline message, NOT the individual upgrade modal (`useLimitErrorHandler` role branch; `upgradePlanCode:null`) | ⬜ | — | — |
| EC28 | `used`/`limit` numbers shown in the message are correct + ICU-pluralized per locale | "1/1", "(used/limit)" rendered, uz/en/ru correct | ⬜ | — | — |

**Notes / open questions**
- `QuotaFeature` (UPLOAD/GENERATION/TUTOR_MESSAGE/VIDEO/PODCAST/STUDENT) is the **quota** vocabulary; the schema `UsageFeature` enum (EMBED/TUTOR_CHAT/QUIZ_GEN/QUESTION_DRAFT/PODCAST_GEN/SECTION_GEN/SUMMARY_GEN/SLIDESHOW_GEN/VIDEO_GEN/TRANSCRIBE/PDF_PARSE/TENANT_ASSISTANT) is the **metering** vocabulary. GENERATION quota = sum of {QUIZ_GEN,SECTION_GEN,SUMMARY_GEN,SLIDESHOW_GEN}; EMBED/TRANSCRIBE/PDF_PARSE/QUESTION_DRAFT are metered but NOT quota-gated as "generation". Verify QUESTION_DRAFT (bank generate) is counted under the GENERATION cap (route uses `enforceQuota('GENERATION')` but the job records `QUESTION_DRAFT`, which is NOT in GENERATION_FEATURES → the bank-generate consumes a check but its own usage doesn't count toward the cap). Log as possible mis-metering.

---

### US-XCUT-13: Data lifecycle & cascade — delete content / student / tenant; deactivate / reactivate
**As the** platform, **I want** deletes to cascade exactly (and deactivation to gate without deleting), **so that** there are no orphan rows, no leaked access, and reactivation restores prior state.
**Routes/code:** `schema.prisma` `onDelete` relations, `cancelContentJobs`, tenant student CRUD, admin content/tenant/user delete, `contentAccess.service.ts` (active-membership gate).
**Priority:** P0 (S1 — orphan access / data integrity)

**Acceptance criteria**
- AC1 — Delete content cascades ALL dependents and leaves zero orphans; the storage file + queued jobs are also removed.
- AC2 — Deactivating a student keeps their data (assignments/attempts) but revokes access immediately; reactivating restores it.
- AC3 — Delete tenant / delete owner cascades the whole org; delete student cascades their memberships/attempts/assignments only.

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Delete Content → Chunks | all `Chunk` rows gone (cascade) — RAG no longer finds them | ⬜ | — | — |
| EC2 | Delete Content → ContentSection (+Title), ContentTranscriptSegment, ContentSlideDeck | all cascade-removed | ⬜ | — | — |
| EC3 | Delete Content → ContentAssignment | assignments removed; assigned students no longer see it (list + per-record 404) | ⬜ | — | — |
| EC4 | Delete Content → Podcast → PodcastEpisode → PodcastEpisodeProgress | full chain cascades | ⬜ | — | — |
| EC5 | Delete Content → ContentVideo, ContentSummary, contentSlideDeck | cascade; storage audio/files for video deleted? (admin deleteGenerated deletes file; content delete deletes `content.storagePath` but **episode/video audio files in storage may be orphaned** — verify storage cleanup for media) | ⬜ | — | possible storage leak |
| EC6 | Delete Content → Quiz → QuizQuestion + QuizAttempt | cascade | ⬜ | — | — |
| EC7 | Delete Content → ChatSession → ChatMessage | cascade; later manim asset fetch for those messages → 404 | ⬜ | — | — |
| EC8 | Delete Content → ContentProgress, SectionProgress, LearningActivityDay | cascade; student progress aggregates recompute without it | ⬜ | — | — |
| EC9 | Delete Content → AssessmentAssignment (content-targeted) | cascade (schema:570 content onDelete Cascade) | ⬜ | — | — |
| EC10 | Delete Content → BankQuestion.sourceContent / AssessmentAssignment.section | `SetNull` (sourceContent:509, section:571) — questions/assignments survive with null source, not deleted | ⬜ | — | — |
| EC11 | Delete Content → queued jobs | `cancelContentJobs` removes waiting/delayed process/quiz/podcast/video jobs; active one finishes harmlessly | ⬜ | — | — |
| EC12 | Delete Content → storage file | `storageService.delete(storagePath)` best-effort (`.catch(()=>{})`); missing file doesn't fail the delete | ⬜ | — | — |
| EC13 | Delete Content mid-generation (podcast/quiz running) | no orphan generated row for gone content; FAILED-write `updateMany` no-ops (US-OWNER-12·EC4) | ⬜ | — | — |
| EC14 | Delete Content while a learner is mid-chat on it | next chat call → 404 (access guard); no crash (US-OWNER-12·EC5) | ⬜ | — | — |
| EC15 | **Deactivate** student (membership.active=false) | content list → []; per-record → 404; `/learner/*` → 403; **ContentAssignment + AssessmentAttempt rows PRESERVED** | ⬜ | — | — |
| EC16 | **Reactivate** student | prior assignments/attempts visible again (rows were never deleted) — access restored (US-LEARNER-01·EC10) | ⬜ | — | — |
| EC17 | Deactivate consumes/frees a seat | active-student count drops → frees a seat (STUDENT quota uses `active:true` count) | ⬜ | — | — |
| EC18 | **Delete** student (User) | TenantMembership, ContentAssignment (as learner + as assignedBy), AssessmentAttempt, AssessmentAssignment(learner), Subscription(user), their own Content cascade — verify no orphans; frees a seat | ⬜ | — | — |
| EC19 | Delete student who CREATED question banks / assessments | `QuestionBank.createdBy`/`TenantAssessment.createdBy` = Cascade (484/535) — **deleting a student who is also a creator would cascade banks/assessments**; in practice only owners create these, but verify the owner-deletion path | ⬜ | — | — |
| EC20 | **Delete Tenant** | TenantMembership, Content(tenantId), QuestionBank, TenantAssessment, Subscription(tenantId) cascade; members become memberless (revert toward INDIVIDUAL behaviour) — verify learners' role/state after org deletion | ⬜ | — | — |
| EC21 | **Delete TENANT_OWNER (User)** | owned Tenant cascades (198) → entire org (content/students/assessments/subscription) gone — large blast radius; confirm admin UI warns | ⬜ | — | **S1 blast radius** |
| EC22 | Delete an ADMIN who wrote audit logs | `AdminAuditLog.adminUser` = `SetNull` (749) — logs retained with null adminUserId (audit trail preserved) | ⬜ | — | — |
| EC23 | Delete User → TutorRequest, Subscription(user) | cascade (182/249); a pending tutor request vanishes | ⬜ | — | — |
| EC24 | Unassign content from a student (`DELETE /tenant/assignments`) | only that ContentAssignment removed; student loses access to that one; attempts/progress for it remain or orphan? verify | ⬜ | — | — |
| EC25 | Switch tutor (learner joins new class) | old ContentAssignment rows survive but are tenant-scoped-out (`getAssignedContentIds(tenantId)`); learner sees only new tenant's content (US-LEARNER-01) | ⬜ | — | — |
| EC26 | Cancel subscription (admin) → effective FREE | content stays; quotas drop to FREE limits; CANCELED tenant sub → owner blocked from generate/add-student (402) | ⬜ | — | — |
| EC27 | Admin `deleteGenerated` slideshow | deletes ContentVideo + its storage file; podcast/quiz/summary delete rows (no separate storage cleanup for podcast episode audio — verify orphan audio) | ⬜ | — | possible storage leak |

**Notes / open questions**
- Storage-file cleanup is **only** explicit for `content.storagePath` (content delete) and `ContentVideo.storagePath` (admin deleteGenerated). PodcastEpisode `audioPath` files appear to rely on no explicit deletion on content/podcast delete (cascade removes DB rows but not the saved `.mp3` blobs) → potential storage leak; worth confirming against `storageService` GC.

---


<!-- ===== AREA: critic ===== -->
# Completeness-critic stories — cross-area SEAMS & missing whole flows

These stories cover gaps the nine area specialists left **between** their areas:
identity transitions (role flips), subscription→learner cascades, admin role-change
cascades, owner-edit-vs-learner-read concurrency, AI-output locale persistence,
temporal/streak correctness, the dual quiz system, and the absence of notifications.
All grounded in code read during the critic pass (file:line cited per EC where load-bearing).

---

### US-XCUT-14: Identity transitions — INDIVIDUAL ↔ TENANT_LEARNER ↔ class-switch (content visibility & seat accounting)
**As the** platform, **I want** a user's content, seat, and access to stay correct as their role flips between solo learner, a tutor's student, and back, **so that** nobody loses data, sees a stranger's content, or silently consumes/leaks a paid seat.
**Routes/code:** `POST /auth/join-class`, `POST /auth/register` (+joinCode) · `services/tenant/organization.ts` (`joinTenantByCode`) · `contentAccess.service.ts` (`buildContentListWhere`, `resolveTenantIdForUser`) · `services/adminUserRole.service.ts` (`applyAdminRoleChange`)
**Priority:** P0 (S1 isolation + data-lifecycle)

**Acceptance criteria**
- AC1 — Given an INDIVIDUAL with their own B2C uploads, When they join a class (role → TENANT_LEARNER), Then they read only assigned content AND their own prior uploads are not destroyed (recoverable if they later leave/are demoted).
- AC2 — Given a TENANT_LEARNER in org A, When they redeem org B's join code, Then org A membership is deactivated, only one seat is held (B's), and org A content disappears.
- AC3 — Seat counting is exact across every flip: no flip ever lets two orgs both count the same active learner.

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | INDIVIDUAL with 5 own B2C PDFs joins a class | Role→TENANT_LEARNER; dashboard now shows ONLY assigned content; the 5 own uploads vanish from the list (tenantId=null, not assigned) — **but are not deleted** | ⬜ | — | likely S2 UX: silent disappearance, no warning/explanation |
| EC2 | …same learner is later demoted to INDIVIDUAL (admin) | The 5 own uploads reappear; assigned tenant content disappears | ⬜ | — | data-lifecycle round-trip |
| EC3 | Learner in org A redeems org B's join code | A-membership `active:false`, B-membership active, role stays TENANT_LEARNER, only B's seat consumed (`organization.ts` updateMany deactivates `tenantId not B`) | ⬜ | — | confirm A's owner seat count drops by 1 |
| EC4 | …immediately after EC3, can the learner still open org A's previously-assigned content? | 404 via `assertCanAccessContent` (membership inactive) — even with a still-valid JWT carrying tenantId=A | ⬜ | — | **S1**: token tenantId is now stale; verify guard re-reads membership not token |
| EC5 | Learner switches A→B but JWT still encodes tenantId=A until reload | `/learner/*` calls: does `attachTenantId` use the token's tenantId or re-resolve from DB? If token-based, learner sees A's empty workspace / 403 until re-login | ⬜ | — | stale-tenantId-in-JWT seam (parallels AUTH-06 owner case) |
| EC6 | Seat-full org B, learner in A tries to join B | 402 STUDENT quota; **A-membership must NOT be deactivated** (join is transactional — quota asserted before `$transaction`) — verify learner keeps A | ⬜ | — | confirm `assertTenantQuota` runs before the deactivate-others `updateMany` |
| EC7 | INDIVIDUAL joins class, then the SAME owner later deletes that student (deactivate) | Learner loses content; can they re-join with the code? (membership exists but inactive → reactivation re-checks quota) | ⬜ | — | crosses OWNER-03 |
| EC8 | Re-join own previously-left org A (membership inactive) | Reactivates A, deactivates current B, consumes a seat in A (`if(!existing?.active) assertTenantQuota`) | ⬜ | — | — |
| EC9 | TENANT_OWNER redeems any join code | 400 "Tutors cannot join a class" (`organization.ts`); owner of THAT org → 400 "You own this organization" | ⬜ | — | — |
| EC10 | Two browser tabs: learner joins org B in tab 1; tab 2 still shows org A workspace | Tab 2 must 404/refetch empty on next call; no cross-org content bleed from cached react-query data | ⬜ | — | stale-cache seam |
| EC11 | Learner's B2C uploads that were mid-processing (PENDING job) when they join a class | Job still completes server-side, but content is invisible to them now; no crash, no orphaned processing card on the (now hidden) item | ⬜ | — | job × visibility seam |
| EC12 | A learner who never was INDIVIDUAL (kid created by tutor) is given a join code for a different org | Switches orgs (kid leaves tutor 1 for tutor 2); tutor 1's roster shows them inactive, frees a seat silently — tutor 1 gets no notice | ⬜ | — | S3 UX: silent student departure |
| EC13 | No self-serve "leave class" exists | A learner cannot revert to INDIVIDUAL on their own; only admin role-change or joining another org. Document as gap | ⬜ | — | missing flow |
| EC14 | i18n — the "you joined {org}" / disappeared-content state | Localized uz/en/ru; no English leak on the post-join transition | ⬜ | — | — |
| EC15 | Concurrent double-redeem of the same code (double-click) | Idempotent: one active membership, one seat, no P2002 on the upsert | ⬜ | — | — |

**Notes** — `joinTenantByCode` deactivates *all other* learner memberships, so the model is strictly one active class at a time. The user's own `tenantId=null` content is never reassigned, just filtered out by `buildContentListWhere` while they're a learner.

---

### US-XCUT-15: Subscription-status cascade to LEARNERS (owner sub goes PAST_DUE / CANCELED / TRIALING)
**As the** platform, **I want** the right thing to happen to a tutor's *students* when the tutor's org subscription changes, **so that** access matches what was paid for and is consistent between owner and learner.
**Routes/code:** `routes/learner.routes.ts` (`requireTenantMember, requireActiveLearner`) · `middleware/tenant.middleware.ts:58` (`requireActiveLearner`) · `services/subscription/tenant.ts` (`requireActiveTenantSubscription`) · admin `PATCH /admin/users/:id/subscription`, `/admin/tenants/:id`
**Priority:** P0 (S2 billing-correctness, possible S2 access bug)

**Acceptance criteria**
- AC1 — Given an admin sets a tenant's subscription to CANCELED, When the owner uses `/tenant/*`, Then they get 402 (via `requireActiveTenantSubscription`).
- AC2 — The intended-by-design behaviour for that org's LEARNERS must be explicit and consistent (today it is NOT — see EC1).

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Owner sub set CANCELED; a learner of that org opens assigned content / chats / takes a game | **Code today: learner still has FULL access** — `requireActiveLearner` checks only membership `active`, never the owner's subscription; `/learner/*` has no `requireActiveTenantSubscription`. Owner is locked out but students keep working on a cancelled plan | ⬜ | — | **S2 suspected bug — subscription cancellation does not cascade to learners** (tenant.middleware.ts:58, learner.routes.ts:14) |
| EC2 | Owner sub PAST_DUE; learner takes a quota-gated action (none — learners only read/chat/attempt) vs owner generation | Learner TUTOR_MESSAGE is gated by a *personal FREE* sub (see xcut-sec bug), not the org plan → throttled even on a paid org; orthogonal to sub status | ⬜ | — | crosses xcut-sec quota bug |
| EC3 | Owner sub TRIALING | `requireActiveTenantSubscription` throws 402 for status≠ACTIVE incl. TRIALING → owner cannot operate, but learners still can (EC1) → a trialing org's students work while the owner is blocked | ⬜ | — | design inconsistency |
| EC4 | Admin reactivates sub ACTIVE after a cancel | Owner regains `/tenant/*` immediately on next request (no token reissue needed — sub read from DB) | ⬜ | — | — |
| EC5 | Owner sub CANCELED then owner tries to deactivate a student to free seats | Blocked by 402 before reaching student mgmt → owner cannot even down-scope to fit a smaller plan | ⬜ | — | recovery-path gap |
| EC6 | Learner-facing UI when org sub lapses | No banner/notice to the student (only the owner shell shows the inactive banner, hardcoded English per admin-billing bug); students are unaware | ⬜ | — | S3 UX |
| EC7 | currentPeriodEnd in the past but status still ACTIVE | No cron flips ACTIVE→PAST_DUE (manual activation only) → "expired" subs never auto-lapse; owner keeps full access past period end | ⬜ | — | missing lifecycle job |
| EC8 | Admin CANCELs an INDIVIDUAL sub (B2C) | `subscription/user.ts` rewrites planId→FREE on CANCELED (admin-billing bug) → re-ACTIVE returns FREE not the paid plan; assert the data-loss path | ⬜ | — | crosses admin-billing |
| EC9 | i18n of any learner-facing lapse message (if added) | uz/en/ru | ⬜ | — | — |

**Notes** — The seam is that owner billing state and learner access live behind different guards. Decide & document: should a CANCELED org freeze its learners read-only or fully? Today it does neither.

---

### US-XCUT-16: Admin role-change cascade (owner↔learner↔individual↔admin) — orphans, ownership transfer, stale token
**As an** admin, **I want** changing a user's role to correctly migrate their org, students, content, subscription, and session, **so that** no org is left ownerless and no access is stale.
**Routes/code:** `PATCH /admin/users/:id` · `services/adminUserRole.service.ts` (`applyAdminRoleChange`, `transferTenantOwnership`, `ensureIndividualSubscription`, `ensureTenantSubscription`)
**Priority:** P1 (S2 data-lifecycle)

**Acceptance criteria**
- AC1 — Demoting a TENANT_OWNER who owns an org requires `newOwnerId` (or it 400s) and transfers the org, its students, content, and subscription to the new owner.
- AC2 — Every successful role change reconciles the user's subscription (individual FREE vs tenant) and leaves no active membership in a role they no longer hold.

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Owner→INDIVIDUAL without `newOwnerId`, owner owns an org | 400 "Select a new owner before demoting" (adminUserRole.service.ts:102) | ⬜ | — | — |
| EC2 | Owner→INDIVIDUAL with `newOwnerId` | `transferTenantOwnership` reassigns org; old owner becomes INDIVIDUAL with a FREE sub; org keeps all students/content/assessments | ⬜ | — | verify content `tenantId` unchanged, new owner can access |
| EC3 | Owner→ADMIN while still owning an org | 400 "Reassign the owner before changing role" (service:84) | ⬜ | — | — |
| EC4 | newOwnerId is a learner in a DIFFERENT org / an admin / nonexistent | `transferTenantOwnership` must validate the target is eligible; else 400/404, no half-transfer | ⬜ | — | verify validation depth |
| EC5 | Owner→TENANT_LEARNER of their OWN org | 400 "Cannot make owner a learner of their own org" (service:184) | ⬜ | — | — |
| EC6 | Owner→TENANT_LEARNER of another org while still owning one | 400 "Reassign ownership before changing to learner" (service:181) | ⬜ | — | — |
| EC7 | Promote INDIVIDUAL→TENANT_OWNER who already owns a tenant (re-promote) | Reactivates OWNER membership + ensures tenant sub; no duplicate tenant (service:129) | ⬜ | — | — |
| EC8 | Promote→TENANT_OWNER with neither orgName nor tenantId | 400 "orgName or tenantId required" | ⬜ | — | — |
| EC9 | After ANY role change, the user's existing JWT still encodes the OLD role | `/auth/me` reflects new role but `me()` only reissues a token for `legacyToken`; non-legacy users see new role in web but get 403 on the new role's API until re-login/expiry | ⬜ | — | **S2 stale-JWT** (parallels AUTH-06) — affects every admin role change, not just tutor-approval |
| EC10 | Learner→INDIVIDUAL: their assigned-content history/progress | Memberships deactivated; assigned content disappears; QuizAttempt/SectionProgress rows persist (orphaned) | ⬜ | — | data-lifecycle |
| EC11 | Demote owner→individual mid-flight while a learner of that org is chatting | New owner owns content instantly; learner access continues (assignments unchanged); no crash on the in-flight stream | ⬜ | — | concurrency |
| EC12 | Concurrent/double role-change (double admin click) | Idempotent or clean 409; not a duplicate-tenant / P2002 500 (non-transactional — parallels approve race) | ⬜ | — | **S2 race** |
| EC13 | Audit: does the role change write an `AdminAuditLog`? | Yes — but per admin-billing bug, patchUser audits ONLY on role change; confirm role-change IS logged here | ⬜ | — | — |
| EC14 | ensureIndividualSubscription on a since-deleted user | Should not P2003-500 (crosses xcut-sec deleted-user bug) | ⬜ | — | — |

---

### US-XCUT-17: Owner-edit vs learner-read concurrency (unassign / delete / reject mid-consumption; reassignment)
**As the** platform, **I want** owner mutations to interleave safely with learners actively consuming the same content/assessment, **so that** there is no crash, stale grant, or retroactive grade corruption.
**Routes/code:** `DELETE /tenant/assignments`, `DELETE /tenant/content/:id`, `PATCH /tenant/.../questions/:id` · `services/contentAccess.service.ts` · `services/assessment/learner.ts`
**Priority:** P1 (S2 concurrency/data-integrity)

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Owner UNassigns content while the learner is mid-chat on it | Next learner request 404s cleanly; the open stream errors gracefully (no infinite spinner, no 500) | ⬜ | — | — |
| EC2 | Owner unassigns content while learner is mid-quiz-submit on its auto-quiz | Submit either completes (grace) or 404s with a clear message; no partial attempt row | ⬜ | — | — |
| EC3 | Owner DELETES content while learner is reading it (PDF blob open) | Blob fetch 404 → learner gets a "content removed" state, redirected to dashboard (parallels OWNER-12·EC5) | ⬜ | — | — |
| EC4 | Owner REJECTS a bank question that is in a PUBLISHED assessment a learner is taking right now | Learner is still served the rejected question (no status filter at learner.ts:66) → already-graded attempts mismatch grading basis | ⬜ | — | **S2** (assess area flagged; here = the live-concurrency manifestation) |
| EC5 | Owner re-assigns the same content from learner X to learner Y while X has it open | X loses access on next call; Y gains it; X's progress rows persist (orphaned) | ⬜ | — | reassignment seam |
| EC6 | Owner changes a SECTION-scoped assignment to CONTENT-scoped while learner reads one section | Learner's visible scope changes on refetch; no crash; progress keyed by section survives | ⬜ | — | assignment-scope seam |
| EC7 | Owner unassigns then re-assigns within seconds (toggle) | Learner's stale react-query cache may still show content → must 404 on actual fetch; no ghost access | ⬜ | — | stale-cache |
| EC8 | Owner deletes an assessment a learner is mid-attempt on | Submit 404/clean; leaderboard/results drop it; no orphaned AssessmentAttempt FK error | ⬜ | — | crosses OWNER-14 |
| EC9 | Two owners? (N/A — one owner per org) | 🚫 by design (single ownerId) | ⬜ | — | record why |
| EC10 | Owner edits a question's correct answer after learners already submitted | Past attempts keep their graded result; only future attempts use the new answer? Or retroactively wrong? Document (link-by-id, no snapshot → retroactive) | ⬜ | — | **S2 data-integrity** |
| EC11 | Owner unassigns content mid-podcast-listen (learner streaming episode audio) | Audio stream 404s on next range/segment; player shows error not infinite buffer | ⬜ | — | — |

---

### US-XCUT-18: AI-output locale persistence & regeneration cost (generate uz → switch ru)
**As an** Uzbek-first user who switches languages, **I want** AI-generated artifacts to behave sensibly across locales, **so that** I'm not silently shown nothing or charged twice.
**Routes/code:** `quiz.controller.ts` (`listQuizzesByContent` filters `locale`), `summary.controller.ts`, `podcast`/`section` generation · `buildRagContext(..., locale)` · `lib/limit-error.ts`
**Priority:** P1 (S2 UX + quota)

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Generate a quiz in uz, switch app locale to ru, open the content | `listQuizzesByContent` filters by `locale=ru` → **no quizzes shown** even though a uz quiz exists; user thinks none exist and re-generates (charges QUIZ_GEN quota again) | ⬜ | — | **S2 locale-scoped generation** double-charges |
| EC2 | Same for summaries | Summary likely locale-keyed too → switching locale shows empty/regenerate; verify and document | ⬜ | — | — |
| EC3 | Podcast generated in uz, listened in ru UI | Audio is uz TTS; player chrome ru; is that acceptable? No re-gen prompt | ⬜ | — | — |
| EC4 | Chat history in uz, continue conversation after switching to ru | RAG context locale flips mid-thread → mixed-language thread; assistant should follow new locale but prior turns stay uz | ⬜ | — | — |
| EC5 | Section titles generated in uz, viewed in ru | Titles stay uz (persisted) → navigation shows uz labels on a ru page (English/Uzbek-leak class on a per-content basis) | ⬜ | — | S3 i18n-data leak |
| EC6 | Mid-stream chat error message localization | `data:{"error":"Stream failed"}` literal English appended un-localized on uz/ru (media-area bug) | ⬜ | — | crosses media |
| EC7 | Regenerate in the new locale when quota already spent | 402 modal with feature-specific headline (IND-08) — but user is confused *why* they must regen just for a language switch | ⬜ | — | UX gap |
| EC8 | Owner generates a bank question in uz, assessment taken by a ru-locale learner | Question text stays uz; learner sees uz question on ru UI | ⬜ | — | — |

---

### US-XCUT-19: Temporal correctness — streaks, activity days, heatmap (TZ, DST, midnight, backfill)
**As a** user in UTC+5 (Uzbekistan), **I want** streaks and activity heatmaps computed against my local day, **so that** near-midnight activity isn't mis-attributed and streaks don't break wrongly.
**Routes/code:** `services/learningProgress.service.ts` · `components/tenant/activity-heatmap.tsx:12,18` · `lib/format-relative-time.ts` · learner/owner progress + B2C history
**Priority:** P2 (S3 correctness, broad surface)

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Activity at 23:30 local (UTC+5) | Counts toward *today* local, not yesterday UTC; heatmap cell highlights the right day | ⬜ | — | heatmap keys active days in UTC (`toISOString`) but builds cells from local `new Date()` → near-midnight off-by-one (xcut-quality bug) |
| EC2 | Streak crossing midnight | Two activities 23:50 + 00:10 local count as 2 different days (streak++), not the same day | ⬜ | — | — |
| EC3 | Streak with a gap exactly at the day boundary | Missing one local day breaks the streak; verify off-by-one doesn't preserve/break wrongly | ⬜ | — | — |
| EC4 | DST (Uzbekistan has no DST, but a traveling user / server TZ) | No double-count or skipped day if server TZ ≠ user TZ | ⬜ | — | server-vs-client TZ seam |
| EC5 | "N days" streak ICU plural in uz/en/ru | uz invariant, en one/other, ru paucal — already F28/F29 territory; re-verify on owner progress | ⬜ | — | — |
| EC6 | Invalid/null lastActiveDate | `format-relative-time.ts` has no NaN guard → "NaN soniya oldin" (xcut-quality bug) | ⬜ | — | crosses xcut-quality |
| EC7 | Heatmap 35 cells are color-only divs (no aria) | Screen reader cannot perceive active days (WCAG 1.4.1) | ⬜ | — | crosses xcut-quality |
| EC8 | Owner class-progress streak vs per-student streak vs learner self streak | All three surfaces compute identically for the same student | ⬜ | — | consistency across 3 surfaces |
| EC9 | `toLocaleDateString()` no-locale-arg on progress/heatmap/roster | Renders in OS locale not app locale (extends XCUT-01·EC3 to 4 surfaces) | ⬜ | — | crosses xcut-quality |
| EC10 | Activity day recorded while role-flipping (learner→individual) | Day attributed to the correct workspace; no double-count across role change | ⬜ | — | crosses XCUT-11 |

---

### US-OWNER-17: Per-content auto-quiz (§1.6 `Quiz`) authored by owner, consumed by learner — dual quiz-system seam
**As a** tutor, **I want** the per-content auto-quiz I generate on a material to be takeable by my assigned students and to count toward their progress, **so that** the §1.6 quiz and §4 assessment systems don't confuse anyone.
**Routes/code:** `/quiz/content/:contentId`, `/quiz/:id`, `/quiz/:id/submit` · `controllers/quiz.controller.ts` (`listQuizzesByContent` learner filter `{}`, `submitQuiz`) · vs §4 `TenantAssessment`
**Priority:** P1 (S2 — two parallel quiz systems)

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Owner generates an auto-quiz on a tenant material assigned to learner X | X sees it (learner filter `{}` at quiz.controller.ts:278) and can take it | ⬜ | — | confirm intended — learner sees ALL quizzes on the content |
| EC2 | Learner takes the auto-quiz | QuizAttempt recorded; does it feed learner progress / dashboard "avg quiz"? vs only TenantAssessment feeds it | ⬜ | — | progress-source ambiguity |
| EC3 | Learner sees quizzes authored by ANOTHER learner on the same shared content | Filter `{}` for learners → a classmate's generated quiz is visible too (clutter / minor info leak of "someone made a quiz") | ⬜ | — | S3 — verify desired |
| EC4 | Auto-quiz with 0 valid questions (gen failed) | Quiz row persists with 0 Qs, no FAILED state → learner submit returns 400 "still generating" forever, UI polls indefinitely (media bug) | ⬜ | — | crosses media |
| EC5 | Learner crafts `/quiz/:id` for an UNassigned content's quiz | 404 via `assertCanAccessContent(quiz.contentId)` (quiz.controller.ts:189) | ⬜ | — | **S1 IDOR** — verify guard fires |
| EC6 | Learner submits auto-quiz twice (double-click) | Two QuizAttempt rows, progress updated twice (no idempotency — media bug) | ⬜ | — | crosses media |
| EC7 | Owner deletes the content; learner had auto-quiz attempts | Cascade deletes Quiz/QuizQuestion/QuizAttempt; learner's avg-quiz recomputed without them | ⬜ | — | data-lifecycle |
| EC8 | maxAttempts: auto-quiz has none vs TenantAssessment has maxAttempts | Learner can retake auto-quiz unlimited; document the difference so testers don't conflate | ⬜ | — | — |
| EC9 | i18n: which "quiz" surfaces are localized | auto-quiz player (IND-04, localized) vs assessment list (F24 debt) — verify learner sees consistent language | ⬜ | — | — |
| EC10 | Owner-created auto-quiz locale vs learner locale | Locale-filtered (XCUT-15·EC1) → a uz owner-quiz invisible to a ru learner | ⬜ | — | crosses XCUT-15 |

---

### US-XCUT-20: Discovery of newly-assigned work (no notification system) + missing reverse flows
**As a** student, **I want** to know when my tutor assigns me a new material or assessment, **so that** I don't miss work — and as a user I want self-serve reverse paths (leave class).
**Routes/code:** `POST /tenant/assignments`, `POST /tenant/assessments/:id/assign` · learner dashboard `app/[locale]/(learner)/learner/dashboard` · (no notification model exists)
**Priority:** P2 (S3 product gap, but high impact for B2B)

**Edge cases & negative paths**
| # | Scenario | Expected behaviour | Status | Finding | Fix |
| --- | --- | --- | --- | --- | --- |
| EC1 | Owner assigns a new material to a logged-in learner | Learner has NO notification/badge; only discovers it by refreshing the dashboard. Document as gap | ⬜ | — | missing notifications |
| EC2 | Owner publishes & assigns a GAME assessment with a deadline (if any) | Learner not alerted; no due-date surfacing (verify assessments even have deadlines) | ⬜ | — | — |
| EC3 | Owner approves a tutor request (admin) → user becomes owner | User isn't told until they reload / re-login (also stale-JWT, AUTH-06) | ⬜ | — | crosses auth |
| EC4 | Tutor resets a kid's password | Kid not notified; must be told out-of-band; mustChangePassword banner is dismissible (auth bug) | ⬜ | — | crosses auth |
| EC5 | Learner wants to leave their class | No self-serve "leave"; only join another code or admin action (XCUT-11·EC13) | ⬜ | — | missing flow |
| EC6 | Owner unassigns all of a learner's content | Learner dashboard goes empty with "teacher will assign materials" — no "removed" explanation | ⬜ | — | S3 UX |
| EC7 | Real-time: new assignment appears without manual refresh? | No websockets/polling for assignments — react-query staleTime governs; verify a reasonable refetch | ⬜ | — | — |
| EC8 | i18n of any future notification copy | uz/en/ru | ⬜ | — | — |

**Notes** — There is no `Notification` model anywhere in the schema; the entire product relies on pull (refresh) discovery. This is the single biggest cross-area UX gap for the B2B flow.

---


## Suspected findings ledger (code-read, UNVERIFIED)

Hypotheses from reading source during the expansion. **Not verified at runtime** — triage, reproduce, then promote real ones into the main Findings ledger with an `F#`.


### S2 — major (likely flow-breaking / wrong-result / security)  (30)

- [auth] Forced first-login password change NOT enforced: mustChangePassword only renders a DISMISSIBLE StudentWelcomeBanner (apps/web/components/learner/student-welcome-banner.tsx) with no route gate; a kid can dismiss and use the whole app on a tutor temp password. Contradicts AUTH-01 EC5 expectation. (AUTH-04 EC8)
- [auth] Stale-JWT role on tutor approval: approveTutorRequest flips DB role to TENANT_OWNER (apps/api/src/services/tutorRequest.service.ts:114) but the user's existing JWT still encodes role:INDIVIDUAL; auth.middleware (apps/api/src/middleware/auth.middleware.ts:35-44) only backfills role for LEGACY tokens and me() reissues only when legacyToken. So /auth/me shows OWNER (web routes to /tenant/dashboard) but all /tenant/* API calls 403 until re-login or 7-day expiry. (AUTH-06 EC11/EC12, AUTH-07)
- [auth] Orphaned account on ANY register-with-join-code failure: register() (apps/api/src/controllers/auth.controller.ts:105-125) creates the user BEFORE joinTenantByCode, so an invalid join code (404) — not just seat-full — leaves an orphaned INDIVIDUAL account; retry then hits 'Email already registered'. Broadens F27. (AUTH-02 EC13)
- [auth] No session/token revocation on password change or logout: stateless 7-day JWT with no tokenVersion; old tokens stay valid after password change/logout. (AUTH-04 EC14, AUTH-07 EC21)
- [auth] Multi-tab logout desync: useAuthStore persist (apps/web/store/useAuthStore.ts) has no storage-event listener; logout in one tab leaves other tabs authed in-memory until reload/401. (AUTH-05 EC5)
- [auth] Username identity normalization weaker than email: createStudent username uniqueness is case-SENSITIVE findUnique (apps/api/src/services/tenant/students.ts:76) but login() matches username case-INSENSITIVE findFirst (auth.controller.ts:166) -> case-variant usernames coexist yet login is ambiguous; case-variant usernames also collide on the synthetic ${username.toLowerCase()}@students.talim.local email. (AUTH-09 EC3/EC4)
- [auth] Approval race: approveTutorRequest status check (tutorRequest.service.ts:106) is not transactional; two concurrent admin approvals can both pass PENDING and double-run applyAdminRoleChange (duplicate tenant / unique-constraint 500). (AUTH-06 EC17)
- [auth] No forgot-password / email-reset flow exists for B2C; a locked-out INDIVIDUAL has no self-serve recovery — backlog 'reset via email/link' is unimplemented. (AUTH-04 EC24)
- [auth] 429 rate-limit responses surfaced as generic 'server error' in web login (login/page.tsx maps non-401/403 -> serverError); authWriteRateLimit (40/15min, no skipSuccessfulRequests) can block a >40-student NAT'd classroom self-registering. (AUTH-08 EC3/EC8) — S2/S3
- [ingest] SLIDE (.pptx/.ppt) uploads always FAIL: upload.middleware.ts:18-22 allows PowerPoint mimetypes and uploadContent assigns ContentType.SLIDE, but processContent.job.ts:53-54 routes SLIDE through extractPdfText->pdf-parse which throws on a non-PDF ZIP; no PPTX extractor exists. (S2)
- [ingest] YouTube AI-transcription has no audio size/duration cap: youtube.service.ts:109-123 buffers entire audio in memory and sends to Whisper (147-154) with no chunking; >25MB audio (long video) -> Whisper 413/FAILED, livestream/huge video -> OOM risk. (S2)
- [ingest] Orphan PENDING content if contentQueue.add rejects: uploadContent/createYoutubeContent (content.controller.ts:157-167/178-188) create the PENDING Content row before awaiting contentQueue.add; if Redis/add fails the row persists with no job and no sweeper -> perpetual processing card. (S2)
- [owner-mgmt] S2 createStudent (apps/api/src/services/tenant/students.ts:76-129): username uniqueness check (findUnique) then user.create is non-atomic — concurrent creation of the same username races into a Prisma P2002 that is uncaught, returning a 500 instead of a clean 409.
- [owner-mgmt] S2 seat-quota race (students.ts:156-163 patchStudent reactivation; mirrored in organization.ts:102-116 joinTenantByCode): assertTenantQuota then activate is check-then-act with no transaction/lock — two concurrent reactivations (or join+reactivate) both pass the quota check and both activate, overshooting seatLimit.
- [owner-mgmt] S2 AssignStudentsPanel.handleAssign (apps/web/components/tenant/assign-students-panel.tsx:38-44): sequential await loop has no try/catch — if one assign fails (402/404/network), the promise rejects unhandled, remaining selected ids are skipped, setSelected([]) never runs, leaving a partial multi-assign with no user-facing error.
- [owner-mgmt] S2 reparseContent (apps/api/src/controllers/tenant-content.controller.ts:130-151): vision OCR runs INLINE in the request (not a Bull job); a long doc can exceed the nginx/gateway timeout, and if the client aborts the content is stranded at status PROCESSING (only a thrown error sets FAILED).
- [assess] GAME leaderboard integrity (S2): per-question `timings` are client-supplied and trusted for speed points — a learner can POST timings=0 for every question to force speedFactor=1.0 and inflate points; server only clamps to [0,limit], never validates against server-side elapsed time. apps/api/src/services/assessment/learner.ts:111 + shared.ts:66-76 (computeGamePoints).
- [assess] maxAttempts concurrency hole (S2): the in-transaction re-count (learner.ts:137-155) does not prevent two parallel submits under Postgres default READ COMMITTED from both reading count<maxAttempts and both inserting; there is no unique constraint to serialize, so a learner can exceed maxAttempts via concurrent double-submit.
- [admin-billing] admin/content.controller.ts:71-91 — retryContentJob writes NO writeAdminAuditLog (and never references req.user), so re-enqueueing a stuck job is invisible in the audit log, violating the 'every admin action recorded' invariant. (S2 audit gap)
- [admin-billing] admin/users.controller.ts:234-258 — patchUser audits ONLY on role change; name/preferredLocale/adminPasswordNote edits (incl. the sensitive plaintext password note) persist with NO audit row. (S2 audit gap)
- [admin-billing] subscription/user.ts:75-81 vs subscription/tenant.ts — adminUpdateUserSubscription rewrites planId→FREE when status=CANCELED (forgets the paid plan, so re-ACTIVE returns FREE), but the tenant path keeps the plan on cancel. Asymmetric + potential data-loss on the individual path. (S2)
- [admin-billing] tutorRequest.service.ts:99-124 — approveTutorRequest is NOT transactional and has no atomic status guard: concurrent/double approval both read status PENDING and both run applyAdminRoleChange→createTenantForOwner, risking a duplicate tenant / unique-slug crash / double subscription. Partial-failure re-approve also silently drops seatLimit (fromRole===toRole early-returns tenantId:null). (S2 race)
- [admin-billing] subscription/tenant.ts:28-37 — requireActiveTenantSubscription throws 402 for any status≠ACTIVE including TRIALING, so a 'trialing' tenant owner cannot upload/add students/generate at all — trials appear unusable (likely unintended). (S2/design)
- [xcut-sec] [S2] Learner tutor-message quota uses a phantom PERSONAL FREE subscription, not the tenant plan. apps/api/src/services/subscription/user.ts:147-158 — assertQuota for TENANT_LEARNER only blocks UPLOAD/GENERATION/VIDEO/PODCAST; TUTOR_MESSAGE falls through to getSubscriptionForUser(userId), which auto-creates a personal FREE Subscription (user.ts:25-36) and gates by FREE maxTutorMessagesPerDay. A student in a paid GROWTH org is throttled by a FREE cap, and a stray Subscription row is silently created per student. Tenant TUTOR_MESSAGE limits (tenant.ts:144-151) are never consulted for learners.
- [xcut-sec] [S2] Deleted user with a still-valid NON-legacy JWT gets a 500 (FK violation) instead of 401 on /billing/me and /usage/me. apps/api/src/middleware/auth.middleware.ts:37-44 only reloads/validates the user for legacy tokens (no embedded role); a normal token for a since-deleted user passes auth, then getSubscriptionForUser (subscription/user.ts:25-36) runs prisma.subscription.create({data:{userId}}) for a non-existent user -> P2003 -> generic 500. Content endpoints 404 via cascade, but billing/usage auto-provision and crash.
- [xcut-sec] [S2] Per-episode podcast regenerate failure marks the WHOLE podcast FAILED. apps/api/src/jobs/generatePodcast.job.ts:219-228 podcastQueue.on('failed') sets podcast.status='FAILED' for ANY thrown job, including the single-episode (episodeId) regenerate path. If generateChatCompletion (script gen) throws before the TTS try/catch, the in-handler withAudio recompute (job:97-103) is skipped, so a podcast with other Ready episodes is wrongly flipped to FAILED.
- [critic] [cascade] S2 — Subscription cancellation does NOT cascade to a tutor's LEARNERS. requireActiveLearner (apps/api/src/middleware/tenant.middleware.ts:58) checks only TenantMembership.active; /learner/* (routes/learner.routes.ts:14) has no requireActiveTenantSubscription. So when an admin sets a tenant sub to CANCELED/PAST_DUE/TRIALING the OWNER is 402-locked out of /tenant/* but every STUDENT keeps full access (read assigned content, chat, take games) on the lapsed plan. Owner billing state and learner access live behind different guards — the intended behaviour is undefined and inconsistent. (US-XCUT-12 EC1/EC3)
- [critic] [i18n×quota] S2 — Locale-scoped generation silently hides prior artifacts and double-charges. listQuizzesByContent (apps/api/src/controllers/quiz.controller.ts:278) filters quizzes by `locale`; a quiz generated in uz returns EMPTY when the app locale is ru, so the user assumes none exists and regenerates, re-charging QUIZ_GEN quota. Summaries/sections are likely keyed the same way — switching language costs quota and orphans the original-locale artifacts. (US-XCUT-15 EC1/EC2)
- [critic] [auth] S2 — Admin role-change stale-JWT (broadens AUTH-06 beyond tutor-approval). applyAdminRoleChange (apps/api/src/services/adminUserRole.service.ts) flips User.role in the DB, but me() only reissues a token for legacyToken and auth.middleware backfills role only for legacy tokens. After ANY admin role change (owner↔learner↔individual), /auth/me shows the new role (web routes accordingly) while all of the new role's API calls 403 until re-login or 7-day expiry. Also non-transactional → concurrent/double role-change can duplicate-tenant/P2002-500. (US-XCUT-13 EC9/EC12)
- [critic] [lifecycle] S2 — Silent self-content loss on class join + no reverse path. joinTenantByCode (apps/api/src/services/tenant/organization.ts) flips an INDIVIDUAL to TENANT_LEARNER, after which buildContentListWhere hides all of their own tenantId=null B2C uploads with no warning, explanation, or recovery hint. There is no self-serve 'leave class' — reverting to INDIVIDUAL requires an admin role change — so a solo learner who joins a tutor's class appears to 'lose' all their material. (US-XCUT-11 EC1/EC13, US-XCUT-17 EC5)


### S3 — minor  (20)

- [auth] Password min-length inconsistency: register & self-change require min(8), but tutor-set student password is min(6) (apps/api/src/services/tenant/shared.ts createStudentSchema). (AUTH-04 EC7)
- [auth] Deleted-user token inconsistency: non-legacy tokens are not re-checked against DB in auth.middleware (passes), while legacy path 404s — low impact since users are soft-deactivated not hard-deleted. (AUTH-07 EC8)
- [ingest] POST /content/:id/ocr-region is unmetered+unrate-limited: content.controller.ts:268 runs a paid OpenAI vision OCR with no assertQuota and no rate limiter, unlike reparse (reparseRateLimit + GENERATION quota). Cost-abuse vector. (S3)
- [ingest] Plan page-cap silently bypassed for encrypted/corrupt PDFs: pdf.service.ts:28-31 getPdfPageCount returns null when pdf-parse fails, so content.controller.ts:143-144 overPages=false and an over-limit/encrypted PDF passes the plan page cap. (S3)
- [ingest] Redundant mid-job GENERATION quota can FAIL an already-accepted upload: upload route enforceQuota('UPLOAD','GENERATION') then processContent.job.ts:65-71 re-asserts GENERATION; if quota exhausted between accept and job run the content FAILS post-acceptance. (S3)
- [ingest] PDF blob 401 doesn't trigger re-auth: authenticatedBlob.ts uses raw fetch (bypasses axios 401 logout/redirect interceptor); content-stage.tsx:107-115 treats 401 as permanent and shows error screen, stranding the user instead of re-login. (S3)
- [ingest] Multi-file selection silently drops extras: useFileUpload.tsx:25 reads files?.[0] only; selecting N files uploads the first and silently ignores the rest with no notice. (S3 UX)
- [owner-mgmt] S3 createStudent (students.ts:76): username uniqueness is GLOBAL not tenant-scoped — owner A creating a username already used by owner B's kid gets 409 'Username already taken', leaking cross-tenant username existence (enumeration). Synthetic email <username>@students.talim.local is likewise global.
- [owner-mgmt] S3 createStudent (students.ts:75-83): username 'Ali' passes the case-sensitive username-taken check when 'ali' exists, but the lowercased synthetic email collides, falling into the email branch and returning a misleading 'Email already registered' 409 instead of a username error.
- [owner-mgmt] S3 deleteStudent (students.ts:173-183): 'delete' only soft-deactivates the membership; ContentAssignments, progress, and quiz attempts persist, so a later reactivation/re-add silently restores all prior material access. No hard-delete path and 'delete' terminology is misleading.
- [owner-mgmt] S3 assignContent (assignments.ts:13-18): assigning to a deactivated (active:false) student returns 404 'Student not found' even though the student exists — wrong/misleading error for an inactive learner.
- [owner-mgmt] S3 reset-password & org-rename have no client error feedback: students/page.tsx reset uses onSuccess only (silent failure, dialog never opens on error); settings/page.tsx handleSubmit awaits patch.mutateAsync with no catch (silent fail on rename error).
- [owner-mgmt] S3 deactivate student has no confirmation dialog (students/page.tsx): patchStudent.mutate({active:!s.active}) fires immediately on click — a destructive, content-access-revoking action with no confirm and double-click misfire risk.
- [admin-billing] tenant-shell.tsx:34-36 — inactive-subscription banner text is a hardcoded English literal (no useTranslations), leaks English to uz/ru in an Uzbek-first app. Should be a translated tenant.* key. (S3 i18n)
- [admin-billing] tenant-shell.tsx:23 — banner condition `billing?.subscription && status!=='ACTIVE'` treats a tenant with NO subscription row as fine (no banner), so a sub-less org is never warned. (S3)
- [admin-billing] admin/content.controller.ts:176-186 — deleteGenerated for kind=podcast|quiz|summary calls prisma.X.delete({where:{id}}) with no existence check, so a non-existent id throws Prisma P2025 → 500 instead of a clean 404 (the slideshow branch DOES 404-check). Inconsistent error contract. (S3)
- [admin-billing] billing.controller.ts:15 + subscription/user.ts:38 — a TENANT_OWNER whose req.user.tenantId is unresolved (legacy token) falls through getBillingMe to the user branch and is shown a personal FREE subscription instead of the org's billing; PAST_DUE individuals keep paid-plan limits (only CANCELED downgrades). (S3 edge)
- [xcut-sec] [S3] GENERATION quota mis-metering for question-bank generation. Route POST /tenant/question-banks/:bankId/generate uses enforceQuota('GENERATION') (tenant.routes.ts) but the job records UsageFeature QUESTION_DRAFT, which is NOT in GENERATION_FEATURES (subscription/shared.ts:19-24 = QUIZ_GEN/SECTION_GEN/SUMMARY_GEN/SLIDESHOW_GEN). So bank generation is pre-checked against the GENERATION cap but its own usage never counts toward it -> effectively uncapped after the check.
- [critic] [product] S3 — No notification/inbox system exists anywhere in the schema. Newly-assigned materials and assessments, tutor-request approvals, and password resets are discoverable ONLY by manual refresh (pull). This is the single biggest cross-area UX gap for the B2B flow; couldn't be turned into a behaviour story because there is no code surface to test. (US-XCUT-17)
- [critic] [lifecycle] S3 — No subscription auto-expiry. currentPeriodEnd passing never flips ACTIVE→PAST_DUE (activation is manual-only, no cron). An 'expired' subscription stays ACTIVE indefinitely and the owner keeps full access past period end; conversely there is no scheduled re-check. (US-XCUT-12 EC7)


### S4 — polish  (5)

- [owner-mgmt] S4 blockIndividualContentForOwner (apps/api/src/middleware/tenant.middleware.ts:100): error message references the legacy '/api/tenant/content' path though the API has no /api prefix.
- [owner-mgmt] S4 patchTenantSchema (tenant/shared.ts:28-30): org name is not trimmed, so a whitespace-only name ('   ') passes .min(1) and is stored blank; no max length either (very long names can break header/sidebar layout).
- [owner-mgmt] S4 listContentAssignments (assignments.ts:66): returns learner.email raw, which for email-less kids is the synthetic '<username>@students.talim.local' — leaks the internal synthetic email in the assignments view (the roster hides it, this list does not).
- [xcut-sec] [S4] B2C content reprocess has no quota pre-check while the tenant path does. apps/api/src/routes/content.routes.ts POST /:id/retry has no enforceQuota, whereas tenant.routes.ts tenantContent POST /:id/retry uses enforceQuota('GENERATION'). A FREE individual can retry-spam reprocessing (re-embed/section-gen); only the in-job assertQuota at processContent.job.ts:65-71 (chunks>3) partially bounds it.
- [xcut-sec] [S4] Possible storage-file leak for podcast episode audio on delete. Content/podcast delete cascades DB rows (schema onDelete Cascade) but only content.storagePath (admin/content.controller.ts:55-57) and ContentVideo.storagePath (deleteGenerated:183) are explicitly removed from storage; PodcastEpisode.audioPath .mp3 blobs are not deleted on content/podcast deletion -> orphaned files accumulate.


### Untagged (review)  (35)

- [auth] Password reuse allowed: changePassword (apps/api/src/controllers/auth.controller.ts:221-242) never checks newPassword !== currentPassword. (AUTH-04 EC3)
- [media] OCR region endpoint (POST /content/:id/ocr-region) has NO quota/assertCanGenerate guard (content.routes.ts:32) — a quota-exhausted INDIVIDUAL/owner can spam the vision-OCR model unmetered-against-quota (usage recorded for billing only, not gated). content.controller.ts:268 ocrPdfRegion.
- [media] Quiz has no FAILED state: when AI generates 0 valid questions the generateQuiz job throws but the Quiz row persists with 0 questions and no status field (formatQuiz has no status) — indistinguishable from 'still generating', submit returns 400 'still being generated' forever, UI polls indefinitely. quiz.controller.ts + generateQuiz.job.ts:85,123.
- [media] Video createVideo has NO in-progress (409) guard unlike podcast: a second regenerate:true POST while GENERATING re-enqueues a duplicate job and re-charges GENERATION+VIDEO quota; two jobs race on the same segments row. video.controller.ts:101-149.
- [media] Chat mid-stream server error: chat.controller.ts:309-313 writes data:{"error":"Stream failed"} after headers are flushed; useChatStore.ts:141-146 appends the literal English 'Stream failed' to the assistant bubble (un-localized, leaks on uz/ru) and it is NOT persisted server-side, so it vanishes on reload (ghost message).
- [media] Chat streamMessage (useChatStore.ts:80) has no AbortController — navigating away/unmount calls reset() but the fetch keeps reading SSE in the background, writing to a reset store (orphaned work, wasted tokens).
- [media] Slides 'Regenerate' is effectively a no-op: createSlides (slides.controller.ts:48-53) short-circuits and returns the cached READY deck, ignoring a regenerate intent AND a changed audience — clicking Regenerate produces no fresh deck and spends no quota.
- [media] Manim asset URL lifecycle: resolveManimAsset (renderManim.job.ts:126) only scans the most recent 200 Bull jobs; once evicted, GET /chat/visual/manim/:jobId/asset 404s, so older chat visuals break over time.
- [media] Video status can stick at GENERATING forever if the worker dies without firing the Bull 'failed' event — useVideo polls every 4s with no max-poll cap (unlike useSlides which caps at ~8 polls).
- [media] Per-episode podcast regenerate (regenerateEpisode) flips the WHOLE podcast status to GENERATING (podcast.controller.ts:160), which can interrupt/relabel a currently-playing different episode; it also charges a full PODCAST quota unit for one episode.
- [media] PodcastPlayer play/pause button (PodcastPlayer.tsx:125) is a bare glyph (▶/⏸) with no aria-label — screen readers cannot name it (a11y).
- [media] Quiz submit has no double-submit/idempotency guard — double-click creates two QuizAttempt rows and updates progress twice (quiz.controller.ts submitQuiz).
- [media] File/audio streaming (sendContentFile, streamEpisodeAudio, streamVideoSegmentAudio, getManimAsset) buffer the whole file into memory with no HTTP Range/206 support — large PDFs/audio load fully per request (perf).
- [assess] Leaderboard self-highlight never works: LeaderboardTable accepts `highlightId` (leaderboard-table.tsx:11) but no caller passes it — neither the learner page (learner/assessments/page.tsx:20) nor the owner page (tenant/assessments/page.tsx:83) — so the current learner is never highlighted on their own board.
- [assess] Stale-cache bugs in hooks/useAssessments.ts: usePatchBankQuestion (line 80) and useGenerateBankQuestions (line 65) invalidate only the questions list, not ['tenant','question-banks'], so the bank sidebar approvedCount/questionCount badges go stale after approve/reject/generate; useAssignAssessment (line 154) invalidates NOTHING, so assignmentCount and the results learner list stay stale after assigning (violates apps/web/CLAUDE.md §4 invalidation rule).
- [assess] Data-lifecycle: editing or REJECTING a bank question after it is in a PUBLISHED assessment retroactively mutates the live assessment (the AssessmentQuestion link is by id, no snapshot) — learner.ts:66 fetches assessment questions with no status filter, so a REJECTED question is still served to learners, and already-graded attempts no longer match their grading basis.
- [assess] Assigning a DRAFT assessment silently does nothing for the learner: assignAssessment (assessments.ts:48) has no status guard and will create assignments for a DRAFT assessment, but listLearnerAssessments filters status:'PUBLISHED' (learner.ts:14) and submit requires PUBLISHED (learner.ts:66) — the owner gets no feedback that the assignment is inert.
- [learner] Leaderboard self-highlight never wired: apps/web/app/[locale]/(learner)/learner/assessments/page.tsx ~line 16-20 renders <LeaderboardTable rows mode /> without highlightId, so the viewing learner's own row is never highlighted (the requested self-highlight feature is dead). Fix: pass highlightId={useAuthStore(s=>s.user)?.id}.
- [learner] Forced password change not enforced: apps/web/contexts/learner-shell.tsx has no mustChangePassword guard and apps/web/components/learner/student-welcome-banner.tsx handleDismiss lets a kid dismiss the nudge and use the full workspace with mustChangePassword still true. Product model says the kid is blocked until changed; implementation is a soft dismissible banner only.
- [learner] Over-attempt concurrency race: apps/api/src/services/assessment/learner.ts submitLearnerAssessment (~line 72 pre-check and ~line 130 inside $transaction) both gate on assessmentAttempt.count() >= maxAttempts then create(). Under read-committed isolation with no row lock or unique attempt-index constraint, two concurrent POSTs at maxAttempts=1 each read count 0 and both insert, exceeding the limit.
- [learner] GAME leaderboard cheatable via client-trusted timings: apps/api/src/services/assessment/shared.ts computeGamePoints consumes body.timings[questionId] and the leaderboard tiebreak uses body.durationMs, both fully client-supplied with no server-side authoritative timer. A crafted POST .../attempts with timings:{...:0} and durationMs:0 maximizes speed points and wins all ties.
- [learner] Possible peer-email exposure on leaderboard: apps/api/src/services/assessment/shared.ts:247 learnerDisplayName = name ?? username ?? email. A classmate with null name and username but a real email has that email shown to the whole class.
- [learner] Client/server secondsPerQuestion default mismatch: game-quiz-player.tsx counts down with ?? 20 while assessment/learner.ts scores against secondsPerQuestion ?? 30. When secondsPerQuestion is null, displayed timer (20s) and scoring limit (30s) disagree, skewing speed points.
- [xcut-quality] packages/ui/components/sheet.tsx:45-76 — the mobile drawer Sheet has NO Esc handler, NO focus trap, NO initial-focus move, NO focus restore, and the panel <div> lacks role="dialog"/aria-modal/aria-labelledby (SheetTitle is sr-only but unlinked). Keyboard/SR users can tab behind the backdrop and aren't told it's a dialog. Also no body scroll-lock.
- [xcut-quality] components/account/upgrade-dialog.tsx:60-78 — UpgradeDialog sets role="dialog" aria-modal="true" but does NOT trap Tab, move focus in, handle Esc, or set aria-labelledby on its <h2> headline. Opens on every quota 402 (high-traffic).
- [xcut-quality] components/deck/DeckPlayer.tsx:163 — carousel root is tabIndex={0} with outline-none, removing the visible keyboard-focus indicator (WCAG 2.4.7).
- [xcut-quality] components/tenant/activity-heatmap.tsx:18-25 — 35 day-cells are color-only <div>s (active=color) with only a title attr; no role/aria-label/text, so active days are invisible to screen readers (WCAG 1.4.1). Also the active-day Set is keyed in UTC (toISOString) while cells are built from local new Date(), so near-midnight a day can mis-highlight (TZ off-by-one).
- [xcut-quality] lib/format-relative-time.ts:41-63 — no NaN/invalid-date guard: an invalid date yields diffMs=NaN and for uz renders "NaN soniya oldin" (en/ru render "in NaN seconds").
- [xcut-quality] app/[locale]/(tenant)/tenant/students/page.tsx:172,240 + tenant/progress/page.tsx:69 + activity-heatmap.tsx:12 — toLocaleDateString() called with no locale arg → dates render in the OS/browser locale, not the app locale (extends XCUT-01·EC3 to 4 surfaces).
- [xcut-quality] app/[locale]/(tenant)/tenant/students/page.tsx:210-270 — the mobile card grid (grid md:hidden) maps filteredStudents with NO isLoading skeleton and NO empty-state guard (only the desktop <table> branch handles those), so mobile shows blank while loading and nothing when zero students.
- [xcut-quality] components/layout/resizable-split.tsx — minLeft 320 + minRight 280 + 6 = 606px exceeds phone widths; the degenerate clampLeftWidth branch can collapse the right (AI-tutor) pane to ~0 on phones. Confirm the learning view swaps to a stacked/drawer layout under md rather than rendering ResizableSplit. The divider (role=separator) is also pointer-only — not focusable, no Arrow-key resize (keyboard a11y gap).
- [xcut-quality] components/deck/DeckPlayer.tsx:145-153 — fullscreen toggle calls requestFullscreen/webkitRequestFullscreen on a generic element, which is undefined on iOS Safari (only <video> can fullscreen on iPhone) → button silently no-ops on iOS.
- [xcut-quality] components/deck/Slide.tsx:66 (Cover "{estimatedMinutes} min") and Slide.tsx:356 (Callout fallback slide.title ?? slide.variant) — hardcoded English "min" and raw variant enum (tip/warning/note/key/example) leak untranslated into uz/ru.
- [xcut-quality] components/language-switcher.tsx:26-28 — locale switch uses window.location.assign (full reload), discarding all unsaved client state (form inputs, chat draft, scroll, open dialogs) and possibly dropping query/hash params; conflicts with the 'locale switch mid-flow keeps state' requirement. PATCH /auth/me failure is also swallowed silently (.catch(()=>{})).
- [xcut-quality] No skip-to-content link found anywhere in app/components — keyboard users tab through the full nav on every page (WCAG 2.4.1).

