#!/usr/bin/env node
/**
 * qa-sweep.mjs — the deterministic FULL-SURFACE sweep (breadth layer of continuous QA).
 *
 * The nightly LLM agent could only ever drive 6-10 hand-picked charters a night, which
 * reached <10% of the product: 25 of 43 UI routes had never had a coverage cell, /login
 * and /register among them. That is a coverage problem, and coverage problems belong to
 * machines. This script visits EVERY route x role x variant, runs a pack of *binary*
 * probes on each, and writes machine-readable verdicts. It costs no LLM tokens, so it can
 * run every cycle; the agent then spends its expensive judgement only on the cells this
 * sweep flags.
 *
 * Two hard design rules, both learned from the old runbook:
 *   1. ROUTES ARE ENUMERATED, NEVER LISTED. The coverage model is every `page.tsx` under
 *      `apps/web/app` and `apps/admin/app`, walked at run start. A hand-maintained route
 *      list rots silently; a directory walk cannot.
 *   2. NOTHING IS EVER SILENTLY SKIPPED. An unresolvable [id], a broken QA login, a route
 *      the role matrix doesn't recognise — all become RED cells with a reason. Surface rot
 *      must be visible in the verdicts, not absent from them.
 *
 * Usage (reuses the running dev stack — it never starts servers):
 *   node scripts/qa-sweep.mjs                       # full sweep
 *   node scripts/qa-sweep.mjs --list                # enumerate cells only, no browser/stack
 *   node scripts/qa-sweep.mjs --only='/[locale]/tenant/**' --role=TENANT_OWNER
 *   node scripts/qa-sweep.mjs --max-cells=40        # least-recently-swept cells first
 *   node scripts/qa-sweep.mjs --help
 *
 * Outputs:
 *   docs/qa/qa-sweep-verdicts.json           FULL-sweep verdicts (the agent's triage queue)
 *   docs/qa/qa-sweep-verdicts.filtered.json  a FILTERED run's verdicts, kept in a separate file
 *   docs/qa/qa-coverage-state.json           durable continuous-QA queue (merged across runs)
 *   docs/qa/screenshots/sweep/*.png          evidence (gitignored)
 *
 * A filtered run gets its own file because it must never make the full queue look green by
 * omission: after `--only=/[locale]/tenant/**` overwrote the shared file, every untouched
 * route read as "not failing" when it had simply not been visited.
 *
 * Both verdicts files are gitignored. They quote rendered page text, and an admin:users cell
 * failing `content-rendered` would otherwise commit real student names to a public repo. The
 * coverage state IS committed — it is the durable queue — so it carries no page text at all.
 *
 * Exit codes:
 *   0  the sweep ran. Product findings NEVER fail the process; the verdicts file carries them.
 *   2  bad invocation (unknown flag, unknown flag value, or a filter that selects no cell).
 *   1  the sweep could not be trusted: API down, :3000/:3001 are not the apps under test
 *      (identity gate), or so many cells came back blank/crashed that the ENVIRONMENT is
 *      broken rather than the product.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

// Playwright is a devDependency of apps/web only; resolve it from there rather than
// adding a root dependency just for this script.
const require = createRequire(new URL('../apps/web/package.json', import.meta.url));
const { chromium } = require('@playwright/test');

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WEB_APP_DIR = path.join(REPO, 'apps', 'web', 'app');
const ADMIN_APP_DIR = path.join(REPO, 'apps', 'admin', 'app');
const MESSAGES_DIR = path.join(REPO, 'apps', 'web', 'messages');
const QA_DIR = path.join(REPO, 'docs', 'qa');
const BASELINE_FILE = path.join(QA_DIR, 'console-baseline.json');
const VERDICTS_FILE = path.join(QA_DIR, 'qa-sweep-verdicts.json');
const FILTERED_VERDICTS_FILE = path.join(QA_DIR, 'qa-sweep-verdicts.filtered.json');
const STATE_FILE = path.join(QA_DIR, 'qa-coverage-state.json');
const STATE_LOCK = path.join(QA_DIR, '.qa-coverage-state.lock');
const SHOTS_DIR = path.join(QA_DIR, 'screenshots', 'sweep');

// ---------------------------------------------------------------------------
// 1. CLI
// ---------------------------------------------------------------------------
const KNOWN_FLAGS = new Set([
  'help',
  'list',
  'headed',
  'no-error-pass',
  'only',
  'role',
  'variant',
  'max-cells',
  'recycle-every',
  'cell-timeout',
  'base-web',
  'base-admin',
  'base-api',
]);

function parseArgs(argv) {
  const out = {};
  for (const raw of argv) {
    if (!raw.startsWith('--')) throw new Error(`unexpected argument "${raw}" (flags only)`);
    const [name, ...rest] = raw.slice(2).split('=');
    if (!KNOWN_FLAGS.has(name)) throw new Error(`unknown flag "--${name}" (see --help)`);
    out[name] = rest.length ? rest.join('=') : true;
  }
  return out;
}

const HELP = `qa-sweep.mjs — deterministic full-surface QA sweep

  --only=<glob>          limit to matching route patterns, e.g. '/[locale]/tenant/**'
  --role=<A,B>           limit to these roles (ADMIN TENANT_OWNER TENANT_LEARNER INDIVIDUAL ANON)
  --variant=<a,b>        limit to these variant names (see below)
  --max-cells=<n>        cap cells this run; least-recently-swept cells go first
  --headed               show the browser (default headless)
  --no-error-pass        skip the aborted-data-GET error-state sub-pass
  --recycle-every=<n>    recreate the browser context every n cells (default 25)
  --cell-timeout=<ms>    hard per-cell timeout (default 45000)
  --base-web=<url>       default http://localhost:3000
  --base-admin=<url>     default http://localhost:3001
  --base-api=<url>       default http://localhost:4000
  --list                 enumerate routes + cells and exit (no stack, no browser)
  --help                 this text

Variants  web:   uz-light-1440 (primary) · uz-dark-1440 · uz-light-390 · ru-light-1440
          admin: light-1440 (primary) · dark-1440 · light-390   (apps/admin has no i18n)

Outputs   full sweep      docs/qa/qa-sweep-verdicts.json
          filtered run    docs/qa/qa-sweep-verdicts.filtered.json  (kept apart on purpose)
          coverage queue  docs/qa/qa-coverage-state.json           (merged under a lock)

Exit      0 ran · 2 bad invocation · 1 stack not identified / environment broken
`;

let ARGS;
try {
  ARGS = parseArgs(process.argv.slice(2));
} catch (err) {
  console.error(`qa-sweep: ${err.message}`);
  process.exit(2);
}
if (ARGS.help) {
  process.stdout.write(HELP);
  process.exit(0);
}

const CFG = {
  web: String(ARGS['base-web'] ?? 'http://localhost:3000').replace(/\/$/, ''),
  admin: String(ARGS['base-admin'] ?? 'http://localhost:3001').replace(/\/$/, ''),
  api: String(ARGS['base-api'] ?? 'http://localhost:4000').replace(/\/$/, ''),
  headed: Boolean(ARGS.headed),
  errorPass: !ARGS['no-error-pass'],
  maxCells: ARGS['max-cells'] ? Number(ARGS['max-cells']) : null,
  recycleEvery: Number(ARGS['recycle-every'] ?? 25),
  cellTimeout: Number(ARGS['cell-timeout'] ?? 45_000),
  only: ARGS.only ? String(ARGS.only) : null,
  roles: ARGS.role ? String(ARGS.role).split(',').map((s) => s.trim().toUpperCase()) : null,
  variants: ARGS.variant ? String(ARGS.variant).split(',').map((s) => s.trim()) : null,
  list: Boolean(ARGS.list),
};
// A filtered run must not retire the cells it never looked at, and must not overwrite
// the canonical verdicts file. `noErrorPass` counts as filtering: a run that skipped the
// error states is not a full sweep, and letting it write the canonical file would silently
// erase every error-affordance / immortal-spinner failure with nothing recording why.
const IS_FULL_SWEEP =
  !CFG.only && !CFG.roles && !CFG.variants && !CFG.maxCells && CFG.errorPass;

// ---------------------------------------------------------------------------
// 2. Constants: roles, variants, accounts, thresholds
// ---------------------------------------------------------------------------
const ANON = 'ANON';
const ALL_ROLES = ['ADMIN', 'TENANT_OWNER', 'TENANT_LEARNER', 'INDIVIDUAL', ANON];

/** Credentials ledger: docs/qa/visual-qa-report.md (keep in sync with qa-preflight.sh §3c). */
const ACCOUNTS = {
  ADMIN: { identifier: 'qa-admin@talim.local', password: 'QaAdmin-12345' },
  TENANT_OWNER: { identifier: 'qa-owner@talim.local', password: 'QaOwner-12345' },
  TENANT_LEARNER: { identifier: 'teststudent1', password: 'Student-12345' },
  INDIVIDUAL: { identifier: 'qa-individual@talim.local', password: 'Individual-12345' },
};

const WEB_VARIANTS = {
  'uz-light-1440': { locale: 'uz', colorScheme: 'light', width: 1440, height: 900, primary: true },
  'uz-dark-1440': { locale: 'uz', colorScheme: 'dark', width: 1440, height: 900 },
  'uz-light-390': { locale: 'uz', colorScheme: 'light', width: 390, height: 844 },
  'ru-light-1440': { locale: 'ru', colorScheme: 'light', width: 1440, height: 900 },
};
const ADMIN_VARIANTS = {
  'light-1440': { locale: 'en', colorScheme: 'light', width: 1440, height: 900, primary: true },
  'dark-1440': { locale: 'en', colorScheme: 'dark', width: 1440, height: 900 },
  'light-390': { locale: 'en', colorScheme: 'light', width: 390, height: 844 },
};

/**
 * Unknown FLAGS exit 2, but unknown flag VALUES used to sail straight through: `--role=OWNER`
 * (the real role is TENANT_OWNER) matched no cell, so the sweep swept nothing, declared an
 * all-green run and overwrote the verdicts file with it. A green run that looked at nothing is
 * the exact false-green this whole system exists to prevent — so values are checked too.
 */
function validateFilters() {
  const problems = [];
  const check = (label, values, allowed) => {
    for (const value of values ?? []) {
      if (!allowed.includes(value)) {
        problems.push(`unknown --${label} value "${value}" — valid: ${allowed.join(', ')}`);
      }
    }
  };
  check('role', CFG.roles, ALL_ROLES);
  check('variant', CFG.variants, [...Object.keys(WEB_VARIANTS), ...Object.keys(ADMIN_VARIANTS)]);
  for (const [label, value] of [
    ['max-cells', CFG.maxCells],
    ['recycle-every', CFG.recycleEvery],
    ['cell-timeout', CFG.cellTimeout],
  ]) {
    if (value != null && (!Number.isFinite(value) || value <= 0)) {
      problems.push(`--${label} must be a positive number (got "${ARGS[label]}")`);
    }
  }
  if (problems.length) {
    for (const problem of problems) console.error(`qa-sweep: ${problem}`);
    process.exit(2);
  }
}
validateFilters();

/**
 * Per-cell time budget, derived from --cell-timeout so the parts always fit inside the whole.
 * Fixed budgets (goto 20s + settle 6s + evaluate 15s + one 15s retry) could total 56s inside a
 * 45s cell timeout, so a slow-but-healthy page was recorded as `cell-crashed` — a false RED,
 * which costs more triage than the slow page ever cost wall clock.
 */
const budget = (fraction, floorMs) => Math.max(floorMs, Math.round(CFG.cellTimeout * fraction));
const CELL_BUDGET = {
  goto: budget(0.4, 5000),
  settle: budget(0.14, 2000),
  evaluate: budget(0.18, 4000), // spent twice: first attempt + the lost-context retry
};
// The error pass additionally sits through a retry/backoff window before it judges a spinner.
const ERROR_PASS_BUDGET = {
  goto: budget(0.3, 5000),
  settle: budget(0.15, 2000),
  backoff: budget(0.06, 1500),
  evaluate: budget(0.15, 4000),
};

// Dev-mode-tolerant thresholds: an unoptimised `next dev` build shifts and blocks far more
// than production, so these sit at the CWV "poor" boundary rather than the "good" one. The
// point is to catch a page that is genuinely broken, not to grade dev-server performance.
const CLS_LIMIT = 0.25;
const LONG_TASK_LIMIT_MS = 800;
const MIN_RENDERED_TEXT = 20;

// Sweep-integrity guard: past this share of cells coming back blank or crashed, the honest
// reading is "the environment is broken", not "the product has N bugs". Reporting 200 product
// findings because the dev server fell over is how a QA system earns being muted.
const INTEGRITY_FAIL_SHARE = 0.25;
const INTEGRITY_MIN_CELLS = 8; // below this a single bad cell would trip the share
const CHECKPOINT_EVERY = 25; // cells between verdict-file checkpoints (see the sweep loop)

/**
 * Framework noise that is NEVER a product finding. Without this every one of ~300 cells
 * reports the same Next-dev-server chatter and the real signal drowns. Product noise does
 * NOT belong here — it belongs in docs/qa/console-baseline.json, per route, with a reason.
 */
const BUILTIN_CONSOLE_NOISE = [
  'Download the React DevTools',
  '[Fast Refresh]',
  'react-devtools',
  'Slow filesystem detected',
];
const BUILTIN_NETWORK_NOISE = ['/_next/static/webpack/', '/__nextjs', '/favicon.ico'];

// API paths that every page hits and that therefore say nothing about *this* route's
// primary data dependency (used by the error-state sub-pass to pick what to abort).
const AMBIENT_API_PATHS = [
  '/health',
  '/auth/me',
  '/events',
  '/unread-count',
  '/billing/me',
  '/usage/me',
];

// ---------------------------------------------------------------------------
// 3. Route enumeration — the coverage model
// ---------------------------------------------------------------------------
function walkPages(dir, acc = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith('_') || entry.name === 'api' || entry.name === 'node_modules') continue;
      walkPages(full, acc);
    } else if (entry.name === 'page.tsx' || entry.name === 'page.jsx') {
      acc.push(full);
    }
  }
  return acc;
}

/** `app/[locale]/(tenant)/tenant/students/[id]/page.tsx` → `/[locale]/tenant/students/[id]`. */
function fileToRoutePattern(appDir, file) {
  const segs = path
    .relative(appDir, file)
    .split(path.sep)
    .slice(0, -1)
    .filter((s) => !(s.startsWith('(') && s.endsWith(')'))) // route groups add layout, not URL
    .filter((s) => !s.startsWith('@')); // parallel-route slots are not addressable
  return `/${segs.join('/')}`.replace(/\/$/, '') || '/';
}

function enumerateRoutes() {
  const routes = [];
  for (const [app, dir] of [
    ['web', WEB_APP_DIR],
    ['admin', ADMIN_APP_DIR],
  ]) {
    for (const file of walkPages(dir)) {
      routes.push({
        app,
        pattern: fileToRoutePattern(dir, file),
        source: path.relative(REPO, file),
      });
    }
  }
  return routes.sort((a, b) => (a.app + a.pattern).localeCompare(b.app + b.pattern));
}

function globToRegExp(glob) {
  // `**` crosses path separators, `*` does not. Everything else is literal — route patterns
  // contain `[` and `]`, which would otherwise be read as a regex character class.
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  const body = escaped.replace(/\*\*|\*/g, (m) => (m === '**' ? '.*' : '[^/]*'));
  return new RegExp(`^${body}$`);
}

// ---------------------------------------------------------------------------
// 4. Role matrix — who should reach each route, and what should happen
// ---------------------------------------------------------------------------
// expectation: 'ok' = renders · 'redirect' = a guard bounces elsewhere · 'denied' = blocked
//              'unclassified' = a route the matrix does not know (LOUD, see below)
const HOME = {
  TENANT_OWNER: '/tenant/dashboard',
  TENANT_LEARNER: '/learner/dashboard',
  INDIVIDUAL: '/dashboard',
};

function webRoleMatrix(pattern) {
  const p = pattern.replace('/[locale]', '') || '/';
  const bounceHome = (roles) => roles.map((role) => ({ role, expectation: 'redirect', to: HOME[role] }));
  const toLogin = { role: ANON, expectation: 'redirect', to: '/login' };

  if (p === '/') {
    return [{ role: ANON, expectation: 'ok' }, ...bounceHome(['INDIVIDUAL', 'TENANT_OWNER', 'TENANT_LEARNER'])];
  }
  if (p === '/pricing' || p === '/terms') {
    // Public marketing pages: reachable signed-in too (the navbar links there).
    return [
      { role: ANON, expectation: 'ok' },
      { role: 'INDIVIDUAL', expectation: 'ok' },
    ];
  }
  if (p === '/login' || p === '/register') {
    return [{ role: ANON, expectation: 'ok' }, ...bounceHome(['INDIVIDUAL', 'TENANT_OWNER', 'TENANT_LEARNER'])];
  }
  if (p === '/impersonate') {
    // One-shot admin token consumer. With no ?token= it must render its own error
    // affordance rather than hang — that IS the check worth running here.
    return [{ role: ANON, expectation: 'ok' }];
  }
  if (p.startsWith('/learner')) {
    return [
      { role: 'TENANT_LEARNER', expectation: 'ok' },
      ...bounceHome(['TENANT_OWNER', 'INDIVIDUAL']),
      toLogin,
    ];
  }
  if (p.startsWith('/tenant')) {
    return [
      { role: 'TENANT_OWNER', expectation: 'ok' },
      ...bounceHome(['TENANT_LEARNER', 'INDIVIDUAL']),
      toLogin,
    ];
  }
  if (p.startsWith('/dashboard')) {
    return [
      { role: 'INDIVIDUAL', expectation: 'ok' },
      ...bounceHome(['TENANT_OWNER', 'TENANT_LEARNER']),
      toLogin,
    ];
  }
  if (p.startsWith('/content') || p.startsWith('/quiz')) {
    return [
      { role: 'INDIVIDUAL', expectation: 'ok' },
      { role: 'TENANT_LEARNER', expectation: 'ok' },
      toLogin,
    ];
  }
  // Unknown route: sweep it as every role at the primary variant and fail the
  // `route-classified` probe. A new page must never enter the product unnoticed.
  return ALL_ROLES.map((role) => ({ role, expectation: 'unclassified' }));
}

function adminRoleMatrix(pattern) {
  if (pattern === '/') {
    // apps/admin/app/page.tsx server-redirects to /login, but /login itself then bounces an
    // authenticated ADMIN on to /dashboard. So the landing place is role-dependent, and
    // asserting /login for everyone made a correctly-behaving admin look like a defect on
    // the very first sweep.
    return [
      { role: ANON, expectation: 'redirect', to: '/login' },
      { role: 'ADMIN', expectation: 'redirect', to: '/dashboard' },
    ];
  }
  if (pattern === '/login') {
    return [
      { role: ANON, expectation: 'ok' },
      { role: 'ADMIN', expectation: 'redirect', to: '/dashboard' },
    ];
  }
  return [
    { role: 'ADMIN', expectation: 'ok' },
    { role: ANON, expectation: 'redirect', to: '/login' },
    // Isolation check: a tenant-owner session injected into the admin origin must be
    // bounced by AuthGuard's `user?.role === 'ADMIN'` test, not merely by the API 403.
    { role: 'TENANT_OWNER', expectation: 'redirect', to: '/login' },
  ];
}

function roleMatrixFor(route) {
  return route.app === 'web' ? webRoleMatrix(route.pattern) : adminRoleMatrix(route.pattern);
}

// ---------------------------------------------------------------------------
// 5. Cell construction
// ---------------------------------------------------------------------------
function slugRoute(pattern) {
  return pattern.replace(/^\//, '').replace(/[[\]]/g, '').replace(/\//g, '.') || 'root';
}

function buildCells(routes) {
  const cells = [];
  for (const route of routes) {
    if (CFG.only && !globToRegExp(CFG.only).test(route.pattern)) continue;
    const variantTable = route.app === 'web' ? WEB_VARIANTS : ADMIN_VARIANTS;
    const primaryVariant = Object.keys(variantTable).find((v) => variantTable[v].primary);

    for (const entry of roleMatrixFor(route)) {
      if (CFG.roles && !CFG.roles.includes(entry.role)) continue;
      // Only cells expected to RENDER earn the full variant matrix. A guard bounce looks
      // identical at 390px in Russian dark mode, so paying 4x for it buys nothing.
      const variants = entry.expectation === 'ok' ? Object.keys(variantTable) : [primaryVariant];
      for (const variant of variants) {
        if (CFG.variants && !CFG.variants.includes(variant)) continue;
        cells.push({
          cellId: `${route.app}:${slugRoute(route.pattern)}/${entry.role}/${variant}`,
          app: route.app,
          route: route.pattern,
          source: route.source,
          role: entry.role,
          expectation: entry.expectation,
          expectedTarget: entry.to ?? null,
          variant,
          variantSpec: variantTable[variant],
          isPrimaryVariant: variant === primaryVariant,
        });
      }
    }
  }
  return groupForContextReuse(cells);
}

/**
 * A browser context is keyed by app|role|variant, so route-major order changed the key on
 * almost every cell: ~282 newContext() calls where ~40 were intended, and --recycle-every
 * never had a chance to fire. Grouping by that key first is a pure ordering change.
 */
function groupForContextReuse(cells) {
  const key = (c) => `${c.app}|${c.role}|${c.variant}|${c.route}`;
  return [...cells].sort((a, b) => key(a).localeCompare(key(b)));
}

// ---------------------------------------------------------------------------
// 6. Sessions + dynamic-segment resolution (live API, per role)
// ---------------------------------------------------------------------------
async function apiFetch(pathname, { token, timeoutMs = 10_000 } = {}) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(`${CFG.api}${pathname}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: ctl.signal,
    });
    const body = res.headers.get('content-type')?.includes('json') ? await res.json() : null;
    return { status: res.status, body };
  } catch (err) {
    return { status: 0, body: null, error: String(err?.message ?? err) };
  } finally {
    clearTimeout(timer);
  }
}

async function login(role) {
  const account = ACCOUNTS[role];
  if (!account) return { ok: false, reason: `no QA account defined for ${role}` };
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 10_000);
  try {
    const res = await fetch(`${CFG.api}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // The API's login field is named `email` but accepts a student username too.
      body: JSON.stringify({ email: account.identifier, password: account.password }),
      signal: ctl.signal,
    });
    if (res.status !== 200) return { ok: false, reason: `login ${res.status} for ${account.identifier}` };
    const data = await res.json();
    if (!data?.token || !data?.user) return { ok: false, reason: 'login 200 but no {user,token}' };
    return { ok: true, token: data.token, user: data.user };
  } catch (err) {
    return { ok: false, reason: `login failed: ${String(err?.message ?? err)}` };
  } finally {
    clearTimeout(timer);
  }
}

const firstId = (list, key = 'id') =>
  Array.isArray(list) && list.length ? (list[0][key] ?? null) : null;

/** Live ids for one role, fetched once and reused for the whole run. */
async function resolveIdBag(role, session) {
  const bag = {};
  const token = session?.token;
  if (!token) return bag;

  if (role === 'INDIVIDUAL') {
    const { body } = await apiFetch('/content', { token });
    const contents = body?.contents ?? [];
    bag.contentId = (contents.find((c) => c.status === 'READY') ?? contents[0])?.id ?? null;
  }
  if (role === 'TENANT_LEARNER') {
    const { body } = await apiFetch('/learner/materials', { token });
    bag.contentId = firstId(body?.materials ?? [], 'contentId');
  }
  if (role === 'TENANT_OWNER') {
    const [contents, students] = await Promise.all([
      apiFetch('/tenant/content', { token }),
      apiFetch('/tenant/students', { token }),
    ]);
    const list = contents.body?.contents ?? [];
    bag.tenantContentId = (list.find((c) => c.status === 'READY') ?? list[0])?.id ?? null;
    bag.studentId = firstId(students.body?.students ?? []);
  }
  if (role === 'ADMIN') {
    const [users, tenants] = await Promise.all([
      apiFetch('/admin/users', { token }),
      apiFetch('/admin/tenants', { token }),
    ]);
    bag.adminUserId = firstId(users.body?.items ?? []);
    bag.adminTenantId = firstId(tenants.body?.items ?? []);
  }
  if (bag.contentId) {
    const { body } = await apiFetch(`/quiz/content/${bag.contentId}`, { token });
    bag.quizId = firstId(body?.quizzes ?? []);
  }
  return bag;
}

/**
 * Which id bag key fills a SPECIFIC parameter. Rule-based so new sub-routes inherit it.
 *
 * Keyed on the parameter name as well as the route, because the route-only version returned
 * the same id for every `[...]` in the pattern: the day someone adds `/tenant/students/[id]/
 * assessments/[assessmentId]` it would quietly paste a student id into the assessment slot and
 * report the resulting 404 as a product bug.
 */
function idKeyForParam(app, pattern, param) {
  const forId = (p) => {
    if (app === 'admin') {
      if (p.startsWith('/users/')) return 'adminUserId';
      if (p.startsWith('/tenants/')) return 'adminTenantId';
      return null;
    }
    if (p.startsWith('/content/')) return 'contentId';
    if (p.startsWith('/quiz/')) return 'quizId';
    if (p.startsWith('/tenant/materials/')) return 'tenantContentId';
    if (p.startsWith('/tenant/students/')) return 'studentId';
    return null;
  };
  const p = app === 'admin' ? pattern : pattern.replace('/[locale]', '');
  if (param === 'id') return forId(p);
  if (param === 'contentId') return app === 'admin' ? null : 'contentId';
  if (param === 'studentId') return 'studentId';
  if (param === 'quizId') return 'quizId';
  return null;
}

/**
 * Fill a route pattern into a real URL. Returns {ok:false, reason:'unresolved-params'}
 * rather than skipping — an [id] that cannot be resolved means the product has no data
 * for that surface, and that is exactly the kind of rot this sweep exists to show.
 */
function buildUrl(cell, bags) {
  const base = cell.app === 'web' ? CFG.web : CFG.admin;
  const params = [...cell.route.matchAll(/\[([^\]]+)\]/g)].map((m) => m[1]);
  let filled = cell.route;

  for (const param of params) {
    if (param === 'locale') {
      filled = filled.replace('[locale]', cell.variantSpec.locale);
      continue;
    }
    const key = idKeyForParam(cell.app, cell.route, param);
    if (!key) {
      return { ok: false, reason: `unresolved-params: no id source mapped for [${param}] on ${cell.route}` };
    }
    // Guards fire before any data fetch, so a non-'ok' cell only needs a well-formed id —
    // borrow one from whichever role could resolve it.
    let value = bags[cell.role]?.[key] ?? null;
    if (!value && cell.expectation !== 'ok') {
      value = Object.values(bags).map((b) => b?.[key]).find(Boolean) ?? null;
    }
    if (!value) {
      return { ok: false, reason: `unresolved-params: no ${key} available for ${cell.role}` };
    }
    filled = filled.replace(`[${param}]`, value);
  }
  return { ok: true, url: `${base}${filled}` };
}

// ---------------------------------------------------------------------------
// 7. Console / network baseline triage
// ---------------------------------------------------------------------------
function loadBaseline() {
  try {
    return JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8'));
  } catch {
    return { global: { console: [], network: [] }, routes: {} };
  }
}

/**
 * Three waiver kinds live in docs/qa/console-baseline.json, global and per route:
 *   console  — a console error/warning that is known-benign
 *   network  — a `METHOD /path` + status that is known-benign
 *   text     — a rendered-text finding (garbage / raw i18n key / raw math)
 * `text` exists so a text-probe false positive has an escape hatch that is a data edit with a
 * reason attached, instead of someone loosening a regex in this file for one page.
 */
function baselineEntries(baseline, route, kind) {
  const global = baseline?.global?.[kind] ?? [];
  const perRoute = baseline?.routes?.[route]?.[kind] ?? [];
  return [...global, ...perRoute];
}

/** An entry may be a bare string or `{ match, status?, level?, reason, sev }`. */
function isWaived(entries, { text, status, level, url }) {
  return entries.some((entry) => {
    const e = typeof entry === 'string' ? { match: entry } : entry;
    if (!e?.match) return false;
    if (e.sev && e.sev !== 'waived') return false;
    if (e.status != null && e.status !== status) return false;
    if (e.level && e.level !== level) return false;
    // Match the URL too. A failed-resource console error carries no useful text — every
    // one of them reads "Failed to load resource: … 404" — so the only thing that
    // identifies it is the URL. Keying a waiver on that text instead would waive every
    // 404 on the page, which is precisely the noise this file exists to avoid.
    return text.includes(e.match) || (url ? String(url).includes(e.match) : false);
  });
}

// ---------------------------------------------------------------------------
// 7b. Redaction — the verdicts quote real pages, and this repo is public
// ---------------------------------------------------------------------------
/**
 * Every quoted string in the verdicts comes off a live page rendered with real seeded data.
 * An admin:users cell failing `content-rendered` quotes the user table; a console entry often
 * carries a whole API response body. The files are gitignored, but they are also read, pasted
 * into issues and attached to PRs — so the PII is masked at the source, where it cannot be
 * forgotten. Shape survives (that is all triage needs); identities do not.
 */
const REDACTIONS = [
  [/[\w.+-]+@[\w-]+\.[\w.-]+/g, '<email>'],
  [/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '<uuid>'],
  [/\bc[a-z0-9]{20,}\b/gi, '<cuid>'],
  [/\beyJ[\w-]{8,}\.[\w-]+\.?[\w-]*/g, '<jwt>'],
  [/\b\+?\d[\d\s().-]{7,}\d\b/g, '<num>'],
];

function redact(value, max = 80) {
  let out = String(value ?? '');
  for (const [pattern, replacement] of REDACTIONS) out = out.replace(pattern, replacement);
  out = out.replace(/\s+/g, ' ').trim();
  return out.length > max ? `${out.slice(0, max)}…` : out;
}

/** Query strings carry tokens and ids; a URL's path is what identifies the request. */
function redactUrl(value, max = 120) {
  const raw = String(value ?? '');
  let out = raw;
  try {
    const url = new URL(raw);
    out = `${url.origin}${url.pathname}${url.search ? '?…' : ''}`;
  } catch {
    /* relative or data: URL — fall through to the generic masker */
  }
  return redact(out, max);
}

// ---------------------------------------------------------------------------
// 8. In-page collectors (installed before any page script runs)
// ---------------------------------------------------------------------------
function installCollectors({ storageKey, blob }) {
  try {
    if (blob) window.localStorage.setItem(storageKey, blob);
    else window.localStorage.removeItem(storageKey);
  } catch {
    /* about:blank / opaque origin — nothing to seed */
  }
  if (window.__qaSweep) return;
  const state = { rejections: [], cls: 0, longestTask: 0 };
  window.__qaSweep = state;
  window.addEventListener('unhandledrejection', (event) => {
    state.rejections.push(String(event.reason?.stack ?? event.reason ?? 'unknown rejection').slice(0, 500));
  });
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) if (!entry.hadRecentInput) state.cls += entry.value;
    }).observe({ type: 'layout-shift', buffered: true });
  } catch {
    /* layout-shift unsupported */
  }
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        state.longestTask = Math.max(state.longestTask, entry.duration);
      }
    }).observe({ type: 'longtask', buffered: true });
  } catch {
    /* longtask unsupported */
  }
}

// ---------------------------------------------------------------------------
// 9. The probe pack — runs in the page, returns raw findings (no judgement)
// ---------------------------------------------------------------------------
function collectFindings(cfg) {
  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'TEXTAREA', 'SVG', 'TITLE']);
  const CHROME_SELECTOR = 'nav,header,footer,aside,button,label,a,h1,h2,h3,h4,h5,h6,[role="navigation"]';
  const FILE_EXT = new Set([
    'pdf', 'png', 'jpg', 'jpeg', 'svg', 'mp3', 'mp4', 'wav', 'csv', 'json', 'ts', 'tsx',
    'js', 'jsx', 'css', 'html', 'md', 'txt', 'pptx', 'docx', 'local', 'com', 'org', 'uz', 'ai',
  ]);

  const nodes = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const el = node.parentElement;
      if (!el || SKIP_TAGS.has(el.tagName.toUpperCase())) return NodeFilter.FILTER_REJECT;
      if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      if (!el.getClientRects().length) return NodeFilter.FILTER_REJECT; // not rendered
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  for (let n = walker.nextNode(); n && nodes.length < 4000; n = walker.nextNode()) {
    nodes.push({ text: n.nodeValue.trim(), el: n.parentElement });
  }
  const describe = (el) => {
    if (!el) return '?';
    const cls = typeof el.className === 'string' ? el.className.split(/\s+/).slice(0, 3).join('.') : '';
    return `${el.tagName.toLowerCase()}${cls ? `.${cls}` : ''}`;
  };

  // --- garbage text ---------------------------------------------------------
  // Split by signal strength, because a bare `\bundefined\b` is NOT one: the AI tutor at
  // /content/[id]/chat explains JavaScript, so it renders the word "undefined" as correct
  // prose. Failing on that teaches the reader to ignore the probe. NaN, [object Object] and
  // Invalid Date have no legitimate prose use, and the concatenated / URL-embedded forms of
  // "undefined" are template bugs no sentence produces.
  const hardGarbageRe = /\bNaN\b|\[object Object\]|Invalid Date|undefinedundefined|\/undefined\b|\bundefined\//;
  const softGarbageRe = /\bundefined\b/;
  const garbage = [];
  const garbageSoft = [];
  for (const { text, el } of nodes) {
    if (garbage.length >= 8 && garbageSoft.length >= 5) break;
    if (hardGarbageRe.test(text)) {
      if (garbage.length < 8) garbage.push({ text: text.slice(0, 160), at: describe(el) });
    } else if (softGarbageRe.test(text)) {
      if (garbageSoft.length < 5) garbageSoft.push({ text: text.slice(0, 160), at: describe(el) });
    }
  }

  // --- raw i18n keys --------------------------------------------------------
  // Anchored on the real message namespaces (read from apps/web/messages at run start).
  // A bare `/\b[a-z]+(\.\w+){2,}\b/` matches filenames, hostnames and version strings, and
  // the false positives would poison every cell; namespace-anchoring makes it precise.
  // `cfg.namespaces` is EMPTY for apps/admin, which has no i18n at all — see the caller.
  const keyRe = /[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z0-9_]+)+/g;
  const i18nKeys = [];
  if (cfg.namespaces.length) {
    for (const { text, el } of nodes) {
      if (i18nKeys.length >= 8) break;
      for (const match of text.match(keyRe) ?? []) {
        const segs = match.split('.');
        if (!cfg.namespaces.includes(segs[0])) continue;
        if (FILE_EXT.has(segs[segs.length - 1].toLowerCase())) continue;
        // Either the node is nothing but the key (next-intl's missing-message fallback),
        // or it is a deep dotted path that no human copy would contain.
        if (text !== match && segs.length < 3) continue;
        i18nKeys.push({ key: match, at: describe(el) });
        break;
      }
    }
  }

  // --- Uzbek apostrophe (oʻ / gʻ = U+02BB, never ASCII ' or a curly quote) ---
  // REPORT-ONLY — see the `uz-apostrophe-count` probe for why this cannot enforce.
  // `inChrome` is recorded for triage colour, not as a verdict: <Link> renders an <a> and a
  // quiz option renders a <label>, so material titles and AI-authored answers land in
  // "chrome" too. Treat it as a hint about where the hit was, nothing stronger.
  const aposRe = /[oOgG][’‘'`´]/;
  const apostrophe = [];
  if (cfg.locale === 'uz') {
    for (const { text, el } of nodes) {
      if (apostrophe.length >= 10) break;
      if (!aposRe.test(text)) continue;
      apostrophe.push({
        text: text.slice(0, 120),
        at: describe(el),
        inChrome: Boolean(el.closest(CHROME_SELECTOR)),
      });
    }
  }

  // --- images ---------------------------------------------------------------
  const brokenImages = [];
  for (const img of Array.from(document.images).slice(0, 300)) {
    // `complete && naturalWidth === 0` = the load finished and produced nothing.
    // Not-yet-complete images are lazy ones below the fold, not broken ones.
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) {
      brokenImages.push((img.currentSrc || img.src || '').slice(0, 200));
    }
  }

  // --- horizontal overflow --------------------------------------------------
  const doc = document.documentElement;
  const overflow = { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth, offenders: [] };
  if (doc.scrollWidth > doc.clientWidth + 1) {
    for (const el of Array.from(document.body.querySelectorAll('*')).slice(0, 2500)) {
      if (overflow.offenders.length >= 10) break;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      if (rect.right <= doc.clientWidth + 2 && rect.left >= -2) continue;
      const parent = el.parentElement;
      const parentRect = parent ? parent.getBoundingClientRect() : null;
      // Clipped by its own container = not a page-level overflow.
      if (parent && getComputedStyle(parent).overflowX !== 'visible') continue;
      if (parentRect && rect.width <= parentRect.width + 2) continue;
      overflow.offenders.push({ at: describe(el), width: Math.round(rect.width), right: Math.round(rect.right) });
    }
  }

  // --- rendered content -----------------------------------------------------
  const main = document.querySelector('main') ?? document.body;
  const mainText = (main.innerText ?? '').trim();

  // --- math / diagrams ------------------------------------------------------
  const katexErrors = document.querySelectorAll('.katex-error').length;
  const rawMath = [];
  for (const { text, el } of nodes) {
    if (rawMath.length >= 5) break;
    if (el.closest('.katex')) continue;
    if (/\$\$|\\frac|\\begin\{/.test(text)) rawMath.push({ text: text.slice(0, 120), at: describe(el) });
  }
  const mermaidNodes = Array.from(document.querySelectorAll('.mermaid,pre.mermaid'));
  const mermaidMissing = mermaidNodes.filter((el) => !el.querySelector('svg')).length;

  // --- loading / error affordances (used by the error-state sub-pass) -------
  const spinners = Array.from(
    document.querySelectorAll('.animate-spin,[role="progressbar"],[aria-busy="true"]'),
  ).filter((el) => el.getClientRects().length).length;
  const loadingWords = /(^|\s)(loading|yuklanmoqda|загрузка|yuklanyapti)/i;
  const spinnerText = nodes.some(({ text }) => loadingWords.test(text));
  const errorWords = /(xato|xatolik|qayta urin|ошибк|повтор|не удалось|error|failed|try again|retry)/i;
  const errorAffordance =
    document.querySelector('[role="alert"],.text-destructive,[data-error]') !== null ||
    nodes.some(({ text }) => errorWords.test(text));

  const perf = window.__qaSweep ?? { rejections: [], cls: 0, longestTask: 0 };
  return {
    htmlLang: document.documentElement.getAttribute('lang'),
    title: document.title,
    mainTextLength: mainText.length,
    mainTextSample: mainText.slice(0, 200), // redacted + truncated again before it is written
    garbage,
    garbageSoft,
    i18nKeys,
    apostrophe,
    brokenImages,
    overflow,
    katexErrors,
    rawMath,
    mermaidTotal: mermaidNodes.length,
    mermaidMissing,
    spinners,
    spinnerText,
    errorAffordance,
    rejections: perf.rejections.slice(0, 5),
    cls: Math.round(perf.cls * 1000) / 1000,
    longestTask: Math.round(perf.longestTask),
  };
}

// ---------------------------------------------------------------------------
// 10. Navigation helpers
// ---------------------------------------------------------------------------
function withTimeout(promise, ms, label) {
  let timer;
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} exceeded ${ms}ms`)), ms);
    }),
  ]);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Playwright's call log is ANSI-coloured; escape codes make the verdicts JSON unreadable. */
const plain = (value) => String(value ?? '').replace(/\u001b\[[0-9;]*m/g, '');

/**
 * Navigate, then wait for the network to go quiet on OUR counter rather than Playwright's
 * `networkidle`. The app holds a permanent SSE connection (`/events`), so `networkidle`
 * never fires and every cell would burn its full timeout.
 */
async function gotoAndSettle(page, url, net, { quietMs = 700, capMs, gotoMs } = {}) {
  const response = await page.goto(url, {
    waitUntil: 'domcontentloaded',
    timeout: gotoMs ?? CELL_BUDGET.goto,
  });
  const deadline = Date.now() + (capMs ?? CELL_BUDGET.settle);
  await sleep(350); // React hydration + zustand persist rehydrate + any guard redirect
  while (Date.now() < deadline) {
    if (Date.now() - net.lastActivityAt >= quietMs) break;
    await sleep(120);
  }
  return response;
}

async function waitForRedirect(page, fromUrl, capMs = 5000) {
  const deadline = Date.now() + capMs;
  while (Date.now() < deadline) {
    if (page.url() !== fromUrl) return true;
    await sleep(150);
  }
  return false;
}

/**
 * `page.evaluate` can lose its execution context to a late redirect; retry once. Playwright
 * puts NO timeout on evaluate, so each attempt gets an explicit slice of the cell budget —
 * otherwise one wedged page burns the whole cell timeout and is filed as `cell-crashed`.
 */
async function evaluateFindings(page, cfg, budgetMs = CELL_BUDGET.evaluate) {
  try {
    return await withTimeout(page.evaluate(collectFindings, cfg), budgetMs, 'evaluate');
  } catch {
    await sleep(400);
    return withTimeout(page.evaluate(collectFindings, cfg), budgetMs, 'evaluate (retry)');
  }
}

// ---------------------------------------------------------------------------
// 11. Per-cell instrumentation + verdict assembly
// ---------------------------------------------------------------------------
function attachRecorders(page, apiOrigin) {
  const rec = {
    console: [],
    pageErrors: [],
    responses: [],
    mutations: [],
    duplicates: [],
    apiGets: [],
    lastActivityAt: Date.now(),
  };
  const touch = () => {
    rec.lastActivityAt = Date.now();
  };
  // Candidate data GETs are stamped when the request STARTS, not when it answers — see
  // primaryApiFor().
  const started = new Map();
  let sequence = 0;

  const dataGetPath = (req) => {
    const url = req.url();
    if (req.method() !== 'GET' || !url.startsWith(apiOrigin)) return null;
    let pathname;
    try {
      pathname = new URL(url).pathname;
    } catch {
      return null;
    }
    return AMBIENT_API_PATHS.some((p) => pathname.includes(p)) ? null : pathname;
  };

  page.on('console', (msg) => {
    const type = msg.type();
    if (type !== 'error' && type !== 'warning') return;
    // Console errors routinely echo an entire API response body, which on admin routes is
    // real user data — mask before it is ever held in memory for the verdicts file.
    rec.console.push({ level: type, text: redact(msg.text(), 200), url: redactUrl(msg.location()?.url ?? '') });
  });
  page.on('pageerror', (err) => {
    rec.pageErrors.push(redact(String(err?.stack ?? err), 400));
  });
  page.on('request', (req) => {
    if (req.resourceType() === 'eventsource') return; // long-lived SSE: never "activity"
    touch();
    const method = req.method();
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
      const pathname = dataGetPath(req);
      if (pathname) {
        sequence += 1;
        started.set(req, { pathname, at: Date.now(), seq: sequence });
      }
      return;
    }
    const key = `${method} ${req.url()} ${(req.postData() ?? '').slice(0, 300)}`;
    const now = Date.now();
    const previous = rec.mutations.find((m) => m.key === key && now - m.at < 1000);
    if (previous) rec.duplicates.push({ key: redactUrl(key, 200), gapMs: now - previous.at });
    rec.mutations.push({ key, at: now });
  });
  page.on('response', (res) => {
    touch();
    const req = res.request();
    if (req.resourceType() === 'eventsource') return;
    const url = res.url();
    let pathname = url;
    try {
      pathname = new URL(url).pathname;
    } catch {
      /* data: / blob: URLs */
    }
    rec.responses.push({ status: res.status(), method: req.method(), url, pathname });
    const start = started.get(req);
    if (start && res.status() === 200) rec.apiGets.push(start);
  });
  return rec;
}

/**
 * Pick the route's primary data GET — the one the error-state sub-pass will abort.
 *
 * This used to be `rec.apiGets[0]`, filled in RESPONSE order, so the target was whichever
 * request happened to answer first: the same code produced `error-affordance` PASS one night
 * and FAIL the next. Flapping verdicts are what get a QA system muted, so the choice is made
 * on REQUEST start order — the page's own fetch order — and tie-broken by path so two
 * requests fired in the same millisecond still resolve the same way every run.
 */
function primaryApiFor(rec, routeHint = null) {
  const byPath = new Map();
  for (const entry of rec.apiGets) {
    const prior = byPath.get(entry.pathname);
    if (!prior || entry.seq < prior.seq) byPath.set(entry.pathname, entry);
  }
  // A page's own resource beats a sibling widget's. On /users/[id] the layout's
  // /admin/tenants and the page's /admin/users/<id> both start at +0ms, and an
  // alphabetical tie-break picked /admin/tenants — so the error pass aborted a sidebar
  // fetch and then blamed the page for not showing an error. Prefer the candidate whose
  // path carries an id that appears in the URL under test.
  const ownResource = (p) => (routeHint && routeHint.some((id) => id && p.includes(id)) ? 0 : 1);
  const ranked = [...byPath.values()].sort(
    (a, b) =>
      ownResource(a.pathname) - ownResource(b.pathname) ||
      a.at - b.at ||
      a.pathname.localeCompare(b.pathname) ||
      a.seq - b.seq,
  );
  if (!ranked.length) return { pathname: null, candidates: [] };
  return {
    pathname: ranked[0].pathname,
    // Recorded so a human reading a surprising error-pass verdict can see what else was in
    // the running and why this one won.
    candidates: ranked.slice(0, 8).map((c) => `${c.pathname} (+${Math.max(0, c.at - ranked[0].at)}ms)`),
  };
}

/**
 * A probe verdict. Detail is dropped on a PASS unless `keepOnPass` — with ~280 cells x ~18
 * probes, keeping every passing detail would triple the verdicts file the LLM has to read
 * for no triage value.
 */
function probe(id, ok, detail, keepOnPass = false) {
  if (ok && !keepOnPass) return { id, ok };
  if (detail === undefined || detail === null) return { id, ok };
  if (Array.isArray(detail) && detail.length === 0) return { id, ok };
  return { id, ok, detail };
}

function assembleProbes(cell, rec, findings, finalUrl, baseline) {
  const probes = [];
  // A guard cell is one we EXPECT to be bounced: it may legitimately show only a
  // "Loading…" placeholder and get 401/403 from the API on its way out. An
  // 'unclassified' route is not a guard cell — we still want its content checked.
  const guardCell = cell.expectation === 'redirect' || cell.expectation === 'denied';

  // -- expected outcome ------------------------------------------------------
  const requestedPath = new URL(cell.url).pathname;
  const finalPath = new URL(finalUrl).pathname;
  const stayed = finalPath === requestedPath;
  if (cell.expectation === 'ok') {
    probes.push(probe('expected-outcome', stayed, `redirected to ${finalPath}`));
  } else if (cell.expectation === 'redirect') {
    const target = cell.expectedTarget;
    const hitTarget = target ? finalPath.endsWith(target) : !stayed;
    probes.push(
      probe('expected-outcome', !stayed && hitTarget, `expected ${target ?? 'any redirect'}, landed on ${finalPath}`),
    );
  } else if (cell.expectation === 'denied') {
    probes.push(probe('expected-outcome', !stayed || findings.errorAffordance, `landed on ${finalPath}`));
  } else {
    // 'unclassified' — record the observed behaviour, then fail loudly so a human/LLM
    // classifies the new route into the matrix.
    probes.push(
      probe('expected-outcome', true, `observed: ${stayed ? 'rendered' : `redirect → ${finalPath}`}`, true),
    );
    probes.push(probe('route-classified', false, `route ${cell.route} is not in the role matrix — classify it`));
  }

  // -- console ---------------------------------------------------------------
  const consoleEntries = baselineEntries(baseline, cell.route, 'console');
  const consoleFindings = rec.console.filter(
    (m) =>
      !BUILTIN_CONSOLE_NOISE.some((n) => m.text.includes(n)) &&
      !isWaived(consoleEntries, { text: m.text, level: m.level, url: m.url }),
  );
  probes.push(
    probe('console-clean', consoleFindings.length === 0, consoleFindings.slice(0, 5)),
  );

  const crashes = [...rec.pageErrors, ...findings.rejections.map((r) => redact(r, 400))];
  probes.push(probe('no-page-error', crashes.length === 0, crashes.slice(0, 3)));

  // -- network ---------------------------------------------------------------
  const networkEntries = baselineEntries(baseline, cell.route, 'network');
  const badResponses = rec.responses.filter((r) => {
    if (r.status < 400) return false;
    if (r.status >= 500) return true; // a 5xx is never waivable
    if (BUILTIN_NETWORK_NOISE.some((n) => r.pathname.includes(n))) return false;
    // A guard cell is *supposed* to be rejected by the API before the redirect lands.
    if (guardCell && (r.status === 401 || r.status === 403)) return false;
    return !isWaived(networkEntries, { text: `${r.method} ${r.pathname}`, status: r.status });
  });
  probes.push(
    probe(
      'http-ok',
      badResponses.length === 0,
      badResponses.slice(0, 6).map((r) => `${r.status} ${r.method} ${r.pathname}`),
    ),
  );

  probes.push(
    probe('no-duplicate-mutations', rec.duplicates.length === 0, rec.duplicates.slice(0, 3)),
  );

  // -- rendered DOM ----------------------------------------------------------
  const textEntries = baselineEntries(baseline, cell.route, 'text');
  const garbage = findings.garbage
    .filter((g) => !isWaived(textEntries, { text: g.text }))
    .map((g) => ({ ...g, text: redact(g.text, 120) }));
  probes.push(probe('no-garbage-text', garbage.length === 0, garbage));
  // Report-only: bare "undefined" is legitimate prose on /content/[id]/chat, where the AI
  // tutor explains JavaScript. Counted so a real regression is still visible to a human.
  if (findings.garbageSoft.length) {
    probes.push(
      probe(
        'garbage-text-soft',
        true,
        {
          note: 'report-only: bare "undefined" in rendered text; never fails a cell',
          count: findings.garbageSoft.length,
          hits: findings.garbageSoft.map((g) => ({ ...g, text: redact(g.text, 120) })),
        },
        true,
      ),
    );
  }

  // apps/admin has NO i18n, so it has no message keys to leak — and judging it against
  // apps/web's namespaces produced pure noise: the audit log at app/(admin)/audit/page.tsx
  // renders an action such as `content.delete` or `tenant.patch` as the SOLE text of a
  // <span>, and `content` and `tenant` are both real web namespaces. The `text !== match`
  // guard cannot save it, because on that page text IS the match. Web-only, permanently.
  if (cell.app === 'web') {
    const i18nKeys = findings.i18nKeys.filter((k) => !isWaived(textEntries, { text: k.key }));
    probes.push(probe('no-raw-i18n-keys', i18nKeys.length === 0, i18nKeys));
  }

  if (cell.variantSpec.locale === 'uz' && findings.apostrophe.length) {
    // REPORT-ONLY, and it must stay that way until the product picks a side. Counted on
    // 2026-08-24 across apps/web/messages/uz.json: 650 ASCII `o'`/`g'` against 4 of U+02BB.
    // The product's own convention IS the ASCII apostrophe, so enforcing U+02BB would have
    // failed nearly every uz cell on day one. The chrome/body split cannot rescue it either:
    // <Link> renders <a> and a quiz option renders <label>, so material titles and AI-written
    // answers land in "chrome" too. Making this a verdict is a typography decision, not a
    // sweep decision.
    probes.push(
      probe(
        'uz-apostrophe-count',
        true,
        {
          note: 'report-only: uz.json itself uses ASCII (650) over U+02BB (4); counted, never enforced',
          chromeish: findings.apostrophe.filter((a) => a.inChrome).length,
          elsewhere: findings.apostrophe.filter((a) => !a.inChrome).length,
          samples: findings.apostrophe.slice(0, 3).map((a) => ({ ...a, text: redact(a.text, 80) })),
        },
        true,
      ),
    );
  }

  probes.push(
    probe('images-loaded', findings.brokenImages.length === 0, findings.brokenImages.slice(0, 5).map((src) => redactUrl(src))),
  );
  probes.push(
    probe('no-horizontal-overflow', findings.overflow.offenders.length === 0, {
      scrollWidth: findings.overflow.scrollWidth,
      clientWidth: findings.overflow.clientWidth,
      offenders: findings.overflow.offenders,
    }),
  );

  // A guard cell legitimately renders only a "Loading…" placeholder mid-bounce.
  if (!guardCell) {
    probes.push(
      probe(
        'content-rendered',
        findings.mainTextLength >= MIN_RENDERED_TEXT,
        // The sample exists to answer "what rendered INSTEAD" on a blank page — a masked,
        // 80-char shape does that without quoting a real user table into the file.
        `main text length ${findings.mainTextLength}: ${JSON.stringify(redact(findings.mainTextSample))}`,
      ),
    );
  }

  if (cell.app === 'web') {
    const want = cell.variantSpec.locale;
    probes.push(probe('html-lang', findings.htmlLang === want, `html[lang]=${findings.htmlLang} want ${want}`));
  }

  const rawMath = findings.rawMath
    .filter((m) => !isWaived(textEntries, { text: m.text }))
    .map((m) => ({ ...m, text: redact(m.text, 120) }));
  probes.push(
    probe('katex-clean', findings.katexErrors === 0 && rawMath.length === 0, {
      katexErrors: findings.katexErrors,
      rawMath,
    }),
  );
  if (findings.mermaidTotal > 0) {
    probes.push(
      probe('mermaid-rendered', findings.mermaidMissing === 0, `${findings.mermaidMissing}/${findings.mermaidTotal} without <svg>`),
    );
  }

  probes.push(probe('layout-stability', findings.cls <= CLS_LIMIT, `CLS ${findings.cls} (limit ${CLS_LIMIT})`));
  probes.push(
    probe('no-long-task', findings.longestTask <= LONG_TASK_LIMIT_MS, `longest task ${findings.longestTask}ms`),
  );

  return probes;
}

// ---------------------------------------------------------------------------
// 12. Cell execution (normal pass + error-state sub-pass)
// ---------------------------------------------------------------------------
async function sweepCell(context, cell, baseline, namespaces) {
  const started = Date.now();
  const page = await context.newPage();
  page.setDefaultTimeout(CELL_BUDGET.evaluate);
  const rec = attachRecorders(page, CFG.api);

  try {
    await gotoAndSettle(page, cell.url, rec);
    if (cell.expectation !== 'ok') await waitForRedirect(page, cell.url);

    const findings = await evaluateFindings(page, {
      locale: cell.variantSpec.locale,
      // Empty for apps/admin: it has no i18n, so there is nothing for the key probe to find
      // there but false positives off apps/web's namespaces.
      namespaces: cell.app === 'web' ? namespaces : [],
    });
    const finalUrl = page.url();
    const probes = assembleProbes(cell, rec, findings, finalUrl, baseline);
    const failed = probes.filter((p) => !p.ok);

    let screenshot = null;
    if (cell.isPrimaryVariant || failed.length > 0) {
      const file = path.join(SHOTS_DIR, `${cell.cellId.replace(/[^a-zA-Z0-9._-]/g, '_')}.png`);
      // Viewport-sized, not fullPage: bounded file size, and every visual probe
      // (overflow, broken image, blank page) is a viewport-scoped claim anyway.
      await page.screenshot({ path: file }).catch(() => null);
      screenshot = path.relative(REPO, file);
    }

    // The ids substituted into this cell's URL identify the page's own resource, which is
    // how primaryApiFor breaks a same-millisecond tie against a layout-level fetch.
    const primary = primaryApiFor(rec, (cell.url.match(/[A-Za-z0-9_-]{16,}/g) ?? []));
    return {
      result: failed.length === 0 ? 'pass' : 'fail',
      finalUrl,
      durationMs: Date.now() - started,
      probes,
      failedProbes: failed.map((p) => p.id),
      screenshot,
      primaryApi: primary.pathname,
      primaryApiCandidates: primary.candidates,
    };
  } finally {
    await page.close().catch(() => null);
  }
}

/**
 * Error-state sub-pass: re-visit with the route's primary data GET aborted and assert the
 * page degrades honestly — an error affordance appears and no spinner spins forever. The
 * primary GET is the one OBSERVED during the normal pass, so this needs no hand-maintained
 * route→endpoint table and cannot drift.
 */
async function sweepErrorState(context, cell, primaryApi, namespaces, candidates = []) {
  const page = await context.newPage();
  page.setDefaultTimeout(ERROR_PASS_BUDGET.evaluate);
  const rec = attachRecorders(page, CFG.api);
  try {
    await page.route(
      (url) => {
        try {
          return url.href.startsWith(CFG.api) && url.pathname === primaryApi;
        } catch {
          return false;
        }
      },
      (route) => route.abort('failed'),
    );
    await gotoAndSettle(page, cell.url, rec, {
      gotoMs: ERROR_PASS_BUDGET.goto,
      capMs: ERROR_PASS_BUDGET.settle,
    });
    await sleep(ERROR_PASS_BUDGET.backoff); // let retry/backoff settle so an "immortal" spinner really is
    const findings = await evaluateFindings(
      page,
      { locale: cell.variantSpec.locale, namespaces: cell.app === 'web' ? namespaces : [] },
      ERROR_PASS_BUDGET.evaluate,
    );
    const probes = [
      probe('error-affordance', findings.errorAffordance, `aborted GET ${primaryApi}`),
      probe(
        'no-immortal-spinner',
        !(findings.spinners > 0 || (findings.spinnerText && !findings.errorAffordance)),
        `spinners=${findings.spinners} loadingText=${findings.spinnerText}`,
      ),
    ];
    return {
      abortedApi: primaryApi,
      // Kept on PASS as well: the verdict is only readable if you can see which GET was
      // chosen and what it was chosen over.
      abortedApiChosenFrom: candidates,
      probes,
      failedProbes: probes.filter((p) => !p.ok).map((p) => p.id),
    };
  } finally {
    await page.close().catch(() => null);
  }
}

// ---------------------------------------------------------------------------
// 13. Durable coverage state
// ---------------------------------------------------------------------------
function loadState() {
  try {
    const parsed = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    return { cells: parsed.cells ?? {}, runs: parsed.runs ?? [] };
  } catch {
    return { cells: {}, runs: [] };
  }
}

function mergeState(previous, { runId, at, cells, verdicts, enumeratedIds }) {
  const merged = { ...previous.cells };
  for (const cell of cells) {
    const verdict = verdicts.get(cell.cellId);
    // Everything the LLM agent writes onto a cell survives. The old version rebuilt each
    // entry from a whitelist that named only depthVerifiedAt, so `issue`, `notes`,
    // `waivedUntil` and `owner` were destroyed by the next sweep — the agent's memory was
    // being erased by the machine that is supposed to feed it.
    const { retiredAt, ...prior } = merged[cell.cellId] ?? {};
    merged[cell.cellId] = {
      ...prior,
      cellId: cell.cellId,
      route: cell.route,
      role: cell.role,
      variant: cell.variant,
      app: cell.app,
      expectation: cell.expectation,
      firstSeenAt: prior.firstSeenAt ?? at,
      lastSweptAt: at,
      lastResult: verdict?.result ?? 'error',
      lastFailedProbes: verdict?.failedProbes ?? [],
      sweepCount: (prior.sweepCount ?? 0) + 1,
      depthVerifiedAt: prior.depthVerifiedAt ?? null,
      status: 'active', // a re-enumerated cell is back, so `retiredAt` above is dropped
    };
  }
  // Only a full sweep is entitled to declare a cell gone: a filtered run never looked.
  let retiredNow = 0;
  if (IS_FULL_SWEEP) {
    for (const [id, entry] of Object.entries(merged)) {
      if (!enumeratedIds.has(id) && entry.status !== 'retired') {
        merged[id] = { ...entry, status: 'retired', retiredAt: at };
        retiredNow += 1;
      }
    }
  }
  const failures = [...verdicts.values()].filter((v) => v.result !== 'pass').length;
  const runs = [...previous.runs, { runId, at, cells: cells.length, failures }];
  return { cells: merged, runs: runs.slice(-20), retiredNow };
}

/** Rename is atomic, so a reader never sees a half-written queue — or an empty one. */
function writeJsonAtomic(file, value) {
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(tmp, file);
}

const LOCK_STALE_MS = 10 * 60_000;
const LOCK_WAIT_MS = 60_000;

/**
 * The coverage state is a read-modify-write, and this system is designed to run continuously:
 * a 40-minute full sweep and a two-minute `--only` run overlap routinely, and the one that
 * finished second used to write a state it had read before the first one existed — silently
 * discarding a whole sweep's progress. Hold a lock for the read-merge-write, and re-read
 * inside it.
 */
async function withStateLock(fn) {
  fs.mkdirSync(QA_DIR, { recursive: true });
  const deadline = Date.now() + LOCK_WAIT_MS;
  let fd = null;
  while (fd === null) {
    try {
      fd = fs.openSync(STATE_LOCK, 'wx');
    } catch (err) {
      if (err?.code !== 'EEXIST') throw err;
      let ageMs = LOCK_STALE_MS + 1;
      try {
        ageMs = Date.now() - fs.statSync(STATE_LOCK).mtimeMs;
      } catch {
        /* vanished between open and stat — just retry */
      }
      // A run killed mid-write must not wedge every later run.
      if (ageMs > LOCK_STALE_MS) {
        fs.rmSync(STATE_LOCK, { force: true });
        continue;
      }
      if (Date.now() > deadline) {
        throw new Error(`coverage state locked for >${LOCK_WAIT_MS}ms by another sweep (${STATE_LOCK})`);
      }
      await sleep(250);
    }
  }
  try {
    fs.writeSync(fd, `${JSON.stringify({ pid: process.pid, at: new Date().toISOString() })}\n`);
    return await fn();
  } finally {
    try {
      fs.closeSync(fd);
    } catch {
      /* already closed */
    }
    fs.rmSync(STATE_LOCK, { force: true });
  }
}

// ---------------------------------------------------------------------------
// 14. Main
// ---------------------------------------------------------------------------
/**
 * Identity gate. A sweep is only meaningful if the thing at :3000 IS apps/web — and on
 * 2026-08-24 a full sweep ran against an entirely different project that happened to occupy
 * that port, found "product bugs" everywhere and still exited 0. Ports are not identity.
 *
 * A weak marker is no better: the impostor on :3000 was ALSO a Next.js app with an i18n
 * `[locale]` segment serving `<html lang="uz-UZ">`. So each app must answer a Talim-specific
 * route AND carry at least two Talim-specific content markers. `Talim AI` in a <title> is not
 * something another project renders by accident.
 */
const IDENTITY_TIMEOUT_MS = 8000;

async function fetchPage(url) {
  try {
    const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(IDENTITY_TIMEOUT_MS) });
    const body = await res.text();
    return { status: res.status, finalUrl: res.url || url, body: body.slice(0, 400_000) };
  } catch (err) {
    return { status: 0, finalUrl: url, body: '', error: String(err?.message ?? err) };
  }
}

/**
 * A copy marker taken from apps/web's own uz messages, so it can never drift out of sync with
 * the product: next-intl ships the whole message catalogue into the page, so any /uz/* page of
 * apps/web contains it. Only ASCII values without quotes are eligible — HTML escaping would
 * turn `oʻqish` or `yo'q` into something the raw-body match would miss.
 */
function uzCopyMarker() {
  try {
    const messages = JSON.parse(fs.readFileSync(path.join(MESSAGES_DIR, 'uz.json'), 'utf8'));
    for (const key of ['auth.welcomeBack', 'auth.signIn', 'common.appName', 'landing.hero.title']) {
      const value = key.split('.').reduce((node, seg) => (node == null ? node : node[seg]), messages);
      if (typeof value === 'string' && value.length >= 8 && /^[\x20-\x7E]+$/.test(value) && !/['"&<>]/.test(value)) {
        return value;
      }
    }
  } catch {
    /* messages unreadable — the title marker below still has to match */
  }
  return null;
}

/**
 * The other markers are each app's own `metadata` strings, read from its layout at run start
 * for the same reason: a hardcoded "Talim AI" here would rot into a false IDENTITY FAILED the
 * day someone renames the product, and a gate that cries wolf gets deleted.
 */
function metadataString(layoutFile, field, fallback) {
  try {
    const source = fs.readFileSync(layoutFile, 'utf8');
    const match = source.match(new RegExp(`metadata[^=]*=\\s*{[\\s\\S]*?${field}:\\s*['"\`]([^'"\`]+)['"\`]`));
    if (match) return match[1];
  } catch {
    /* layout unreadable — fall back to the known brand string */
  }
  return fallback;
}

function identityVerdict({ name, base, probePath, page, expectPathPrefix, langRe, contentMarkers }) {
  const problems = [];
  if (page.status !== 200) {
    problems.push(`GET ${base}${probePath} returned ${page.status}${page.error ? ` (${page.error})` : ''}`);
  }
  let finalPath = page.finalUrl;
  try {
    finalPath = new URL(page.finalUrl).pathname;
  } catch {
    /* keep the raw value for the message */
  }
  if (!finalPath.startsWith(expectPathPrefix)) {
    problems.push(`${probePath} landed on ${finalPath}, expected a path under ${expectPathPrefix}`);
  }
  if (!langRe.test(page.body)) problems.push(`no ${langRe} in the served HTML`);
  const matched = contentMarkers.filter((m) => page.body.includes(m));
  for (const marker of contentMarkers.filter((m) => !matched.includes(m))) {
    problems.push(`Talim marker ${JSON.stringify(marker)} absent from the served HTML`);
  }
  return { name, base, probePath, matched, problems };
}

async function assertApiIdentity() {
  const health = await apiFetch('/health', { timeoutMs: 5000 });
  const problems = [];
  if (health.status !== 200) {
    problems.push(
      `GET ${CFG.api}/health returned ${health.status}${health.error ? ` (${health.error})` : ''}`,
    );
  } else if (health.body?.status !== 'ok') {
    problems.push(`GET ${CFG.api}/health answered ${JSON.stringify(health.body)}, expected {"status":"ok"}`);
  }
  // Talim mounts its routes at ROOT with no /api prefix, and guards them: an unauthenticated
  // GET must be REJECTED, not 404'd. A 404 means these routes do not exist here.
  const guarded = [];
  for (const route of ['/learner/materials', '/tenant/students']) {
    const { status } = await apiFetch(route, { timeoutMs: 5000 });
    if (status === 401 || status === 403) guarded.push(route);
  }
  if (!guarded.length) {
    problems.push(`neither /learner/materials nor /tenant/students is a guarded Talim route on ${CFG.api}`);
  }
  return { name: 'api', base: CFG.api, probePath: '/health', matched: guarded, problems };
}

/** `apps` = the apps this run actually sweeps; a web-only run must not die because :3001 is down. */
async function preflight(apps) {
  const uzMarker = uzCopyMarker();
  const [api, webPage, adminPage] = await Promise.all([
    assertApiIdentity(),
    apps.has('web') ? fetchPage(`${CFG.web}/uz/login`) : null,
    apps.has('admin') ? fetchPage(`${CFG.admin}/login`) : null,
  ]);

  const reports = [
    api,
    webPage &&
      identityVerdict({
        name: 'web',
        base: CFG.web,
        probePath: '/uz/login',
        page: webPage,
        // apps/web keeps the [locale] segment in the URL; a host that strips it is not it.
        expectPathPrefix: '/uz/',
        langRe: /<html[^>]*\slang="uz"/,
        contentMarkers: [
          metadataString(path.join(WEB_APP_DIR, '[locale]', 'layout.tsx'), 'title', 'Talim AI'),
          ...(uzMarker ? [uzMarker] : []),
        ],
      }),
    adminPage &&
      identityVerdict({
        name: 'admin',
        base: CFG.admin,
        probePath: '/login',
        page: adminPage,
        expectPathPrefix: '/login',
        langRe: /<html[^>]*\slang="en"/,
        contentMarkers: [
          metadataString(path.join(ADMIN_APP_DIR, 'layout.tsx'), 'title', 'Talim Admin'),
          metadataString(path.join(ADMIN_APP_DIR, 'layout.tsx'), 'description', 'Talim AI platform administration'),
        ],
      }),
  ].filter(Boolean);

  const broken = reports.filter((r) => r.problems.length);
  if (broken.length) {
    console.error('\nqa-sweep: IDENTITY GATE FAILED — refusing to sweep an unknown stack.');
    for (const report of broken) {
      console.error(`  ${report.name} (${report.base}):`);
      for (const problem of report.problems) console.error(`    - ${problem}`);
    }
    console.error(
      '  The sweep reuses the running dev stack and never starts servers. Verdicts about the\n' +
        '  wrong app are worse than no verdicts, so this is fatal. Start the real stack\n' +
        '  (pnpm dev:all) or point the sweep at it with --base-web / --base-admin / --base-api.\n',
    );
    process.exit(1);
  }
  return reports.map((r) => ({ app: r.name, base: r.base, verifiedVia: r.probePath, markers: r.matched }));
}

function playwrightCacheDir() {
  if (process.env.PLAYWRIGHT_BROWSERS_PATH) return process.env.PLAYWRIGHT_BROWSERS_PATH;
  const home = os.homedir();
  if (process.platform === 'darwin') return path.join(home, 'Library', 'Caches', 'ms-playwright');
  if (process.platform === 'win32') return path.join(home, 'AppData', 'Local', 'ms-playwright');
  return path.join(home, '.cache', 'ms-playwright');
}

const CHROMIUM_EXE_NAMES = new Set([
  'chrome',
  'chrome.exe',
  'Chromium',
  'Google Chrome for Testing',
  'headless_shell',
]);

function findExecutable(dir, depth = 0) {
  if (depth > 6) return null;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return null;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isFile() && CHROMIUM_EXE_NAMES.has(entry.name)) return full;
    if (entry.isDirectory()) {
      const hit = findExecutable(full, depth + 1);
      if (hit) return hit;
    }
  }
  return null;
}

/** Newest `chromium-<build>` in the Playwright cache, whatever its on-disk layout is. */
function findCachedChromium() {
  const root = playwrightCacheDir();
  let dirs;
  try {
    dirs = fs.readdirSync(root).filter((d) => /^chromium-\d+$/.test(d));
  } catch {
    return null;
  }
  dirs.sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]));
  for (const dir of dirs) {
    const executablePath = findExecutable(path.join(root, dir));
    if (executablePath) return { build: dir, executablePath };
  }
  return null;
}

/**
 * apps/web pins Playwright to one browser build, but the machine's ms-playwright cache is
 * shared with (and usually newer than) whatever Playwright MCP installed — so the pinned
 * build is frequently absent and `chromium.launch()` dies with "Executable doesn't exist".
 * An unattended sweep must not fail on that: fall back to the newest cached build, then to
 * the system Chrome, and only give up (loudly, with the fix command) if none of them work.
 */
async function launchBrowser() {
  const cached = findCachedChromium();
  const attempts = [
    { label: 'pinned Playwright build', options: {} },
    ...(cached ? [{ label: `cached ${cached.build}`, options: { executablePath: cached.executablePath } }] : []),
    { label: 'system Google Chrome', options: { channel: 'chrome' } },
  ];
  const failures = [];
  for (const [i, attempt] of attempts.entries()) {
    try {
      const browser = await chromium.launch({ headless: !CFG.headed, ...attempt.options });
      if (i > 0) console.warn(`qa-sweep: WARN pinned browser missing — using ${attempt.label}`);
      return browser;
    } catch (err) {
      failures.push(`${attempt.label}: ${String(err?.message ?? err).split('\n')[0]}`);
    }
  }
  throw new Error(
    `no usable Chromium. Tried:\n  - ${failures.join('\n  - ')}\n` +
      '  fix: pnpm --filter @talim/web exec playwright install chromium',
  );
}

function loadNamespaces() {
  const namespaces = new Set();
  for (const locale of ['uz', 'en', 'ru']) {
    try {
      const messages = JSON.parse(fs.readFileSync(path.join(MESSAGES_DIR, `${locale}.json`), 'utf8'));
      for (const key of Object.keys(messages)) namespaces.add(key);
    } catch {
      /* a missing message file is apps/web's problem, not the sweep's */
    }
  }
  return [...namespaces];
}

function printSummary(summary) {
  const { total, pass, fail, error, byProbe, newCells, retiredCells, durationMs, verdictsFile, coverage } = summary;
  console.log('\n─── qa-sweep summary ───────────────────────────────────────────');
  console.log(`coverage      ${coverage}`);
  console.log(`cells swept   ${total}  (pass ${pass} · fail ${fail} · error ${error})`);
  console.log(`wall clock    ${(durationMs / 1000).toFixed(1)}s`);
  const ranked = Object.entries(byProbe).sort((a, b) => b[1] - a[1]);
  if (ranked.length) {
    console.log('failures by probe:');
    for (const [id, n] of ranked) console.log(`  ${String(n).padStart(4)}  ${id}`);
  } else {
    console.log('failures by probe: none');
  }
  console.log(`new cells     ${newCells}   (never swept before this run)`);
  console.log(`retired now   ${retiredCells} (route vanished from the tree)`);
  console.log(`verdicts      ${path.relative(REPO, verdictsFile)}`);
  console.log(`state         ${path.relative(REPO, STATE_FILE)}`);
  console.log('────────────────────────────────────────────────────────────────');
}

/**
 * Did this run measure the PRODUCT, or measure a broken environment? A dev server that fell
 * over mid-sweep renders every remaining cell blank, and a verdicts file with 180 fresh
 * `content-rendered` failures is not 180 findings — it is one, and it is not a product bug.
 * Say so, loudly, and exit non-zero instead of handing the agent a fabricated backlog.
 */
function integrityCheck(list) {
  const broken = list.filter(
    (v) => (v.failedProbes ?? []).some((id) => id === 'content-rendered' || id === 'cell-crashed'),
  );
  const share = list.length ? broken.length / list.length : 0;
  const tripped = list.length >= INTEGRITY_MIN_CELLS && share > INTEGRITY_FAIL_SHARE;
  return { broken: broken.length, share: Math.round(share * 1000) / 1000, tripped };
}

async function main() {
  const startedAt = Date.now();
  const runId = new Date(startedAt).toISOString().replace(/[:.]/g, '-');
  const routes = enumerateRoutes();
  let cells = buildCells(routes);

  if (CFG.list) {
    // Pure enumeration: no stack, no browser. Lets the orchestrator verify the coverage
    // model (and any --only/--role filter) without a running dev environment.
    console.log(`routes: ${routes.length} (web ${routes.filter((r) => r.app === 'web').length}, admin ${routes.filter((r) => r.app === 'admin').length})`);
    for (const route of routes) console.log(`  ${route.app.padEnd(5)} ${route.pattern}`);
    console.log(`\ncells: ${cells.length}`);
    for (const cell of cells) console.log(`  ${cell.expectation.padEnd(12)} ${cell.cellId}`);
    if (!cells.length) {
      console.error('qa-sweep: no cells — the filters select nothing (see --help).');
      process.exit(2);
    }
    return;
  }

  // Zero cells is a broken invocation, never a clean run. Sweeping nothing used to print an
  // all-green summary and overwrite the verdicts file with it — the loudest possible lie.
  if (!cells.length) {
    console.error(
      'qa-sweep: no cells to sweep — the route walk or the --only/--role/--variant filters\n' +
        `           selected nothing (routes enumerated: ${routes.length}). Refusing to write an\n` +
        '           empty all-green verdicts file. Check the filters with --list.',
    );
    process.exit(2);
  }

  const identity = await preflight(new Set(cells.map((c) => c.app)));
  fs.mkdirSync(SHOTS_DIR, { recursive: true });

  const baseline = loadBaseline();
  const namespaces = loadNamespaces();
  const previousState = loadState();
  const enumeratedIds = new Set(cells.map((c) => c.cellId));

  // Sessions: one HTTP login per role, then injected as localStorage. Logging in through
  // the form on every cell is what made the old runbook need a whole login-stall section.
  const sessions = {};
  const sessionErrors = {};
  for (const role of ALL_ROLES) {
    if (role === ANON) continue;
    if (CFG.roles && !CFG.roles.includes(role)) continue;
    if (!cells.some((c) => c.role === role)) continue;
    const result = await login(role);
    if (result.ok) sessions[role] = result;
    else sessionErrors[role] = result.reason;
  }
  for (const [role, reason] of Object.entries(sessionErrors)) {
    console.warn(`qa-sweep: WARN session unavailable for ${role} — ${reason}`);
  }

  const bags = {};
  for (const [role, session] of Object.entries(sessions)) {
    bags[role] = await resolveIdBag(role, session);
  }

  // Continuous-QA ordering: with --max-cells, never-swept cells come first, then the
  // stalest. That is what makes repeated bounded runs converge on full coverage. The
  // selection is by staleness; the ORDER it is then swept in is by context key, or every
  // cell would pay for a fresh browser context (see groupForContextReuse).
  if (CFG.maxCells) {
    const lastSwept = (cell) => previousState.cells[cell.cellId]?.lastSweptAt ?? '';
    cells = [...cells].sort((a, b) => lastSwept(a).localeCompare(lastSwept(b)));
    cells = groupForContextReuse(cells.slice(0, CFG.maxCells));
  }

  // A filtered run gets its OWN file. Sharing one meant that after `--only=...`, the agent
  // read the verdicts, saw no failures for the other 250 cells, and concluded they were
  // clean — they had simply not been visited. Absence must never read as evidence.
  const verdictsFile = IS_FULL_SWEEP ? VERDICTS_FILE : FILTERED_VERDICTS_FILE;
  const coverageOf = (visited) =>
    IS_FULL_SWEEP
      ? `full — all ${visited} enumerated route × role × variant cells were visited this run`
      : `PARTIAL — only the ${visited} cell(s) listed here were visited; every other cell is UNKNOWN, not passing`;

  const browser = await launchBrowser();
  const verdicts = new Map();
  const byProbe = {};
  let context = null;
  let contextKey = null;
  let cellsInContext = 0;
  let index = 0;
  let aborted = null;

  const closeContext = async () => {
    if (context) await context.close().catch(() => null);
    context = null;
    contextKey = null;
    cellsInContext = 0;
  };

  const buildVerdictsPayload = ({ status, finishedAt, integrity }) => {
    const list = [...verdicts.values()];
    return {
      _doc:
        'Per-cell probe verdicts from scripts/qa-sweep.mjs. Input to the LLM triage queue. ' +
        'Regenerated every run — do not hand-edit. Gitignored: it quotes rendered page text.',
      status,
      coverage: coverageOf(list.length),
      runId,
      startedAt: new Date(startedAt).toISOString(),
      finishedAt: finishedAt ? new Date(finishedAt).toISOString() : null,
      durationMs: (finishedAt ?? Date.now()) - startedAt,
      fullSweep: IS_FULL_SWEEP,
      aborted: aborted ? plain(aborted?.message ?? aborted) : null,
      identity,
      integrity,
      baseUrls: { web: CFG.web, admin: CFG.admin, api: CFG.api },
      filters: { only: CFG.only, roles: CFG.roles, variants: CFG.variants, maxCells: CFG.maxCells },
      sessionErrors,
      idBags: bags,
      routes: {
        count: routes.length,
        patterns: routes.map((r) => ({ app: r.app, pattern: r.pattern, source: r.source })),
      },
      totals: {
        cells: list.length,
        planned: cells.length,
        pass: list.filter((v) => v.result === 'pass').length,
        fail: list.filter((v) => v.result === 'fail').length,
        error: list.filter((v) => v.result === 'error').length,
        newCells: cells.filter((c) => !previousState.cells[c.cellId]).length,
      },
      failuresByProbe: byProbe,
      cells: list,
    };
  };

  try {
    for (const cell of cells) {
      index += 1;
      const label = `[${String(index).padStart(3, '0')}/${cells.length}] ${cell.cellId}`;
      // `variantSpec` is run config, not a verdict field — keep it out of what we record.
      const base = { ...cell, variantSpec: undefined, url: null };

      const session = cell.role === ANON ? null : sessions[cell.role];
      if (cell.role !== ANON && !session) {
        const verdict = {
          ...base,
          result: 'fail',
          probes: [probe('session-available', false, sessionErrors[cell.role] ?? 'no session')],
          failedProbes: ['session-available'],
        };
        verdicts.set(cell.cellId, verdict);
        byProbe['session-available'] = (byProbe['session-available'] ?? 0) + 1;
        console.log(`${label}  FAIL session-available`);
        continue;
      }

      const built = buildUrl(cell, bags);
      if (!built.ok) {
        const verdict = {
          ...base,
          result: 'fail',
          probes: [probe('params-resolved', false, built.reason)],
          failedProbes: ['params-resolved'],
        };
        verdicts.set(cell.cellId, verdict);
        byProbe['params-resolved'] = (byProbe['params-resolved'] ?? 0) + 1;
        console.log(`${label}  FAIL params-resolved — ${built.reason}`);
        continue;
      }
      const active = { ...cell, url: built.url };
      const record = { ...base, url: built.url };

      let verdict;
      try {
        // Context setup lives INSIDE the guard: when a newContext()/addInitScript() throw
        // escaped it, the whole process died before anything was written, discarding every
        // cell already swept. A browser problem is a red cell like any other.
        // One context per (app, role, variant): viewport / colorScheme / locale are context
        // options, and the session blob is origin-scoped. Recycled every N cells to bound RSS.
        const key = `${cell.app}|${cell.role}|${cell.variant}`;
        if (key !== contextKey || cellsInContext >= CFG.recycleEvery) {
          await closeContext();
          const spec = cell.variantSpec;
          context = await browser.newContext({
            viewport: { width: spec.width, height: spec.height },
            colorScheme: spec.colorScheme,
            locale: cell.app === 'web' ? spec.locale : 'en-US',
            isMobile: spec.width < 500,
            hasTouch: spec.width < 500,
            ignoreHTTPSErrors: true,
          });
          await context.addInitScript(installCollectors, {
            storageKey: cell.app === 'web' ? 'talim-auth' : 'talim-admin-auth',
            blob: session ? JSON.stringify({ state: { user: session.user, token: session.token }, version: 0 }) : null,
          });
          contextKey = key;
          cellsInContext = 0;
        }
        cellsInContext += 1;

        const outcome = await withTimeout(
          sweepCell(context, active, baseline, namespaces),
          CFG.cellTimeout,
          `cell ${cell.cellId}`,
        );
        verdict = { ...record, ...outcome };

        if (CFG.errorPass && cell.expectation === 'ok' && cell.isPrimaryVariant) {
          if (outcome.primaryApi) {
            try {
              verdict.errorPass = await withTimeout(
                sweepErrorState(context, active, outcome.primaryApi, namespaces, outcome.primaryApiCandidates),
                CFG.cellTimeout,
                `error-pass ${cell.cellId}`,
              );
            } catch (err) {
              verdict.errorPass = { result: 'error', error: plain(err?.message ?? err), failedProbes: ['error-pass-crashed'] };
            }
            const epFailed = verdict.errorPass.failedProbes ?? [];
            for (const id of epFailed) {
              byProbe[id] = (byProbe[id] ?? 0) + 1;
            }
            if (epFailed.length) {
              verdict.result = 'fail';
              // Surface them on the cell too. Marking the cell failed while leaving
              // failedProbes empty produced a verdict that said "this failed" and
              // "nothing failed" at once — the reader has no thread to pull.
              verdict.failedProbes = [...(verdict.failedProbes ?? []), ...epFailed.map((id) => `errorPass:${id}`)];
            }
          } else {
            verdict.errorPass = { skipped: 'no-data-dependency-observed' };
          }
        }
      } catch (err) {
        // One cell crashing must never end the sweep — record it red and move on.
        verdict = {
          ...record,
          result: 'error',
          error: plain(err?.message ?? err),
          stack: plain(err?.stack).slice(0, 1500),
          probes: [],
          failedProbes: ['cell-crashed'],
        };
        byProbe['cell-crashed'] = (byProbe['cell-crashed'] ?? 0) + 1;
        await closeContext(); // a crashed context is not reusable
      }

      for (const id of verdict.failedProbes ?? []) {
        if (id === 'cell-crashed') continue;
        byProbe[id] = (byProbe[id] ?? 0) + 1;
      }
      verdicts.set(cell.cellId, verdict);
      const tag = verdict.result === 'pass' ? 'ok  ' : verdict.result === 'fail' ? 'FAIL' : 'ERR ';
      const detail = verdict.result === 'pass' ? '' : ` ${(verdict.failedProbes ?? []).join(',')}`;
      console.log(`${label}  ${tag} ${((verdict.durationMs ?? 0) / 1000).toFixed(1)}s${detail}`);

      // Checkpoint: a full sweep runs for the better part of an hour and the overnight
      // runner will kill it on its own timeout. Everything swept up to that point is real
      // evidence and should survive being killed — the file is stamped `in-progress` so a
      // reader can never mistake a truncated run for a complete one.
      if (index % CHECKPOINT_EVERY === 0) {
        writeJsonAtomic(verdictsFile, buildVerdictsPayload({ status: 'in-progress', finishedAt: null, integrity: null }));
      }
    }
  } catch (err) {
    // Caught, not thrown: whatever escaped the loop, the cells already swept are real work
    // and are written below. An abnormal exit used to discard the lot. Re-raised at the end.
    aborted = err;
  } finally {
    await closeContext();
    await browser.close().catch(() => null);
  }

  const finishedAt = Date.now();
  const at = new Date(finishedAt).toISOString();
  const list = [...verdicts.values()];
  const pass = list.filter((v) => v.result === 'pass').length;
  const fail = list.filter((v) => v.result === 'fail').length;
  const error = list.filter((v) => v.result === 'error').length;
  const newCells = cells.filter((c) => !previousState.cells[c.cellId]).length;
  const integrity = integrityCheck(list);
  const coverage = coverageOf(list.length);

  writeJsonAtomic(
    verdictsFile,
    buildVerdictsPayload({ status: aborted ? 'aborted' : 'complete', finishedAt, integrity }),
  );

  const state = await withStateLock(async () => {
    // Re-read INSIDE the lock: a short --only run may have started after this sweep did and
    // finished before it, and its progress must survive this write.
    const current = loadState();
    const merged = mergeState(current, { runId, at, cells, verdicts, enumeratedIds });
    writeJsonAtomic(STATE_FILE, {
      _doc:
        'Durable continuous-QA queue. One entry per route×role×variant cell, merged across runs. ' +
        'lastSweptAt/lastResult/sweepCount/status are owned by scripts/qa-sweep.mjs; every OTHER ' +
        'field (depthVerifiedAt, issue, notes, owner, …) belongs to the LLM QA agent and is ' +
        'preserved untouched. Only a FULL sweep retires cells. This file IS committed, so keep ' +
        'rendered page text out of it — probe IDs and timestamps only.',
      updatedAt: at,
      runs: merged.runs,
      cells: merged.cells,
    });
    return merged;
  });

  printSummary({
    total: list.length,
    pass,
    fail,
    error,
    byProbe,
    newCells,
    retiredCells: state.retiredNow,
    durationMs: finishedAt - startedAt,
    verdictsFile,
    coverage,
  });

  if (aborted) throw aborted;
  if (integrity.tripped) {
    console.error(
      `\nqa-sweep: SWEEP INTEGRITY FAILED — ${integrity.broken}/${list.length} cells came back blank or\n` +
        `          crashed (${Math.round(integrity.share * 100)}%, limit ${Math.round(INTEGRITY_FAIL_SHARE * 100)}%).\n` +
        '          Treat this as a broken environment, not as product findings: check the dev\n' +
        '          servers, the database seed and the QA accounts before triaging anything here.',
    );
    process.exit(1);
  }
}

main().catch((err) => {
  // Only a failure of the sweep ITSELF gets a non-zero exit; findings never do.
  console.error(`qa-sweep: fatal — ${plain(err?.stack ?? err)}`);
  process.exit(1);
});
