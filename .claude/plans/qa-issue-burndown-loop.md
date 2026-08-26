# Loop runbook — QA issue burndown

**Pattern:** `continuous-pr` · **Mode:** `safe` · **Started:** 2026-08-26

## Stop condition (explicit)

The loop ends when this returns `0`:

```bash
gh issue list --label qa-found --state open --limit 100 --json number --jq length
```

Baseline at start: **34 open** (1×S2, 22×S3, 11×S4).

### Progress

**34 → 9 open.** 25 closed across 20 PRs (#86–#105), all merged. Two were closed as
*already fixed* after verification rather than re-fixed (#45 messages, #63 flashcards tab).

Three issues turned out to be **wrong or narrower than filed**, and were corrected on the
issue rather than fixed as written:

- **#43** — the page was never stuck; it errors after a ~1s react-query retry. The real
  defect was the dead-end that state settles into.
- **#67** — names the change-password banner as a cause, but `learner-shell` redirects a
  student with `mustChangePassword` away from the dashboard entirely.
- **#42** — asks for per-answer correctness feedback that cannot exist: the client has no
  answer key mid-game.

Two grew **larger** than filed once diagnosed:

- **#35** — `ContentVideo.storagePath` is written by no code, so *every* delete path was
  orphaning video audio, not just the admin ones.
- **#32** — the axios interceptor is the only thing that ends a session, so every raw-fetch
  transport (blob, summary, chat, SSE) bypassed it.

Remaining 9:

| | Why it's still here |
| --- | --- |
| #9 #29 #30 | Need a product decision, not a fix. All three have the options written up on the issue. |
| #11 #12 #16 #25 #26 #28 | Ingest/queue failure paths — each needs a way to *induce* the failure before it can be honestly verified. Diagnosis in progress. |

### Method note

Two rounds of parallel diagnosis agents (read-only, no edits) produced the fix and
verification plans; implementation and verification stayed in the main loop. That split
worked well — the agents found the two scope expansions above, which a straight read of the
issues would have missed.

It also stops early on any of: the quality gates going red and not being fixable
within the iteration, `qa-preflight.sh` aborting (never drive QA against a stack that
isn't ours), or the user saying stop.

## Iteration

One issue — or one tightly-related cluster — per iteration:

1. **Read the issue and locate the cause.** Do not fix from the title. Roughly a third
   of the issues worked so far were mis-scoped, already fixed, or had a different cause
   than reported, and one "obvious" fix would have been a silent no-op.
2. **Branch** off current `main` (`fix/<n>-<slug>`).
3. **Fix**, with a comment saying *why* wherever the reason isn't obvious from the code.
4. **Verify against the running stack** — not just types. Assert the user-visible
   behaviour, and assert the negative case too (see Gates).
5. **Gates** (all must pass):
   - `pnpm --filter @talim/types build`
   - `tsc --noEmit` in each touched app
   - `pnpm lint` — repo-wide. *Typecheck alone is not enough: CI caught a literal
     U+FEFF via `no-irregular-whitespace` that tsc was happy with.*
   - `node scripts/qa-i18n-check.mjs` if any user-facing string changed
6. **PR** with the evidence in the body, then **merge on green** (user-authorised).
7. Re-check the stop condition and continue.

## Gates that exist because they caught something

- **Verify the negative case.** A `confirm()` the code then ignores passes a
  "does it prompt?" test. Assert that dismissing it *cancels*.
- **Verify the success path too.** A guard that errors on everything passes an
  "does it show an error?" test. Assert no spurious error when the request succeeds.
- **Assert on a real value.** One check read `avgQuizScore` off the response root where
  the field doesn't exist, so `undefined == null` satisfied it — it would have passed
  no matter what the fix did.
- **Match UI selectors exactly.** `Faolsizlantirish` substring-collides with
  `Qayta faollashtirish`; a loose match clicks the opposite button, and a *skipped*
  assertion reads as a pass at a glance.
- **Scope test data to the right tenant.** Two orgs exist in the dev DB. Picking a
  student via `findFirst` hits the wrong one and the request 404s, which looks like a
  failing fix.
- **Clear `.next` when a client change seems inert.** An edited interceptor appeared
  only in HMR hot-update chunks, so a fresh browser context loaded the stale main
  bundle and a working fix looked broken.

## Scope rules

- **Fix what's reported; don't redesign.** If the correct behaviour is a product
  decision (#9's cross-locale artifact discoverability, #13's lapsed-subscription
  policy), post the evidence on the issue and ask rather than choosing silently.
- **Security- or abuse-shaped findings never become public issues** — this repo is
  public. Draft advisory instead:
  `gh api --method POST /repos/KAMRONBEK/talim-ai/security-advisories --input <file>`.
- **Group only when one change genuinely closes several** (e.g. `parseCsv` closed
  #48/#65/#66). Otherwise one issue per PR, so a revert is surgical.
- **Say what was left undone.** #44/#67 shipped as explicitly partial with measurements,
  rather than being closed on an improvement that didn't reach the bar.

## Monitor

```bash
gh issue list --label qa-found --state open --limit 100 --json number --jq length   # burndown
gh pr list --state open                                                             # in flight
gh run list --branch main --limit 5                                                 # deploys
cat docs/qa/.qa-run-manifest.json                                                   # sweep phase
```
