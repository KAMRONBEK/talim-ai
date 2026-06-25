# Overnight DEEP QA Runbook — Talim AI

You are **Claude Code running UNATTENDED overnight**. Goal: **exhaustively** test EVERY page,
feature, flow, interactive element, state, and edge case across all roles and locales with a
**real browser** (Playwright MCP). Test DEEPLY — not "does it render" but "does it WORK and behave
correctly in every state, down to the tiny details." Fix clear bugs on a branch; log the rest.

## HARD RULES (never break)
- **Branch only.** You are on `claude/visual-qa`. Commit only here. NEVER `git checkout main`,
  NEVER `git push`, NEVER deploy. (Pushing `main` auto-deploys to prod.)
- **Local only.** Test `localhost:3000` (web) + `localhost:3001` (admin). NEVER prod (`talim-ai.uz`).
- **Fix discipline.** Fix only **clear, low-risk** bugs and **verify** the fix. Anything ambiguous,
  subjective, or structural → **LOG it, don't fix.**
- **Verify before each commit:** `pnpm --filter @talim/types build && pnpm --filter @talim/web typecheck && pnpm --filter @talim/admin typecheck` pass; re-test the fixed thing in the browser. One logical fix per commit.
- **Resumable:** keep a live checklist in `docs/qa/visual-qa-report.md` marking each page/flow
  `[ ]`/`[x]` so a re-run (`claude -p ... --continue`) continues where you stopped. Never restart
  from zero. This WILL span work — pace by the budget; always end by saving the report.

## TEST DEPTH — apply to EVERY interactive element you meet
- **Buttons/links:** default, **hover**, **focus** (Tab), active/pressed, **disabled**, **loading/
  pending**; clicking actually performs the action AND the result is correct.
- **Forms/inputs:** empty submit, valid submit, **EACH invalid case** (too short/long, bad format,
  missing required, duplicate, mismatch), the exact validation/error message, char limits, paste,
  clear, submit disabled when it should be, Enter-to-submit.
- **Async/data states:** loading skeleton/spinner, success, **error** (force via bad input / stopped
  API), **empty** state, and **stale→fresh after a mutation** (does the list/progress update without
  refresh?).
- **Overlays:** modals/dialogs/sheets/dropdowns/popovers/tooltips/toasts — open, close via **X, Esc,
  backdrop**, **focus trap**, scroll lock, content correct.
- **Tabs/accordions/toggles/segmented:** every panel switches + persists; active styling correct.
- **Lists/tables:** pagination, sort, filter, search, row actions, empty/loading, very long lists.
- **Tiny details:** text truncation/ellipsis, number/date/plural formatting, copy-to-clipboard,
  icons present, image fallbacks, tooltips, badge counts, avatars, progress rings, streak counters,
  scroll position, keyboard shortcuts, no layout shift, no flicker.

## CROSS-CUTTING MATRIX — apply to EVERY page
- **Locales:** test in **uz, ru, en** (web; admin has none) — every string translated, **no raw
  keys** (e.g. `content.foo`), no English leaking into uz/ru, layout holds with longer ru/en text.
- **Themes:** **light AND dark** — contrast, borders, surfaces, no invisible/low-contrast text.
- **Breakpoints:** **mobile ~390, tablet ~768, desktop ~1440** — no horizontal overflow, nav
  collapses, drawers/sheets work, touch targets ≥ ~40px.
- **Console & network:** ZERO uncaught errors/warnings; no failed/4xx/5xx requests (except
  intentional ones you're testing); no React hydration mismatches.
- **Accessibility:** Tab through every page (visible focus ring, logical order); Esc closes overlays;
  modals trap focus; images have alt; controls have accessible names.

## 0. Bring up the local stack
`pnpm dev:all` in the background. Wait for: `curl localhost:4000/health` → ok; `localhost:3000` →
200; `localhost:3001` → 200. Reuse if already running.

## 1. Test accounts (create if missing; record creds in the report)
- ADMIN: `pnpm create-admin --email qa-admin@talim.local --password QaAdmin-12345`
- OWNER: `pnpm create-tenant-owner` (note the org **join code**).
- LEARNER: register at `/uz/register` with the join code (also test an email-less kid the owner creates).
- INDIVIDUAL: register fresh at `/uz/register`.
As INDIVIDUAL and OWNER, upload one small **PDF** and add one **YouTube** link so the **workspace**
has both content types to test.

## 2. DEEP FLOW TESTS PER ROLE (end-to-end; verify the RESULT, not just "no crash")
### AUTH
Register valid (individual); register with join code (→ student); duplicate-email error; weak/short
password error; password mismatch. Login valid; wrong password; unknown email; the login rate-limit
message after repeated failures. Role-based redirect after login (individual→/dashboard, owner→/tenant,
student→/learner). Logout clears session + redirects. Locale switch persists across reload. Deep-link
while logged out → bounced to login → returned after login.

### INDIVIDUAL (B2C)
Upload PDF → processing screen → READY → **workspace**. Add YouTube → READY. For BOTH content types,
test the **workspace** deeply: center source renders; Material/Summary toggle; resizable divider
**persists** after reload; sidebar sections navigate; reading marks progress (ring updates).
- Learn tab: **generate Summary** (renders markdown/LaTeX), **generate Quiz** → open it, answer every
  type, submit, **verify score + explanations + formula rendering**, retry; **generate Podcast** →
  player (play/pause/seek/speed) + transcript.
- Chat tab: send a question → **streamed answer renders** (markdown, LaTeX via KaTeX, mermaid/charts
  if any); **select transcript text** and **marquee a PDF region** → Chat seeded with the excerpt →
  ask → answer scoped to it; the visual tutor tools (Manim/Desmos/mermaid) render.
- Mobile: stage + ✨ Learn drawer + FAB. Quiz page `/quiz/<id>` standalone. Dashboard (recent grid,
  search, empty state). Settings (name, locale, password, theme). Become-tutor → submit → pending.

### TENANT_OWNER (tutor)
Students: create (email; and **email-less** kid → synthetic `username@students.talim.local` +
mustChangePassword); reset password; **deactivate → confirm the student loses content access**;
reactivate. Join code: copy, **regenerate (confirm dialog)** → old code rejected at register.
Materials: upload; **assign to specific students / whole class** (assign panel in the workspace) →
confirm the student then sees it; re-read (OCR) a PDF; delete (confirm). Assessments: build a
**question bank** (AI-generate — verify each question type is valid), create a **WRITTEN** and a
**GAME** assessment (per-question timer, speed points), assign, view **results + leaderboard**.
Progress: per-student + class views update after a student submits. Billing (manual plan/seat view).
Dashboard onboarding checklist. Settings.

### TENANT_LEARNER (student)
Login → **mustChangePassword banner** on first login → change password. Dashboard shows ONLY
assigned materials. Open an assigned workspace → **verify NO generate buttons, NO upload, NO delete**;
chat works; read. Take an assigned **quiz** and a **GAME** quiz (timer counts down, **auto-lock on
timeout**, speed points, streak, **leaderboard with self highlighted**). Progress updates. Settings.
Navigate to a **non-assigned** content id → **access denied/redirect**. After the owner deactivates →
access lost on next action.

### ADMIN (localhost:3001, no i18n)
Login. Dashboard stats. **Tutor-requests: approve** (set seat limit → creates org + ACTIVE sub) and
**reject**. Users: list/search/detail, reset password, patch subscription. Tenants: list/detail.
Content: list, delete, retry job. Generated media. Subscriptions. Usage. **Audit log** shows entries
for the admin actions you just performed.

## 3. EDGE / ADVERSARIAL
Very long titles/names (truncation); every **empty state** (no content/students/assessments/history);
**special chars / emoji / RTL Arabic + Cyrillic** in inputs and AI output; rapid double-clicks (no
double-submit); browser back/forward; refresh mid-flow (state restored); expired/no token → redirect;
**generation limit reached** → the proper "limit reached" message; very large quiz counts.

## 4. AI-OUTPUT QUALITY (deep)
For every generator + chat answer: **LaTeX renders (KaTeX)**, markdown renders, **mermaid/charts
render**, proper-Uzbek-first language, no raw transcript dumps, no empty/"couldn't read" artifacts,
no hallucinated UI text.

## 5. Per finding → Report → Finalize
Record each: `{page, role, locale, theme, breakpoint, severity, screenshot, description, file}`.
Clear+low-risk → fix, re-verify in browser, commit. Ambiguous/risky → LOG. Maintain the running
checklist + findings table in `docs/qa/visual-qa-report.md` (screenshots under `/tmp/talim-qa/`).
Finalize: full verify (types build + web/admin typecheck + web build) → commit fixes + report to
`claude/visual-qa`. **Do not push.** End with a plain summary: coverage, bugs fixed (commits), issues
logged, and what's left for a resumed run.
