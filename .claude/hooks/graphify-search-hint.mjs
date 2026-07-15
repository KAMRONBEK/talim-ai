#!/usr/bin/env node
// PreToolUse(Bash) hook: ONCE per session, when a real search command runs,
// hint that the graph may answer faster. Replaces the old substring matcher
// that fired on nearly every command ('.c' matched '.claude/', 'find' matched
// pathnames) and demanded a mandatory query, producing compliance noise.
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

try {
  if (!existsSync('graphify-out/graph.json')) process.exit(0);

  const input = JSON.parse(readFileSync(0, 'utf8'));
  const cmd = input?.tool_input?.command ?? '';
  const session = String(input?.session_id ?? 'nosession').replace(/[^a-zA-Z0-9-]/g, '');

  // Real command-word match only: start of command or after a separator.
  const isSearch =
    /(^|[;&|(]\s*)(rg|grep|egrep|fgrep|ack|ag)\s/.test(cmd) ||
    /(^|[;&|(]\s*)(find|fd)\s+\S/.test(cmd) ||
    /\bgit\s+(log|blame)\b/.test(cmd);
  if (!isSearch) process.exit(0);

  const sentinel = join(tmpdir(), `graphify-hint-${session}`);
  if (existsSync(sentinel)) process.exit(0); // once per session
  writeFileSync(sentinel, '1');

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        additionalContext:
          'Hint (once per session): the graphify graph may answer this faster than raw search — `graphify explain "<identifier>"` for where/how, `graphify affected "<file>"` for who-depends-on-this. Raw search is fine for exact strings, new/uncovered files (e2e, scripts, CI), or line-level debugging.',
      },
    })
  );
} catch {
  process.exit(0);
}
