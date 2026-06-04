#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

CONFIG="${DOPPLER_CONFIG:-dev}"
PROJECT="${DOPPLER_PROJECT:-talim-ai}"

export PATH="${HOME}/bin:${HOME}/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/snap/bin:${PATH:-}"

SSH_MCP_CMD='exec npx -y ssh-mcp -- \
  --host="${TALIM_VPS_HOST:-185.217.131.248}" \
  --port="${TALIM_VPS_PORT:-22}" \
  --user="${TALIM_VPS_USER:-root}" \
  --password="${TALIM_VPS_SSH_PASSWORD}" \
  --timeout=120000 \
  --maxChars=none \
  --disableSudo'

# Password already in env — skip Doppler CLI
if [[ -n "${TALIM_VPS_SSH_PASSWORD:-}" ]]; then
  exec bash -lc "$SSH_MCP_CMD"
fi

resolve_doppler() {
  if [[ -n "${DOPPLER_BIN:-}" && -x "${DOPPLER_BIN}" ]]; then
    echo "${DOPPLER_BIN}"
    return 0
  fi
  local candidate
  for candidate in doppler "${HOME}/bin/doppler" "${HOME}/.local/bin/doppler" /opt/homebrew/bin/doppler /usr/local/bin/doppler /usr/bin/doppler /snap/bin/doppler; do
    if command -v "$candidate" >/dev/null 2>&1; then
      command -v "$candidate"
      return 0
    fi
    if [[ -x "$candidate" ]]; then
      echo "$candidate"
      return 0
    fi
  done
  return 1
}

DOPPLER="$(resolve_doppler || true)"

if [[ -z "$DOPPLER" ]]; then
  echo "Doppler CLI not found. Install it and run 'doppler login' before enabling talim-vps MCP." >&2
  exit 1
fi

exec "$DOPPLER" run --project "$PROJECT" --config "$CONFIG" -- bash -lc "$SSH_MCP_CMD"
