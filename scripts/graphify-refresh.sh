#!/usr/bin/env bash
#
# Graphify refresh runbook — one command to bring the knowledge graph, labels,
# lessons doc, Obsidian vault, and Home.md back in sync with HEAD.
#
# Usage:  bash scripts/graphify-refresh.sh [--commit]
#   default: refreshes everything locally and prints a commit reminder
#   --commit: also commits graphify-out/ + vault as one generation
#
# Verified semantics (2026-07-15 audit — see memory talim-graphify-audit):
#   * `update --force` is AST-only (free) and PRESERVES community labels via
#     the gitignored graphify-out/.graphify_labels.json.
#   * Do NOT use `update --no-cluster` for refreshes — it overwrites graph.json
#     with a RAW extraction (no communities).
#   * `label` claims "Done" even when every LLM batch fails (e.g. missing
#     python 'openai' package: fix = uv tool install 'graphifyy[openai]' --force),
#     so we VERIFY labels afterwards instead of trusting the exit message.
set -euo pipefail
cd "$(dirname "$0")/.." || exit 1

echo "==> AST refresh (labels preserved)"
PYTHONHASHSEED=0 graphify update . --force

generic=$(node -e "
const l=require('./graphify-out/.graphify_labels.json');
const e=Object.entries(l.labels||l);
console.log(e.filter(([k,v])=>/^Community \d+\$/.test(typeof v==='string'?v:(v.label||''))).length);
")
if [ "${generic}" -gt 0 ]; then
  echo "==> ${generic} unlabeled communities — relabeling (deepseek, <\$0.01)"
  doppler run -- graphify label . --backend deepseek
  still=$(node -e "
const l=require('./graphify-out/.graphify_labels.json');
const e=Object.entries(l.labels||l);
console.log(e.filter(([k,v])=>/^Community \d+\$/.test(typeof v==='string'?v:(v.label||''))).length);
")
  if [ "${still}" -gt 0 ]; then
    echo "❌ labeling silently failed (${still} still generic). Likely fix:" >&2
    echo "   uv tool install 'graphifyy[openai]' --force   # deepseek backend needs the openai pkg" >&2
    exit 1
  fi
fi

echo "==> reflect (aggregate save-result outcomes into LESSONS.md)"
graphify reflect --graph graphify-out/graph.json || true

echo "==> clean vault re-export + Home.md"
find graphify-out/obsidian -maxdepth 1 \( -name '*.md' -o -name '*.canvas' \) -delete 2>/dev/null || true
graphify export obsidian
node scripts/graphify-home.mjs

if [ "${1:-}" = "--commit" ]; then
  git add graphify-out/
  git commit -m "chore(graphify): refresh graph + vault ($(git rev-parse --short HEAD) → $(node -e "console.log(require('./graphify-out/graph.json').built_at_commit.slice(0,8))"))"
  echo "==> committed"
else
  echo "==> done (uncommitted). Review with: git status graphify-out/ ; commit when happy."
fi
