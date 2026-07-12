---
name: qa-run
description: Run a resumable visual-QA pass on Talim AI with Playwright MCP — pick up the checklist in docs/qa/visual-qa-report.md, drive the real browser as each role, log findings as F<n>, fix + typecheck, and commit on the QA branch. Use when the user says "qa", "qa run", "visual qa", "continue qa", or "/qa-run".
---

# Talim AI — Visual QA run

A resumable, browser-driven, **session-based** QA pass with full traceability. **Four** instruments,
one source of truth each:
- **`docs/qa/coverage-map.md`** — the **machine-readable frontier ledger** (route × role × state cells
  + staleness). *This is the planner's source of truth for what to test next.* Sort cells by
  `staleness × risk − recentness`, pick 6–10 charters, never re-test a cell touched in the last 2 runs
  unless code changed under it.
- **`docs/qa/user-stories.md`** — the **durable EC spec + findings ledger** (`F#` findings, the new
  `O#` observations ledger, severities). *Source of truth for EC results.*
- **`docs/qa/human-qa-playbook.md`** — **how a human tests**: personas, tour lenses, the minute-detail
  catalog, the input-attack catalog (Uzbek apostrophe quadruple, Cyrillic, emoji, RTL, naughty
  strings), the behavior-simulation recipes (R1–R15), and the AI-output/Uzbek/screenshot rubrics.
- **`docs/qa/visual-qa-report.md`** — the append-only **session journal**.

Read all four first. `docs/qa/overnight-visual-qa.md` is the full runbook (charters §B, session loop
§C, oracles §D, self-verification §E, closeout §G) — this skill is its interactive twin.

## Hard rules (never break)
- **Branch:** work only on `claude/visual-qa`. **Never** push, never touch `main`, never deploy to prod. Commit locally only.
- **Tooling:** drive the UI with the **`playwright`** MCP (real browser). Use **`talim-vps`** MCP only for server/docker ops, never for UI checks.
- **Screenshots** go to `docs/qa/screenshots/` (gitignored). **Do not** leave repo-root `*.png` or `.playwright-mcp/` snapshots — delete them before committing (both are gitignored; see `.cursor/rules/mcp-qa.mdc`).
- **Secrets** stay in Doppler `dev` — never write real credentials into git.

## Stack (local)
| App | URL | Notes |
| --- | --- | --- |
| web | `http://localhost:3000` | learner/tenant, i18n `[locale]` (`uz`/`en`/`ru`) |
| admin | `http://localhost:3001` | platform admin, no i18n |
| api | `http://localhost:4000` | health `GET /health` (no `/api` prefix) |

Bring it up first: `pnpm dev:infra && pnpm dev` (or `pnpm dev:all` for a clean DB). Confirm `GET /health` is ok before testing.

**Preflight (always, esp. unattended):** run `bash scripts/qa-preflight.sh` (= `pnpm qa:preflight`) first. It clears stale Playwright Chrome profile locks (the recurring "Browser is already in use" stall), health-gates web/admin/api, recovers a **wedged web server in place** (never spawns a duplicate or touches the user-owned api/admin), **probes the QA test-account logins + generates the `docs/qa/fixtures/` kit (`pnpm qa:fixtures`) + checks disk**, verifies Doppler, and cleans `.playwright-mcp/` + repo-root `*.png`. **Exit 1 → stop**, don't drive a browser against a dead stack. For the full unattended anti-stall playbook (bounded waits, login-stall direct-nav fallback, between-role health gates, browser recycle, console-error triage), see **`docs/qa/overnight-visual-qa.md` §0** — `scripts/qa-overnight.sh` is the launcher and `.claude/settings.local.json` pre-grants the permissions so recovery never prompts.

## Procedure
1. **Boot ritual — read all four docs + preflight.** Load test accounts from the journal; read the
   last 5 journal entries, the `coverage-map.md` frontier, and the `user-stories.md` F/O ledgers. Run
   `bash scripts/qa-preflight.sh` (clears the Chrome lock, health-gates + recovers a wedged web server
   in place, **checks test-account logins + generates fixtures + disk**, verifies Doppler). Exit
   non-zero → STOP and log a `stack-down`/`web-wedge` note. Compile the Never/Ever invariants (seat
   limit never exceeded; deactivated learner loses access immediately; learner sees only assigned; no
   cross-tenant id in any response; GAME timing server-authoritative) as standing violation-charters.
2. **Select charters from `coverage-map.md` (not "the next ⬜ story").** Sort cells by
   `staleness × risk − recentness`; pick 6–10; **never re-test a cell touched in the last 2 runs unless
   its `last_commit` changed.** Write each in Hendrickson form with pre-committed done-conditions you
   may not redefine mid-run. Honor `QA_FOCUS`/`QA_TOUR`/`QA_PERSONA`/`QA_SOAP`. Guarantee ≥1 charter per
   run for reliability, isolation, a11y, performance, and visual.
3. **Run each session with a persona + tour lens** (from `human-qa-playbook.md`), to **depth ≥3**:
   open → interact → submit → **verify persisted after a real `location.reload()`** (not soft-nav).
   Apply ≥3 input attacks per field (playbook §4) and the charter's tour lens. **Vigilance-scan console
   + network after every click/type.** Use **bounded waits only** — cap generation waits, mark a stuck
   Bull job `blocked-on-job` and move on; on the login-redirect stall, direct-nav to the role home
   (`overnight-visual-qa.md` §0.3). Cover mobile (390) + the state axis (empty/error/loading/quota).
4. **Run the oracles (§D) before trusting AI output.** Grade summaries/quizzes/flashcards against
   `docs/qa/fixtures/uz-math-facts.md`: solve every quiz key independently, ground each claim to a
   source sentence, run the decomposed Uzbek rubric, and the deterministic KaTeX/mermaid checks.
   Rendering alone is depth-1 and does **not** pass. Add a new EC row whenever you find a case the
   matrix misses (still 🚫 the impossible ones with reasoning).
5. **Self-verify before logging (§E).** Reproduce twice (once from fresh state) → minimal repro →
   environment-attribution + **skeptic pass** → **evidence triple** (failure screenshot + console
   excerpt + full failing request) + severity `S1–S4`. Reproducible + oracle-named + evidence-bundled
   → **`F<n>`** (next number after the highest F across both docs; a reserved block F76–F99 exists for
   the coverage-expansion pass). Non-repro / enhancement / Uzbek-fluency-doubt → **`O<n>` observations
   ledger** (re-triaged every run — this is how "dismissed as artifact → real bug", cf. F63, is caught).
6. **Record results.** Update the touched `coverage-map.md` cell (depth/run-id/tour/findings); set each
   EC's status + the story's Last verified; a ❌ EC must link a finding. Translate any user-facing string
   fix across `uz`/`en`/`ru` (`apps/web/messages/*.json`).
7. **After any code fix:** verify per the HARD RULES (`pnpm --filter @talim/types build && pnpm --filter
   @talim/web typecheck && pnpm --filter @talim/admin typecheck`) and re-test in the browser. Respect
   invariants — `prisma generate` is auto-wired in `apps/api`; route content/assessment access through
   `contentAccess.service.ts`. Set the EC 🐛→✅ with the fix commit SHA in both the EC row and the ledger.
8. **Update the journal** (`visual-qa-report.md`) with the session report
   (`charter · tour · persona · env · action-log · TBS% · F# · O# · cells-touched · blocked%`).
9. **Clean up** repo-root screenshots / `.playwright-mcp/`; screenshots live under `docs/qa/screenshots/`.
10. **Commit on `claude/visual-qa` per charter** (a crash loses ≤1 charter):
   - QA-only progress: `docs(qa): <what was checked> — <notes>; F<n> logged[+fixed]`
   - A code fix tied to QA: a separate `fix(web): …` (or `fix(api):` / `fix(admin):`) commit, mirroring
     history like `fix(web): show 'account deactivated' on login 403…`.

## Roles to exercise (from the product model)
- **INDIVIDUAL** (B2C): upload PDF/YouTube → READY → workspace; Summary/Quiz/Podcast/Chat; dashboard; settings; become-tutor.
- **TENANT_OWNER**: students (create email-less kid, reset, deactivate/reactivate), join code, materials upload/assign/delete, question banks, WRITTEN + GAME assessments, progress, billing, settings/org-rename.
- **TENANT_LEARNER**: sees only assigned materials, AI tutor, quizzes/games, own progress; deactivated → content access lost.
- **ADMIN** (3001): tutor-requests approval (sets seat limit), users, tenants, content, generated, subscriptions, usage, audit.
- **AUTH** (all locales): register (valid / duplicate / weak pw / join-code), login (valid / wrong pw / deactivated 403), role-based redirect, logout, locale persistence, deep-link bounce, reset-password.

## When done — ledger-reconciliation gate
The run may **not** close while the journal and the ledgers disagree. Confirm typechecks pass, then:
every EC you touched has a status; every ❌ links a finding; every fix has a commit SHA in both the EC
row and the ledger; every touched `coverage-map.md` cell has an updated depth + run-id + `last_commit`.
Roll closed runs in the journal into a summary line so it never exceeds one read window. Promote any
structural/ambiguous deferral into `docs/PLANS.md` with an owner + date rather than re-pasting it into
next run's deferred block. End with: cells advanced (by depth), bugs fixed (commits), issues logged
(F + O), the flaky/blocked-on-job lists, and **tomorrow's charter queue**.

## The mindset
Coverage is **oracle-verified cells, not clicks**. A cell isn't covered because it renders — it's
covered at **depth ≥3** (interacted → submitted → persisted-after-reload) with its negative paths,
races, and isolation checks accounted for. **A finding without an evidence triple (console + network +
screenshot) and a named oracle is an anecdote, not a bug** — it belongs in the `O<n>` observations
ledger until it earns an `F<n>`. When in doubt, add the EC row and test it.
