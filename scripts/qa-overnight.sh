#!/usr/bin/env bash
#
# Overnight DEEP visual QA — drives a real browser (Playwright MCP) across every
# page / role / locale / theme / breakpoint, fixes CLEAR bugs, and logs the rest.
# Runs UNATTENDED on the `claude/visual-qa` branch — never main, never push, never
# deploy. Resumable: re-run any night and it continues from the checklist in
# docs/qa/visual-qa-report.md. Full spec: docs/qa/overnight-visual-qa.md
#
# SELF-SUFFICIENT: one command. If the local stack isn't already running it brings it
# up (docker db/redis → prisma migrate deploy → all 3 dev servers; NO seed, so QA test
# data is preserved), runs a health/lock preflight, then drives the QA. Prereqs it
# can't do for you: Docker Desktop running + Doppler logged in + `claude` CLI installed.
#
# Usage:   pnpm qa:overnight
# Tunables: QA_BUDGET (USD, default 120)   QA_TURNS (default 2500)
#          QA_REPORT_ONLY=1  → find + report only, fix nothing (safer first pass)
#
set -uo pipefail

cd "$(dirname "$0")/.." || exit 1
BRANCH="claude/visual-qa"
BUDGET="${QA_BUDGET:-120}"
TURNS="${QA_TURNS:-2500}"
LOG="/tmp/talim-visual-qa-$(date +%Y%m%d-%H%M).log"

command -v claude >/dev/null 2>&1 || {
  echo "❌ 'claude' CLI not found — install Claude Code first."; exit 1; }

# QA branch only. Pushing main auto-deploys to prod, so we never touch it here.
git checkout "$BRANCH" 2>/dev/null || git checkout -b "$BRANCH" || {
  echo "❌ could not switch to $BRANCH (commit/stash your changes first)."; exit 1; }

MODE_NOTE=""
FIX_CLAUSE="Fix clear bugs per the runbook; log ambiguous ones."
if [ "${QA_REPORT_ONLY:-0}" = "1" ]; then
  MODE_NOTE=" [REPORT-ONLY]"
  FIX_CLAUSE="REPORT-ONLY: do NOT edit any code — only screenshot, console-check, and write docs/qa/visual-qa-report.md with every finding."
fi

echo "▶ Overnight deep QA${MODE_NOTE} on '$BRANCH' — budget \$$BUDGET, max turns $TURNS"
echo "  log: $LOG   runbook: docs/qa/overnight-visual-qa.md (resumable: just re-run)"

PROMPT="Follow docs/qa/overnight-visual-qa.md EXHAUSTIVELY. You are unattended overnight; obey its HARD RULES. Test every single thing — every element in every state, every form's every error path, every flow end-to-end with result verification, every locale (uz/ru/en), light AND dark, mobile/tablet/desktop, plus the edge/adversarial and AI-output checks. ${FIX_CLAUSE} Keep the resumable checklist in docs/qa/visual-qa-report.md updated so you never restart from zero."

# Keep the Mac awake during the run (no-op on systems without caffeinate).
CAFFEINATE=""
command -v caffeinate >/dev/null 2>&1 && CAFFEINATE="caffeinate -is"

# --- Self-sufficient stack bring-up: reuse a healthy stack, else start it ----------
# This makes `pnpm qa:overnight` a true one-command overnight run: if the dev stack
# isn't up it starts infra (db/redis) + applies migrations + launches all 3 dev
# servers (NO seed → preserves accumulated QA test data). If the stack is already
# running, it's reused untouched. caffeinate on the backgrounded `pnpm dev` keeps the
# Mac awake for the whole night.
qa_http(){ curl -s -o /dev/null -w '%{http_code}' -m 5 "$1" 2>/dev/null || echo 000; }
qa_stack_healthy(){
  [ "$(qa_http http://localhost:4000/health)" = 200 ] || return 1
  case "$(qa_http http://localhost:3000/uz)"    in 200|307|308) ;; *) return 1;; esac
  case "$(qa_http http://localhost:3001/login)" in 200|307|308) ;; *) return 1;; esac
  return 0
}
if qa_stack_healthy; then
  echo "▶ local stack already up — reusing it" | tee -a "$LOG"
else
  echo "▶ local stack down — bringing it up (infra → migrate → dev; NO seed)" | tee -a "$LOG"
  docker info >/dev/null 2>&1 || { echo "❌ Docker not running — start Docker Desktop (db/redis need it), then re-run." | tee -a "$LOG"; exit 1; }
  pnpm dev:infra 2>&1 | tee -a "$LOG" || { echo "❌ dev:infra (db/redis) failed." | tee -a "$LOG"; exit 1; }
  pnpm db:migrate:deploy 2>&1 | tee -a "$LOG" || echo "⚠ db:migrate:deploy failed — continuing on the existing schema." | tee -a "$LOG"
  bash scripts/free-dev-ports.sh 2>&1 | tee -a "$LOG" || true
  DEV_LOG="/tmp/talim-dev-qa-$(date +%Y%m%d-%H%M).log"
  echo "  starting dev servers in background → $DEV_LOG" | tee -a "$LOG"
  nohup $CAFFEINATE pnpm dev >"$DEV_LOG" 2>&1 &
  echo "  waiting up to ~5 min for web/admin/api to compile + report healthy…" | tee -a "$LOG"
  for _ in $(seq 1 100); do qa_stack_healthy && break; sleep 3; done
  qa_stack_healthy || { echo "❌ stack did not become healthy in time (see $DEV_LOG)." | tee -a "$LOG"; exit 1; }
  echo "  stack healthy ✓" | tee -a "$LOG"
fi

# Preflight + auto-recovery BEFORE burning agent budget: clears stale Playwright
# Chrome profile locks, health-gates web/admin/api (recovers a wedged web server in
# place, never touches user-owned api/admin), verifies Doppler. Aborts the whole run
# if the stack is unreachable/unrecoverable — never drive a browser against a dead stack.
$CAFFEINATE bash scripts/qa-preflight.sh 2>&1 | tee -a "$LOG"
if [ "${PIPESTATUS[0]}" -ne 0 ]; then
  echo "❌ preflight failed — stack not healthy / unrecoverable. Fix it and re-run." | tee -a "$LOG"
  exit 1
fi

# --allowedTools is allowlist-only (acceptEdits auto-approves edits). It MUST list
# every command the run + its auto-recovery use, or an unattended session stalls
# forever on the first un-allowed prompt. Recovery tools (kill/lsof/pkill/ps/pgrep/
# rm/find/graphify) are included here (they were missing before, which is exactly
# why runs 1/7/11/13 stalled). Push/main-checkout/prod-docker are intentionally NOT
# allowlisted, so the unattended run cannot perform them.
$CAFFEINATE claude -p "$PROMPT" \
  --permission-mode acceptEdits \
  --allowedTools "Read,Edit,Write,Grep,Glob,mcp__playwright__*,Bash(pnpm *),Bash(doppler *),Bash(curl *),Bash(node *),Bash(npx *),Bash(caffeinate *),Bash(ps *),Bash(pgrep *),Bash(pkill *),Bash(lsof *),Bash(kill *),Bash(sleep *),Bash(mkdir *),Bash(ls *),Bash(cat *),Bash(head *),Bash(tail *),Bash(wc *),Bash(date *),Bash(echo *),Bash(grep *),Bash(rg *),Bash(find *),Bash(awk *),Bash(sed *),Bash(graphify *),Bash(bash scripts/qa-preflight.sh*),Bash(bash scripts/free-dev-ports.sh*),Bash(rm -rf .playwright-mcp*),Bash(rm -f .playwright-mcp*),Bash(git add *),Bash(git commit *),Bash(git status*),Bash(git diff*),Bash(git log*),Bash(git show*),Bash(git branch*),Bash(git rev-parse*),Bash(git stash*),Bash(git checkout claude/*),Bash(git checkout -b claude/*)" \
  --max-budget-usd "$BUDGET" \
  --max-turns "$TURNS" \
  2>&1 | tee -a "$LOG"
