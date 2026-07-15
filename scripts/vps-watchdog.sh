#!/usr/bin/env bash
#
# Infra self-healing watchdog for the prod VPS. Docker's `restart: unless-stopped`
# revives a CRASHED container, but does NOT restart one that is running-but-unhealthy
# (healthcheck failing while the process stays alive) — this closes that gap.
#
# Every run it:
#   1. Restarts any talim container Docker reports as `unhealthy`.
#   2. Re-`up`s any expected service that is missing/exited (compose recreates it).
#   3. Curls the public site; if still down after step 1-2, fires an alert.
#
# Install as a cron on the VPS (every 2 min), logging to a file:
#   crontab -e
#   */2 * * * * /bin/bash "$HOME/talim-ai/scripts/vps-watchdog.sh" >> "$HOME/talim-watchdog.log" 2>&1
#
# Alerting is opt-in: set WATCHDOG_ALERT_URL to a webhook (Slack/Telegram/generic)
# in the crontab line or ~/.talim-watchdog.env and it POSTs {"text": "..."} on failure.
set -uo pipefail

REPO_DIR="${TALIM_REPO_DIR:-$HOME/talim-ai}"
COMPOSE_FILES="-f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.registry.yml"
HEALTH_URL="${WATCHDOG_HEALTH_URL:-https://talim-ai.uz/api/health}"
SERVICES="db redis api web admin nginx"

# Optional env file (never committed) for WATCHDOG_ALERT_URL etc.
[ -f "$HOME/.talim-watchdog.env" ] && . "$HOME/.talim-watchdog.env"

ts() { date '+%Y-%m-%d %H:%M:%S'; }
log() { echo "[$(ts)] $*"; }

alert() {
  local msg="$1"
  log "ALERT: $msg"
  [ -n "${WATCHDOG_ALERT_URL:-}" ] || return 0
  curl -fsS -m 10 -X POST -H 'Content-Type: application/json' \
    -d "{\"text\":\"🔴 Talim watchdog: ${msg}\"}" "$WATCHDOG_ALERT_URL" >/dev/null 2>&1 || true
}

cd "$REPO_DIR" 2>/dev/null || { log "repo dir $REPO_DIR missing"; exit 1; }

# We need Doppler for compose (secrets). If it's absent, still handle raw docker restart.
DC="docker compose $COMPOSE_FILES"
if command -v doppler >/dev/null 2>&1 && [ -n "${DOPPLER_TOKEN:-}" ]; then
  DC="doppler run --project talim-ai --config prd -- docker compose $COMPOSE_FILES"
fi

acted=0

# 1) Restart unhealthy-but-running containers.
unhealthy=$(docker ps --filter health=unhealthy --format '{{.Names}}' 2>/dev/null || true)
if [ -n "$unhealthy" ]; then
  for c in $unhealthy; do
    log "restarting unhealthy container: $c"
    docker restart "$c" >/dev/null 2>&1 && acted=1
    alert "restarted unhealthy container $c"
  done
fi

# 2) Bring back any expected service that isn't running (exited/missing).
running=$(docker ps --format '{{.Names}}' 2>/dev/null || true)
missing=""
for s in $SERVICES; do
  echo "$running" | grep -qiE "(^|[-_])${s}([-_]|$)" || missing="$missing $s"
done
if [ -n "${missing// }" ]; then
  log "services down, re-upping:${missing}"
  $DC up -d --no-build ${missing} >/dev/null 2>&1 && acted=1
  alert "re-upped down services:${missing}"
fi

# 3) End-to-end probe of the public endpoint.
if ! curl -fsS -m 15 "$HEALTH_URL" >/dev/null 2>&1; then
  log "public health probe FAILED ($HEALTH_URL)"
  # last-resort full up in case something is wedged that steps 1-2 didn't catch
  $DC up -d --no-build ${SERVICES} >/dev/null 2>&1 || true
  sleep 5
  if ! curl -fsS -m 15 "$HEALTH_URL" >/dev/null 2>&1; then
    alert "site still DOWN after recovery attempt ($HEALTH_URL)"
  fi
elif [ "$acted" = 1 ]; then
  log "recovery actions taken; public endpoint now healthy"
fi

[ "$acted" = 0 ] && log "ok — all services healthy"
exit 0
