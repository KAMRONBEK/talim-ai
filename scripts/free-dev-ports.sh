#!/usr/bin/env bash
#
# Free the dev ports and kill stale dev servers before a fresh `pnpm dev:all`.
#
# Why: `next dev` / `tsx watch` from a previous run orphan to PID 1 when their
# terminal closes and keep squatting on :3000 / :3001 / :4000, so the next run
# fails with EADDRINUSE. This clears them so `dev:all` always starts clean.
#
# Pass 1 kills THIS repo's web/admin/api dev-server processes by path. Pass 2 then
# frees ports 3000/3001/4000 by whatever is LISTENing on them — those are this
# stack's dev ports, so if another process is squatting one it gets killed too
# (that's the point: a clean `dev:all`). Never touches Docker (db/redis).
set -u

REPO="$(cd "$(dirname "$0")/.." && pwd)"
# Regex-escape the repo path before embedding it in `pkill -f` patterns — paths
# can contain regex metacharacters (e.g. a '.' in a username) that would alter the match.
REPO_RE=$(printf '%s' "$REPO" | sed -e 's/[][\\.^$*+?(){}|]/\\&/g')
PORTS=(3000 3001 4000)

# 1) Kill this repo's dev-server parents by path (catches zombie supervisors that
#    aren't currently holding a port but would respawn and grab one).
pkill -f "${REPO_RE}/apps/web/node_modules/.*next/dist/bin/next dev" 2>/dev/null || true
pkill -f "${REPO_RE}/apps/admin/node_modules/.*next/dist/bin/next dev" 2>/dev/null || true
pkill -f "${REPO_RE}/apps/api/node_modules/.*tsx/dist/cli.mjs watch src/index.ts" 2>/dev/null || true

# 2) Free the three ports (catches orphaned next-server children whose parent is gone).
free_ports() {
  local sig="$1" port pids
  for port in "${PORTS[@]}"; do
    pids="$(lsof -ti "tcp:${port}" -sTCP:LISTEN 2>/dev/null || true)"
    if [ -n "${pids}" ]; then
      echo "  freeing :${port} (kill ${sig} ${pids//$'\n'/ })"
      # shellcheck disable=SC2086
      kill "${sig}" ${pids} 2>/dev/null || true
    fi
  done
}

echo "› clearing stale dev servers on ${PORTS[*]}"
free_ports -TERM
sleep 1
free_ports -KILL   # force-kill anything still holding a port
exit 0
