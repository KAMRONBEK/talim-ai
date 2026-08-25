#!/usr/bin/env node
/**
 * qa-i18n-check.mjs — static i18n gate for apps/web (BLOCKING in CI).
 *
 * Why this exists: message-key parity across messages/{uz,en,ru}.json is already
 * perfect (1287 keys each), so a parity checker would find nothing. Every i18n bug
 * that actually reached a user was a display string hardcoded in TSX that never
 * went through next-intl at all — e.g. the inactive-subscription banner in
 * `apps/web/contexts/tenant-shell.tsx`, which renders an English sentence to Uzbek
 * and Russian tutors (issue #27). Those are invisible to a parity check and to the
 * browser-driven QA loop unless someone happens to log in as a tutor with a lapsed
 * subscription in the uz locale. A parser catches them at commit time instead.
 *
 * Three checks:
 *   1. HARDCODED LITERALS (fails)  — user-visible Latin-script prose in JSX.
 *   2. ICU COMPILE       (fails)  — every message in all 3 locales must parse as
 *                                   valid ICU (broken plurals, unbalanced braces).
 *   3. IDENTICAL TO EN   (warns)  — uz/ru values byte-identical to en. Many are
 *                                   legitimate ("Email", "PDF", brand names), so
 *                                   this reports, it never fails.
 *
 * Scope note: apps/admin is deliberately NOT scanned — it has no i18n by design
 * (see CLAUDE.md). packages/ui is shared with admin and therefore cannot use
 * next-intl, so it is out of scope too.
 *
 * Usage:
 *   node scripts/qa-i18n-check.mjs                    # report + exit 0/1
 *   node scripts/qa-i18n-check.mjs --json             # machine-readable, same exit code
 *   node scripts/qa-i18n-check.mjs --update-allowlist # re-seed the allowlist (see below)
 *
 * Exit 0 = clean (check 3 may still have warned). Exit 1 = literals or ICU failed.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WEB = path.join(REPO, 'apps', 'web');
const MESSAGES_DIR = path.join(WEB, 'messages');
const LOCALES = ['uz', 'en', 'ru'];
const BASE_LOCALE = 'en';
const ALLOWLIST_PATH = path.join(REPO, 'docs', 'qa', 'i18n-allowlist.json');

const args = new Set(process.argv.slice(2));
const JSON_OUT = args.has('--json');
const UPDATE = args.has('--update-allowlist');
if (args.has('--help') || args.has('-h')) {
  const header = fs
    .readFileSync(fileURLToPath(import.meta.url), 'utf8')
    .split('*/')[0]
    .replace(/^#![^\n]*\n/, '')
    .replace(/^\/\*\*\n/, '')
    .replace(/^ ?\* ?/gm, '');
  console.log(header.trimEnd());
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Known open bugs: findings that may NEVER be silenced, even by --update-allowlist
// or by a hand-edited allowlist entry. This is how the gate stays red for a real,
// tracked defect instead of being quietly seeded away with the pre-existing debt.
// Match is on file + exact string, so it survives the lines moving.
// ---------------------------------------------------------------------------
const KNOWN_OPEN_BUGS = [
  {
    file: 'apps/web/contexts/tenant-shell.tsx',
    startsWith: 'Your organization subscription is not active',
    issue: 'https://github.com/KAMRONBEK/talim-ai/issues/27',
    note: 'inactive-subscription banner shows English to uz/ru tutors — translate it, do not allowlist it',
  },
];
const knownBugFor = (rel, str) =>
  KNOWN_OPEN_BUGS.find((b) => b.file === rel && str.startsWith(b.startsWith));

// ---------------------------------------------------------------------------
// Dependency resolution. Neither package is a direct dependency of this repo, so
// both are reached through the workspace that DOES own them (pnpm keeps every
// package in an isolated store, `require('typescript')` from a bare script fails).
// ---------------------------------------------------------------------------
const webRequire = createRequire(path.join(WEB, 'package.json'));
const ts = createRequire(path.join(REPO, 'package.json'))('typescript');
// The ICU parser is what next-intl itself compiles messages with, reached via
// next-intl -> use-intl -> intl-messageformat. Validating with the real parser
// means "passes this gate" and "renders at runtime" cannot disagree.
const icuRequire = createRequire(createRequire(webRequire.resolve('next-intl')).resolve('use-intl'));
const { parse: parseIcu } = icuRequire('@formatjs/icu-messageformat-parser');

// ---------------------------------------------------------------------------
// Allowlist
// ---------------------------------------------------------------------------
const EMPTY_ALLOWLIST = {
  _doc:
    'Known-and-accepted i18n exceptions. globalLiterals: strings exempt in every file ' +
    '(brand names, product nouns). fileLiterals: per-file exact strings. identicalToEn: ' +
    'message keys whose uz/ru value is legitimately the same as en (supports * as a path ' +
    'segment wildcard). Every entry needs a reason. Prune entries that stop appearing.',
  globalLiterals: {},
  fileLiterals: {},
  identicalToEn: {},
};

function loadAllowlist() {
  if (!fs.existsSync(ALLOWLIST_PATH)) return structuredClone(EMPTY_ALLOWLIST);
  try {
    return { ...structuredClone(EMPTY_ALLOWLIST), ...JSON.parse(fs.readFileSync(ALLOWLIST_PATH, 'utf8')) };
  } catch (err) {
    console.error(`i18n: allowlist ${path.relative(REPO, ALLOWLIST_PATH)} is not valid JSON — ${err.message}`);
    process.exit(1);
  }
}
const allow = loadAllowlist();

const isAllowedLiteral = (rel, str) =>
  !knownBugFor(rel, str) &&
  (Object.hasOwn(allow.globalLiterals, str) || Object.hasOwn(allow.fileLiterals[rel] ?? {}, str));

// `landing.stats.items.*.value` matches one path segment, like a glob.
const keyMatchers = Object.keys(allow.identicalToEn).map((pattern) =>
  pattern.includes('*')
    ? new RegExp(`^${pattern.split('.').map((s) => (s === '*' ? '[^.]+' : s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))).join('\\.')}$`)
    : pattern,
);
const isAllowedIdentical = (key) =>
  keyMatchers.some((m) => (typeof m === 'string' ? m === key : m.test(key)));

// ---------------------------------------------------------------------------
// CHECK 1 — hardcoded user-visible literals in JSX
// ---------------------------------------------------------------------------

// Allowlist, not denylist: only attributes that definitely render as text are
// inspected. The inverse (skip className/href/src/... and check the rest) drowns
// in Tailwind class strings — measured at ~1500 false positives on this tree.
const VISIBLE_ATTRS = new Set([
  'placeholder', 'title', 'alt', 'label', 'summary',
  'aria-label', 'aria-description', 'aria-placeholder', 'aria-roledescription', 'aria-valuetext',
]);
// Same names as object-literal keys — catches the `{ PDF: { label: 'Video' } }`
// lookup-table pattern this codebase uses for badges and status chips.
const VISIBLE_PROPS = new Set(['label', 'placeholder', 'title', 'alt', 'ariaLabel', 'aria-label']);
// <style>/<script> children are code, not copy.
const RAW_ELEMENTS = new Set(['style', 'script']);
const SKIP_DIRS = new Set(['node_modules', '.next', 'e2e', 'messages', 'public']);
const EXEMPT_MARKER = 'i18n-exempt';

function tsxFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) tsxFiles(p, out);
    } else if (entry.name.endsWith('.tsx')) {
      out.push(p);
    }
  }
  return out;
}

/**
 * Is this string something a user would read, as opposed to an identifier, a
 * class name, a unit, or punctuation? Deliberately conservative: a blocking gate
 * that cries wolf gets bypassed, so it would rather miss a literal than invent one.
 */
function looksLikeProse(raw) {
  const s = raw.trim();
  if (s.length < 3 || !/[A-Za-z]/.test(s)) return false;
  if (/^&[a-zA-Z]+;$/.test(s)) return false; // &nbsp; &ldquo; …
  if (/^(https?:\/\/|\/|#|data:|mailto:|tel:)/.test(s)) return false;
  if (/^[a-z0-9]+([._-][a-z0-9]+)+$/i.test(s)) return false; // dotted.or_snake identifier
  const words = s.split(/\s+/).filter(Boolean);
  const alphaWords = words.filter((w) => /^[A-Za-z][A-Za-z'’-]*[.,!?:;)]?$/.test(w));
  if (words.length >= 2 && alphaWords.length >= 2) return true;
  // A lone capitalised word is a button/badge label ("Save", "Slides"); a lone
  // lowercase or ALLCAPS token is far more often an id, a unit, or an acronym.
  return words.length === 1 && /^[A-Z][a-z]{2,}[.!?]?$/.test(words[0]);
}

/** Tailwind-ish? `'border-success bg-muted/20'` reads as prose to the test above. */
function looksLikeClassNames(s) {
  const tokens = s.trim().split(/\s+/).filter(Boolean);
  return (
    tokens.length > 0 &&
    tokens.every((t) => /^[a-z0-9][a-z0-9!:/[\]#().,%_-]*$/.test(t)) &&
    tokens.some((t) => /[-:/[]/.test(t))
  );
}

function scanFileForLiterals(absPath, findings) {
  const rel = path.relative(REPO, absPath);
  const text = fs.readFileSync(absPath, 'utf8');
  const lines = text.split('\n');
  const sf = ts.createSourceFile(absPath, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

  const record = (node, value, kind) => {
    const str = value.trim().replace(/\s+/g, ' ');
    if (!looksLikeProse(str)) return;
    const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
    // `// i18n-exempt` on the offending line or the one above opts a literal out.
    const near = `${lines[line] ?? ''}\n${lines[line - 1] ?? ''}`;
    if (near.includes(EXEMPT_MARKER)) return;
    findings.push({ file: rel, line: line + 1, kind, string: str, allowed: isAllowedLiteral(rel, str) });
  };

  const insideRawElement = (node) => {
    for (let p = node.parent; p; p = p.parent) {
      if (ts.isJsxElement(p) && RAW_ELEMENTS.has(p.openingElement.tagName.getText(sf))) return true;
    }
    return false;
  };

  const unwrap = (node) => {
    if (!node) return undefined;
    if (ts.isJsxExpression(node)) return unwrap(node.expression);
    if (ts.isParenthesizedExpression(node)) return unwrap(node.expression);
    return node;
  };

  /**
   * Literals rendered directly as a JSX child. Descent is restricted to the
   * shapes that still put the literal on screen (ternary branches, `??`/`||`
   * fallbacks). Anything else — a call, a member access — is NOT descended into,
   * because that is where `{t('save')}` lives and the argument is a key, not copy.
   */
  const scanChildExpression = (node) => {
    const e = unwrap(node);
    if (!e) return;
    if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)) return record(e, e.text, 'jsx-child');
    if (ts.isTemplateExpression(e)) {
      const literalParts = [e.head.text, ...e.templateSpans.map((s) => s.literal.text)].join(' ');
      return record(e, literalParts, 'jsx-template');
    }
    if (ts.isConditionalExpression(e)) {
      scanChildExpression(e.whenTrue);
      scanChildExpression(e.whenFalse);
      return;
    }
    if (ts.isBinaryExpression(e)) {
      const op = e.operatorToken.kind;
      if (op === ts.SyntaxKind.AmpersandAmpersandToken) return scanChildExpression(e.right);
      if (op === ts.SyntaxKind.BarBarToken || op === ts.SyntaxKind.QuestionQuestionToken) {
        scanChildExpression(e.left);
        scanChildExpression(e.right);
      }
    }
  };

  const visit = (node) => {
    if (ts.isJsxText(node)) {
      if (node.text.trim() && !insideRawElement(node)) record(node, node.text, 'jsx-text');
    } else if (ts.isJsxAttribute(node) && node.initializer) {
      const name = node.name.getText(sf);
      const value = unwrap(node.initializer);
      if (
        VISIBLE_ATTRS.has(name) &&
        value &&
        (ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value)) &&
        !looksLikeClassNames(value.text)
      ) {
        record(node, value.text, `attr:${name}`);
      }
    } else if (ts.isPropertyAssignment(node)) {
      const name = ts.isIdentifier(node.name) || ts.isStringLiteral(node.name) ? node.name.text : null;
      const value = node.initializer;
      if (
        name && VISIBLE_PROPS.has(name) &&
        (ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value)) &&
        !looksLikeClassNames(value.text)
      ) {
        record(node, value.text, `prop:${name}`);
      }
    } else if (
      ts.isJsxExpression(node) &&
      node.parent &&
      (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent)) &&
      !insideRawElement(node)
    ) {
      scanChildExpression(node.expression);
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
}

function checkLiterals() {
  const findings = [];
  for (const f of tsxFiles(WEB).sort()) scanFileForLiterals(f, findings);
  return findings;
}

// ---------------------------------------------------------------------------
// CHECK 2 — every message compiles as ICU  /  CHECK 3 — uz|ru identical to en
// ---------------------------------------------------------------------------
function flattenMessages(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object') flattenMessages(v, key, out);
    else out[key] = v;
  }
  return out;
}

function loadLocales() {
  const byLocale = {};
  for (const locale of LOCALES) {
    const file = path.join(MESSAGES_DIR, `${locale}.json`);
    if (!fs.existsSync(file)) {
      console.error(`i18n: missing message file ${path.relative(REPO, file)}`);
      process.exit(1);
    }
    try {
      byLocale[locale] = flattenMessages(JSON.parse(fs.readFileSync(file, 'utf8')));
    } catch (err) {
      console.error(`i18n: ${locale}.json is not valid JSON — ${err.message}`);
      process.exit(1);
    }
  }
  return byLocale;
}

function checkIcu(byLocale) {
  const failures = [];
  for (const locale of LOCALES) {
    for (const [key, value] of Object.entries(byLocale[locale])) {
      if (typeof value !== 'string') continue;
      try {
        parseIcu(value);
      } catch (err) {
        failures.push({
          locale,
          key,
          value,
          error: String(err.message).split('\n')[0],
          column: err.location?.start?.column ?? null,
        });
      }
    }
  }
  return failures;
}

function checkIdenticalToEn(byLocale) {
  const base = byLocale[BASE_LOCALE];
  const warnings = [];
  for (const [key, enValue] of Object.entries(base)) {
    if (typeof enValue !== 'string' || !/[A-Za-z]/.test(enValue)) continue;
    if (isAllowedIdentical(key)) continue;
    const same = LOCALES.filter((l) => l !== BASE_LOCALE && byLocale[l][key] === enValue);
    if (same.length) warnings.push({ key, value: enValue, locales: same });
  }
  return warnings;
}

// ---------------------------------------------------------------------------
// Allowlist seeding
// ---------------------------------------------------------------------------
function writeSeededAllowlist(literals, identical) {
  const next = structuredClone(allow);
  const stamp = new Date().toISOString().slice(0, 10);
  let added = 0;
  for (const f of literals) {
    if (f.allowed || knownBugFor(f.file, f.string)) continue;
    next.fileLiterals[f.file] ??= {};
    next.fileLiterals[f.file][f.string] = `seeded ${stamp} — pre-existing, untriaged`;
    added += 1;
  }
  for (const w of identical) {
    next.identicalToEn[w.key] = `seeded ${stamp} — pre-existing, untriaged`;
    added += 1;
  }
  fs.writeFileSync(ALLOWLIST_PATH, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`i18n: seeded ${added} entries into ${path.relative(REPO, ALLOWLIST_PATH)}`);
  console.log('i18n: every seeded entry needs a real reason — replace the placeholders by hand.');
  const skipped = literals.filter((f) => knownBugFor(f.file, f.string));
  for (const f of skipped) {
    const bug = knownBugFor(f.file, f.string);
    console.log(`i18n: NOT seeded (known open bug) ${f.file}:${f.line} — ${bug.issue}`);
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
const byLocale = loadLocales();
const literals = checkLiterals();
const icuFailures = checkIcu(byLocale);
const identical = checkIdenticalToEn(byLocale);
const offending = literals.filter((f) => !f.allowed);

if (UPDATE) {
  writeSeededAllowlist(literals, identical);
  process.exit(0);
}

if (JSON_OUT) {
  console.log(
    JSON.stringify(
      {
        ok: offending.length === 0 && icuFailures.length === 0,
        scanned: { messages: Object.keys(byLocale[BASE_LOCALE]).length * LOCALES.length },
        hardcodedLiterals: offending,
        allowlistedLiterals: literals.length - offending.length,
        icuFailures,
        identicalToEn: identical,
      },
      null,
      2,
    ),
  );
  process.exit(offending.length || icuFailures.length ? 1 : 0);
}

const rel = (p) => p;
console.log('i18n gate — apps/web (uz|en|ru)');
console.log(`  scanned ${tsxFiles(WEB).length} .tsx files and ${Object.keys(byLocale[BASE_LOCALE]).length} keys × ${LOCALES.length} locales\n`);

// --- 1 ---
console.log(`1. HARDCODED LITERALS — ${offending.length} unexplained (${literals.length - offending.length} allowlisted)`);
if (offending.length === 0) {
  console.log('   none\n');
} else {
  for (const f of offending) {
    const bug = knownBugFor(f.file, f.string);
    console.log(`   ${rel(f.file)}:${f.line}  [${f.kind}]`);
    console.log(`     ${JSON.stringify(f.string.length > 100 ? `${f.string.slice(0, 100)}…` : f.string)}`);
    if (bug) console.log(`     KNOWN OPEN BUG — ${bug.note}\n       ${bug.issue}\n       This one is NOT allowlistable. The gate stays red until the string is translated.`);
  }
  console.log('');
  console.log('   Fix: replace the literal with `useTranslations(<namespace>)` and add the key to');
  console.log('   all three apps/web/messages/{uz,en,ru}.json files.');
  console.log('   Not user-visible? Add `// i18n-exempt` on the line (or the line above), or add');
  console.log(`   the exact string to ${path.relative(REPO, ALLOWLIST_PATH)} with a reason.\n`);
}

// --- 2 ---
console.log(`2. ICU COMPILE — ${icuFailures.length} failed`);
if (icuFailures.length === 0) {
  console.log('   all messages parse\n');
} else {
  for (const f of icuFailures) {
    console.log(`   apps/web/messages/${f.locale}.json  ${f.key}${f.column ? ` (col ${f.column})` : ''}`);
    console.log(`     ${JSON.stringify(f.value.length > 100 ? `${f.value.slice(0, 100)}…` : f.value)}`);
    console.log(`     ${f.error}`);
  }
  console.log('\n   Fix: repair the ICU syntax — plural/select need an `other` branch, and every');
  console.log('   `{` needs its `}`. A literal brace or apostrophe must be escaped: \'{\', \'\'.\n');
}

// --- 3 (warn only) ---
console.log(`3. IDENTICAL TO EN — ${identical.length} keys (warning only, never fails)`);
if (identical.length === 0) {
  console.log('   none\n');
} else {
  for (const w of identical) console.log(`   ${w.key}  [${w.locales.join(', ')}]  ${JSON.stringify(w.value)}`);
  console.log('\n   Each is either an untranslated string or a legitimately shared value (brand,');
  console.log(`   acronym, proper noun). Translate it, or add the key to "identicalToEn" in`);
  console.log(`   ${path.relative(REPO, ALLOWLIST_PATH)} with a reason.\n`);
}

// --- limits: be honest about what a heuristic cannot see ---
if (offending.length || icuFailures.length) {
  console.log('Heuristic limits: check 1 reads JSX text, user-facing attributes, JSX-child');
  console.log('expressions, and label/title/placeholder object keys. It does NOT follow strings');
  console.log('through variables, `new Error(...)`, or arbitrary props, so a clean run is not a');
  console.log('proof of full coverage. apps/admin (no i18n by design) and packages/ui (shared');
  console.log('with admin) are out of scope.\n');
}

const failed = offending.length > 0 || icuFailures.length > 0;
console.log(failed ? 'i18n gate: FAIL' : 'i18n gate: PASS');
process.exit(failed ? 1 : 0);
