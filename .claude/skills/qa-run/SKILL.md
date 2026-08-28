---
name: qa-run
description: Run a QA cycle on Talim AI — run the deterministic sweep, triage its failures, drive stale coverage cells to depth in a real browser (Playwright MCP), file findings as GitHub issues, fix + typecheck, and commit on the QA branch. Use when the user says "qa", "qa run", "visual qa", "continue qa", or "/qa-run".
---

# Talim AI — QA cycle

The interactive twin of the continuous QA loop. Full spec: **`docs/qa/overnight-visual-qa.md`** — read
it first; this skill is the short form.

## The two tiers — know which one you are

| Tier | What | Who |
| --- | --- | --- |
| **Deterministic sweep** | `pnpm qa:sweep` (`scripts/qa-sweep.mjs`) visits **every** route × role × variant and runs a binary probe pack. Zero LLM cost. | The machine |
| **Judgement** | Whether a failure is real; whether a *flow* works end to end; Uzbek quality; answer-key correctness; multi-actor races. | **You** |

Never spend turns doing the sweep's job. If you are eyeballing a page for overflow or counting console
errors, stop — that already ran on every page, deterministically.

## Instruments (one source of truth each)
- **`docs/qa/qa-sweep-verdicts.json`** — this cycle's machine findings. **Your first work queue.**
- **`docs/qa/qa-coverage-state.json`** — the durable coverage queue. **The definition of done.**
- **`docs/qa/human-qa-playbook.md`** — personas, tour lenses, input-attack catalog, soap operas.
- **`docs/qa/user-stories.md`** — EC spec + F/O findings ledger.
- **`docs/qa/visual-qa-report.md`** — append-only session journal.

## Hard rules
- **Branch:** work only on `claude/visual-qa`. Never push `main`, never deploy.
- **Local only:** `:3000` web, `:3001` admin, `:4000` api. Never prod — production is out of scope
  for QA. (Nothing polls it on a schedule: the health monitor was removed rather than carry a
  credential nobody wanted to maintain. The admin `/health` page still runs the same probes on demand.)
- **Tooling:** drive the UI with the **`playwright`** MCP. Use **`talim-vps`** MCP only for server ops.
- **Screenshots** → `docs/qa/screenshots/` (gitignored). No repo-root `*.png`, no `.playwright-mcp/` staged.
- **Secrets** stay in Doppler — never write real credentials into git.

## Stack
`pnpm dev:infra && pnpm dev` (or `pnpm dev:all` for a clean DB). Confirm `GET :4000/health` is 200.
**Preflight always:** `bash scripts/qa-preflight.sh` (= `pnpm qa:preflight`) — clears stale Chrome
profile locks, health-gates all three servers, recovers a wedged web server in place, probes the QA
test-account logins, generates fixtures, checks disk, verifies Doppler. **Exit 1 → stop.**

## Procedure

1. **Boot.** Read the runbook, `qa-coverage-state.json`, and the last 3 journal entries. Run the
   preflight. Compile the Never/Ever invariants (seat limit never exceeded; deactivated learner loses
   access immediately; learner sees only assigned; no cross-tenant id in any response; GAME timing
   server-authoritative).

2. **Sweep.** `pnpm qa:sweep`. It enumerates routes from the filesystem, so new pages appear on their
   own. Never hand-maintain a route list.

3. **Triage the sweep's failures first.** Each `fail` in the verdicts names route + role + variant +
   probe and already reproduced deterministically. Reproduce once in the browser, apply §E, then fix or
   file. **A false positive is a probe bug** — tighten `scripts/qa-sweep.mjs` or extend
   `console-baseline.json`, and say so. A sweep that cries wolf gets ignored inside a week.

4. **Then deepen.** Pull cells whose status isn't `verified`, sorted by staleness × risk, and drive each
   to **depth ≥3**: open → interact → submit → **verify persisted after a real `location.reload()`**
   (not soft-nav). Tag one persona + one tour lens; apply ≥3 input attacks per field; fire a side-quest
   (cancel mid-op, reload mid-flow, back-button mid-wizard) and watch the recovery. Mark a cell
   `verified` only when it truly reached depth 3 — a coverage number that lies is worse than none.

5. **Spend judgement where only judgement works:** multi-turn tutor conversations (follow-ups that only
   make sense in context — this is how F64 hid for months), multi-actor races, long sessions that rot,
   soap operas, and anything with money or a date on it.

6. **Oracles (§D) before trusting AI output.** Grade against `docs/qa/fixtures/uz-math-facts.md`: solve
   every quiz key independently, ground each claim to a source sentence, run the decomposed Uzbek
   rubric. Rendering is depth 1 and does not pass.

7. **Self-verify (§E) before logging.** Reproduce twice (once fresh) → minimal repro → environment
   attribution + skeptic pass → evidence triple (screenshot + console + full failing request) + severity.
   **An S1/S2-shaped candidate that fails reproduce-twice is `F<n>` marked flaky, not a demoted
   observation** — the old rule is exactly how the duplicate-PDF-panel bug survived 13 runs.

8. **File it (§F).** Non-security → `gh issue create --label bug --label S2|S3|S4 --label qa-found`
   (title = the symptom in the user's words; body = Symptom / Evidence file:line / Reproduction / Notes;
   `gh issue list --label qa-found` first to dedupe). **Security- or abuse-shaped → NEVER a public
   issue — this repo is public.** Draft advisory instead:
   `gh api --method POST /repos/KAMRONBEK/talim-ai/security-advisories --input <file>`. When in doubt,
   treat it as security.

9. **After any code fix:** `pnpm --filter @talim/types build && pnpm --filter @talim/web typecheck &&
   pnpm --filter @talim/admin typecheck`, then re-test in the browser. Route content/assessment access
   through `contentAccess.service.ts`. Translate user-facing strings across `uz`/`en`/`ru`.

10. **Record + commit per unit of work.** Update the cell, append the session report
    (`cells-advanced · sweep-failures-triaged · F# · O# · issues-filed · blocked-on-job · next-up`), clean
    stray screenshots, commit:
    - QA progress: `docs(qa): <what was checked> — <notes>; F<n> logged[+fixed]`
    - Code fix: a separate `fix(web|api|admin): …` commit.

**Don't** write TBS percentages, PROOF debriefs, budget checkpoints, or staleness reports.
`qa-coverage-state.json` is generated truth; narrating it is wasted budget.

## Roles to exercise
- **INDIVIDUAL** (B2C): upload PDF/YouTube → READY → workspace; Summary/Quiz/Podcast/Chat; practice
  generator; SRS flashcards; dashboard; settings; become-tutor.
- **TENANT_OWNER**: students (email-less kid, reset, deactivate/reactivate), join code, materials
  upload/assign/delete, question banks, WRITTEN + GAME assessments, messaging, CSV import/export,
  progress, billing, settings.
- **TENANT_LEARNER**: only assigned materials, AI tutor, structured players, games, own progress;
  deactivated → access lost.
- **ADMIN** (:3001): tutor-request approval, users, tenants, content moderation, generated, subscriptions,
  usage, audit, impersonation, `/health`.
- **AUTH** (all locales): register (valid / duplicate / weak pw / join-code), login (valid / wrong pw /
  deactivated 403), role redirect, logout, locale persistence, deep-link bounce.

## The mindset
Coverage is **cells verified at depth, not clicks**. A cell isn't covered because it renders — the sweep
already proved that on every page. It's covered when its flow was driven end to end, persisted through a
real reload, and its negative paths, races, and isolation checks were accounted for. **A finding without
an evidence triple and a named oracle is an anecdote** — it belongs in the `O<n>` ledger until it earns
an `F<n>`.
