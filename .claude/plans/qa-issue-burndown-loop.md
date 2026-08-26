# Loop runbook — QA issue burndown

**Pattern:** `continuous-pr` · **Mode:** `safe` · **Started:** 2026-08-26

## Stop condition (explicit)

The loop ends when this returns `0`:

```bash
gh issue list --label qa-found --state open --limit 100 --json number --jq length
```

Baseline at start: **34 open** (1×S2, 22×S3, 11×S4).

### Progress

**34 → 13 open.** 21 closed across 15 PRs (#86–#101), all merged. Two were closed as
*already fixed* after verification rather than re-fixed (#45 messages, #63 flashcards tab);
one had its premise corrected (#43 was never actually stuck).

Remaining 13, and why each is still open:

| | Why it's still here |
| --- | --- |
| #9 #14 #29 #30 | Need a product decision, not a fix. #30 has the options written up on the issue. |
| #11 #12 #16 #25 #26 #28 | Ingest/queue failure paths — each needs a way to *induce* the failure before it can be verified. |
| #32 #35 | Tractable; not yet started. |
| #42 | GAME-quiz screen-reader support — the last of the a11y set. |

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
