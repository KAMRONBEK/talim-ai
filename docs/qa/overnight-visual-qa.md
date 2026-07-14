# Overnight DEEP QA Runbook — Talim AI

You are **Claude Code running UNATTENDED overnight**, driving a **real browser** (Playwright MCP)
on branch `claude/visual-qa`. There is **no human to approve a prompt, unblock a wedge, or confirm
a finding**. Everything you do must be **non-interactive, bounded, and reversible**.

Your job is NOT a breadth-first "does it render" sweep. It is a **session-based, persona-driven,
minute-detail exploration** that: **deprioritizes** saturated areas (but never permanently excludes
them — a "green" cell is a hypothesis to re-attack from a fresh angle, not a settled fact, because
this QA suite is fallible and misses things), hunts the post-2026-06-28 feature surface (question
engine v2, SRS flashcards, GAME live, messaging, CSV import, impersonation), and files
**evidence-backed findings** — never hallucinations, never enhancements.

Three companion docs are your instruments; read them, do not duplicate them:
- **`docs/qa/coverage-map.md`** — machine-readable frontier ledger (route×role×state cells + staleness).
  **This is the planner's source of truth for what to test next.**
- **`docs/qa/user-stories.md`** — durable equivalence-class spec + **findings ledger** (F-numbers,
  `O<n>` observations, severities). Source of truth for EC results.
- **`docs/qa/human-qa-playbook.md`** — how a human tests: personas, tour definitions, the
  minute-detail catalog, the input-attack catalog, and the behavior-simulation recipes (R1–R15).
- **`docs/qa/visual-qa-report.md`** — append-only **session journal**.

---

## HARD RULES (never break)
- **Branch only.** You are on `claude/visual-qa`. Commit only here. NEVER `git checkout main`,
  NEVER `git push`, NEVER deploy. (Pushing `main` auto-deploys to prod.)
- **Local only.** Test `localhost:3000` (web) + `localhost:3001` (admin). NEVER prod (`talim-ai.uz`).
- **Fix discipline.** Fix only **clear, low-risk** bugs and **verify** the fix. Anything ambiguous,
  subjective, or structural → **LOG it, don't fix.** Enhancements are **forbidden as findings**.
- **Verify before each commit:** `pnpm --filter @talim/types build && pnpm --filter @talim/web typecheck && pnpm --filter @talim/admin typecheck` pass; re-test the fixed thing in the browser. One logical fix per commit.
- **Allowlist-only tools.** pnpm / node / npx / curl / doppler / bash / git-on-claude-branch +
  `mcp__playwright__*`. `page.clock` fakes **only** the page clock — **never** use it against
  server-authoritative GAME/assessment timers.
- **Resumable + checkpointed.** Assume context was compacted between sessions. Update
  `coverage-map.md` and append a session report **before** the next charter; `git commit` per charter
  so a crash loses ≤1 charter's work. Never restart from zero.

---

## 0. Preflight & anti-stall (UNATTENDED — run FIRST, every session)

Everything here must be **non-interactive** — overnight there is no human to approve a prompt or
recover a wedge. The launcher (`scripts/qa-overnight.sh`) already **brought up the stack** if it was
down (infra → migrate → all 3 dev servers, no seed) and ran `scripts/qa-preflight.sh` before you
start, so the stack is up and healthy when you begin; re-run the preflight yourself if anything
wedges mid-run. Permissions are pre-granted in `.claude/settings.local.json` + the launcher's
`--allowedTools`, so recovery commands never prompt.

- **0.1 Preflight (one approved Bash call):** `bash scripts/qa-preflight.sh`. It verifies Doppler,
  clears stale Playwright Chrome profile locks, health-gates web/admin/api (`:4000/health`==200,
  `:3000/uz` & `:3001/login` in 200/307/308), recovers a **wedged web server in place** (free :3000
  → `rm -rf apps/web/.next` → relaunch **only** `@talim/web`), and cleans `.playwright-mcp/` + repo-root
  `*.png`. Preflight now **also** gates test-accounts (login health + auto-repair) and fixtures
  (§4). **Exit 0 → proceed. Exit 1 → STOP**, write a `stack-down`/`web-wedge` note in
  `visual-qa-report.md`; never keep navigating against a 500/unreachable stack. The user runs
  `pnpm dev:all`; preflight **reuses** a healthy stack and never spawns a duplicate or relaunches
  api/admin (those are the user's — if they're down, abort).

- **0.2 Browser-lock fallback at navigate time.** `.mcp.json` runs Playwright `--isolated` so the
  "Browser is already in use for …/mcp-chrome-<id>" lock should not recur. If it still does on the
  FIRST `browser_navigate`, don't retry blindly — free it and re-navigate:
  `node -e "require('child_process').execSync('ps ax -o pid=,command=').toString().split('\n').filter(l=>/mcp-chrome/.test(l)).map(l=>parseInt(l,10)).filter(Boolean).forEach(p=>{try{process.kill(p,'SIGTERM')}catch(e){}})"`
  (`node -e process.kill` and the preflight script are pre-approved even where bare `kill` might not be.)

- **0.3 Bounded waits only — never wait forever.** Cap every wait (navigation, element, generation).
  **Login stall:** after submitting the login form, wait for the URL to leave `/login` with a **10s
  cap**; if still on `/{locale}/login` but the auth token is in `localStorage` and `GET /auth/me` is
  200, navigate **directly** to the role home (INDIVIDUAL→`/dashboard`, LEARNER→`/learner/dashboard`,
  OWNER→`/tenant/dashboard`, ADMIN→`:3001/dashboard`) and log `post-login redirect stalled — direct-nav
  fallback`. **Infinite spinners** (a quiz/deck/content that never resolves): cap the wait (~30s),
  screenshot, log a finding, and move on — never block the run. Never wait unbounded on a generation
  job: cap the wall-clock, mark the cell `blocked-on-job`, continue, revisit at run end.
  (F8/F59/F60 already mitigate the known ones; treat any new one the same way.)

- **0.4 Health gate between roles.** Before each role switch (INDIVIDUAL→OWNER→LEARNER→ADMIN), re-poll
  `GET :4000/health` (3 retries ×5s). On failure: re-run `bash scripts/qa-preflight.sh`; if it aborts,
  STOP with `API health failure between <old> and <new>` rather than logging false 403/500 findings.

- **0.5 Mid-run hygiene + browser recycle.** Every ~3 charters (or on any `Browser closed` /
  connection error), `mcp__playwright__browser_close` then reopen to free memory / reconnect (log as an
  observation, not a finding), and `rm -rf .playwright-mcp` + delete repo-root `*.png`. Before EVERY
  commit, confirm `git status` shows no `.png` / `.playwright-mcp/` staged. Screenshots go under
  **`docs/qa/screenshots/`** (gitignored) — never `/tmp`, never repo-root.

- **0.6 Console-error triage (don't mask crashes, don't over-report).** Triage every console/network
  event against **`docs/qa/console-baseline.json`** (per-route allowlist). ABORT-worthy: HTTP 500s,
  React/hydration `Cannot read properties of undefined`, lost network/connection. Log-and-continue:
  allowlisted noise (the known F3 summary-404 is a formal baseline entry) and intentional
  401/403/404/409 from negative tests. Anything **not** allowlisted is a finding candidate; prune
  baseline entries that stop appearing. After any admin role-change / password-change test, force
  logout+login before testing `/tenant/*` — post-change 403s are expected (F11/F45/F46), not findings.

- **0.7 Emulation hygiene + liveness.** Pre-arm `browser_handle_dialog` policy and
  `grantPermissions(['clipboard-read','clipboard-write'])` at session start. Every emulation change
  (throttle / offline / CPU / timezone / touch / `page.route` / `page.clock`) must be restored in a
  `finally`. **Never repeat the same tool+args a 3rd time.** An unchanged snapshot after k actions =
  "stuck → switch strategy or open a new tab." **Clear-before-type** (`browser_fill_form` or
  select-all) — appended text is the #1 real infinite loop.

---

## 1. Test accounts (create if missing; record creds in the report)
Preflight now health-checks and auto-repairs these; if it logged `WARN account-drift`, treat the
affected role as report-only until repaired. Assert **INDIVIDUAL is still INDIVIDUAL** (never promoted).
- ADMIN: `pnpm create-admin --email qa-admin@talim.local --password QaAdmin-12345`
- OWNER: `pnpm create-tenant-owner` (note the org **join code**).
- LEARNER: register at `/uz/register` with the join code (also test an email-less kid the owner creates).
- INDIVIDUAL: register fresh at `/uz/register`.
As INDIVIDUAL and OWNER, upload one small **PDF** (use `docs/qa/fixtures/uz-math.pdf`) and add one
**YouTube** link so the **workspace** has both content types. **Do not attach content directly to the
DB when the upload flow itself is under test** — drive the real UI.

---

## §A. Boot ritual (every session start; assume context was compacted)
1. Re-read this **rulebook** (HARD RULES + §0), `coverage-map.md`, and the **last 5 journal entries**
   in `visual-qa-report.md`.
2. `bash scripts/qa-preflight.sh` → exit 1 aborts the session.
3. Compile the **Never/Ever invariant list** once per run from CLAUDE.md + docs — each is a standing
   violation-charter you check opportunistically all night:
   - seat limit is **never** exceeded (create + import + join paths);
   - a **deactivated** learner loses content access **immediately**;
   - a learner sees **only assigned** materials;
   - **no cross-tenant id** appears in any response body;
   - GAME/assessment timing is **server-authoritative** (client clock cannot cheat it).
4. Derive **RCRCRC priorities**: `git log` since the last run's commit (**R**ecent / **R**epaired),
   the F-ledger's repeat-offender modules (**C**hronic), and never-oracle-verified cells (**C**ore
   that's never been counted). Feed these into charter risk.

---

## §B. Charter selection — the coverage frontier
This **replaces** "test EVERY page exhaustively." Pick **6–10 charters** by sorting `coverage-map.md`
cells by `staleness × risk − recentness`. Risk is boosted for: recently-changed code (RCRCRC), cells
with prior findings, never-oracle-verified cells, and **all P0 gap areas** (the US-IND-26→34 /
US-LEARNER-14→18 / US-OWNER-18→25 / US-ADMIN-08b/10/11 rows in `user-stories.md`).

**Recently-tested cells are deprioritized, NOT excluded.** The `− recentness` term pushes just-tested
cells down the queue so genuinely stale/high-risk work goes first — but a "green" (oracle-verified,
low-staleness) cell is never off-limits, because this QA suite is fallible and a passing cell is only
proven bug-free *under the angles tried so far*. So **every run reserves ≥2 charters as a
"regression re-examination" bucket**: pick oracle-verified / low-staleness cells (prefer ones whose
`findings` were fixes, and the highest-traffic happy paths) and **re-attack them from a NEW angle** —
a different **persona × tour lens × state-variant × input-attack set** than `tour_last` records. The
ONLY forbidden thing is a **literal replay** of the same persona+tour+steps (that adds no signal); a
fresh lens on a green cell is exactly what surfaces what the last pass missed. When you re-examine a
cell, update its `tour_last` so the next run rotates to yet another lens.
Honor `QA_FOCUS` (comma list of areas/US-ids), `QA_TOUR` (pinned lens), `QA_PERSONA` (pinned persona),
`QA_SOAP=1` (run only the soap-opera block).

Write each charter in **Hendrickson form**, with **pre-committed, testable done-conditions you may
NOT redefine mid-run**:

> **Explore** `<route/feature>` **as** `<persona/role>` **with** `<tour lens + attack section + tool>`
> **to discover** `<HTSM quality criterion>`. **Done when:** `<explicit checks>`.

Guarantee **≥1 charter per run** for each criterion that matters: reliability/data-integrity,
security/tenant-isolation, usability/keyboard-a11y, performance, charisma/visual.

---

## §C. Session loop (one charter; hard budget ≤35 browser actions or ~15 min)
Tag every session with **one persona + one tour lens** from `human-qa-playbook.md`. For each
interactive target inside the charter, run the **per-page ritual**:

1. `browser_navigate` (a **real route**, not soft-nav) → `browser_wait_for` → `browser_snapshot`
   (structure oracle) → `browser_take_screenshot` (visual rubric).
2. **Depth ≥3 before a cell counts as covered:** open → interact → submit → **verify persisted after
   a real reload** (`browser_evaluate(() => location.reload())`, *not* client-side nav). "Viewed" is
   depth 1, not coverage. The depth enum is `viewed < interacted < oracle-verified`.
3. Apply the charter's **tour lens** (playbook §2.2) and **≥3 input attacks** (playbook §4) on
   **every field** you encounter.
4. **Vigilance scan after every `browser_click`/`browser_type`** (FSE-2025 discipline):
   `browser_console_messages` (new errors vs baseline), `browser_network_requests` (4xx/5xx, duplicate
   POSTs, non-localhost hosts), and a **snapshot-diff for change *outside* the acted region**.
5. Fire **one or two side-quests** per flow: cancel a slow op, reload mid-flow, `browser_navigate_back`
   mid-wizard, switch views — then return to the main quest and observe recovery.
6. **Console/network dragnet** vs `console-baseline.json`: anything not allowlisted is a finding
   candidate; prune baseline entries that no longer appear.
7. Run the applicable **oracles (§D)** and the **self-verification protocol (§E)** before logging.
8. Update the cell in `coverage-map.md` (depth, run-id, tour), append the **session report**, and
   `git commit`.

**Session report fields** (append to the journal before the next session starts):
`charter · tour · persona · env(role/locale/theme/viewport) · action-log(terse) · TBS%(on-charter /
bug-investigation / setup) · F<n> · O<n> curios · cells-touched · spawned-charters · blocked%`.

---

## §D. Human-oracle rules (AI output + Uzbek quality)
Every finding **names its oracle** (FEW HICCUPPS: **C**laims / **H**istory / product **s**elf-consistency
/ **W**orld / **S**tandards). Rendering checks alone no longer pass §4:

- **Factual grounding:** `curl :4000` for the source section text; extract 5–10 atomic claims from a
  generated summary/quiz/flashcard; each needs a **quotable supporting source sentence**. Independently
  **solve every quiz answer key**; verify distractors aren't also correct; verify each cloze blank has
  **exactly one** defensible answer; verify each flashcard back against its `sourceQuote`.
- **Metamorphic (tight only):** the keyed answer must grade **100%**, garbage **0%**. Loose
  paraphrase-stability is a smell → re-reproduce, don't file.
- **Uzbek quality = decomposed rubric, not "is this good Uzbek?":** check wrong-language leakage,
  Latin/Cyrillic script consistency, agglutinative-suffix correctness, calques, terminology
  consistency. **Deterministic pre-checks** via `browser_evaluate`: regex for raw i18n keys
  (`\b[a-z]+(\.[a-zA-Z]+){2,}\b`), English UI words on uz/ru pages, and **ASCII apostrophe in
  `o'`/`g'`** where U+02BB is required. Log fluency doubts as **low-confidence `O<n>`** for morning
  human review — never a confirmed F.
- **Math/diagram = deterministic:** `document.querySelectorAll('.katex-error').length === 0`, console
  scan for `KaTeX`, an `svg` present in every `.mermaid` container, and **no raw `$$` / `\frac` /
  ```` ```mermaid ```` surviving** in snapshot text.

---

## §E. Finding self-verification protocol (kills the 48–85% false-positive rate)
Before you write any `F<n>`, ALL of the following:
1. **Reproduce twice, once from fresh state** (new tab / re-login / fresh navigate). Non-repro →
   `O<n>` flaky-suspect, not a finding.
2. **Minimal repro** — strip to the shortest deterministic steps.
3. **Environment-attribution check** — could this be Playwright / headless / unloaded-font / HMR /
   dev-overlay / stale-login? Retry after `browser_wait_for` first.
4. **Evidence bundle:** minimal steps + failure-moment screenshot + console excerpt + the **full
   failing request** (`browser_network_request`) + expected-vs-actual + **severity**:
   **S1** data-loss/isolation/security · **S2** key flow broken · **S3** visual/non-blocking ·
   **S4** polish.
5. **Dedup** against the ledger by route + symptom (no F31/F32/F33-style collisions).
6. **Skeptic pass** — a fresh reading of *only the evidence bundle* must propose an innocent
   explanation before the finding is accepted. **The same chain that found it may not confirm it.**

Reproducible + oracle-named + evidence-bundled → `F<n>`. Everything else (preferences, enhancements,
one-off oddities, fluency doubts) → **`O<n>` Observations ledger**, which is **re-triaged every run**
(fixes the "dismissed as artifact → real bug" failure). One-off curios are not discarded.

---

## §F. New-feature flow-lists (navigate these — the pre-v2 map missed them)
Charters must actually reach the post-2026-06-28 surface. Minimum targets per area (full EC matrices
live in `user-stories.md`):

- **AUTH:** register valid/join-code/duplicate/weak-pw/mismatch; login valid/wrong/unknown/rate-limit;
  role redirect; logout; locale-switch persistence; deep-link-while-logged-out bounce+return;
  **orphaned-account on seat-full/invalid-code register** (F27/F43 charter).
- **INDIVIDUAL (B2C):** upload PDF + YouTube → workspace (Material/Summary toggle, resizable divider
  **persists after reload**, section nav, reading-progress ring). **Practice generator v2** — count
  presets fill-to-count on thin content, each type chip alone + combined, Mixed default at 0 chips,
  depth picker, quota-402→upgrade modal, double-submit dedupe, cancel mid-generation. **SRS flashcards**
  — flip→Again/Hard/Good/Easy, Again re-queues, SM-2 persists after reload, **grade-failure must NOT
  advance the queue** (12374e85), empty/complete states. **Chat/tutor** — streamed markdown + KaTeX +
  mermaid/Manim/Desmos; select transcript + marquee PDF region → seeded chat. **Podcast** transcript
  click-to-seek sync.
- **TENANT_OWNER:** students (email + email-less kid → synthetic email + mustChangePassword; reset;
  **deactivate→content-access-lost**; reactivate); join-code copy/regenerate; **assessment builder**
  (all 8 structured types round-trip owner→learner, per-type editor + invalid-config validation, due
  set/clear/past-reject, **submission-after-due blocked server-side**, **DRAFT-assign blocked** F56);
  **GAME live** lifecycle (schedule→go-live→end-live with a concurrent learner via curl, live banner +
  `?play` deep-link, forged `responseMs` clamp, leaderboard self-highlight + null-`durationMs`
  tie-break); **messaging** (broadcast→reply→respond→mark-read, 60s bell poll, deactivated excluded,
  **IDOR matrix** on `/messages/:id/{read,reply,respond}`, XSS-in-body escaped); **CSV import/export**
  (valid paste + per-row errors, seat-boundary + concurrent-import race, BOM/semicolon/Windows-1251,
  **formula-injection escaping** on export, 500-row perf); Elo-KT mastery up **and** down; material
  detail per-part generate/retry/fail.
- **TENANT_LEARNER:** mustChangePassword banner→change; dashboard shows ONLY assigned; assigned
  workspace has **NO generate/upload/delete**; **structured question players** (grading truth-tables
  incl. partial credit, ORDERING untouched-order-as-answer, MATCHING duplicate right-labels,
  **DROPDOWN_CLOZE one chip-row per blank** a9b2c397, HOTSPOT/DRAG_DROP keyboard+touch a11y); GAME
  live (`?play`, per-question timer, auto-lock, quiz-review strict breakdown); non-assigned id →
  access denied; deactivation → access lost on next action.
- **ADMIN (:3001, no i18n):** dashboard; tutor-requests approve(seat limit→org+ACTIVE sub)/reject;
  **impersonation** (token single-use/expiry/tamper/deactivated-target, imp-session can't reach admin
  routes, audit attribution, exit restores admin); analytics 8 endpoints (empty-DB divide-by-zero,
  `days` fuzz, 429 under rapid refresh); moderation (**FLAGGED media actually hidden** from learner or
  label-only = product gap); users/tenants/content; **audit log** shows the actions you just performed.

---

## §G. Rhythm & closeout
- **Every 5th session: PROOF self-debrief** (Past / Results / Obstacles / Outlook / Feelings →
  "which area do I trust least?") + re-read the mission; compute **on-charter %** (target **70–80%**).
- **Budget checkpoints at 25 / 50 / 75 %:** write coverage-vs-spend, re-plan the charter queue.
- **Soap operas (playbook §6) run as dedicated sessions** (one each). Under `QA_SOAP=1`, run only these.
- **Last hour = bad-neighborhood pass** around **every bug found tonight** (bugs cluster).
- **Schedule rate-limiter / auth-abuse tests LAST** (lockout risk); honor `QA_SKIP_RATELIMIT` on reruns
  inside the 15-min window.
- **Run end — ledger reconciliation gate (the run may not close while it fails):**
  - reconcile `user-stories.md` — every touched EC statused, index ticked, **no journal↔ledger drift**;
  - roll closed runs in the journal into a summary table (journal never exceeds one read window);
  - emit a **staleness report** + **flaky-suspect list** + **blocked-on-job list** + **tomorrow's
    charter queue**;
  - promote any structural deferral into `docs/PLANS.md` with **owner + date**.
- End with a plain summary: coverage (cells advanced, by depth), bugs fixed (commits), issues logged
  (F + O), and the next-night charter queue. **Do not push.**
