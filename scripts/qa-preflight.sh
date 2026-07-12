#!/usr/bin/env bash
#
# qa-preflight.sh — deterministic preflight + auto-recovery for the UNATTENDED
# overnight visual-QA run (skill: qa-run, launcher: scripts/qa-overnight.sh).
#
# It (1) verifies Doppler, (2) clears stale Playwright-MCP Chrome profile locks
# (the recurring "Browser is already in use …/mcp-chrome-<id>" stall), (3)
# health-gates the 3 dev servers and recovers a WEDGED web server IN PLACE without
# spawning a duplicate (never touches the user-owned api/admin), and (4) cleans
# ephemeral QA artifacts. All kill/lsof run INSIDE this one approved script call,
# so they are never individually permission-gated overnight.
#
# Exit 0 = stack healthy, safe to drive the browser.
# Exit 1 = ABORT (do NOT navigate against a 500/unreachable stack overnight).
#
# Usage:  pnpm qa:preflight   |   bash scripts/qa-preflight.sh
#
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1
REPO="$(pwd)"
WEB=3000; ADMIN=3001; API=4000

log(){ printf '%s  %s\n' "$(date +%H:%M:%S)" "$*"; }
fail(){ log "ABORT: $*"; exit 1; }

# --- 1. Doppler must be able to inject secrets (every dev/recovery cmd is `doppler run`) ---
# Validate the way the QA actually uses doppler — `doppler run -- <cmd>` against the
# configured project/config (doppler.yaml = config dev). NOT `doppler projects list`,
# which needs a broader token scope and false-fails on a config-scoped service token
# even though `doppler run` works fine.
command -v doppler >/dev/null 2>&1 || fail "doppler CLI not installed"
doppler run -- true >/dev/null 2>&1 || fail "doppler run failed — check 'doppler setup' / token (config dev), or network"
log "doppler ok (doppler run works)"

# --- 2. Free orphaned Playwright-MCP Chrome + stale profile dirs (the lock) -------
CH_PIDS="$(ps ax -o pid=,command= 2>/dev/null | grep -i 'mcp-chrome' | grep -vi 'grep' | awk '{print $1}')"
if [ -n "${CH_PIDS}" ]; then
  log "killing orphaned mcp-chrome pids: $(echo ${CH_PIDS} | tr '\n' ' ')"
  # shellcheck disable=SC2086
  kill -TERM ${CH_PIDS} 2>/dev/null || true
  sleep 2
  # shellcheck disable=SC2086
  kill -KILL ${CH_PIDS} 2>/dev/null || true
fi
# Remove the persistent profile dirs that hold the singleton lock. (With --isolated
# in .mcp.json each session uses an ephemeral profile, so this is belt-and-suspenders.)
rm -rf "$HOME/Library/Caches/ms-playwright-mcp/mcp-chrome-"* 2>/dev/null || true
rm -rf "${TMPDIR:-/tmp}"/playwright-mcp-* "${TMPDIR:-/tmp}"/mcp-chrome-* 2>/dev/null || true
log "playwright profile locks cleared"

# --- 3. Health-gate the 3 servers; recover a WEDGED web server in place ----------
http(){ curl -s -o /dev/null -w '%{http_code}' -m 5 "$1" 2>/dev/null || echo 000; }
healthy(){
  [ "$(http http://localhost:${API}/health)" = 200 ] || return 1
  case "$(http http://localhost:${WEB}/uz)"      in 200|307|308) ;; *) return 1;; esac
  case "$(http http://localhost:${ADMIN}/login)" in 200|307|308) ;; *) return 1;; esac
  return 0
}
poll(){ local n=0; until "$1"; do n=$((n+1)); [ "$n" -ge "$2" ] && return 1; sleep "$3"; done; return 0; }

if poll healthy 5 3; then
  log "all servers healthy (api/web/admin) — reusing the running stack"
else
  log "health gate failed — diagnosing"
  WCODE="$(http http://localhost:${WEB}/uz)"
  ACODE="$(http http://localhost:${API}/health)"
  DCODE="$(http http://localhost:${ADMIN}/login)"
  # api + admin are the user's `pnpm dev:all` — never relaunch them; abort if down.
  [ "$ACODE" = 200 ] || fail "api :$API unreachable (code=$ACODE) — user must (re)start the stack"
  case "$DCODE" in 200|307|308) ;; *) fail "admin :$ADMIN unreachable (code=$DCODE) — user must (re)start the stack";; esac
  # Only the web dev server is known to wedge (stale .next / RSS bloat → all 5xx).
  if [ "$WCODE" = 000 ] || { [ "$WCODE" -ge 500 ] 2>/dev/null; }; then
    log "web :$WEB wedged (code=$WCODE) — free port + clear .next + relaunch @talim/web only"
    npx --yes kill-port "$WEB" >/dev/null 2>&1 \
      || lsof -ti "tcp:${WEB}" -sTCP:LISTEN 2>/dev/null | xargs kill -KILL 2>/dev/null || true
    rm -rf "${REPO}/apps/web/.next" 2>/dev/null || true
    nohup doppler run -- pnpm --filter @talim/web dev >/tmp/talim-web-qa.log 2>&1 &
    log "web relaunching (pid $!) — waiting up to ~90s for health"
    poll healthy 30 3 || fail "web did not recover after relaunch (see /tmp/talim-web-qa.log)"
    log "web recovered in place"
  else
    fail "web :$WEB unhealthy (code=$WCODE) but not a 5xx/wedge — needs a human"
  fi
fi

# --- 3b. Deterministic test fixtures (uz-math.pdf + answer key, CSV imports, ---
# reject-path files). The overnight agent uploads KNOWN content so AI output can
# be graded against docs/qa/fixtures/uz-math-facts.md instead of eyeballed.
if node "${REPO}/scripts/qa-fixtures.mjs" >/dev/null 2>&1; then
  log "fixtures ready (docs/qa/fixtures/ — see uz-math-facts.md for the answer key)"
else
  log "WARN: qa-fixtures.mjs failed — agent must generate/upload its own test PDF"
fi

# --- 3c. Test-account health: probe the canonical QA logins ONCE via the API ---
# so the run learns broken/rotated credentials in 2 seconds here instead of
# burning browser turns discovering them one login-form at a time. Failed probes
# WARN (the runbook §1 tells the agent to recreate missing accounts) — only the
# stack being down aborts. NOTE: loginRateLimit counts only FAILED attempts, so
# these probes never rate-limit a healthy account set.
probe_login(){
  local code
  code="$(curl -s -o /dev/null -w '%{http_code}' -m 8 -X POST \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"$1\",\"password\":\"$2\"}" \
    "http://localhost:${API}/auth/login" 2>/dev/null || echo 000)"
  if [ "$code" = 200 ]; then
    log "  account ok:     $1"
  else
    log "  ACCOUNT BROKEN: $1 (login=$code) — recreate per runbook §1 before testing this role"
    ACCOUNTS_BROKEN=$((ACCOUNTS_BROKEN + 1))
  fi
}
ACCOUNTS_BROKEN=0
log "probing QA test accounts (creds ledger: docs/qa/visual-qa-report.md)"
probe_login "qa-admin@talim.local"      "QaAdmin-12345"
probe_login "qa-owner@talim.local"      "QaOwner-12345"
probe_login "qa-individual@talim.local" "Individual-12345"
probe_login "teststudent1"              "Student-12345"
[ "$ACCOUNTS_BROKEN" -gt 0 ] && log "WARN: $ACCOUNTS_BROKEN QA account(s) unusable — recreate them FIRST (runbook §1)"

# --- 3d. Disk space (screenshots + .next + logs need room; low disk wedges runs)
AVAIL_GB="$(df -g "${REPO}" 2>/dev/null | awk 'NR==2 {print $4}')"
if [ -n "${AVAIL_GB:-}" ] && [ "$AVAIL_GB" -lt 5 ] 2>/dev/null; then
  log "WARN: only ${AVAIL_GB}GB free — clean disk before a long unattended run"
else
  log "disk ok (${AVAIL_GB:-?}GB free)"
fi

# --- 4. Clean ephemeral QA artifacts so the working tree / final commit stays clean
rm -rf "${REPO}/.playwright-mcp" 2>/dev/null || true
find "${REPO}" -maxdepth 1 -name '*.png' -delete 2>/dev/null || true
log "artifacts cleaned (.playwright-mcp/ + repo-root *.png)"

# --- 5. Warn if the permission allowlist is absent (would stall on first prompt) --
if ! grep -qs '"allow"' "${REPO}/.claude/settings.local.json" "${REPO}/.claude/settings.json" 2>/dev/null; then
  log "WARN: no permissions.allow found in .claude/settings*.json — the unattended run may stall on a prompt"
fi

# --- 6. Baseline typecheck (report-only gate; do NOT abort on pre-existing breakage)
if doppler run -- pnpm typecheck >/tmp/talim-typecheck-qa.log 2>&1; then
  log "baseline typecheck OK"
else
  log "WARN: baseline typecheck FAILED — prefer report-only mode + skip code-fix commits (see /tmp/talim-typecheck-qa.log)"
fi

log "preflight OK — safe to drive the browser"
exit 0
