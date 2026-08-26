# Loop runbook — QA issue burndown

**Pattern:** `continuous-pr` · **Mode:** `safe` · **Started:** 2026-08-26

## Stop condition (explicit)

The loop ends when this returns `0`:

```bash
gh issue list --label qa-found --state open --limit 100 --json number --jq length
```

Baseline at start: **34 open** (1×S2, 22×S3, 11×S4).

### Loop complete — stop condition met

```
gh issue list --label qa-found --state open  ->  0
```

**34 → 0.** 34 closed across 27 PRs (#86–#112), all merged. Two were closed as
*already fixed* after verification rather than re-fixed (#45, #63), and #9 was
relabelled S2 → S3 because the analysis showed it was never data loss.

### The last three were decisions, and were decided

| | Call taken | Why not the bigger option |
| --- | --- | --- |
| #29 | Learner keeps their own pre-join uploads, read-only | — |
| #30 | Keep usernames global; make a collision actionable | Per-tenant usernames changes what every existing child types to log in, for a problem that is predictive rather than current |
| #9 | Report what exists in other languages | Un-scoping artifacts would show Uzbek quizzes inside a Russian UI — that contradicts the model rather than fixing it |

#29 was the risky one: it touches `contentAccess.service`, which 17 modules run
through, so it shipped behind six isolation controls (another learner's files,
unassigned org material, another tenant's material, mutate, generate, deactivated
learner) rather than on the strength of the feature working.

### What the diagnoses changed

Three issues were **wrong or narrower than filed** and were corrected on the issue
rather than fixed as written: **#43** (never stuck — it errors after a ~1s retry),
**#67** (blames a banner the learner shell redirects away from), **#42** (asks for
per-answer correctness that cannot exist client-side).

Six grew **larger** once diagnosed — these were the highest-value finds:

- **#11** — the reported race is the smaller half. The mid-job quota assert dropped
  `tenantId`, so every tutor was metered against a phantom personal FREE plan (5/day)
  instead of their org's (50/day), *and* the job wrote that phantom subscription. Two
  of six tenant owners in the dev DB already had one.
- **#35** — `ContentVideo.storagePath` is written by no code, so *every* delete path
  orphaned video audio, not just the admin ones.
- **#32** — the axios interceptor is the only thing that ends a session, so every
  raw-`fetch` transport bypassed it.
- **#25** — a PDF whose catalog lies (`/Count 0`) parsed "fine" as 0 pages and skipped
  the cap; and the tenant upload path had no file gate at all.
- **#16** — three defects: a slug-collision 500, a silent duplicate org, and a seat
  limit discarded at HTTP 200.
- **#26** — the row is `PENDING`, not `PROCESSING`, so all three recovery mechanisms
  were blind to it; and a brief Redis blip does not reproduce it (Bull buffers ~4 min).

### Method

Two rounds of parallel read-only diagnosis agents produced the fix and verification
plans; implementation and verification stayed in the main loop. That split found every
scope expansion above. Their most valuable output was not the fix plans but the
**induce recipes** — the six ingest/queue issues were open precisely because none of
those failures happens on its own.

Every non-trivial fix was run **with the fix stashed first**, to prove the check could
actually fail. That caught more bad tests than bad fixes.

### Known follow-ups, deliberately not done

- **#12's duration ceiling is unverifiable end-to-end** until `@distube/ytdl-core` is
  upgraded — it currently fails "Failed to find any playable formats" on every video.
- **A periodic `UPLOAD_DIR` sweeper** for manim assets (path lives only in the Redis job
  record) and the ACTIVE-job race.
- **`DELETE /admin/users/:id`** cascades every content of a user and still orphans blobs;
  cheap now that `deleteContentMediaBlobs` exists, but it needs its own negative control.
- **Prod is not backfilled** for podcast durations, and prod `Tenant.ownerId` uniqueness
  was only precondition-checked on dev.

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
