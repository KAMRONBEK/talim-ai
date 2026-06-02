#!/usr/bin/env bash
set -euo pipefail

CONFIG="${DOPPLER_CONFIG:-dev}"
PROJECT="${DOPPLER_PROJECT:-talim-ai}"

if ! command -v doppler >/dev/null 2>&1; then
  echo "Doppler CLI is required. Install: https://docs.doppler.com/docs/install-cli"
  exit 1
fi

doppler run --project "$PROJECT" --config "$CONFIG" -- docker compose "$@"
