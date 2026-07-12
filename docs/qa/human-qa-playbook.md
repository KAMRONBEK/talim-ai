# Talim AI — Human QA Playbook

> **What this is.** The encyclopedic "how a skilled human tester actually tests" reference
> that `docs/qa/overnight-visual-qa.md` cites. The runbook decides *what* to test (charter
> selection off `coverage-map.md`); this playbook is *how* — the personas you wear, the tour
> lenses you rotate, the minute-detail checks per page, the literal attack strings, the
> behaviour-simulation recipes mapped to exact Playwright MCP tool calls, and the oracles
> (AI-output grading, Uzbek-language rubric, screenshot visual judgment) you apply before any
> finding is allowed to become an `F<n>`.
>
> **Scope note.** Everything here is UNATTENDED-SAFE. Only these tools exist: the Playwright
> MCP set (`browser_*`), file/Bash tools, and `curl`. Every CDP / `page.*` recipe below is
> reached through `browser_run_code_unsafe(async (page) => { … })` — the one tool whose
> description confirms "run arbitrary Playwright code with the page object — CDP sessions
> possible." If a recipe needs a capability not in that tool's reach, it is not in this doc.
>
> **The golden rule this doc enforces.** *Coverage is edge cases per oracle-verified cell, not
> clicks. A finding without an evidence triple (console + network + screenshot) and a named
> oracle is an anecdote, not a bug.*

---

## Table of contents

1. [Personas](#1-personas) — who you pretend to be; every session tags exactly one.
2. [Tour definitions & night rotation](#2-tour-definitions--night-rotation) — the lens per session.
3. [Minute-detail catalog](#3-minute-detail-catalog) — per-page checks → exact MCP call.
4. [Input-attack catalog](#4-input-attack-catalog) — literal copy-pasteable strings, ≥3 per field.
5. [Behaviour-simulation recipes](#5-behaviour-simulation-recipes-r1r15) — R1–R15, MCP sequences.
6. [Named soap operas](#6-named-soap-operas) — one multi-actor session each.
7. [AI-output grading rubric](#7-ai-output-grading-rubric) — factual grounding, Uzbek quality, KaTeX/mermaid.
8. [Screenshot visual-judgment rubric](#8-screenshot-visual-judgment-rubric) — what a screenshot proves.
9. [Quick reference card](#9-quick-reference-card) — the loop, in one screen.

---

## 1. Personas

A persona is not decoration — it *shapes the input distribution*. A tester wearing "Aziza"
pastes join codes with trailing zero-width characters because a real 9-year-old on a cheap
Android does exactly that. Every session names one persona in its session report
(`env(role/locale/theme/viewport)` derives from the persona). Bundle = locale · viewport ·
theme · input-style · speed · **signature misbehaviour** (the thing this persona does that
breaks software).

### 1.1 Aziza — 9-year-old email-less student
- **Bundle:** uz · 375–390px (cheap Android portrait) · light theme · finger-taps, no keyboard.
- **Role/account:** `TENANT_LEARNER`, created by the owner as an email-less kid (synthetic
  `username@students.talim.local`, `mustChangePassword` true on first login).
- **Signature misbehaviour:** double-taps *everything* (fires R1/R11); pastes join codes copied
  from a chat app with a trailing space, newline, or zero-width char (`U+200B`); never reads
  dialog text — accepts or dismisses at random; rage-taps when a spinner runs >2s.
- **Where she bites:** join-code register, `mustChangePassword` screen, GAME quiz on a tiny
  viewport, drag-drop cloze with a fat finger, tap-target size (≥44px).

### 1.2 Dilnoza — ru-speaking student
- **Bundle:** ru · 768px (tablet) · light · Cyrillic soft-keyboard input.
- **Role/account:** `TENANT_LEARNER`, active, email account.
- **Signature misbehaviour:** types long Russian compound words that overflow fixed-width chips
  and buttons (ru copy runs 30–40% longer than uz); is acutely sensitive to plural-agreement
  ("5 вопрос" instead of "5 вопросов" is jarring to her); expects Cyrillic to render and sort.
- **Where she bites:** every plural string (0/1/2/5/21/101), truncation on cards/tabs/toasts,
  ru locale segment persistence, leaderboard name rendering.

### 1.3 Karim — impatient tutor
- **Bundle:** uz · 1440px desktop · dark theme · **keyboard-only** (`browser_press_key` Tab/Enter,
  never the mouse where a key works).
- **Role/account:** `TENANT_OWNER`.
- **Signature misbehaviour:** machine-guns Generate / Submit / Save (fires R1 double-submit);
  bulk-selects and bulk-acts; ignores confirmation dialogs (Enter through them); Tab-navigates
  and expects a visible focus ring and logical order everywhere.
- **Where he bites:** double-submit dedupe on every mutation, keyboard reachability + focus trap,
  bulk student actions, question-bank generation quota, assign panel.

### 1.4 Nodira — skeptical owner (the human oracle)
- **Bundle:** uz · 1440px · light · deliberate, reads numbers.
- **Role/account:** `TENANT_OWNER`.
- **Signature misbehaviour:** *recomputes every number by hand* — leaderboard points, streak
  bonuses, Elo/mastery deltas, seat count (used vs limit), progress percentages — and compares to
  what the UI claims. She is the persona for data-integrity charters (§7 metamorphic + arithmetic).
- **Where she bites:** GAME speed-points/streak math, mastery up-and-down after right/wrong,
  seat-limit arithmetic at the boundary, class-progress aggregation, CSV export totals.

### 1.5 Rustam — rural low-bandwidth learner
- **Bundle:** uz · 320–375px · light · Slow-3G (CDP) + CPU throttle ×4.
- **Role/account:** `TENANT_LEARNER`, active.
- **Signature misbehaviour:** everything is slow, so he interrupts — reloads a half-loaded page,
  submits then loses signal (R7), taps again when nothing happens. Reveals missing loading
  states, lost-partial-stream bugs, double-submit under latency, layout at 320px.
- **Where he bites:** R7 offline-mid-submit, R2 refresh-mid-generation, loading skeletons,
  400% reflow, GAME under latency (does the *server* clock save him or punish him?).

### 1.6 Power admin
- **Bundle:** no i18n (admin app is English-only) · 1440px · light · deep-links + impersonation.
- **Role/account:** `ADMIN` on `:3001`.
- **Signature misbehaviour:** deep-links straight to `/tenants/:id` and `/users/:id`; mints
  impersonation tokens and replays/tampers them (R6 + soap opera 5); cross-checks every action
  against the audit log; refreshes analytics rapidly (429 probe).
- **Where he bites:** impersonation single-use/expiry/tamper, audit attribution while
  impersonating, analytics divide-by-zero on empty DB, FLAGGED-media moderation.

### 1.7 Hostile actor
- **Bundle:** any locale · any viewport · adversarial.
- **Role/account:** starts as the lowest-privilege real account (INDIVIDUAL or TENANT_LEARNER),
  then attacks upward.
- **Signature misbehaviour:** URL/id tampering (other-tenant content ids), JWT tamper in
  localStorage (R6), IDOR on `/messages/:id/*`, XSS/BLNS strings in every free-text field, token
  role-swap, replays accept/impersonation URLs. **Runs auth-abuse/rate-limit probes LAST** (§Runbook
  §G — lockout risk).
- **Where he bites:** the tenant-isolation invariants, `contentAccess.service.ts` guard, IDOR
  matrices, XSS escaping, seat-limit races.

> **Concurrency note.** Two accounts cannot share one browser context. When a persona needs a
> *second live actor* (owner deactivates while student watches; admin impersonates in a 3rd
> context), the second/third actor is driven by `curl :4000` with that account's JWT — never a
> second browser. See R5, and soap operas 1 & 5.

---

## 2. Tour definitions & night rotation

A **tour** is a lens — a single question you carry through a whole session so you notice one
class of defect deeply instead of clicking randomly. Each session pins one tour (recorded in the
session report). The night runs a **rotation**, not a fixed order: the opening sweeps establish a
baseline, then one lens per session over the coverage frontier, biased by git-log and F-history.

### 2.1 Night rotation (order)
1. **Garbage-collector sweep** (once per app+role, first): visit every menu item, open every
   dialog, trigger every error state once — purely to enumerate the surface and seed
   `coverage-map.md` cells. Depth-1 only; it does *not* count as coverage.
2. **Money tour** per role (the primary value path): tutor buys seats (admin activates) → creates
   students → assigns material → student learns → progress shows up for the tutor. If the money
   tour is broken, nothing else matters — run it early.
3. **Rotate one lens per session** over the frontier (below), biased by **bad-neighborhood /
   museum** (git-log recent changes + F-history repeat-offender modules).

### 2.2 The lenses (Talim-adapted, with concrete examples)

- **FedEx (follow one datum end-to-end).** Pick a single piece of data and shadow it through
  every subsystem it touches. *Talim example:* a bank question → added to a WRITTEN assessment →
  assigned to a learner → learner answers → grading → Elo/mastery update → owner progress view →
  CSV export. Enter a hostile string as the question stem, then search for it, edit it, and export
  it — does it survive unmangled at every hop?

- **Rained-out (cancel / interrupt everything).** Start actions and abandon them. *Talim example:*
  press Esc mid "create student" dialog; `browser_navigate_back` mid assessment-builder wizard;
  refresh mid GAME timer (R2); cancel a generating podcast; close the tab while a PDF uploads.
  Oracle: no orphan job, no half-saved record, clean recovery.

- **OCD (repeat / oscillate).** Do the same thing twice, fast, and toggle back and forth.
  *Talim example:* double-click every Submit (R1); add the same student twice within a second
  (dup within class?); re-order a question list up then back down; toggle Material/Summary rapidly;
  regenerate then regenerate again before the first finishes.

- **Antisocial (illegal order / illegal input).** Do things out of sequence and feed garbage.
  *Talim example:* try to grade before submit; join a GAME that already ended; submit an
  assessment after its due date (server must 403); assign a DRAFT assessment (F56 regression);
  POST to an endpoint whose UI precondition isn't met.

- **Couch-potato (defaults / empties).** Accept every default and submit nothing. *Talim example:*
  create a zero-question assessment; create a student with no email and no name; submit an
  untouched quiz (all blank); Generate practice with 0 type-chips selected (must fall back to Mixed
  default). Oracle: graceful validation, never a 500 or a silent no-op.

- **TOGOF (two of every field / two tabs).** *Talim example:* open the same quiz in two tabs
  (`browser_tabs {new}`) and submit in both (dup attempt?); open the same message thread in two
  tabs and reply in both; log out in tab A and act in tab B (R4).

- **Supermodel (looks only).** Screenshots across the full matrix and judge purely on appearance:
  light + dark × uz/ru/en × 375/768/1440. *Talim example:* dashboard, workspace, GAME lobby,
  leaderboard, assessment builder — no overflow, no clipped text, no invisible dark-theme text, no
  broken icon. Uses §8 rubric.

- **Saboteur (fault injection).** *Talim example:* CDP offline / Slow-3G (R7); `page.route` abort
  or 500 one API path (R8) — e.g. fail `**/summary**` and screenshot the error state; kill the
  network mid GAME round. Oracle: a real error UI with retry, not a dead spinner.

- **Landmark (session-seeded permutation).** Visit 6–8 features in a *seeded random order with no
  reset between them*, so state from feature N leaks into feature N+1 — the classic
  order-dependence bug. Record the seed in the session report so it reproduces.

- **Bad-neighborhood / museum (boosted).** Old, rarely-touched code (museum) and modules with a
  fat F-history (bad neighborhood) get extra sessions. Seed the list from `git log` since the last
  run and the F-ledger's repeat-offender modules. **Last hour of the night = a dedicated
  bad-neighborhood pass around every bug found tonight** — bugs cluster.

---

## 3. Minute-detail catalog

Per-page checks. Each item is **what to check + the exact MCP call** that verifies it. These are
the depth-≥3 checks that turn a "viewed" cell into an "oracle-verified" cell.

### 3.1 Forms
- **Whitespace-only required field.** `browser_type` the field with `" "` (single space), submit,
  then `browser_network_requests` — expect a client-side validation error AND **nothing POSTed**.
  A POST that reaches the server with `" "` is a finding.
- **Leading/trailing trim.** `browser_type` `"  Alisher  "`, submit, inspect the POST body via
  `browser_network_request` (last matching request) — is it trimmed? Then re-open the record
  (`browser_navigate` to detail) and confirm the stored value has no surrounding space.
- **Enter-to-submit.** `browser_type` with `{submit: true}` in the last field — does it submit,
  no-op, or trigger the *wrong* button? All three are distinct outcomes; only "submits the form"
  is correct.
- **Paste path.** `browser_run_code_unsafe`: `await page.context().grantPermissions(['clipboard-read','clipboard-write']); await page.evaluate(t => navigator.clipboard.writeText(t), '  code123 ');`
  then focus the field and `browser_press_key("Meta+v")` (or `Control+v` on non-mac headless).
  Verify the pasted value is trimmed/validated identically to typed input.
- **Autofill (no keystrokes).** `browser_run_code_unsafe`: set the value via the native setter and
  dispatch an `input` event so React sees it without any keydown — some validators only fire on
  keydown and miss autofill. `const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set; set.call(el,'x'); el.dispatchEvent(new Event('input',{bubbles:true}));`
- **Double-submit.** See R1.

### 3.2 Typography / layout
- **Truncation sweep.** `browser_evaluate` a scan flagging any element where
  `el.scrollWidth > el.clientWidth + 1` **without** `text-overflow: ellipsis` (getComputedStyle).
  Run on every page × 3 locales × 2 themes; ru is the overflow magnet. Return the offending
  selectors + text.
  ```js
  browser_evaluate(() => [...document.querySelectorAll('*')].filter(el => {
    const s = getComputedStyle(el);
    return el.scrollWidth > el.clientWidth + 1 && s.overflow !== 'visible'
      && s.textOverflow !== 'ellipsis' && el.childElementCount === 0 && el.textContent.trim();
  }).slice(0,50).map(el => ({tag: el.tagName, cls: el.className, txt: el.textContent.trim().slice(0,40)})))
  ```
- **Contrast audit.** `browser_evaluate` computing effective foreground vs effective background
  color (walk up for the first non-transparent bg), flag ratio < 4.5:1 for normal text. Run in
  **both** themes — dark theme is where low-contrast slips through.
- **CLS (cumulative layout shift).** Install a PerformanceObserver *before* navigation via
  `browser_run_code_unsafe` → `await page.addInitScript(() => { window.__cls = 0; new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({type:'layout-shift', buffered:true}); });`
  then navigate, wait, `browser_evaluate(() => window.__cls)`. Fail > 0.1.
- **Dark-theme FOUC.** `browser_run_code_unsafe`: `await page.emulateMedia({colorScheme:'dark'}); await page.goto(url);` and `browser_take_screenshot` at the *earliest* paint — a white flash before dark CSS applies is a finding.
- **Metadata per route/locale.** `browser_evaluate(() => ({title: document.title, lang: document.documentElement.lang, favicon: document.querySelector('link[rel~=icon]')?.href}))` — title localized, `<html lang>` matches the locale segment, favicon present.
- **Sticky header not covering focus.** Tab to a field near the top; confirm it isn't hidden behind
  a sticky header (`browser_evaluate` compare `getBoundingClientRect().top` of focused element vs
  header height).
- **Reflow at zoom.** `browser_resize` to 640×512 (~200% of 1280) and 320×256 (~400%) — expect
  **zero horizontal scroll**: `browser_evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)`.

### 3.3 i18n
- **Raw-key + English-leak sweep.** `browser_evaluate` over visible text: regex `\b[a-z]+(\.[a-zA-Z]+){2,}\b`
  catches un-rendered i18n keys like `content.summary.title`; a curated English-word list catches
  leaks on uz/ru pages. Return offending nodes.
- **Plurals at 0/1/2/5/21/101.** Drive counts to these values (create N students, N questions) and
  read the rendered count-string. ru needs one/few/many forms; **uz must NOT over-pluralize** —
  `5 savol` is correct, `5 savollar` is a finding.
- **uz number/date format.** Thousands with a space (`1 000`), decimal comma, dates DD/MM,
  currency `so'm`. `browser_evaluate` grab the rendered strings and assert.
- **Locale-switch preserves route.** On `/uz/tenant/assessments`, switch to ru; expect
  `/ru/tenant/assessments` (same route, only the segment changes) — not a bounce to `/ru`.

### 3.4 Players (audio / video)
Drive the underlying media element directly through `browser_run_code_unsafe` — the DOM element
is the oracle, not the custom controls.
- **Seek boundaries.** `const a = page.locator('audio,video').first();` set `currentTime` to `0`,
  `duration/2`, and `duration - 0.2`; play; assert the `ended` event fires at the end.
- **Playback rate persists across parts.** Set `playbackRate` to 0.5 / 1.5 / 2, advance to the
  next media "part" (per-section podcast/video parts), confirm the rate carries over.
- **Transcript sync.** As `currentTime` advances, the highlighted transcript line matches; click a
  transcript line and assert `audio.currentTime` jumps to that line's timestamp.
- **Single active media.** With two players on a page, playing one must pause the other — assert
  only one element has `!paused`.
- **Space toggles without scrolling.** Focus the player, `browser_press_key("Space")` — toggles
  play/pause and does **not** scroll the page (`window.scrollY` unchanged).

### 3.5 Clipboard
- **Grant once per session:** `page.context().grantPermissions(['clipboard-read','clipboard-write'])`.
- **Copy correctness.** Click the copy button, then `browser_evaluate(() => navigator.clipboard.readText())`
  and strict-`===` against the expected value. The **join code must have no trailing newline** and
  no surrounding whitespace.
- **Round-trip.** Paste the copied join code into the register form via `Meta+v` and confirm it
  registers the learner into the right org.

### 3.6 Uploads
- **Fixture kit** from `docs/qa/fixtures/` (generated by `scripts/qa-fixtures.mjs`; never a
  committed binary). Use `browser_file_upload` with the fixture path.
- **Cap every processing wait.** `browser_wait_for` under a wall-clock cap; a Bull job that never
  reaches READY is a **finding (stuck job)**, not a reason to stall — mark the cell
  `blocked-on-job` and move on.
- **Double-upload dedupe.** Upload the same file twice fast — one content record or two? (product
  decision; log the observed behaviour.)
- **Upload-then-navigate-away.** Start an upload, `browser_navigate` elsewhere before READY —
  confirm no orphan half-processed record via `curl :4000` content list.
- **YouTube edge cases.** Playlist URL, `youtu.be/<id>` short form, `&t=90s` timestamp, private/
  unavailable video — each must produce a **distinct localized error**, not a generic failure or
  eternal processing.

### 3.7 Accessibility
- **Full-page Tab sweep.** `browser_run_code_unsafe` loop: press Tab N times, after each read
  `document.activeElement` (tag, accessible name, outline). Assert: every interactive control is
  reachable, order is logical, focus ring is visible, and focus never traps outside a modal.
- **Modal focus-trap.** Open a dialog; Tab past the last control — focus must cycle inside; Esc
  closes; focus returns to the trigger.
- **Skip link.** First Tab from page top should reveal a "skip to content" link (if the design has
  one).
- **Drag alternative (WCAG 2.5.7).** Every drag interaction (cloze, ordering, matching, hotspot,
  drag-drop question types) must have a click-only path. Complete at least one full quiz of each
  type **keyboard-only** per night.

---

## 4. Input-attack catalog

Feed **≥3 of these per field encountered**, chosen for the field's semantics (a name field gets
falsehood strings; a search box gets the apostrophe quadruple; a numeric field gets the number
set). All strings below are literal and copy-pasteable.

### 4.1 The Uzbek apostrophe quadruple (the signature Talim attack)
Uzbek Latin uses `oʻ` and `gʻ` where the modifier letter is **U+02BB (ʻ)**. Users and keyboards
routinely substitute three look-alikes. The system must accept all four in *search* and in
*grading of short-answer/cloze*, and must round-trip names unmangled.

| Variant | Codepoint | Literal string |
| --- | --- | --- |
| Correct modifier letter | U+02BB | `oʻquv qoʻllanma` |
| Left single quote | U+2018 | `oʻquv qoʻllanma` (with ‘) → `o‘quv qo‘llanma` |
| Right single quote | U+2019 | `o’quv qo’llanma` |
| ASCII apostrophe | U+0027 | `o'quv qo'llanma` |

Fields to hit: global search, short-answer + cloze grading (all four must grade the *same* answer
as correct), student name, chat input. **Deterministic pre-check** for the *wrong* apostrophe in
generated UI/content: `browser_evaluate` regex for ASCII `'` inside `o'`/`g'` sequences where U+02BB
is expected → low-confidence `O<n>` for morning review.

### 4.2 Cyrillic, mixed-script, homoglyph
- Cyrillic: `Ўзбекистон тарихи`, `Вопрос №5`
- Mixed script in one token: `Toshkentшаҳри`
- Homoglyph (Cyrillic а/е/о/с/р vs Latin): `аdmin` (leading char is Cyrillic U+0430), `сlass`
  (Cyrillic U+0441) — search and dedup must not silently treat these as equal to Latin, and login
  must not be spoofable.

### 4.3 RTL / bidi
- Arabic name: `اسم الطالب`
- Bidi-override spoof (must not reorder surrounding UI): `‮moc.evil` (leading char is U+202E
  RIGHT-TO-LEFT OVERRIDE) — filenames and names must render without hijacking layout direction.

### 4.4 Emoji / ZWJ
- Basic: `🧕📚✨`
- ZWJ family (single grapheme, multiple codepoints): `👨‍👩‍👧‍👦` — length/trim logic that counts
  codepoints instead of graphemes mangles this.

### 4.5 Zero-width & invisible
- Zero-width space inside a join code: `ABC` + U+200B + `123` → literal `ABC​123`. The register
  flow **must trim/strip** it before matching the code.
- Zero-width joiner / non-joiner sprinkled in a name — must be normalized or rejected, never stored
  raw and later un-searchable.

### 4.6 Length extremes
- 300-char single unbroken word (overflow/wrap probe):
  `Aaaaaaaaaa…` (300× `a`) — generate with `browser_run_code_unsafe`: `'a'.repeat(300)`.
- 300-char natural uz sentence (wrap + truncation with real spaces).
- 10 000-char blob (payload/limit probe): `'x'.repeat(10000)` — expect graceful rejection, no 500,
  no hang.

### 4.7 Injection / naughty strings (BLNS)
Fetch the canonical list at run start: `curl -s https://raw.githubusercontent.com/minimaxir/big-list-of-naughty-strings/master/blns.json`.
Use a fixed ~15-string sample so runs are comparable:
- HTML/script: `<script>alert('xss')</script>`, `<img src=x onerror=alert(1)>`, `"><svg/onload=alert(1)>`
- SQL-ish: `' OR 1=1--`, `'; DROP TABLE users;--`, `admin'--`
- Format-string / template: `%s%n%x`, `${7*7}`, `{{7*7}}`, `#{7*7}`
- Path / null: `../../etc/passwd`, `%00`, `file:///etc/passwd`
- Zalgo (render stress): `Z̸̧̪a̶̰͝l̷̢̈g̵̙͐o̶͇͝`
- RTL override: `‮` (U+202E)

Oracle per field: script strings render **escaped as text** (never execute — confirm via
`browser_console_messages` shows no injected `alert`, and the snapshot shows the literal text);
SQL strings produce a normal validation/not-found, never a DB error string in the response
(`browser_network_request` body must not leak SQL). `%00`/path strings must not reach the
filesystem.

### 4.8 Numbers
Into seat limit, timer seconds, question count, score fields:
`0`, `-1`, `32768` (2¹⁵), `2147483647` (2³¹−1), `2147483648` (2³¹), `-2147483649`, `3.5` (decimal
into an int field), `1e9`, `0x10`, `abc`, empty. Expect field-level validation, clamping to a
documented range, or a clean error — never a 500 or a NaN in the UI.

### 4.9 Dates
Into due-date pickers: a past instant, due-now (this minute), far future (`2999-12-31`), and the
**23:59 vs 00:00 boundary**. The tutor's picker value and the learner's rendered due date must
resolve to the **same calendar day under Asia/Tashkent**. Force a hostile timezone with CDP:
`page.context()` via `browser_run_code_unsafe` → `const c = await page.context().newCDPSession(page); await c.send('Emulation.setTimezoneOverride',{timezoneId:'Pacific/Kiritimati'});` and confirm the due-day doesn't slip.

### 4.10 Files (via fixtures)
`0-byte` file, `limit+1` byte file, wrong-magic-bytes (`notapdf.pdf` = text with `.pdf` extension),
filename with U+02BB + em-dash + emoji (`oʻquv qoʻllanma — 7-sinf ✨.pdf`), 250-char filename,
scanned-only PDF (forces OCR ladder), password-protected PDF. Each has a documented expected
outcome in `uz-math-facts.md`.

### 4.11 Names (falsehoods programmers believe about names)
Into student-name / display-name: single word (`Alisher`), 1-char (`A`), digits only (`12345`),
ALL CAPS (`ALISHER`), apostrophe-heavy uz (`Gʻofur Oʻgʻli`), two students with the **identical
name** in one class (must both be creatable and distinguishable in lists/leaderboard). Expect
round-trip fidelity — the name displayed and exported equals what was entered.

---

## 5. Behaviour-simulation recipes (R1–R15)

Every CDP / `page.*` call below is wrapped in `browser_run_code_unsafe(async (page) => { … })`.
**Every emulation change (throttle / offline / CPU / timezone / touch / route / clock) is undone in
a `finally` block** so it never leaks into the next cell.

| ID | Bug class | Sequence (inside `browser_run_code_unsafe` unless noted) |
| --- | --- | --- |
| **R1** | Double-submit / quota double-burn | `const b = page.getByRole('button',{name:/generate|submit|save/i}); await Promise.all([b.click(), b.click({force:true}), b.click({force:true})]);` → `browser_network_requests` count matching POSTs (**>1 = F**) → `curl :4000` count rows created. |
| **R2** | Refresh mid-generation / mid-stream | Trigger Generate or send a chat message, then at ~2s `browser_evaluate(() => location.reload())`. Oracle: no stuck spinner, no lost partial stream orphan, job either completes or is cleanly cancelled (check `curl :4000`). |
| **R3** | Back / bfcache stale-auth | Log out → `browser_navigate_back` → `browser_snapshot` for leaked learner data in the restored page → click something → expect exactly **one** clean 401→login redirect, no data flash. |
| **R4** | Multi-tab, same account | `browser_tabs {action:'new'}` → log out in tab A → act in tab B (must redirect to login); separately, submit the *same quiz* in both tabs — is a duplicate attempt created? |
| **R5** | Deactivation latency (invariant) | Student tab open on a material. As owner, `curl -X ... :4000` deactivate that student. Student tab clicks the next material link → **immediate lockout** (no grace). Cross-tenant/second-actor is curl, never a 2nd browser. |
| **R6** | Token tamper | `browser_evaluate` to corrupt / delete / role-swap the JWT in `localStorage` (`localStorage.setItem('token', tamperedJwt)`), then click a protected action → expect **one** redirect, **no 401 storm**, no cached-role chrome (e.g. tutor menu) surviving. |
| **R7** | Slow-3G / offline mid-submit | `const c = await page.context().newCDPSession(page); await c.send('Network.emulateNetworkConditions',{offline:false,latency:400,downloadThroughput:62500,uploadThroughput:62500});` submit → then `await page.context().setOffline(true)` → expect visible error + retry affordance; reconnect (`setOffline(false)`) → `curl :4000` proves **exactly one** attempt persisted. Restore in `finally`. |
| **R8** | Fault-injected API state | `await page.route('**/summary**', r => r.fulfill({status:500, contentType:'application/json', body:'{"error":"injected"}'}));` navigate/trigger → `browser_take_screenshot` the error state → `await page.unroute('**/summary**')` in `finally`. Oracle: real error UI + retry, not a dead spinner. |
| **R9** | GAME timing (server-authoritative → **real** waits) | Three profiles: machine-gun (`browser_click` answers ~0.3s apart), human (`browser_wait_for {time: 4..8}` varied per question), at-buzzer/expiry (wait past the per-question timer). Diff speed-points, streak, leaderboard between profiles. **Never `page.clock` here** — the timer is server-authoritative; faking the page clock proves nothing and can produce false findings. |
| **R10** | Session-expiry (client-only surfaces) | `await page.clock.install(); await page.goto(url); await page.clock.fastForward('45:00');` then submit → in-progress work must **not** vanish into a login redirect (or must warn+preserve). Only for *client-side* idle timers, never for server-timed GAME/assessment. |
| **R11** | Rage-click / dead-click | `for (let i=0;i<5;i++) { await page.mouse.click(x,y); }` inside <1s on one control → flag double-fire (two mutations) or dead-click (no visible change and no network). |
| **R12** | Mobile + touch | `browser_resize {width:390,height:844}` + `const c=await page.context().newCDPSession(page); await c.send('Emulation.setEmitTouchEventsForMouse',{enabled:true,configuration:'mobile'});` → assert tap-targets ≥44px (`browser_evaluate` on `getBoundingClientRect`), drive drag-drop cloze via `browser_drag`, check both themes. Restore in `finally`. |
| **R13** | Destructive-dialog cancel-vs-accept | Pre-arm nothing; trigger a confirm-guarded delete, then `browser_handle_dialog {accept:false}` → `curl :4000` proves **no change**; repeat with `browser_handle_dialog {accept:true}` → proves **exactly-once** deletion. |
| **R14** | Monkey burst (learner **content page only**) | `run_code_unsafe`: 60s loop picking a random element from `page.$$('button,a,input,[role]')`, random click/type wrapped in try/catch, stop after 10 `pageerror`s. Then triage `browser_console_messages` + `browser_network_requests`. Scope tightly — do **not** monkey destructive admin/owner pages. |
| **R15** | Pre-registered listeners | *Before* a drag interaction or a GAME round, register `page.on('pageerror', e => window.__errs.push(e.message))` and `page.on('requestfailed', r => window.__fails.push(r.url()))` so time-local errors during the interaction aren't missed. Read them after. |

**Dialog policy (arm at session start).** Because a rogue `alert`/`confirm` blocks the whole run,
pre-arm a default `browser_handle_dialog` disposition at session start, and only override it for
R13 where the accept/cancel choice *is* the test.

---

## 6. Named soap operas

Each is one dedicated session (fits the ≤35-action / ~15-min budget by being scripted). Side-quests
in **bold**. Run these as their own sessions per the rotation; `QA_SOAP=1` restricts a run to this
block.

1. **Chaotic classroom.** Owner CSV-imports 30 students (2 rows malformed) → **hits the seat
   limit** → deactivates a kid *mid-GAME* (that kid live in tab B) → reassigns a material whose due
   date is yesterday → the kid messages the tutor → tutor replies **while a power-admin impersonates
   a third user via curl in parallel**. Oracles: seat arithmetic (Nodira), deactivation latency
   (R5 invariant), due-date server enforcement, message thread integrity, audit attribution.

2. **The cheater.** A learner machine-guns a GAME while rewriting the request body to forge a
   tiny `responseMs` (`page.route('**/attempt**', r => r.continue({postData: patched}))`) →
   leaderboard integrity must **clamp** the impossible speed (invariant, cf. F39), not award
   maximum speed-points. Oracle: recompute the leaderboard by hand (Nodira) and compare.

3. **Offline rural exam.** Rustam takes an assigned quiz on Slow-3G, goes **offline mid-submit**
   (R7), reconnects. Oracle: `curl :4000` proves **exactly one** attempt; no double-charge, no lost
   answers.

4. **Language purist.** Generate summary + quiz + podcast on `uz-math.pdf` → run the full Uzbek
   rubric (§7.2) + apostrophe quadruple (§4.1) + claim-grounding oracle (§7.1) end-to-end. The
   source is a fixture with *known sentences*, so every claim has a checkable origin.

5. **The impersonator.** Admin mints an impersonation token → **replays a used accept URL**
   (expect single-use rejection) → **tampers the token** (expect reject) → impersonates a
   **deactivated** learner (expect block). Oracles: single-use, expiry, tamper-reject, and an audit
   row for every attempt; exiting impersonation restores the admin session cleanly (R6-adjacent).

---

## 7. AI-output grading rubric

Rendering ("it displays") is depth-1 and does **not** pass the AI-quality gate. Every AI finding
**names its oracle** from the FEW HICCUPPS set (**F**amiliarity, **E**xplainability, **W**orld,
**H**istory, **I**mage, **C**omparable-product, **C**laims, **U**ser-expectations, **P**roduct,
**P**urpose, **S**tatutes/standards). The three concrete oracles below cover almost everything.

### 7.1 Factual grounding (oracle: Claims / World)
1. `curl :4000` the **source section text** the generator worked from (the fixture `uz-math.pdf`
   has known sentences — use it for a ground-truth run).
2. Extract **5–10 atomic claims** from the generated summary / quiz stem / flashcard front.
3. Each claim needs a **quotable supporting sentence** in the source. A claim with no source
   support is a hallucination → **F** (S2).
4. **Independently solve every quiz answer key.** The keyed answer must be *the* correct answer;
   verify no distractor is *also* defensible; verify each cloze blank has **exactly one** defensible
   answer; verify each flashcard back matches its `sourceQuote`.

### 7.2 Uzbek language quality (decomposed rubric — never "is this good Uzbek?")
Judge along explicit axes, each with a deterministic pre-check where possible:
- **Wrong-language leakage** — no English/Russian words on a uz page (curated word-list regex via
  `browser_evaluate`).
- **Script consistency** — Latin *or* Cyrillic, not mixed within one string.
- **Apostrophe correctness** — U+02BB in `oʻ`/`gʻ`; ASCII/`’`/`‘` substitution is a low-confidence
  `O<n>` (§4.1 pre-check).
- **Agglutinative-suffix correctness** — case/possessive suffixes attached correctly (hard to
  automate → human-review `O<n>`).
- **Calques** — literal English idioms translated word-for-word (human-review `O<n>`).
- **Terminology consistency** — the same concept uses the same term across summary/quiz/UI.
- **Raw i18n keys** — regex `\b[a-z]+(\.[a-zA-Z]+){2,}\b` (deterministic → `F`).

> **Fluency doubts are `O<n>`, not `F<n>`.** Log them low-confidence for morning human review; do
> not assert a confirmed language finding from a machine judgment about fluency.

### 7.3 Math / diagram rendering (deterministic → `F` when it fails)
- KaTeX errors: `browser_evaluate(() => document.querySelectorAll('.katex-error').length)` must be
  `0`; scan `browser_console_messages` for `KaTeX` warnings.
- No raw math survives: the `browser_snapshot` text must contain no `$$`, `\frac`, `\sqrt`, or
  literal `\(` `\)` sequences.
- mermaid: every `.mermaid` container must contain a rendered `<svg>`
  (`browser_evaluate(() => [...document.querySelectorAll('.mermaid')].every(c => c.querySelector('svg')))`);
  no raw ```` ```mermaid ```` fence left in text.
- Manim / Desmos visual tutor tools: the media element/frame is present and non-zero-size.

### 7.4 Metamorphic (tight only)
- **Tight (file as `F`):** the keyed answer submitted verbatim must grade **100%**; deliberate
  garbage must grade **0%**. A tight metamorphic failure is deterministic and reportable.
- **Loose (smell only, never a standalone `F`):** paraphrase-stability ("a reworded correct answer
  still grades correct") is a *smell* — re-reproduce it deterministically before considering it,
  and even then prefer `O<n>` unless the grader is provably wrong.

---

## 8. Screenshot visual-judgment rubric

A screenshot proves *appearance at a moment*; it does **not** prove behaviour (that needs the
snapshot + network + reload of depth-≥3). Take one at the failure moment for every finding, and
one across the supermodel matrix per supermodel session. Judge each screenshot against:

- **Layout integrity** — no clipped/overlapping text, no element escaping its container, no
  horizontal scrollbar at the tested viewport, no zero-height/collapsed regions where content
  should be.
- **Theme correctness** — in dark theme, no black-on-black or white-on-white; borders and surfaces
  visible; no light-theme panel bleeding into a dark page.
- **Contrast** — text legible against its background (cross-check with the §3.2 computed-contrast
  audit; the screenshot is corroboration, not the measurement).
- **Completeness** — icons present (no missing-glyph boxes), images loaded (no broken-image icon or
  empty alt box), avatars/rings/badges rendered.
- **State honesty** — a loading screenshot shows a skeleton/spinner (not a flash of empty then
  content = CLS); an empty state shows the empty-state UI (not a bare page); an error state shows a
  real error with a retry, not a dead spinner.
- **Locale fit** — ru text (30–40% longer) fits without truncation; uz apostrophes render as U+02BB
  glyphs, not boxes; RTL test strings don't hijack surrounding layout.
- **Focus visibility** — when a screenshot is taken after Tab, the focused control has a visible
  ring.

**What a screenshot must be paired with to become a finding.** Screenshot alone = anecdote. A
finding needs the **evidence triple**: failure-moment screenshot + `browser_console_messages`
excerpt + the full failing request (`browser_network_request`), plus a named oracle and
expected-vs-actual. This is the §E self-verification contract the runbook enforces.

---

## 9. Quick reference card

**Per-page ritual (depth ≥3 before a cell counts as covered):**
`browser_navigate` → `browser_wait_for` → `browser_snapshot` (structure oracle) →
`browser_take_screenshot` (visual rubric) → **interact** → **submit** → **verify persisted after a
real `location.reload()`** (not soft-nav). Apply the charter's tour lens + ≥3 input attacks on
every field. **Vigilance scan after every click/type**: `browser_console_messages` +
`browser_network_requests` (4xx/5xx, dup POSTs, non-localhost hosts) + snapshot-diff outside the
acted region.

**Before any `F<n>` (self-verification):** reproduce twice (once from fresh state) → minimal repro →
environment-attribution check (Playwright/headless/font/HMR/stale-login?) → evidence triple +
severity → dedup against ledger → **skeptic pass** (a fresh read of *only* the evidence bundle must
fail to find an innocent explanation). Non-repro / enhancement / fluency-doubt → **`O<n>`
Observations ledger**, not `F<n>`.

**Severity:** S1 data-loss/isolation/security · S2 key flow broken · S3 visual/non-blocking · S4
polish.

**Liveness:** never repeat the same tool+args a 3rd time; clear-before-type
(`browser_fill_form` or select-all — appended text is the #1 real loop); bounded waits only, mark
`blocked-on-job` and continue; restore every emulation in `finally`.

**Never do (from the runbook HARD RULES):** switch off `claude/visual-qa`; `git push`; touch prod;
use `page.clock` against server-authoritative GAME/assessment timers; run auth-abuse/rate-limit
probes before the last hour.
