#!/usr/bin/env node
// Generates graphify-out/obsidian/Home.md — the vault's entry-point MOC.
// Rerunnable: part of the graph refresh runbook (scripts/graphify-refresh.sh).
// Reads graph.json only; links use the exporter's naming (node pages = symbol
// label, community pages = _COMMUNITY_<label>).
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const g = JSON.parse(readFileSync(join(root, 'graphify-out/graph.json'), 'utf8'));

// community label per node + degree per node
const degree = new Map();
for (const e of g.links) {
  degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
  degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
}
const byCommunity = new Map();
for (const n of g.nodes) {
  const c = n.community_name;
  if (c == null) continue;
  byCommunity.set(c, (byCommunity.get(c) ?? 0) + 1);
}
const topCommunities = [...byCommunity.entries()]
  .filter(([label]) => typeof label === 'string' && !/^Community \d+$/.test(label))
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20);

const idToNode = new Map(g.nodes.map((n) => [n.id, n]));
const godNodes = [...degree.entries()]
  .map(([id, d]) => ({ n: idToNode.get(id), d }))
  .filter((x) => x.n && x.n.label && (x.n.source_file ?? '').length > 0)
  .sort((a, b) => b.d - a.d)
  .slice(0, 15);

const date = new Date().toISOString().slice(0, 10);
const md = `# Talim AI — Knowledge Graph Home

> Auto-generated MOC (scripts/graphify-home.mjs) · graph built at commit \`${(g.built_at_commit ?? '').slice(0, 8)}\` · regenerated ${date}
> ${g.nodes.length} nodes · ${g.links.length} edges · ${byCommunity.size} communities

## How to read this vault
- **Community pages** (\`_COMMUNITY_…\`) are the architecture map — start there.
- **Node pages** are one symbol/file each, with typed connection links.
- **[[graph.canvas|Graph canvas]]** gives the visual overview.
- Coverage: production source code only — e2e specs, shell scripts, and CI YAML are NOT in the graph.
- Better than search here: \`graphify explain "<identifier>"\` (where/how questions) and \`graphify affected "<file>"\` (blast radius).

## Biggest communities
${topCommunities.map(([label, count]) => `- [[_COMMUNITY_${label}]] — ${count} nodes`).join('\n')}

## God nodes (highest degree)
${godNodes.map(({ n, d }) => `- [[${n.label}]] — ${d} connections · \`${n.source_file}\``).join('\n')}
`;

writeFileSync(join(root, 'graphify-out/obsidian/Home.md'), md);
console.log(`Home.md written: ${topCommunities.length} communities, ${godNodes.length} god nodes`);
