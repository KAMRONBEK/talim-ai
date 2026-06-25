# Overnight Visual QA Runbook — Talim AI

You are **Claude Code running UNATTENDED overnight**. Goal: visually QA every page of
the platform across all roles and locales with a **real browser** (Playwright MCP),
**fix clear bugs**, and produce a report. Work safely on a branch.

## HARD RULES (never break)
- **Branch only.** You are on `claude/visual-qa`. Commit only here. NEVER `git checkout main`,
  NEVER `git push`, NEVER deploy. (Pushing `main` auto-deploys to prod — forbidden.)
- **Local only.** Test `http://localhost:3000` (web) and `http://localhost:3001` (admin).
  NEVER touch prod (`talim-ai.uz`). Don't create data on prod.
- **Fix discipline.** Fix only **clear, low-risk** bugs: raw i18n keys, layout overflow /
  horizontal scroll, cut-off/overlapping text, broken images/icons, console errors, broken
  links, 404/500, obviously broken empty states, theme (light/dark) breakage. Anything
  **ambiguous, subjective, or structural → LOG IT, do not fix.**
- **Verify before every commit:** `pnpm --filter @talim/types build && pnpm --filter @talim/web typecheck && pnpm --filter @talim/admin typecheck` must pass; re-screenshot the fixed page to confirm. Commit small, one logical fix per commit.
- **Budget/stop:** stop when pages are covered, budget is near the cap, or you hit a
  destructive/uncertain change. Always finish by writing the report + a summary.

## 0. Bring up the local stack
Run `pnpm dev:all` in the background (docker infra → migrate → seed → dev). Wait until all are up:
- `curl -s localhost:4000/health` → `{"status":"ok"}`
- `curl -s -o /dev/null -w "%{http_code}" localhost:3000` → 200
- `curl -s -o /dev/null -w "%{http_code}" localhost:3001` → 200
If something is already running on those ports, verify health and reuse it.

## 1. Test accounts (create if missing; record in the report)
- ADMIN: `pnpm create-admin --email qa-admin@talim.local --password QaAdmin-12345`
- TENANT_OWNER: `pnpm create-tenant-owner` (or reuse a seeded owner). Note the org **join code**.
- TENANT_LEARNER: register at `/uz/register` with the join code (or use a seeded student).
- INDIVIDUAL: register a fresh account at `/uz/register`.
- If a seed already provides these, reuse them. As INDIVIDUAL/OWNER, upload one small PDF and
  add one YouTube link so the content **workspace** has material to QA.

## 2. Page matrix (default locale `uz`; spot-check `en` + `ru` on 3-4 key pages)
For each role: log in via Playwright (navigate `/uz/login`, fill, submit), then visit each page.
- **Auth:** `/uz/login`, `/uz/register`
- **INDIVIDUAL:** `/uz/dashboard`, `/uz/dashboard/settings`, the **content workspace**
  `/uz/content/<id>` for BOTH a YouTube and a PDF material (verify the new 3-pane workspace:
  source stays in center, Learn + Chat tabs, Material/Summary toggle, resizable divider,
  select-text/marquee → Chat with excerpt), `/uz/quiz/<id>`, marketing `/uz`.
- **TENANT_OWNER:** `/uz/tenant/dashboard`, `/uz/tenant/materials`, `…/materials/<id>/assign`,
  `…/students`, `…/students/<id>`, `…/progress`, `…/assessments`, `…/billing`, `…/settings`,
  plus the content workspace (verify the owner "assign / re-read / delete" footer in Learn tab).
- **TENANT_LEARNER:** `/uz/learner/dashboard`, `…/progress`, `…/assessments`, `…/settings`,
  plus an **assigned** content workspace — verify **NO generate buttons / no upload** appear.
- **ADMIN (localhost:3001):** `/login`, `/dashboard`, `/tutor-requests`, `/users`, `/users/<id>`,
  `/tenants`, `/tenants/<id>`, `/content`, `/generated`, `/subscriptions`, `/usage`, `/audit`.

For EACH page:
1. `browser_take_screenshot` full page at desktop width (~1440), then resize to ~390 and screenshot **mobile**.
2. `browser_console_messages` → record any errors/warnings.
3. Toggle the **theme** (light/dark) on one representative page per area and confirm both render.
4. Look for: raw i18n keys (e.g. `content.foo`), horizontal overflow, clipped/overlapping text,
   broken images/icons, 404/500, broken nav/links, broken empty states, and that the **new
   workspace** renders for video / PDF / text.

## 3. Per finding
Record `{page, role, locale, severity (high/med/low), screenshot, description}`. If clear+low-risk:
find the component (Grep), fix, let dev hot-reload, re-navigate, re-screenshot, confirm fixed,
commit. If ambiguous/risky: LOG only (note the suspected file).

## 4. Report
Write `docs/qa/visual-qa-report.md`: a findings table (page / role / locale / severity /
status = fixed|logged / file) + a short summary. Save screenshots under `/tmp/talim-qa/` and
reference them; commit the report.

## 5. Finalize
Run the full verify (types build + web typecheck + admin typecheck + a web build). If green,
ensure all fixes + the report are committed to `claude/visual-qa`. **Do not push.** End with a
plain-language summary: pages checked, bugs fixed (with commits), and issues logged for human review.
