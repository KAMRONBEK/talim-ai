#!/usr/bin/env bash
#
# Overnight DEEP visual QA — drives a real browser (Playwright MCP) across every
# page / role / locale / theme / breakpoint, fixes CLEAR bugs, and logs the rest.
# Runs UNATTENDED on the `claude/visual-qa` branch — never main, never push, never
# deploy. Resumable: re-run any night and it continues from the checklist in
# docs/qa/visual-qa-report.md. Full spec: docs/qa/overnight-visual-qa.md
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

$CAFFEINATE claude -p "$PROMPT" \
  --permission-mode acceptEdits \
  --allowedTools "Read,Edit,Write,Grep,Glob,mcp__playwright__*,Bash(pnpm *),Bash(docker *),Bash(doppler *),Bash(curl *),Bash(node *),Bash(npx *),Bash(mkdir *),Bash(ls *),Bash(git add *),Bash(git commit *),Bash(git status*),Bash(git diff*),Bash(git checkout claude/*)" \
  --max-budget-usd "$BUDGET" \
  --max-turns "$TURNS" \
  2>&1 | tee -a "$LOG"
