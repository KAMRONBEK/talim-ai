---
name: qa-run
description: Run a resumable visual-QA pass on Talim AI with Playwright MCP — pick up the checklist in docs/qa/visual-qa-report.md, drive the real browser as each role, log findings as F<n>, fix + typecheck, and commit on the QA branch. Use when the user says "qa", "qa run", "visual qa", "continue qa", or "/qa-run".
---

# Talim AI — Visual QA run

A resumable, browser-driven QA pass with full user-story traceability. Two docs work together:
- **`docs/qa/user-stories.md`** — the **durable spec + results ledger**: user stories decomposed to their deepest edge cases (`EC`), each with a live status, the finding (`F#`) it produced, and the fix commit that closed it. *This is the source of truth for coverage.*
- **`docs/qa/visual-qa-report.md`** — the **run journal**: test accounts, the resumable checklist, and the running narrative of this session.

Always read **both** first. Drive testing from the user-stories matrix; record progress in both.

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

**Preflight (always, esp. unattended):** run `bash scripts/qa-preflight.sh` (= `pnpm qa:preflight`) first. It clears stale Playwright Chrome profile locks (the recurring "Browser is already in use" stall), health-gates web/admin/api, recovers a **wedged web server in place** (never spawns a duplicate or touches the user-owned api/admin), verifies Doppler, and cleans `.playwright-mcp/` + repo-root `*.png`. **Exit 1 → stop**, don't drive a browser against a dead stack. For the full unattended anti-stall playbook (bounded waits, login-stall direct-nav fallback, between-role health gates, browser recycle, console-error triage), see **`docs/qa/overnight-visual-qa.md` §0** — `scripts/qa-overnight.sh` is the launcher and `.claude/settings.local.json` pre-grants the permissions so recovery never prompts.

## Procedure
1. **Read both docs.** Load test accounts + checklist from the report; load the story/EC matrix from `user-stories.md`. Pick the next story (or EC) that is ⬜/🟡; don't re-run ✅ items.
2. **Preflight + confirm the stack.** Run `bash scripts/qa-preflight.sh` (clears the Chrome lock, health-gates + recovers a wedged web server in place, verifies Doppler). If it exits non-zero, STOP and log a `stack-down`/`web-wedge` note. Use **bounded waits only** — never wait forever for navigation/elements/generation; on the login-redirect stall, navigate directly to the role home (see `overnight-visual-qa.md` §0.3).
3. **Test the story to its edge cases.** For the chosen story, walk **every EC in its matrix** as the real role via Playwright: snapshot, interact like a user, watch for console errors, broken/empty/error states, untranslated strings (Uzbek-first — flag hardcoded English/Uzbek leaks), layout breaks, races (double-submit), and **role-isolation** (a learner/other-tenant must never reach another's content — S1). Cover mobile + tablet (768) where relevant.
4. **Go deeper — grow the matrix.** When you think of an edge case that isn't listed, **add a new EC row** to that story before/while testing it. The goal is depth: boundaries, concurrency, stale cache, slow network, malformed input, expired/used tokens, seat-limit-full, deactivated-mid-session. An EC that "can't happen" still gets a row with the reasoning and 🚫.
5. **Record results in the matrix.** Set each EC's **Status** (legend in `user-stories.md`), and stamp the story's **Last verified** date/commit. A ❌ EC must get a finding.
6. **Log every issue as `F<n>`** in the **Findings ledger** in `user-stories.md` (next number after the highest existing F across both docs): severity `S1–S4`, the `US-…·ECn` it came from, summary, and screenshot path. Fix small/clear bugs immediately; keep changes scoped; translate any user-facing strings across `uz`/`en`/`ru` (`apps/web/messages/*.json`).
7. **After any code fix:** run `pnpm typecheck` (closing summary asserts "all typechecks pass") before committing. Respect repo invariants — `prisma generate` is auto-wired in `apps/api`; route any content/assessment access through `contentAccess.service.ts`. Then set the EC to 🐛→✅ and put the **fix commit SHA** in both the EC row and the ledger.
8. **Update the journal** (`visual-qa-report.md`): tick checklist items and add the session narrative.
9. **Clean up** repo-root screenshots / `.playwright-mcp/`.
10. **Commit on `claude/visual-qa`** using the project's style:
   - QA-only progress: `docs(qa): <what was checked> — <notes>; F<n> logged[+fixed]`
   - A code fix tied to QA: a separate `fix(web): …` (or `fix(api):` / `fix(admin):`) commit, mirroring history like `fix(web): show 'account deactivated' on login 403…`.
   Commit in checkpoints (per flow/role), not one giant commit — matching the existing `docs(qa): … checkpoint` cadence.

## Roles to exercise (from the product model)
- **INDIVIDUAL** (B2C): upload PDF/YouTube → READY → workspace; Summary/Quiz/Podcast/Chat; dashboard; settings; become-tutor.
- **TENANT_OWNER**: students (create email-less kid, reset, deactivate/reactivate), join code, materials upload/assign/delete, question banks, WRITTEN + GAME assessments, progress, billing, settings/org-rename.
- **TENANT_LEARNER**: sees only assigned materials, AI tutor, quizzes/games, own progress; deactivated → content access lost.
- **ADMIN** (3001): tutor-requests approval (sets seat limit), users, tenants, content, generated, subscriptions, usage, audit.
- **AUTH** (all locales): register (valid / duplicate / weak pw / join-code), login (valid / wrong pw / deactivated 403), role-based redirect, logout, locale persistence, deep-link bounce, reset-password.

## When done
Confirm typechecks pass. Leave the **matrix reflecting reality** — every EC you touched has a status, every ❌ has a finding, every fix has a commit SHA in both the EC row and the ledger. Update the report's closing summary (counts logged/fixed, what's deferred and why) and mark any story `done` in the index once its P0/P1 ECs are all green. Surface anything that needs a human decision rather than silently deferring it.

## The mindset
Coverage is measured in **edge cases, not clicks**. A story isn't "done" because the happy path works — it's done when its negative paths, boundaries, races, and isolation checks are all accounted for. When in doubt, add the EC row and test it.
