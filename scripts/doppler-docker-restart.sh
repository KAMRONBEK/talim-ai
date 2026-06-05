#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "Recreating Talim AI Docker stack..."
bash "$ROOT/scripts/doppler-docker.sh" down --remove-orphans

echo "Building and starting (waiting for healthy services)..."
bash "$ROOT/scripts/doppler-docker.sh" up -d --build --wait

echo ""
echo "Stack status:"
bash "$ROOT/scripts/doppler-docker.sh" ps
