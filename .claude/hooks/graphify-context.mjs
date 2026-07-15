#!/usr/bin/env node
// UserPromptSubmit hook: inject graphify context that is STALENESS-AWARE.
// Replaces the old static text that declared the graph "authoritative" even
// when it was 29 commits behind and asserted deleted files existed.
// Also surfaces the head of the reflect() lessons doc when present.
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

try {
  if (!existsSync('graphify-out/graph.json')) process.exit(0);

  let drift = null;
  try {
    const built = JSON.parse(readFileSync('graphify-out/graph.json', 'utf8')).built_at_commit;
    if (built) {
      drift = parseInt(
        execSync(`git rev-list --count ${built}..HEAD`, { stdio: ['ignore', 'pipe', 'ignore'] })
          .toString()
          .trim(),
        10
      );
    }
  } catch {
    /* unknown drift — treat as stale */
  }

  const fresh = drift !== null && drift <= 10;
  const trust = fresh
    ? `graph is current (${drift} commits behind HEAD)`
    : `graph may be STALE (${drift ?? 'unknown'} commits behind HEAD) — verify existence/deletion claims against the working tree; refresh with scripts/graphify-refresh.sh`;

  let lessons = '';
  try {
    if (existsSync('graphify-out/reflections/LESSONS.md')) {
      lessons =
        ' GRAPH LESSONS: ' +
        readFileSync('graphify-out/reflections/LESSONS.md', 'utf8').slice(0, 600).replace(/\s+/g, ' ');
    }
  } catch {
    /* optional */
  }

  const context =
    `PROJECT MEMORY: graphify knowledge graph at graphify-out/ (${trust}). ` +
    `Best commands: \`graphify explain "<identifier>"\` for where/how questions (strongest), ` +
    `\`graphify affected "<file>"\` for blast radius before refactors, ` +
    `\`graphify query "<identifier-style terms>"\` for exploration (seed with code identifiers, not prose). ` +
    `Coverage: production source only — NOT e2e specs, shell scripts, or CI YAML. ` +
    `After a graph answer proves useful/wrong, log it: \`graphify save-result --question "..." --answer "..." --outcome useful|dead_end|corrected\`.` +
    lessons;

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext: context },
    })
  );
} catch {
  process.exit(0);
}
