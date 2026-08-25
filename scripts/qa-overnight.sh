#!/usr/bin/env bash
#
# CONTINUOUS QA — runs until every piece of the product has been verified, then loops.
#
# This is not a "nightly session". It is a run-to-completion sweep over the whole
# surface: it keeps working cycle after cycle until the coverage queue in
# docs/qa/qa-coverage-state.json reports a complete pass, and only then stops (or
# starts the next pass, if QA_PASSES > 1). It happens to be scheduled at night
# because that is when the machine is free — nothing about it is time-boxed.
#
# Two tiers, in this order, every cycle:
#   1. scripts/qa-sweep.mjs — deterministic Playwright sweep over EVERY route x role x
#      variant with a binary probe pack. No LLM tokens. This is what makes "everything
#      was checked" a fact rather than a claim.
#   2. claude -p — the judgement tier. It triages the sweep's failures first, then
#      advances the stalest cells to real depth (interact -> submit -> persisted after
#      reload) and does the things only judgement can do: multi-actor races, AI-output
#      grounding, soap operas, Uzbek quality.
#
# Runs on the `claude/visual-qa` branch. Never checks out main, never deploys.
# It MAY push its own branch and open a PR (QA_OPEN_PR=1, default on) so fixes stop
# piling up locally — but pushing `main` is not allowlisted, so it cannot deploy.
#
# SELF-SUFFICIENT: if the local stack isn't running it brings it up (docker db/redis ->
# migrate -> 3 dev servers; NO seed, so accumulated QA data survives). Prereqs it can't
# do for you: Docker Desktop running + Doppler logged in + `claude` CLI installed.
#
# Usage:   pnpm qa:continuous     (alias: pnpm qa:overnight)
#
# Tunables:
#   QA_PASSES=1          how many complete coverage passes to run (0 = forever)
#   QA_MAX_CYCLES=12     safety cap on sweep+agent cycles per pass
#   QA_BUDGET=60         USD budget per agent cycle
#   QA_TURNS=1200        max turns per agent cycle
#   QA_REPORT_ONLY=1     find + report only, never edit code
#   QA_SKIP_SWEEP=1      skip the deterministic tier (agent only)
#   QA_SWEEP_ONLY=1      run the deterministic tier and stop (no LLM spend)
#   QA_OPEN_PR=0         don't push the branch / open a PR
#   QA_FOCUS=...         bias the agent toward areas/US-ids
#   QA_TOUR= QA_PERSONA= QA_SOAP=1     pin a lens / persona / soap-opera-only
#
set -uo pipefail

cd "$(dirname "$0")/.." || exit 1
BRANCH="claude/visual-qa"
PASSES="${QA_PASSES:-1}"
MAX_CYCLES="${QA_MAX_CYCLES:-12}"
BUDGET="${QA_BUDGET:-60}"
TURNS="${QA_TURNS:-1200}"
OPEN_PR="${QA_OPEN_PR:-1}"
STAMP="$(date +%Y%m%d-%H%M)"
LOG="/tmp/talim-qa-${STAMP}.log"
MANIFEST="docs/qa/.qa-run-manifest.json"

say(){ printf '%s  %s\n' "$(date +%H:%M:%S)" "$*" | tee -a "$LOG"; }

# The manifest is the black box recorder. Every phase transition lands here, so the
# next run (and a human, days later) can tell exactly where a dead run died. The old
# harness had none, which is why a 5-week outage went unnoticed: launchd throws the
# exit status away and the only trace was a stale /tmp log nobody reads.
phase(){
  printf '{"stamp":"%s","phase":"%s","at":"%s","pass":"%s","cycle":"%s"}\n' \
    "$STAMP" "$1" "$(date -u +%FT%TZ)" "${PASS:-0}" "${CYCLE:-0}" > "$MANIFEST"
  say "▶ $1"
}

phase launched

command -v claude >/dev/null 2>&1 || { say "❌ 'claude' CLI not found."; exit 1; }
command -v doppler >/dev/null 2>&1 || { say "❌ doppler CLI not found."; exit 1; }
# Validate doppler the way everything downstream uses it. `doppler projects list`
# needs a broader scope and false-fails on a config-scoped token.
doppler run -- true >/dev/null 2>&1 || { say "❌ 'doppler run' failed — check 'doppler setup' / token."; exit 1; }

git checkout "$BRANCH" 2>/dev/null || git checkout -b "$BRANCH" || {
  say "❌ could not switch to $BRANCH (commit/stash your changes first)."; exit 1; }

# ---------------------------------------------------------------------------------
# Stack bring-up. Reuse a healthy stack; otherwise start it.
# `pnpm dev:infra` is doppler-wrapped (docker-compose.yml hard-fails without
# CORS_ORIGIN since dd9c7675 — a bare `docker compose up` here is what silently
# killed every scheduled run from 2026-07-19 to 2026-08-22).
# ---------------------------------------------------------------------------------
CAFFEINATE=""
command -v caffeinate >/dev/null 2>&1 && CAFFEINATE="caffeinate -is"

# macOS has no GNU `timeout` by default; coreutils ships it as `gtimeout`. Degrade to
# no cap rather than failing the run, but say so — a silent missing timeout is how a
# hung sweep turns into a lost night.
SWEEP_TIMEOUT_BIN=""
if command -v timeout >/dev/null 2>&1; then
  SWEEP_TIMEOUT_BIN="timeout ${QA_SWEEP_TIMEOUT:-90m}"
elif command -v gtimeout >/dev/null 2>&1; then
  SWEEP_TIMEOUT_BIN="gtimeout ${QA_SWEEP_TIMEOUT:-90m}"
fi

qa_http(){ curl -s -o /dev/null -w '%{http_code}' -m 5 "$1" 2>/dev/null || echo 000; }
qa_stack_healthy(){
  [ "$(qa_http http://localhost:4000/health)" = 200 ] || return 1
  case "$(qa_http http://localhost:3000/uz)"    in 200|307|308) ;; *) return 1;; esac
  case "$(qa_http http://localhost:3001/login)" in 200|307|308) ;; *) return 1;; esac
  return 0
}

phase stack-check
DEV_LOG="/tmp/talim-dev-qa-${STAMP}.log"
if qa_stack_healthy; then
  say "local stack already up — reusing it"
else
  # Recover per service. The stack is usually the user's own `pnpm dev:all`, and a
  # blanket free-dev-ports + `pnpm dev` would kill their running servers to fix one
  # dead app. Only start what is actually down.
  API_OK=0; WEB_OK=0; ADMIN_OK=0
  [ "$(qa_http http://localhost:4000/health)" = 200 ] && API_OK=1
  case "$(qa_http http://localhost:3000/uz)"    in 200|307|308) WEB_OK=1;; esac
  case "$(qa_http http://localhost:3001/login)" in 200|307|308) ADMIN_OK=1;; esac
  say "stack partial — api=$API_OK web=$WEB_OK admin=$ADMIN_OK"

  docker info >/dev/null 2>&1 || { say "❌ Docker not running — start Docker Desktop, then re-run."; exit 1; }
  pnpm dev:infra 2>&1 | tee -a "$LOG" || { say "❌ dev:infra (db/redis) failed."; exit 1; }

  if [ "$API_OK$WEB_OK$ADMIN_OK" = "000" ]; then
    say "nothing running — full bring-up (migrate → dev; NO seed, so QA data survives)"
    pnpm db:migrate:deploy 2>&1 | tee -a "$LOG" || say "⚠ db:migrate:deploy failed — continuing on the existing schema."
    bash scripts/free-dev-ports.sh 2>&1 | tee -a "$LOG" || true
    say "starting all dev servers in background → $DEV_LOG"
    nohup $CAFFEINATE pnpm dev >"$DEV_LOG" 2>&1 &
  else
    [ "$API_OK" = 0 ] && { say "❌ api :4000 is down but web/admin are up — that is the user's stack; not restarting it blind."; exit 1; }
    [ "$WEB_OK"   = 0 ] && { say "starting @talim/web only → $DEV_LOG";   nohup $CAFFEINATE doppler run -- pnpm --filter @talim/web dev   >>"$DEV_LOG" 2>&1 & }
    [ "$ADMIN_OK" = 0 ] && { say "starting @talim/admin only → $DEV_LOG"; nohup $CAFFEINATE doppler run -- pnpm --filter @talim/admin dev >>"$DEV_LOG" 2>&1 & }
  fi

  say "waiting up to ~5 min for web/admin/api to compile + report healthy…"
  for _ in $(seq 1 100); do qa_stack_healthy && break; sleep 3; done
  qa_stack_healthy || { say "❌ stack did not become healthy in time (see $DEV_LOG)."; exit 1; }
  say "stack healthy ✓"
fi

phase preflight
$CAFFEINATE bash scripts/qa-preflight.sh 2>&1 | tee -a "$LOG"
[ "${PIPESTATUS[0]}" -ne 0 ] && { say "❌ preflight failed — stack not healthy / unrecoverable."; exit 1; }

# ---------------------------------------------------------------------------------
# Prompt assembly
# ---------------------------------------------------------------------------------
FIX_CLAUSE="Fix clear, low-risk bugs and verify each; log ambiguous/structural ones as F<n>, curios/enhancements as O<n>."
MODE_NOTE=""
if [ "${QA_REPORT_ONLY:-0}" = "1" ]; then
  MODE_NOTE=" [REPORT-ONLY]"
  FIX_CLAUSE="REPORT-ONLY: do NOT edit any code — only investigate, run oracles + self-verification, and record findings."
fi

FOCUS_CLAUSE=""
[ -n "${QA_FOCUS:-}" ]   && FOCUS_CLAUSE=" Bias selection toward: ${QA_FOCUS}."
[ -n "${QA_TOUR:-}" ]    && FOCUS_CLAUSE="${FOCUS_CLAUSE} Pin the tour lens to '${QA_TOUR}'."
[ -n "${QA_PERSONA:-}" ] && FOCUS_CLAUSE="${FOCUS_CLAUSE} Pin the persona to '${QA_PERSONA}'."
[ "${QA_SOAP:-0}" = "1" ] && FOCUS_CLAUSE="${FOCUS_CLAUSE} SOAP-ONLY: run only the soap-opera sessions in human-qa-playbook §6."

# --allowedTools is allowlist-only. It MUST list every command the run and its
# auto-recovery use, or an unattended cycle stalls forever on the first prompt.
# `gh issue create` is included on purpose: a finding that only ever lands in a
# markdown ledger is a finding nobody works on. Push/main-checkout/prod-docker stay
# OFF the list, so the run cannot deploy.
ALLOWED="Read,Edit,Write,Grep,Glob,mcp__playwright__*,\
Bash(pnpm *),Bash(doppler *),Bash(curl *),Bash(node *),Bash(npx *),Bash(caffeinate *),\
Bash(ps *),Bash(pgrep *),Bash(pkill *),Bash(lsof *),Bash(kill *),Bash(sleep *),Bash(mkdir *),\
Bash(ls *),Bash(cat *),Bash(head *),Bash(tail *),Bash(wc *),Bash(date *),Bash(echo *),\
Bash(grep *),Bash(rg *),Bash(find *),Bash(awk *),Bash(sed *),Bash(df *),Bash(shasum *),\
Bash(jq *),Bash(graphify *),\
Bash(bash scripts/qa-preflight.sh*),Bash(bash scripts/qa-fixtures.mjs*),Bash(bash scripts/free-dev-ports.sh*),\
Bash(node scripts/qa-sweep.mjs*),Bash(rm -rf .playwright-mcp*),Bash(rm -f .playwright-mcp*),\
Bash(gh issue create*),Bash(gh issue list*),Bash(gh issue view*),Bash(gh issue comment*),\
Bash(gh label list*),Bash(gh api *security-advisories*),\
Bash(git add *),Bash(git commit *),Bash(git status*),Bash(git diff*),Bash(git log*),Bash(git show*),\
Bash(git branch*),Bash(git rev-parse*),Bash(git stash*),Bash(git worktree*),\
Bash(git checkout claude/*),Bash(git checkout -b claude/*)"

run_agent(){
  local prompt="$1"
  # --model opus is NOT optional. The global default model is Fable, and this session
  # EDITS AND COMMITS CODE — which the routing policy forbids on Fable, and which would
  # also draw from the shared weekly pool at cycle scale.
  $CAFFEINATE claude -p "$prompt" \
    --model opus \
    --permission-mode acceptEdits \
    --allowedTools "$ALLOWED" \
    --max-budget-usd "$BUDGET" \
    --max-turns "$TURNS" \
    2>&1 | tee -a "$LOG"
}

# A pass is complete when the deterministic sweep reports no unswept cells and no
# open failures. `pending` is written by qa-sweep.mjs; a missing/garbled file counts
# as "work remaining" so a broken sweep can never fake completion.
pass_complete(){
  node -e '
    const fs=require("fs");
    try{
      const s=JSON.parse(fs.readFileSync("docs/qa/qa-coverage-state.json","utf8"));
      const cells=Object.values(s.cells??{});
      const pending=cells.filter(c=>c.status!=="verified"&&c.status!=="retired").length;
      const failing=cells.filter(c=>c.lastResult==="fail").length;
      process.exit(pending===0&&failing===0?0:1);
    }catch(e){ process.exit(1); }
  ' 2>/dev/null
}

pending_summary(){
  node -e '
    const fs=require("fs");
    try{
      const s=JSON.parse(fs.readFileSync("docs/qa/qa-coverage-state.json","utf8"));
      const c=Object.values(s.cells??{});
      console.log(`${c.filter(x=>x.lastResult==="fail").length} failing, ${c.filter(x=>x.status!=="verified"&&x.status!=="retired").length} unverified, ${c.length} total`);
    }catch(e){ console.log("no coverage state yet"); }
  ' 2>/dev/null
}

say "▶ Continuous QA${MODE_NOTE} on '$BRANCH' — passes=$PASSES, max cycles/pass=$MAX_CYCLES, \$$BUDGET + $TURNS turns per cycle"
say "  log: $LOG   spec: docs/qa/overnight-visual-qa.md"

PASS=0
while [ "$PASSES" = "0" ] || [ "$PASS" -lt "$PASSES" ]; do
  PASS=$((PASS + 1))
  CYCLE=0
  say "════ PASS $PASS ════"

  while [ "$CYCLE" -lt "$MAX_CYCLES" ]; do
    CYCLE=$((CYCLE + 1))
    phase "pass${PASS}-cycle${CYCLE}-sweep"

    if [ "${QA_SKIP_SWEEP:-0}" != "1" ]; then
      # Hard wall-clock cap. The sweep checkpoints its verdicts every 25 cells, and that
      # mitigation only means anything if something can actually stop a hung run — an
      # unattended loop with no timeout waits forever on a wedged browser.
      $CAFFEINATE ${SWEEP_TIMEOUT_BIN} node scripts/qa-sweep.mjs 2>&1 | tee -a "$LOG"
      SWEEP_RC="${PIPESTATUS[0]}"
      if [ "$SWEEP_RC" = 124 ]; then
        say "❌ sweep exceeded ${QA_SWEEP_TIMEOUT:-90m} — treating as a broken environment."
        exit 1
      elif [ "$SWEEP_RC" -ne 0 ]; then
        # Exit 1 = identity/integrity gate or unreachable stack; exit 2 = bad invocation.
        # Either way the sweep's verdict file cannot be trusted, so do not spend the agent.
        say "❌ sweep could not run (exit $SWEEP_RC) — aborting (never drive QA against a broken sweep)."
        exit 1
      fi
    fi
    say "coverage: $(pending_summary)"

    if [ "${QA_SWEEP_ONLY:-0}" = "1" ]; then
      say "QA_SWEEP_ONLY=1 — deterministic tier done, stopping before any LLM spend."
      phase done-sweep-only
      exit 0
    fi

    if pass_complete; then
      say "✓ pass $PASS complete — every cell swept clean and verified."
      break
    fi

    phase "pass${PASS}-cycle${CYCLE}-agent"
    run_agent "Follow docs/qa/overnight-visual-qa.md. You are unattended; obey its HARD RULES and the §0 anti-stall playbook. This is CONTINUOUS QA (pass ${PASS}, cycle ${CYCLE}) — the goal is to drive the coverage queue to empty, not to fill a time box.
1) Boot ritual (§A): re-read the rulebook + docs/qa/qa-coverage-state.json + the last 3 journal entries in docs/qa/visual-qa-report.md. The deterministic sweep has ALREADY run this cycle.
2) TRIAGE FIRST (§B0): open docs/qa/qa-sweep-verdicts.json. Every FAIL is pre-evidenced work with a route, role, variant and probe. Work these before anything else — reproduce in the real browser, apply §E self-verification, then fix (clear+low-risk) or file. Do not re-derive what the sweep already proved; your job is to decide whether it is a real defect and what to do about it.
3) THEN DEEPEN (§B): take the stalest cells from docs/qa/qa-coverage-state.json whose status is not 'verified' and drive each to depth ≥3 (open → interact → submit → verify persisted after a real reload). Depth is what the sweep cannot do; that is the whole reason you are here. Mark each cell verified in the state file only when it genuinely reached depth 3.
4) Oracles (§D) for anything AI-generated; grade against docs/qa/fixtures/uz-math-facts.md. Rendering alone is depth 1 and does not count.
5) Self-verify (§E) BEFORE logging anything. An S1/S2-shaped candidate that fails reproduce-twice is F-flaky, NOT a demoted observation — that rule is how the duplicate-PDF-panel bug stayed hidden for 13 runs.
6) FILE WHAT YOU FIND (§H): non-security findings become GitHub issues via 'gh issue create' with labels bug + S2|S3|S4 + qa-found. Security- or abuse-shaped findings NEVER become public issues — this repo is public: put those in a draft advisory via 'gh api --method POST /repos/KAMRONBEK/talim-ai/security-advisories' and reference it in the ledger. Check 'gh issue list' first so you don't duplicate.
Update docs/qa/qa-coverage-state.json + append a session report + git commit per unit of work. ${FIX_CLAUSE}${FOCUS_CLAUSE}"

    say "cycle $CYCLE done — coverage: $(pending_summary)"
  done

  [ "$CYCLE" -ge "$MAX_CYCLES" ] && say "⚠ pass $PASS hit the cycle cap ($MAX_CYCLES) with work still pending."
done

# ---------------------------------------------------------------------------------
# Publish. Pushing the QA branch is safe — deploy.yml triggers on main only — and it
# is how fixes stop accumulating in a local checkout nobody merges.
# ---------------------------------------------------------------------------------
if [ "$OPEN_PR" = "1" ] && command -v gh >/dev/null 2>&1; then
  phase publish
  if git push -u origin "$BRANCH" 2>&1 | tee -a "$LOG"; then
    if [ -z "$(gh pr list --head "$BRANCH" --state open --json number -q '.[0].number' 2>/dev/null)" ]; then
      gh pr create --base main --head "$BRANCH" \
        --title "QA: continuous pass ${STAMP}" \
        --body "Automated continuous-QA pass. Sweep verdicts in \`docs/qa/qa-sweep-verdicts.json\`, coverage in \`docs/qa/qa-coverage-state.json\`, session journal in \`docs/qa/visual-qa-report.md\`. Findings filed as issues labelled \`qa-found\`." \
        2>&1 | tee -a "$LOG" || say "⚠ could not open PR"
    else
      say "PR already open for $BRANCH — pushed to it"
    fi
  fi
fi

phase done
say "✓ continuous QA finished — $PASS pass(es). Final coverage: $(pending_summary)"
