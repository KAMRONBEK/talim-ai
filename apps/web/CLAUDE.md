# apps/web — Talim AI Learner & Tenant Web App

This is the customer-facing Next.js app (port 3000). It serves three audiences from one codebase, gated by `UserRole`:

- **INDIVIDUAL** (B2C solo learner) — uploads own content, gets summaries/podcasts/quizzes/AI-tutor. Lives under `/[locale]/dashboard` and `/[locale]/content/*`.
- **TENANT_OWNER** (tutor / school org admin) — manages students, materials, assessments. Lives under `/[locale]/tenant/*`.
- **TENANT_LEARNER** (a student belonging to one tutor) — reads only assigned materials, takes quizzes/games. Lives under `/[locale]/learner/*`.

The platform-admin panel is a **separate app** (`apps/admin`, port 3001) — not this one.

---

## 1. Stack

Verified in `apps/web/package.json`:

- **Next.js 15** (`^15.1.2`) App Router + **React 19** (`^19.0.0`).
- **next-intl** (`^4.13.0`) for i18n (locales: uz/en/ru).
- **Tailwind CSS** (`^3.4.17`) via `@talim/tailwind-config`; shared components from `@talim/ui`.
- **State:** **Zustand** (`^5.0.2`) for auth/chat/content client state; **@tanstack/react-query** (`^5.62.8`) for server state.
- **HTTP:** **axios** (`^1.7.9`) — single client in `lib/api.ts`.
- **Content rendering:** `react-markdown`, `remark-gfm`, `remark-math`, `rehype-katex`, `katex`, `mermaid`, `recharts`; `next-themes` for dark mode; `lucide-react` icons.
- Shared types from workspace package `@talim/types`.

Scripts (`package.json`): `dev` (port 3000), `build`, `start`, `lint`, `typecheck` (`tsc --noEmit`).

---

## 2. i18n model

- **Single dynamic segment `[locale]`** wraps the whole app: `app/[locale]/...`. There is no non-localized route tree except `app/layout.tsx` / `app/[locale]/layout.tsx`.
- **Locales:** `['uz', 'en', 'ru']`, **default `uz`**, `localePrefix: 'always'` — defined in `i18n/routing.ts`. Every URL is prefixed (e.g. `/uz/dashboard`, `/en/login`).
- **Messages:** `messages/uz.json`, `messages/en.json`, `messages/ru.json`. Loaded server-side in `i18n/request.ts` (statically imported, keyed by locale). Top-level namespaces (verified in `en.json`): `becomeTutor`, `common`, `auth`, `dashboard`, `sidebar`, `content`, `chat`, `quiz`, `theme`, `locales`, `account`, `tenant`, `learner`, `landing`.
- **`middleware.ts`** runs `next-intl/middleware` with `routing`; matcher excludes `api`, `_next`, `_vercel`, and any path with a file extension.
- **Navigation:** import `Link`, `useRouter`, `usePathname`, `redirect` from **`@/i18n/navigation`** (locale-aware wrappers from `createNavigation`), NOT from `next/link` / `next/navigation`. Paths are written WITHOUT the locale prefix (e.g. `router.push('/quiz/' + id)`); the wrapper adds it.
- **Locale + API:** `lib/locale-api.ts` derives the active locale from the URL's first path segment; `lib/api.ts` injects it as both an `Accept-Language` header and a `locale` query param on every request. `components/locale-sync.tsx` (via `hooks/useLocaleContent`) keeps content queries in sync.

> **Rule:** every user-facing string must exist in **all three** message files (`uz`, `en`, `ru`) under the same key. Do not hardcode display text in components — use `useTranslations('<namespace>')`. (Note: some newer feature components, e.g. `components/learner/game-quiz-player.tsx` and `leaderboard-table.tsx`, still contain hardcoded English strings — match the surrounding file's pattern, and prefer translating when adding strings.)

---

## 3. Routing map (route groups under `app/[locale]`)

Route groups (parenthesized folders) attach a layout + a `RoleGuard` without adding URL segments.

| Group / area | URL paths | Role / layout |
|---|---|---|
| `(auth)` | `/login`, `/register` | public; redirect away if already signed in |
| `(learner)` | `/learner/dashboard`, `/learner/progress`, `/learner/assessments`, `/learner/settings` | `TENANT_LEARNER` only (`LearnerShell`) |
| `(tenant)` | `/tenant/dashboard`, `/tenant/materials`, `/tenant/materials/[id]/assign`, `/tenant/students`, `/tenant/students/[id]`, `/tenant/progress`, `/tenant/assessments`, `/tenant/billing`, `/tenant/settings` | `TENANT_OWNER` only (`TenantShell`) |
| B2C dashboard | `/dashboard`, `/dashboard/settings` | `INDIVIDUAL` only (`DashboardShell`) |
| B2C content | `/content/[id]`, `/content/[id]/chat`, `/content/[id]/podcast` | content detail / AI-tutor / podcast |
| Quiz | `/quiz/[id]` | quiz & game player target |
| Marketing landing | `/` (`app/[locale]/page.tsx`) | public; components in `components/marketing/*` |

**Post-login landing** is centralized in `lib/auth-routing.ts → getPostLoginPath(role)`:

- `TENANT_OWNER` → `/tenant/dashboard`
- `TENANT_LEARNER` → `/learner/dashboard`
- everything else (INDIVIDUAL) → `/dashboard`

The login (`(auth)/login/page.tsx`), register, and marketing home pages all call `getPostLoginPath` to redirect signed-in users. `RoleGuard` uses the same helper to bounce a user who hits a route group they aren't allowed in.

The marketing landing (`components/marketing/landing-page.tsx`) composes: `Navbar`, `Hero`, `Features`, `HowItWorks`, `ForTutors`, `Preview`, `Cta`, `Footer`.

---

## 4. Data fetching pattern

- **One axios client:** `lib/api.ts` exports `api` (base URL from `NEXT_PUBLIC_API_URL`, default `http://localhost:4000`). It attaches the Bearer token from the auth store, injects locale, and on a `401` it logs out and redirects to `/{locale}/login`. Also exports `getApiBaseUrl()`.
- **Path builders:** `lib/api/endpoints.ts` is the single discoverability map of REST paths (`authEndpoints`, `tenantEndpoints`, `learnerEndpoints`, `contentEndpoints`, `assessmentEndpoints`). It is an aid — many hooks still use inline string literals, which remains valid. The API has **NO `/api` prefix** (routes are `/auth`, `/tenant`, `/learner`, `/content`, `/quiz`, `/summary`, `/billing`, `/usage`, `/chat`).
- **Hooks wrap react-query** (`hooks/`). Each hook owns its `queryKey` and calls `api`:
  - `useTenant` — tenant CRUD, students, join-code regen, assignments, progress (keys: `['tenant']`, `['tenant','students']`, `['tenant','progress']`, `['tenant','assignments',id]`, `['learner','summary']`).
  - `useAssessments` — question banks, assessments, results, leaderboards, learner submit (keys under `['tenant','question-banks',...]`, `['tenant','assessments',...]`, `['learner','assessments',...]`).
  - `useContentActions` — orchestrates quiz/summary/retry/delete + dialog state for the content detail page.
  - `useTutorRequest` — `useMyTutorRequest` (GET `/auth/tutor-request`) + `useRequestTutor` (POST `/auth/upgrade-to-tenant`).
  - Plus `useContent`, `useTenantContent`, `useQuiz`, `useProgress`, `usePodcast`, `useChat`, `useSections`, `useBilling`, `useAccount`, `useVideo`, `useTranscript`, `useLocaleContent`, `useFileUpload`, `useSidebarSheet`.
- **react-query config:** `lib/queryClient.ts` sets `staleTime: 30_000`, `retry: 1`. Client is created once in `components/providers.tsx`.

> **Rule:** after any mutation, invalidate the affected query keys (`queryClient.invalidateQueries({ queryKey: [...] })`). Follow the existing patterns — e.g. `useAssignContent` invalidates `['tenant','assignments',contentId]`, `['tenant','students']`, AND `['contents']`; `useSubmitLearnerAssessment` invalidates the learner assessments list and that assessment's leaderboard. Keep multi-list invalidation consistent so progress/assignment views don't go stale.

---

## 5. Key feature components

- **`components/learner/game-quiz-player.tsx`** — the GAME-mode assessment runner. Per-question countdown (`secondsPerQuestion`, default 20), auto-locks on timeout, supports MULTIPLE_CHOICE / NUMERIC / text, tracks per-question `timings` and total `durationMs`, submits via `useSubmitLearnerAssessment`, then shows score / correct count / best streak / per-question results. Phases: `intro → playing → submitting → results`.
- **`components/learner/leaderboard-table.tsx`** — ranked rows with medal styling; shows `pts` for `GAME` mode and `%` for written; highlights `highlightId` (the current learner).
- **`components/learner/student-welcome-banner.tsx`** — first-login nudge for students to change their password; shows when `user.mustChangePassword` is set (server-driven) or the legacy per-device `lib/onboarding` flag is pending; CTA links to `/learner/settings`.
- **`components/tenant/join-code-card.tsx`** — displays the class join code (`tenant.joinCode`), copy-to-clipboard, and regenerate (confirm dialog) via `useRegenerateJoinCode`. Students self-enroll with this code at `/register`.
- **`components/account/become-tutor-card.tsx`** — INDIVIDUAL-only. Shows tutor-request form (org name + optional note), or PENDING/REJECTED state, via `useMyTutorRequest` / `useRequestTutor`. Renders `null` for non-INDIVIDUAL users.
- **`components/content/content-status-gate.tsx`** — for the content detail page: renders the FAILED screen (retry/delete for non-learners) or a processing screen for any non-`READY` status; returns `null` when `READY` so the caller renders the full view.

Other notable dirs: `components/tenant/{assign-students-panel,onboarding-checklist,activity-heatmap}`, `components/content/{UploadCard,ContentList,delete-content-dialog}`, `components/chat/*`, `components/quiz/*`, `components/podcast/*`, `components/layout/*` (sidebars, headers, resizable split for the learning view).

---

## 6. Auth / session handling

- **Token + user** live in **Zustand** with `persist` to `localStorage` under key `talim-auth` (`store/useAuthStore.ts`): `{ user, token, setAuth, setUser, logout }`.
- **API auth:** `lib/api.ts` request interceptor adds `Authorization: Bearer <token>`; response interceptor on `401` calls `logout()` and hard-redirects to `/{locale}/login`.
- **Session refresh:** `components/session-sync.tsx` (mounted in `Providers`) calls `GET /auth/me` whenever a token exists, refreshing the stored `user` and re-validating content queries.
- **Guards:**
  - `components/role-guard.tsx` — waits for Zustand hydration, redirects to `/login` if no token, and redirects to `getPostLoginPath(user.role)` if the user's role isn't in `allowedRoles`.
  - `components/auth-guard.tsx` — token-only guard (used inside `LearnerShell`).
  - **Shells wire the guards per group:** `contexts/dashboard-search.tsx → DashboardShell` gates the **B2C dashboard to `INDIVIDUAL`**; `contexts/learner-shell.tsx → LearnerShell` gates `TENANT_LEARNER`; `contexts/tenant-shell.tsx → TenantShell` gates `TENANT_OWNER` (and shows an inactive-subscription banner when `billing.subscription.status !== 'ACTIVE'`). These shells are mounted by the corresponding `layout.tsx` files.
- **API base URL:** `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:4000`). It must be set at build time for production (it is inlined into the client bundle).
- **Register / join code:** `(auth)/register/page.tsx` posts to `/auth/register` and includes an optional uppercased `joinCode` (class self-enroll for students). Everyone signs up as a learner; becoming a tutor goes through the `BecomeTutorCard` → tutor request → admin approval flow.

---

## 7. Conventions & gotchas

- **Build `@talim/types` first.** This app imports `@talim/types` (and `@talim/ui`); run `pnpm --filter @talim/types build` before `dev`/`build`/`typecheck` or you get stale/missing type errors.
- **Use `@/i18n/navigation`** for `Link`/`useRouter`/`redirect`, never `next/link` or `next/navigation` — otherwise the `[locale]` prefix is lost.
- **i18n completeness:** add new strings to all three `messages/*.json` files under the same key; reference via `useTranslations`.
- **Role-based redirects are centralized** in `lib/auth-routing.ts` (`getPostLoginPath`, `getHomePathForRole`, `getSettingsPathForRole`). Reuse them; don't hardcode role→path logic.
- **Hydration:** auth-dependent pages render a "Loading…" placeholder until Zustand `persist` finishes hydrating (see `RoleGuard`'s `useAuthHydrated`, and the `mounted` pattern in `login`/marketing pages) to avoid SSR/CSR mismatch.
- **The API has no `/api` prefix** and **no `/api/health`** — health is `/health` on the API. Frontend paths are role-aware: content is `/content/*` for INDIVIDUAL but `/tenant/content/*` for tutors (see `contentEndpoints.base(isTenantOwner)`).
- **Mutations must invalidate caches** (section 4) — especially the cross-list invalidations for assignments, students, progress, and leaderboards.
