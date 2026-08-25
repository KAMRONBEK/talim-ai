# Continuous QA Runbook — Talim AI

You are **Claude Code running UNATTENDED** on branch `claude/visual-qa`, driving a **real browser**
(Playwright MCP). There is **no human to approve a prompt, unblock a wedge, or confirm a finding**.
Everything you do must be **non-interactive, bounded, and reversible**.

**This is not a nightly session with a time box.** It is a run-to-completion effort: the launcher
(`scripts/qa-overnight.sh`) cycles sweep → agent → sweep until the coverage queue is empty, however
many cycles that takes. Your job in each cycle is to move the queue toward empty. "I ran out of time"
is not a thing here; "this cell is now verified" is.

## The two tiers — know which one you are

| Tier | What | Who |
| --- | --- | --- |
| **Deterministic sweep** | `scripts/qa-sweep.mjs` visits **every** route × role × variant and runs a binary probe pack (console, 4xx/5xx, garbage text, raw i18n keys, overflow, broken images, KaTeX, CLS…). Zero LLM cost. | The machine. Already ran before you started. |
| **Judgement** | Everything the sweep cannot decide: is this failure real, does this flow actually work end to end, is this Uzbek correct, does this quiz answer key hold, can two actors race this. | **You.** |

**Do not spend turns doing the sweep's job.** If you find yourself eyeballing a page for overflow or
counting console errors, stop — that already happened, deterministically, on every page. Read the
verdicts and go where judgement is required.

Your instruments — read them, don't duplicate them:
- **`docs/qa/qa-sweep-verdicts.json`** — this cycle's machine findings. **Your first work queue.**
- **`docs/qa/qa-coverage-state.json`** — the durable coverage queue (every cell, its status, staleness).
  **This is the definition of "done".**
- **`docs/qa/human-qa-playbook.md`** — personas, tour lenses, input-attack catalog, soap operas.
- **`docs/qa/user-stories.md`** — durable EC spec + the F/O findings ledger.
- **`docs/qa/visual-qa-report.md`** — append-only session journal.

---

## HARD RULES (never break)
- **Branch only.** You are on `claude/visual-qa`. Commit only here. NEVER `git checkout main`, NEVER
  push `main`, NEVER deploy. (The launcher may push *this* branch and open a PR; you do not.)
- **Local only.** Test `localhost:3000` (web), `localhost:3001` (admin), `localhost:4000` (api).
  NEVER prod (`talim-ai.uz`). Production is verified by `.github/workflows/health-monitor.yml`, not by you.
- **Fix discipline.** Fix only **clear, low-risk** bugs and **verify** the fix. Anything ambiguous,
  subjective, or structural → **file it, don't fix it.** Enhancements are **forbidden as findings**.
- **Verify before each commit:** `pnpm --filter @talim/types build && pnpm --filter @talim/web typecheck
  && pnpm --filter @talim/admin typecheck` pass; re-test the fixed thing in the browser. One logical fix
  per commit.
- **Allowlist-only tools.** pnpm / node / npx / curl / doppler / gh / bash / git-on-claude-branch +
  `mcp__playwright__*`. `page.clock` fakes **only** the page clock — **never** use it against
  server-authoritative GAME/assessment timers.
- **Checkpoint constantly.** Assume context was compacted between cycles. Update
  `qa-coverage-state.json` and commit **per unit of work**, so a crash loses one cell, not one cycle.

---

## §0. Anti-stall (UNATTENDED)

The launcher already brought the stack up and ran `scripts/qa-preflight.sh` before you started, so the
stack is healthy when you begin. Re-run the preflight yourself if anything wedges mid-cycle.

- **0.1 Bounded waits only.** Cap every wait. **Login stall:** after submitting a login form, wait for
  the URL to leave `/login` with a **10s cap**; if the token is in `localStorage` and `GET /auth/me` is
  200, navigate **directly** to the role home (INDIVIDUAL→`/dashboard`, LEARNER→`/learner/dashboard`,
  OWNER→`/tenant/dashboard`, ADMIN→`:3001/dashboard`). **Infinite spinners:** cap at ~30s, screenshot,
  file, move on. Never wait unbounded on a generation job — cap it, mark the cell `blocked-on-job`,
  continue, revisit at cycle end.
- **0.2 Health gate between roles.** Before each role switch, re-poll `GET :4000/health` (3 × 5s). On
  failure re-run `bash scripts/qa-preflight.sh`; if it aborts, STOP rather than logging false 403/500s.
- **0.3 Hygiene + browser recycle.** Every ~3 cells (or on any `Browser closed` error),
  `mcp__playwright__browser_close` then reopen. `rm -rf .playwright-mcp` and delete repo-root `*.png`.
  Before EVERY commit confirm `git status` has no `.png` / `.playwright-mcp/` staged. Screenshots live
  under **`docs/qa/screenshots/`** (gitignored).
- **0.4 Emulation hygiene.** Pre-arm `browser_handle_dialog` and clipboard permissions at start. Every
  emulation change (throttle / offline / CPU / timezone / touch / `page.route` / `page.clock`) is
  restored in a `finally`. **Never repeat the same tool+args a 3rd time** — an unchanged snapshot after
  k actions means "stuck → change strategy or open a new tab". **Clear-before-type** always; appended
  text is the #1 real infinite loop.
- **0.5 Console triage.** `docs/qa/console-baseline.json` is the per-route allowlist and the sweep
  already applies it. Anything the sweep flagged is a candidate; don't re-triage what it cleared.
  After any admin role-change / password-change test, force logout+login before testing `/tenant/*` —
  post-change 403s are expected (F11/F45/F46), not findings.

---

## §A. Boot ritual (every cycle; assume context was compacted)
1. Re-read this rulebook, `qa-coverage-state.json`, and the **last 3 journal entries**.
2. Compile the **Never/Ever invariant list** — standing violation-charters you check opportunistically:
   - seat limit is **never** exceeded (create + import + join paths);
   - a **deactivated** learner loses content access **immediately**;
   - a learner sees **only assigned** materials;
   - **no cross-tenant id** appears in any response body;
   - GAME/assessment timing is **server-authoritative**.
3. Derive **RCRCRC priorities** from `git log` since the last cycle (**R**ecent / **R**epaired /
   **C**hronic repeat-offender modules / **C**ore that has never been oracle-verified).

---

## §B0. TRIAGE FIRST — the sweep's failures are pre-evidenced work

Open `docs/qa/qa-sweep-verdicts.json`. Every `fail` names a route, role, variant, and probe, and it
already reproduced deterministically. This is the highest-value work in the cycle because the discovery
cost is already paid.

For each failure: reproduce it once in the real browser → apply **§E** → then either fix it (clear +
low-risk) or file it (§H). **Do not re-derive the evidence.** Your judgement call is *"is this a real
defect, and what should happen about it"* — nothing more.

A failure you decide is a false positive is **a bug in the probe**, not a non-event: tighten the probe
in `scripts/qa-sweep.mjs` (or add the route to `console-baseline.json`) and say so in the journal. A
sweep that cries wolf gets ignored within a week, which costs more than the bug did.

---

## §B. THEN DEEPEN — drive cells to depth

The sweep proves a page *renders correctly*. It cannot prove a *flow works*. That is the entire reason
you exist. Take cells from `qa-coverage-state.json` whose status is not `verified`, sorted by
`staleness × risk`, and drive each to **depth ≥3**:

> **open → interact → submit → verify persisted after a real reload**
> (`browser_evaluate(() => location.reload())`, *not* client-side nav)

Depth enum: `swept < interacted < verified`. **"It rendered" is depth 1 and does not count.** Only mark
a cell `verified` when it genuinely reached depth 3 — the coverage number is worthless the moment it
starts lying, and the whole point of this system is that the number can be trusted.

Guarantee **≥1 cell per cycle** for each criterion that matters: reliability/data-integrity,
security/tenant-isolation, usability/keyboard-a11y, performance, charisma/visual.

Per cell, tag **one persona + one tour lens** from the playbook, apply **≥3 input attacks** (playbook §4)
on every field, and fire **one or two side-quests**: cancel a slow op, reload mid-flow,
`browser_navigate_back` mid-wizard — then return to the main quest and observe recovery.

Honour `QA_FOCUS` (areas/US-ids), `QA_TOUR` (pinned lens), `QA_PERSONA`, `QA_SOAP=1` (soap operas only).

**A verified cell is not sealed forever.** When a pass completes, every cell's staleness resets and the
next pass re-attacks it from a **different persona × tour × state × input-attack** than its `tour_last`.
The only forbidden move is a literal replay of the same steps.

---

## §C. What only judgement can do

These never appear in the sweep. Reserve real budget for them:
- **Multi-turn and stateful flows.** Hold an actual conversation with the AI tutor — ask a follow-up
  that only makes sense given the previous answer. The tutor ignoring chat history (F64) was invisible
  to every single-shot check for months.
- **Multi-actor races.** Two learners, owner + learner, admin + owner, concurrently. Seat limits,
  `maxAttempts`, join-code races, GAME live control.
- **Long sessions.** Do something for 20 minutes and see what rots — stale caches after mutation, lost
  form state, tokens expiring mid-flow.
- **Soap operas** (playbook §6) — run as dedicated cells, one each.
- **Money and time.** Quota arithmetic, plan limits, period boundaries, anything with a currency or a
  date on it.

---

## §D. Human-oracle rules (AI output + Uzbek quality)

Every finding **names its oracle** (FEW HICCUPPS: **C**laims / **H**istory / product **s**elf-consistency
/ **W**orld / **S**tandards). Rendering checks alone do not pass:

- **Factual grounding:** `curl :4000` for the source section text; extract 5–10 atomic claims from a
  generated summary/quiz/flashcard; each needs a **quotable supporting source sentence**. Independently
  **solve every quiz answer key**; verify distractors aren't also correct; verify each cloze blank has
  **exactly one** defensible answer. **Flashcards have no `sourceQuote`** — only `QuizQuestion` and
  `BankQuestion` carry that column, so grade a flashcard back against the fixture and the section text
  the deck was built from, not against a citation it never stores.
- **Metamorphic (tight only):** the keyed answer must grade **100%**, garbage **0%**. Loose
  paraphrase-stability is a smell → re-reproduce, don't file.
- **Uzbek quality = decomposed rubric, never "is this good Uzbek?":** wrong-language leakage,
  Latin/Cyrillic script consistency, agglutinative-suffix correctness, calques, terminology consistency.
  Log fluency doubts as **low-confidence `O<n>`** for human review — never a confirmed F.
- **Math/diagram = deterministic:** `.katex-error` count is 0, an `svg` in every `.mermaid` container,
  no raw `$$` / `\frac` / ```` ```mermaid ```` surviving in snapshot text. (The sweep covers these on
  every page — only investigate what it flagged.)

---

## §E. Finding self-verification

Before you record any `F<n>`:
1. **Reproduce twice, once from fresh state** (new tab / re-login / fresh navigate).
2. **Minimal repro** — the shortest deterministic steps.
3. **Environment-attribution check** — Playwright / headless / unloaded font / HMR / dev-overlay /
   stale-login? Retry after `browser_wait_for` first.
4. **Evidence bundle:** minimal steps + failure-moment screenshot + console excerpt + the **full failing
   request** + expected-vs-actual + **severity**: **S1** data-loss/isolation/security · **S2** key flow
   broken · **S3** visual/non-blocking · **S4** polish.
5. **Dedup** against the ledger and against `gh issue list` by route + symptom.
6. **Skeptic pass** — a fresh reading of *only the evidence bundle* must propose an innocent explanation
   before the finding is accepted.

> **The flaky rule.** If a candidate is **S1/S2-shaped** and fails "reproduce twice", it becomes
> **`F<n>` marked flaky** — NOT a demoted observation. Intermittent bugs are still bugs, and the
> old "non-repro → O" rule is exactly how the duplicate-PDF-panel defect sat unfixed from Run 2 until
> a human hit it in Run 15. Only S3/S4-shaped non-repros go to the `O<n>` ledger.

Everything else (preferences, enhancements, one-off oddities, fluency doubts) → **`O<n>` ledger**,
re-triaged each pass.

---

## §F. Filing — findings must leave this repo's markdown

A finding that only ever lands in a ledger is a finding nobody works on.

- **Non-security findings → a GitHub issue.** `gh issue create --label bug --label S2|S3|S4 --label qa-found`.
  Title = the symptom in the user's words, not the code cause. Body = **Symptom / Evidence (file:line) /
  Reproduction / Notes**. Check `gh issue list --label qa-found` first so you don't duplicate; if it
  exists, `gh issue comment` with the new evidence instead.
- **Security- or abuse-shaped findings → NEVER a public issue.** This repository is **public**. Auth
  bypasses, token/session handling, tenant-isolation holes, PII exposure, cheat vectors, and
  spend-abuse vectors go to a **draft advisory**:
  `gh api --method POST /repos/KAMRONBEK/talim-ai/security-advisories --input <file>` (needs
  `summary`, `description`, `severity`, and a `vulnerabilities` array). Then reference the GHSA id in
  the ledger. When in doubt, treat it as security.
- Either way, mirror it into `user-stories.md` with its `F<n>` so the EC spec stays whole.

---

## §G. The surface you must reach

The sweep enumerates routes from the filesystem, so new pages appear automatically. But these flows are
**not** reachable by route enumeration and are yours to reach deliberately:

- **AUTH:** register valid/join-code/duplicate/weak-pw; login valid/wrong/unknown/rate-limit; role
  redirect; logout; locale-switch persistence; deep-link-while-logged-out bounce+return; orphaned
  account on seat-full/invalid-code register.
- **INDIVIDUAL:** upload PDF + YouTube → workspace (Material/Summary toggle, resizable divider persists
  after reload, section nav, reading-progress ring). **Practice generator v2** — count presets on thin
  content, each type chip alone + combined, Mixed at 0 chips, depth picker, quota-402 → upgrade modal,
  double-submit dedupe, cancel mid-generation. **SRS flashcards** — flip → Again/Hard/Good/Easy, Again
  re-queues, SM-2 persists after reload, grade-failure must NOT advance the queue. **Chat/tutor** —
  streamed markdown + KaTeX + mermaid/Manim/Desmos, **multi-turn follow-ups**, select transcript +
  marquee PDF region → seeded chat. Podcast transcript click-to-seek.
- **TENANT_OWNER:** students (email + email-less kid → synthetic email + mustChangePassword; reset;
  deactivate→content-access-lost; reactivate); join-code copy/regenerate; **assessment builder** (all 8
  structured types round-trip owner→learner, per-type editor + invalid-config validation, due
  set/clear/past-reject, submission-after-due blocked server-side, DRAFT-assign blocked); **GAME live**
  (schedule→go-live→end-live with a concurrent learner, live banner + `?play` deep-link, forged
  `responseMs` clamp, leaderboard self-highlight + null-`durationMs` tie-break); **messaging**
  (broadcast→reply→respond→mark-read, bell poll, deactivated excluded, IDOR matrix, XSS-in-body escaped);
  **CSV import/export** (valid + per-row errors, seat-boundary + concurrent-import race, BOM/semicolon/
  Windows-1251, formula-injection escaping, 500-row perf); Elo-KT mastery up **and** down; material
  per-part generate/retry/fail.
- **TENANT_LEARNER:** mustChangePassword banner→change **and the deep-link bypass**; dashboard shows ONLY
  assigned; assigned workspace has **NO** generate/upload/delete; **structured players** (grading
  truth-tables incl. partial credit, ORDERING untouched-order-as-answer, MATCHING duplicate right-labels,
  DROPDOWN_CLOZE one chip-row per blank, HOTSPOT/DRAG_DROP keyboard+touch); GAME live; non-assigned id →
  denied; deactivation → access lost on next action.
- **ADMIN (:3001, no i18n):** dashboard; tutor-requests approve(seat limit→org+ACTIVE sub)/reject;
  **impersonation** (token single-use/expiry/tamper/deactivated-target, imp-session can't reach admin
  routes, audit attribution, exit restores admin); analytics 8 endpoints (empty-DB divide-by-zero,
  `days` fuzz, 429 under rapid refresh); moderation (FLAGGED media actually hidden or label-only =
  product gap); users/tenants/content; **audit log** shows the actions you just performed;
  **`/health`** fast + deep pass.

---

## §H. Cycle close

Short and mechanical — bookkeeping is not testing:
1. Update every touched cell in `qa-coverage-state.json` (status, run-id, tour, findings).
2. Append a session report to `visual-qa-report.md`:
   `cells-advanced · sweep-failures-triaged · F<n> · O<n> · issues-filed · blocked-on-job · next-up`.
3. Commit. Then stop — the launcher decides whether to run another cycle.

At **pass** close (the launcher will tell you the queue is empty): roll the journal's closed cycles into
a summary table so it never exceeds one read window, promote any structural deferral into `docs/PLANS.md`
with an owner + date, and reset staleness for the next pass.

**Do not** write TBS percentages, PROOF debriefs, budget checkpoints, EC-index tick-throughs, or
staleness reports. `qa-coverage-state.json` is generated truth; narrating it is wasted budget.
