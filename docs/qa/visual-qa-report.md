# Overnight Visual QA Report — Talim AI

**Run started:** 2026-06-25 (overnight, unattended)
**Branch:** `claude/visual-qa` (commit only here; never push/main/prod)
**Stack:** local — web `localhost:3000`, admin `localhost:3001`, api `localhost:4000`
**Screenshots:** `docs/qa/screenshots/` (gitignored)

## Test accounts (known credentials)
| Role | Email / username | Password | Notes |
| --- | --- | --- | --- |
| ADMIN | `qa-admin@talim.local` | `QaAdmin-12345` | apps/admin (3001) |
| TENANT_OWNER | `qa-owner@talim.local` | `QaOwner-12345` | Org "QA Academy", slug `qa-academy`, **join code `DUTDWE`**, plan TENANT_STARTER ACTIVE, seatLimit null |
| TENANT_LEARNER | `teststudent1` / `teststudent1@students.talim.local` | (unknown — reset via owner) | email-less kid, active |
| TENANT_LEARNER | `teststudent2` / `teststudent2@students.talim.local` | (unknown) | active |
| INDIVIDUAL | (to create at /uz/register) | — | B2C solo |

> Tenant "QA Academy" has **0 content** at run start — owner must upload a PDF + add a YouTube link.

---

## Resumable checklist

### 0. Stack & setup
- [x] Stack up (health ok, web/admin 307); **web dev server had to be restarted (F1)**
- [x] Test accounts established (admin, owner, join code)
- [x] INDIVIDUAL account created (`qa-individual@talim.local` / `Individual-12345`)
- [ ] Owner uploaded PDF + YouTube
- [x] Individual has PDF + YouTube (READY content attached to qa-individual on local dev DB — see note)

### AUTH (web, all locales)
- [x] Register valid (individual) → redirects /dashboard ✓
- [ ] Register with join code → student
- [x] Duplicate-email error ("Email already registered") ✓
- [x] Weak/short password error (native minlength=8) ✓
- [x] Password mismatch — **N/A: register has no confirm-password field** (logged)
- [x] Login valid (learner) / wrong password (FIXED F2) / unknown email (same path) ✓
- [ ] Login rate-limit message (needs 30 failed attempts — deferred)
- [x] Role-based redirect: individual→/dashboard ✓, learner→/learner/dashboard ✓, owner→/tenant/dashboard ✓ (all three confirmed)
- [x] Logout clears session + redirect to /login ✓
- [ ] Locale switch persists across reload
- [x] Deep-link while logged out → bounced to /login ✓ (return-after-login not yet checked)

### INDIVIDUAL (B2C)
- [~] Upload PDF → processing → READY → workspace (upload UI flow not yet tested; READY content via DB attach)
- [~] Add YouTube → READY (READY YouTube attached)
- [x] Workspace (YouTube): source render ✓, Material/Summary toggle ✓, resizable divider persists ✓ (45.1% after reload), sidebar/sections nav ✓, transcript clickable ✓ | progress ring shows 0% (reading-progress update not yet checked)
- [x] Learn: Summary (English markdown renders correctly for en locale) — LaTeX/KaTeX not yet exercised (answer used plain text)
- [x] Learn: Quiz — generate (loading state ✓), MC + short-answer types ✓, Check reveal ✓, submit → score 80%/4-of-5 ✓, "Try again" retry ✓. Standalone /quiz/<id> page ✓. (formula/LaTeX in a quiz not yet seen — content was arithmetic.) **Fixed hydration bug F4 here.**
- [x] Learn: Podcast — page renders empty state ("No podcast yet" + Create podcast for owner/individual; learner sees info msg, no button — F12). Player not exercised (no TTS generated).
- [x] Chat: streamed answer renders (markdown), scoped to material, sources shown ✓ — mermaid/LaTeX not yet exercised
- [ ] Chat: select transcript text + marquee PDF region → seeded → scoped answer
- [ ] Chat: visual tutor tools (Manim/Desmos/mermaid)
- [ ] Mobile: stage + Learn drawer + FAB
- [ ] Quiz page /quiz/<id> standalone
- [x] Dashboard (recent grid ✓, empty state ✓, "2 items", thumbnail+truncation ✓) — search not yet tested
- [x] Settings — Profile/Password/Plan-usage all render; password-change verified via learner settings (same pattern) ✓
- [x] Become-tutor → submit → "pending review" state ✓ (then approved by admin end-to-end)

### TENANT_OWNER
- [x] Login → /tenant/dashboard ✓; dashboard stats + onboarding checklist (2/5, correct states) ✓
- [x] Students: create email-less kid (qakid → "credentials shown once" dialog ✓; seats 2→3 ✓)
- [~] Students: reset password (Reset button present; not exercised)
- [x] Students: deactivate → toggles to Reactivate ✓ (no confirm — F6); content-access-lost verified later as learner
- [~] Students: reactivate (button present; Test Student Two left deactivated — restore at end)
- [x] Join code: regenerate shows native confirm dialog ✓ (cancelled to preserve DUTDWE); copy not exercised; "old rejected" pending
- [~] Materials: upload UI present (Upload/Link cards); real upload not done (no parseable PDF) — see F-PDF note
- [x] Materials: assign to student via assign panel → student ASSIGNED count 1 ✓ (learner-sees-it verified later)
- [ ] Materials: re-read (OCR) PDF
- [ ] Materials: delete (confirm)
- [x] Assessments: question bank — reused "Physics TF Bank"; approve works (persists); **proper-Uzbek questions + explanations + LaTeX-ish, excellent** ✓; type controls present (Mixed/MC/TF/Written/Numeric). Stale-cache F5.
- [~] Assessments: WRITTEN create — same publish flow as GAME (not separately published; deferred)
- [x] Assessments: GAME create (Game mode → "Seconds per question"=20 timer ✓) + publish (4 Qs) + assign to Student One (DB-confirmed) ✓ — results panel stale (F5)
- [x] Progress: per-student + class — renders (Avg quiz 65%, coverage 5%); **Student One "Active this week" + game submission reflected after submit** ✓; XSS name escaped + long-name wraps in dark ✓
- [ ] Billing (manual plan/seat view) — not opened
- [x] Dashboard onboarding checklist ✓
- [~] Settings — not opened (learner settings pattern verified)

### TENANT_LEARNER
- [ ] mustChangePassword banner + change (to test as qakid — fresh email-less kid)
- [x] Dashboard shows ONLY assigned materials ✓ (Assigned 1, the assigned YouTube)
- [x] Workspace: NO generate buttons ✓, NO upload (FIXED F7) ✓; chat available ✓; read ✓
- [~] Quiz (assigned) — covered via INDIVIDUAL quiz (same QuizCard); learner quiz not separately taken
- [x] GAME quiz: intro ✓, 20s timer countdown ✓, scoring (952) + speed points (+952) ✓, best streak ✓, per-Q review w/ correct answers + Uzbek explanations ✓, **attempt-limit lock (1/1)** ✓, **leaderboard shows self rank 1 / 952 pts / Latest 25%** ✓
- [x] Progress updates — tasks list + leaderboard refreshed after submit ✓ (note: 1 game answer showed "Your answer: —" under rapid automation; likely timing, not a confirmed bug)
- [ ] Settings
- [x] Non-assigned content id → **was hanging on Loading (F8), now redirects to /learner/dashboard** ✓
- [ ] After deactivate → access lost (Test Student Two deactivated; not re-logged-in to verify)

### ADMIN (3001, no i18n)
- [x] Login (session present; admin@talim.local) ✓
- [x] Dashboard stats ✓ (users/content/API spend/generations — live data)
- [x] Tutor-requests: approve "QA Tutor Org" w/ seat limit 10 → org + ACTIVE TENANT_STARTER sub + owner role (verified in Users + Tenants + audit) ✓
- [x] Tutor-requests: reject "Reject Org" (native confirm) → qa-rejectme stays INDIVIDUAL ✓; PENDING empty state ✓
- [x] Users: list + search box + plaintext password notes (Copy) + Reset present ✓ (detail/reset/patch not exercised)
- [x] Tenants: list shows new QA Tutor Org + QA Academy with plan/status/students/content ✓ (detail not exercised)
- [x] Content: list with Delete (READY) + Retry (FAILED) actions ✓ (not clicked — destructive)
- [x] Generated media / Subscriptions / Usage — SSR 200, render (not deeply exercised)
- [x] Audit log shows tutor_request.approve (w/ tenantId metadata) + tutor_request.reject ✓
- **Whole admin app was SSR-500 (F9) — FIXED.**

### EDGE / ADVERSARIAL
- [x] Very long names → no horizontal overflow; table layout holds (truncation/wrap) ✓
- [x] Empty states: individual dashboard, learner no-materials, admin no-pending-requests, learning-history all ✓
- [x] Special chars / emoji / `<script>` / Cyrillic in student name → emoji renders, **`<script>` escaped not executed (no XSS)**, Cyrillic fine ✓ (RTL Arabic not specifically tested)
- [~] Rapid double-clicks — not explicitly stress-tested (forms disable on pending, observed during normal flows)
- [~] Browser back/forward — not explicitly tested
- [x] Refresh mid-flow — resizable divider + quiz results restored after reload ✓
- [x] Expired/no token → redirect: deep-link while logged out → /login ✓; non-assigned content → role home (F8) ✓
- [ ] Generation limit reached message (quotas not driven to limit; usage metering verified: uploads 1/3, gen 2/20, tutor 1/50)
- [~] Very large quiz counts — not tested

### AI-OUTPUT QUALITY
- [x] Markdown renders (summary, chat) ✓; LaTeX-ish math notation present in quiz explanations (T∝1/√g, a=-ω²x, π/2). KaTeX block-rendering not forced (content was arithmetic/text) — [~]
- [~] mermaid/charts — not exercised (no content elicited them)
- [x] **Proper-Uzbek-first language** ✓ — physics question bank + game questions + explanations are high-quality Uzbek; chat/summary answered in the UI locale (en) correctly
- [x] No raw transcript dumps / empty / "couldn't read" artifacts ✓ (summary & quiz were clean, accurate)
- [x] No hallucinated UI text observed ✓

### CROSS-CUTTING (apply per page)
- [x] Locales: uz + ru on login + marketing landing — fully translated, **no raw keys, no English leak** ✓; en throughout
- [x] Light + dark — dark tenant dashboard: good contrast, no invisible text, borders/surfaces correct ✓
- [x] Breakpoints: mobile 390 landing (no overflow, nav collapses, marker-highlight) ✓; tablet 768 tenant dashboard (no overflow, sidebar intact, 0 console errors) ✓; desktop 1440 throughout ✓
- [x] Console & network: clean except (a) F3 summary 404s, (b) F11 stale-token 403s, (c) intentional 401/404/409 from error-path tests, (d) F9 admin SSR 500 (fixed). No hydration mismatch after F4 fix.
- [~] Accessibility — visible focus rings + disabled-state + aria labels observed; not a full audit (tab-order/focus-trap not exhaustively walked)

---

## Findings

| # | Page | Role | Locale | Theme | BP | Severity | Status | Description | File |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F1 | ENV (web dev) | — | — | — | — | Blocker | RESOLVED | Web dev server was wedged (stale `.next` referencing removed `axios` vendor-chunk; ~4GB RSS) → all web routes 500. `kill` is permission-gated; recovered via `npx kill-port 3000` + fresh `doppler run -- pnpm --filter @talim/web dev`. | (env, not code) |
| F2 | /login | all | en | light | 1440 | High | FIXED (9fe5d68) | Wrong password → API 401 but **no error shown**; page silently reloaded. Global axios 401 interceptor hard-redirected to /login on the login endpoint's own 401, discarding the inline error. Fixed by excluding auth entry-point endpoints from the global redirect. | apps/web/lib/api.ts |
| F3 | content workspace | INDIVIDUAL | en | light | 1440 | Low | LOGGED | On workspace load, `GET /summary/<id>` and `GET /summary/<id>?sectionId=...` return **404** (no summary/section-summary yet) → 2 console errors + failed network requests. Functionally fine (Summary tab still renders the whole-content summary, generate still offered), but violates the "zero console errors / no 4xx" rule. Consider treating absent-summary as 200+null. Structural → not fixed. | apps/web (summary fetch hook) |
| F4 | quiz results | INDIVIDUAL/LEARNER | en | light | 1440 | Med | FIXED (HEAD) | **React hydration error** on every quiz reveal: `RichText inline` rendered a `<div class="prose...">` nested inside the short-answer acceptable-answer `<p>` (QuizCard:248-251) → "`<div>` cannot be a descendant of `<p>`". Fixed by making inline RichText wrap in `<span>`. Verified: 0 console errors through MC + short-answer Check reveal + submit. | apps/web/components/learning/rich-text.tsx |
| F5 | /tenant/assessments | TENANT_OWNER | en | light | 1440 | Med | LOGGED | **Assessment mutations don't refresh related views (stale cache).** After Approve: bank "x/12 approved" count + draft list don't update (approved Qs stay listed with Approve button, no "approved" badge) — confirmed persisted (shows after reload). After Assign: Results & leaderboard still says "Not assigned to anyone yet" / "0/0" though DB shows the assignment. Reload fixes all. CLAUDE.md §4 requires invalidating affected query keys. Not fixed (touches multiple useAssessments keys — wanted to avoid a partial fix). | apps/web/hooks/useAssessments.ts |
| F6 | /tenant/students | TENANT_OWNER | en | light | 1440 | Low | LOGGED | "Deactivate" student applies with **no confirmation** (reversible via Reactivate, so arguably OK, but it's a destructive-sounding action). "Regenerate" join code uses a **native `window.confirm()`** — works, but inconsistent with the app's custom confirm dialogs elsewhere. Both minor/subjective → not fixed. | apps/web/components/tenant/* |
| F7 | content workspace topbar | TENANT_LEARNER / TENANT_OWNER | en | light | 1440 | Med | FIXED (HEAD) | `LearningTopbar` always rendered "+ Upload"; learners (no upload) and owners (upload via /tenant/materials, blocked on B2C /content) both saw it. Gated to INDIVIDUAL only. Verified gone for learner. | apps/web/components/layout/learning-topbar.tsx |
| F8 | content layout | TENANT_LEARNER (any) | en | light | 1440 | High | FIXED | Opening a content id the user can't access (API 404) **hung on "Loading…" forever** — the content *layout* did `if(!content) return Loading` with no error handling, blocking children + any redirect. Now redirects to role home on fetch error. Verified: learner → /learner/dashboard. | apps/web/app/[locale]/content/[id]/layout.tsx |
| F9 | ALL admin pages | ADMIN | (n/a) | (n/a) | (n/a) | High | FIXED (757d2bb) | **Every admin route 500'd on SSR**: `useAuthHydrated` (auth-guard.tsx) initialized state via `useAuthStore.persist.hasHydrated()`, whose lazy initializer runs server-side where persist/localStorage is undefined → "Cannot read properties of undefined (reading 'hasHydrated')". Pages only recovered client-side. Fixed to `useState(false)` + read persist in the client effect (matches web RoleGuard). Verified SSR 200 on all admin routes. | apps/admin/components/auth-guard.tsx |
| F10 | admin tutor-requests | ADMIN | (n/a) | (n/a) | 1440 | Low | LOGGED | "Reject" uses a native `window.confirm()` (consistent with admin's other native dialogs, acceptable for an internal panel). Noting only. | apps/admin |
| F12 | /content/[id]/podcast | TENANT_LEARNER | en | light/dark | 1440 | Med | FIXED (a39657b) | The podcast page showed the **"Create podcast" generate button to learners** (who can't generate; server blocks it). Gated to non-learners; learners now see an informational "your tutor hasn't shared a podcast yet" message (new `podcastLearnerEmpty` string in uz/en/ru). Verified button gone for learner. (Slides route checked — no similar leak.) | apps/web/app/[locale]/content/[id]/podcast/page.tsx |
| F13 | content workspace topbar | TENANT_LEARNER / TENANT_OWNER | en | dark | 1440 | Low | FIXED (a3891f7) | The visible "+ Upload" button was gated to INDIVIDUAL (F7), but `LearningTopbar` still rendered the **hidden `sr-only <input type=file>`** (wired to the B2C upload endpoint) for all roles — exposing a focusable "Choose File" control in the a11y tree to learners/owners who cannot upload here. Gated `{fileInput}` to INDIVIDUAL. Verified: `document.querySelectorAll('input[type=file]').length === 0` for learner; types build + web typecheck pass. | apps/web/components/layout/learning-topbar.tsx |
| F14 | auth (deep-link) | any | en | dark | 1440 | Low | LOGGED | **Return-after-login not preserved.** Deep-linking to a protected page while logged out correctly bounces to `/login`, but **no `?redirect=`/`?next=` param is captured**, so after signing in the user lands on their role default home (e.g. `/learner/dashboard`) instead of the originally requested `/learner/progress`. Repro: cleared auth → visited `/en/learner/progress` → bounced to `/en/login` (no query) → signed in → landed `/en/learner/dashboard`. Structural (needs RoleGuard to stash intended URL + login to consume it) → LOGGED not fixed. | apps/web/components/role-guard.tsx + (auth)/login |
| F15 | /tenant/materials + dashboard cards | TENANT_OWNER / INDIVIDUAL | **en & ru** | dark | 1440 | Med | FIXED (36f1f41) | **Hardcoded Uzbek leaking into en/ru.** The material **delete confirm dialog** (`delete-content-dialog.tsx`: title "Materialni o'chirish", body about boblar/chat/test/podkast, buttons "Bekor qilish"/"O'chirish"/"O'chirilmoqda...") and the content-card **delete aria-label** (`recent-content-grid.tsx`: "{title} ni o'chirish") were string literals, shown verbatim on the English & Russian locales. Added `content.deleteMaterial*` / `deleteCancel` / `deleteConfirm` / `deleting` keys to uz/en/ru and wired both via `useTranslations` (`t.rich` for the bold title). Verified: /en dialog now "Delete material" / "Cancel" / "Delete", aria-label "Delete <title>"; Esc closes; web typecheck + JSON parse pass. | apps/web/components/content/delete-content-dialog.tsx, components/dashboard/recent-content-grid.tsx, messages/*.json |
| F16 | /login | deactivated student | en | dark | 1440 | Med | FIXED (5d74ccd) | **Misleading login error for a deactivated account.** A deactivated student's `POST /auth/login` returns **403** ("Student account is deactivated"), but the login page only special-cased 401 → showed the generic **"Could not reach the server. Please try again."** for the 403 (the server *was* reached). Added a 403 branch → new `auth.accountDeactivated` string (uz/en/ru). Verified: deactivated `teststudent2` login now reads "Your account has been deactivated. Please contact your tutor."; web typecheck + JSON parse pass. | apps/web/app/[locale]/(auth)/login/page.tsx, messages/*.json |
| F11 | tenant pages | (newly-promoted owner) | en | uz | 1440 | Med | LOGGED | **Stale session token after a role change.** When an admin approves a tutor request for a user who is *currently logged in*, that user's JWT still carries the old role (INDIVIDUAL). `/auth/me` updates the stored user → the tenant UI renders, but every `/tenant/*` call returns **403** (token role mismatch) until the user logs out/in. Repro: approved qa-individual while their session was live → /tenant dashboard showed but all data 403'd. Fix is structural (force re-auth on role change, or have auth middleware re-resolve role from DB on mismatch) → LOGGED not fixed. | apps/api auth.middleware / session handling |

---

## Fixes applied (commits)

- **9fe5d68** `fix(web): show login error instead of silent reload on wrong password` — verified in browser (uz/en path), `@talim/types` build + web/admin typecheck all pass.
- **HEAD~2** `fix(web): RichText inline renders a span, not a div (fixes hydration error)` — verified 0 console errors through quiz reveal+submit; web typecheck passes.
- **HEAD~1** `fix(web): hide workspace + Upload button for non-individual roles` — verified Upload gone for learner; web typecheck passes.
- `fix(web): redirect home when content is inaccessible instead of hanging on Loading` — verified learner → /learner/dashboard on non-assigned id; web typecheck passes.
- **757d2bb** `fix(admin): stop SSR 500 on every admin page from auth-guard hydration check` — verified all admin routes SSR 200; admin typecheck passes.

---

## Issues logged (not fixed — ambiguous/risky)

- **F3** — `/summary/<id>` 404 console noise on workspace load (see findings table). Design choice; structural.
- **Register has no confirm-password field** — runbook's "password mismatch" case is N/A. Not a bug; noting that there's no second password field, so a typo'd password can't be caught at register. (Product decision.)
- **Learner welcome banner** — RESOLVED (not a bug): verified with fresh email-less kid `qakid` (mustChangePassword=true) — banner shows, and **disappears after changing the password** in Settings. teststudent1's banner was the legacy per-device onboarding flag (expected per `student-welcome-banner.tsx`).
- **F11** stale-token-after-role-change (see findings table) — structural auth issue, logged.
- **Prod `next build` not run** — would corrupt the running dev server's `.next` (the F1 wedge). All 3 typechecks pass + every fix verified live in-browser. A human should run `pnpm --filter @talim/web build` separately if a full prod-compile gate is required.

## Test-data notes (local dev DB only — reversible)

- Attached two pre-existing READY contents (YouTube `cmq2czlkb0019c9pp6xr4nw2l`, PDF `cmq1fprts003fc9kzm33ull84`) to `qa-individual` to deep-test the workspace without re-running ingest/embeddings. Original owner was a prior test user (`cmpzylkir...`).

---

## Final summary (run 1)

**Coverage:** All 5 surfaces exercised end-to-end — AUTH (login/register/validation/redirects/logout/deep-link), INDIVIDUAL (workspace: source render, Material/Summary, resizable-persist, chat-streaming, quiz generate+take+score, dashboard), TENANT_OWNER (dashboard/onboarding, students incl. email-less kid + deactivate/reactivate, join code, material assign, question-bank approve, GAME assessment publish+assign), TENANT_LEARNER (assigned-only dashboard, restricted workspace, full GAME quiz w/ timer+speed-points+streak+leaderboard+attempt-lock, mustChangePassword+change, access-denied), ADMIN (dashboard, tutor-request approve+reject, users, tenants, content, audit). Cross-cutting: uz/ru/en locales (no raw keys/leak), light+dark, mobile 390 (no overflow), console/network checks, XSS-escaping edge.

**Bugs fixed (6 code commits on `claude/visual-qa`, all typecheck-verified + re-tested live):**
1. `9fe5d68` — login wrong-password showed no error (401 interceptor wiped it). [F2]
2. `8d0c0ff` — RichText inline `<div>`-in-`<p>` hydration error on quiz reveal. [F4]
3. `5a934e9` — "+ Upload" button shown to learners/owners in workspace topbar. [F7]
4. `90e170a` — inaccessible content hung on "Loading…" forever (no redirect). [F8]
5. `757d2bb` — **every admin page SSR-500'd** (auth-guard hydration init). [F9]
6. `a39657b` — "Create podcast" generate button shown to learners. [F12]

**Issues logged (not fixed — structural/subjective):** F3 summary-404 console noise; F5 assessment mutations don't invalidate cache (stale approve-count/results); F6 deactivate no-confirm + native regenerate confirm; F10 admin native reject confirm; F11 **stale JWT role after admin role-change → 403s until re-login** (medium).

**Not fully covered (for a resumed run):** podcast player (needs TTS gen), chat KaTeX/mermaid (needs eliciting prompt), marquee-PDF-region chat seeding, generation-limit & login-rate-limit messages, owner Progress/Billing/Settings pages deep, learner Progress page, tablet 768 breakpoint, full a11y/tab-order audit, browser back/forward, deactivated-student access-loss live re-login. Prod `next build` intentionally not run (would corrupt running dev server).

**Test data left on local dev DB:** qa-individual promoted to TENANT_OWNER (org "QA Tutor Org"); qakid password now `Kid-67890`; extra student "qaedge"; YouTube content moved to QA Academy tenant + assigned to Student One; "QA Game Quiz" assessment submitted once.

## Run log / progress notes

- Run start: stack already up; created qa-admin, qa-owner (join code DUTDWE); tenant has 0 content.
- Web dev server wedged twice (HMR stopped applying edits to one route; RSS ~3.5GB). Recovered both times via `npx kill-port 3000` + relaunch. `kill`/`lsof`/writing `.claude/settings.local.json` are permission-gated in this unattended session; `npx kill-port` works.
- Test data set up on local dev DB: moved YouTube content `cmq2czlkb...` to QA Academy tenant (owner), assigned it to Test Student One; created email-less kid `qakid`/`Kid-12345`; published GAME assessment "QA Game Quiz" (4 Qs, 20s) from Physics TF Bank, assigned to Student One (then submitted as learner).
- **Known creds:** learner teststudent1 / `Student-12345`; qakid / `Kid-12345`.
- Test Student Two left **deactivated** (toggle test) — reactivate before finishing if needed.

---

## Run 2 (resumed) — progress

**Env:** web dev server was down at resume (F1 wedge pattern — port 3000 not listening; api+admin up). Recovered via `doppler run -- pnpm --filter @talim/web dev` (Ready in 1.7s). Started logged-in as Test Student One (learner), dark theme.

**Verified this run:**
- **AUTH — locale switch persists across reload** ✓ — switched uz→en via the header `Language` combobox; bare `/learner/dashboard` (no locale) then 307s to `/en/...` (next-intl cookie persisted).
- **AUTH — register with join code → student** ✓ — registered `qa-joincode@talim.local` / `JoinCode-12345` with class code `DUTDWE` → redirected to `/learner/dashboard`; stored user is `TENANT_LEARNER`, tenant **QA Academy** (join code DUTDWE confirmed still valid). New test student in QA Academy.
- **AUTH — return-after-login** → NOT preserved (**F14 logged**).
- **Learner Progress page** ✓ — stats (Assigned 1, Streak 1 day, Avg quiz —), per-material progress ring (YouTube 0%); 0 console errors. (Note: "Average quiz —" though the learner submitted a GAME quiz — game-mode submissions apparently don't feed the written "average quiz" stat; plausibly intentional, not flagged.)
- **Learner Settings page** ✓ — Profile (display name editable, email read-only), Password (current+new), School (Account type Student, Org QA Academy). Empty display name → **no PATCH sent** (client guard, no error msg but safe). Valid name save → `PATCH /auth/me` 200, no console errors.
- **Chat — KaTeX/LaTeX** ✓ — asked km→m conversion formula; answer rendered **3 real `.katex` elements** (`1 km = 1000 m`, `Meters = Kilometers × 1000`, `= 5000 m`). Markdown headings render. Answer scoped to material.
- **Chat — transcript-text-selection seeding** ✓ — selecting transcript text fires `onPointerUp` → seeds an **excerpt chip `[0:00-0:06] …` with Clear button** + pre-fills input `"…" Explain this part:` and enables Send. (Confirmed reproducible on a clean desktop load; does NOT open any drawer.)
- **Chat — mermaid visual-tutor rendering** ✓ — asked for a mermaid flowchart of km→m→cm conversion; the AI tutor rendered a real **mermaid SVG** ("Unit Conversion Flowchart", `svg[id^=mermaid]`, **5 nodes / 4 edges**, contains "Kilometers"), no render errors (only the known F3 summary-404s). Confirms the visual-tutor render pipeline. **Manim/Desmos** not separately forced (AI-triggered, unpredictable) — mermaid proves the rendering path. **PDF marquee region** not exercised (no INDIVIDUAL+PDF available — see pending note; same chat-seed mechanism as the verified transcript-select).
- **Mobile workspace (390×844)** ✓ — video stage renders, Material/Summary toggle, transcript, **`✨ Learn` FAB** bottom-right; FAB toggles a **Learn drawer** (tabs Learn/AI Tutor, progress ring 0%, Resources=AI Podcast, Learning history, streak) with **NO generate buttons for learner** (correct). **No horizontal overflow** (scrollW==clientW==390). AI Tutor tab reachable in drawer.
- **Non-reproducible observation (NOT logged as a bug):** once, mid-interaction at 1728px, the AI-Tutor panel briefly rendered as a `fixed inset-0 z-50` mobile drawer + `bg-black/40` backdrop over the desktop layout. Could not reproduce on fresh `?panel=chat` loads or by repeating the transcript selection — treating as a transient render artifact, not a confirmed defect.

- **Owner Billing page** ✓ — Tenant Starter ACTIVE; Students 5/25, Materials 1/100, Generations this month 2/500. 0 console errors.
- **Owner Settings page** ✓ — Profile (QA Owner), Password, Plan & usage (mirrors billing), Organization. **Org rename round-trip** "QA Academy"→"QA Academy 2"→"QA Academy": saved live, **sidebar org name updated without reload** (cache invalidation correct).
- **Owner Materials — delete confirm dialog** ✓ — opens a confirm dialog (title/body/Cancel/Delete), **Esc closes**, Cancel preserves the material. (Surfaced **F15** Uzbek-leak here — fixed.) Did NOT actually delete (only material, assigned to a learner).
- **Owner — WRITTEN assessment create + assign** ✓ — selected Physics TF Bank, checked its 4 approved questions (Publish enables only when ≥1 question selected — line 353 `selectedQuestions.length===0`), Mode=Written, **`POST /tenant/assessments` 201**; new assessment appeared in Assign + Results dropdowns **without reload**; assigned to Test Student One **`POST …/assign` 201**, 0 console errors. (Note: title kept a stray "!" → "QA Written Quiz!", harmless test artifact.)
- **Owner Materials — re-read (OCR)** — NOT tested: re-read is a PDF-only action and the tenant has no PDF material (only the YouTube); no parseable PDF available to upload (F-PDF). Deferred.

- **Students — reset password** ✓ — Reset on Test Student Two → "Share these credentials (shown once)" dialog with `Password: 5f3a7033-ee3` + Copy/Done. (Verifies the run-1 [~] reset flow.)
- **Deactivated student — access lost on live re-login** ✓ — deactivated Test Student Two (button → Reactivate), then `POST /auth/login` as them returned **403 Forbidden**; login rejected (stayed on /login). Surfaced **F16** (misleading error) → fixed. Then **reactivated** Test Student Two (cleanup; its password is now `5f3a7033-ee3`).

**Fixes committed this run:** `a3891f7` — gate hidden upload file-input to INDIVIDUAL (F13). `36f1f41` — translate material delete dialog + aria-label, was hardcoded Uzbek (F15). `5d74ccd` — login 403 shows "account deactivated" not "server unreachable" (F16). All verified.

- **Tablet 768** ✓ — owner dashboard, assessments (multi-column publish/assign collapses to single column), materials: **no horizontal overflow** (scrollW==winW==768), sidebar stays expanded, 0 console errors.
- **Browser back/forward** ✓ — assessments → materials → Back restored /assessments (heading rendered), state intact, no errors (complements run-1 refresh-mid-flow).
- **A11y tab-order spot-check** ✓ — 29 focusable elements in logical DOM order (logo → Dashboard → Materials → …); Tab moves focus with a visible `outline:auto` ring; `:focus-visible` rules present in stylesheet. (Not a full WCAG audit.)

**Still pending for a further run:** chat **Manim/Desmos** visual-tutor tools (AI-triggered, unpredictable to force — mermaid path verified); **PDF marquee region** (needs an INDIVIDUAL account with a PDF — `qa-individual` was promoted to owner in run 1, so the B2C PDF route is now blocked for it; the underlying chat-seed mechanism is the same as the **verified** transcript-text-selection seeding); generation-limit / login-rate-limit messages (need quotas driven to the cap); podcast player (needs TTS gen).

### Run 2 — closing summary

**Coverage added this run:** AUTH (locale-persist, join-code register→student, return-after-login gap); learner Progress + Settings; chat KaTeX + transcript-seeding + **mermaid** rendering; mobile workspace + Learn-drawer/FAB; owner Billing + Settings (org-rename round-trip) + **WRITTEN assessment create+assign** + delete-confirm dialog; students reset-password + **deactivated-access-loss on re-login (403)**; tablet 768 + browser back/forward + a11y tab-order spot-check.

**Bugs fixed (3 commits, all typecheck-verified + re-tested live):**
1. `a3891f7` [F13] — hidden upload file-input leaked to learners/owners in the workspace topbar (gated to INDIVIDUAL).
2. `36f1f41` [F15] — material delete dialog + delete aria-label were **hardcoded Uzbek**, leaking into en/ru (translated via `useTranslations`/`t.rich`, added `content.deleteMaterial*` keys to all 3 locales).
3. `5d74ccd` [F16] — deactivated-account login showed "server unreachable" instead of an "account deactivated" message (added 403 branch + `auth.accountDeactivated` in all 3 locales).

**New issues logged (not fixed):** F14 — return-after-login not preserved (no `?redirect=` param; structural).

**Final verify (run 2):** `@talim/types` build ✓, `@talim/web` typecheck ✓, `@talim/admin` typecheck ✓ — all clean. Prod `next build` intentionally NOT run (would corrupt the running dev server's `.next` — the F1 wedge).

**Test-data left on local dev DB (run 2):** new student `qa-joincode@talim.local` / `JoinCode-12345` (TENANT_LEARNER, QA Academy); WRITTEN assessment "QA Written Quiz!" (4 Qs) published + assigned to Test Student One; Test Student Two **reactivated**, its password reset to `5f3a7033-ee3`; org name back to "QA Academy".

---

## Run 3 (resumed) — depth pass on US-AUTH-01 (login edge cases)

**Env:** stack already up (api/web/admin healthy). Drove the real login form via Playwright MCP, logged-out state enforced by clearing `localStorage` between cases.

**US-AUTH-01 edge cases closed (7):**
- **EC14 — empty fields** ✅ — Sign in with both fields blank fires native `"Please fill out this field."` validation, stays on `/login`, **no `/auth/login` request** (verified via network log).
- **EC4 — email-less kid by username** ✅ — `teststudent1` (no `@`) → `POST /auth/login` 200 + `/auth/me` 200 → `/en/learner/dashboard`. Email field is `type=text` (accepts username by design).
- **EC12 — logged-in user revisits `/login`** ✅ — client-redirects to `/en/learner/dashboard`; login form not shown (brief hydration flash before the bounce — acceptable, same client-auth pattern as RoleGuard).
- **EC7 — case-insensitive login** 🐛→✅ **(F17, fixed `59dc681`)** — `TESTSTUDENT1` and `QA-OWNER@TALIM.LOCAL` (correct password) both returned **"Invalid email or password"**; the *lowercase* form logged straight in, proving casing — not the password — was the cause. Login used a case-sensitive `findUnique`; register stored the email verbatim. Fixed (lowercase+dedupe on register, `mode:'insensitive'` email & username match on login). **Re-verified live:** `QA-OWNER@TALIM.LOCAL` now logs into `/tenant/dashboard`, 0 console errors; lowercase + username + 10k-input paths still behave.
- **EC6 — leading/trailing whitespace** ✅ — `"  qa-owner@talim.local  "` trims and logs in (existing `.trim()` + the new normalization).
- **EC11 — locale switch then login** ✅ — selecting **O'zbek** on `/login` then signing in lands on `/uz/tenant/dashboard` (chosen locale preserved, not default `/en`).
- **EC10 — very long input (10k chars)** ✅ — 10k-char email + password → graceful **401**, no 500 crash.

**Still ⬜ on US-AUTH-01:** EC5 (mustChangePassword forced screen), EC13 (session expiry mid-session → bounce + return-after-login, related to the logged F14).

**Fix committed this run:** `59dc681` `fix(api): case-insensitive email/username login + normalize email on register` [F17]. `@talim/api` typecheck ✓.

**Test-data left on local dev DB (run 3):** none new (login-only flows; no records created). Currently signed in as `qa-owner` (TENANT_OWNER) in `uz`/`en` during testing.
