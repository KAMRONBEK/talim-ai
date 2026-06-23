# apps/admin — Talim platform-admin panel

Next.js 15 (App Router) + React 19 internal console used **only by platform operators** (`UserRole.ADMIN`) to run the Talim AI business: approve tutor requests, manage users/tenants/subscriptions, inspect content and AI-generated media, watch API spend, and read the audit log.

This is `@talim/admin` (`apps/admin/package.json`). It is a thin client over the API's `/admin/*` routes — there is no DB access here; all data and mutations go through `apps/api`.

## 1. Purpose & access model

- **Operators only.** Login is gated to `user.role === 'ADMIN'`. `app/login/page.tsx` calls `POST /auth/login`, and if the returned user is not `ADMIN` it immediately `logout()`s and shows "This account is not authorized for admin access." `components/auth-guard.tsx` re-checks `token && user?.role === 'ADMIN'` on every `(admin)` route and redirects to `/login` otherwise.
- **Not self-registerable.** There is no register page. Admin accounts are created from the repo root with `pnpm create-admin` (root `package.json` → `doppler run -- pnpm --filter @talim/api create-admin --`, which runs `apps/api/src/scripts/create-admin.ts`). Tenant owners are created via `pnpm create-tenant-owner` or by approving a tutor request in this panel.
- **Port 3001.** `dev`/`start` scripts pass `--port 3001` (`apps/admin/package.json`). The dev API CORS allow-list only adds `http://localhost:3001` in non-production (`apps/api/src/index.ts`), so the panel must be served on 3001 in dev or requests are CORS-blocked.
- **Title "Talim Admin", NO i18n.** `app/layout.tsx` hardcodes `metadata.title = 'Talim Admin'` and `<html lang="en">`. There is no `next-intl` and no `[locale]` segment. `middleware.ts` actively **strips** any leading `/en|/ru|/uz` locale prefix and redirects to the unprefixed path (a guard against habitually typing web-app-style URLs).

## 2. Routing

Root `app/page.tsx` redirects `/` → `/login`. Auth lives at `/login` (`app/login/page.tsx`, outside the route group). Everything else is under the `(admin)` route group, wrapped by `app/(admin)/layout.tsx` → `components/admin-shell.tsx` (= `AuthGuard` + `AdminSidebar` + main content). The layout is `force-dynamic`.

Sidebar nav order and labels are in `components/admin-sidebar.tsx`:

| Route | Sidebar label | Purpose |
| --- | --- | --- |
| `/dashboard` | Statistics | Platform KPIs from `GET /admin/stats/platform`: total/active users, signups (7d/30d), total content + READY count, est. API spend, and generation counts (quizzes/podcasts/slideshows/summaries). |
| `/tutor-requests` | Tutor requests | List + approve/reject learner "become a tutor" requests. Filter by `PENDING`/`APPROVED`/`REJECTED`/All. Approve takes an optional **seat limit**; approving creates the org + active subscription. |
| `/users` | Users | Searchable paginated table of all accounts (email, name, recorded password note, role, plan, status, content count). Per-row **Reset** (generate new password) and **Delete** (with 409 cascade confirm). |
| `/users/[id]` | — | User detail: stats cards, **Credentials** card (recorded `adminPasswordNote`, set/generate password), **Role & organization** (change role, create/assign org, transfer ownership before demoting an owner), **Subscription** (individual plans only; tenant owners/learners are billed via the org), usage-vs-limits, recent content. |
| `/tenants` | Tenants | Searchable paginated table of organizations (name/slug, owner, plan, status, student count, content count). |
| `/tenants/[id]` | — | Tenant detail: edit org name, plan (`TENANT_STARTER`/`TENANT_GROWTH`), status, period end, and **custom seat limit**; members table (owner + learners with active/inactive state); usage-vs-limits. |
| `/content` | Content | All uploads platform-wide (title, owner email, type, status). **Retry** on `FAILED` items, **Delete** on any. |
| `/generated` | Generated media | AI artifacts tabbed by kind (all/podcast/quiz/slideshow/summary) with delete. |
| `/subscriptions` | Subscriptions | Read-only list of individual + tenant subscriptions, filterable by kind (user/tenant/all), status, plan, and search. Links to the user/tenant detail page to actually edit. |
| `/usage` | Usage & costs | Per-user API spend over 7/30/90 days (events, input/output tokens, est. USD). |
| `/audit` | Audit log | Paginated admin-mutation log (when, admin email, action, target, JSON metadata), newest first. |

## 3. Key admin capabilities

- **Approve tutor requests** (`/tutor-requests`, `useApproveTutorRequest` → `POST /admin/tutor-requests/:id/approve`): turns a learner into a `TENANT_OWNER`, creating their organization with an ACTIVE subscription and the optional seat limit you type in. Reject via `POST /admin/tutor-requests/:id/reject`.
- **Manage users** (`/users`, `/users/[id]`): change role / create / assign org / transfer ownership (`usePatchUser` → `PATCH /admin/users/:id`), set or generate a password (`useResetUserPassword` → `POST /admin/users/:id/reset-password`), record a known password without changing login (the `adminPasswordNote` field), edit an individual user's subscription (`useUpdateUserSubscription` → `PATCH /admin/users/:id/subscription`), and delete users (`useDeleteUser` → `DELETE /admin/users/:id`).
- **Manage tenants** (`/tenants/[id]`, `useUpdateTenant` → `PATCH /admin/tenants/:id`): org name, plan, status, period end, and a **custom seat limit** (blank = plan default) that caps student count.
- **Content & generated media** (`/content`, `/generated`): inspect, delete, and retry failed content jobs (`POST /admin/contents/:id/retry-job`).
- **Visibility**: platform stats, subscriptions overview, per-user usage/costs, and the audit log are all read-only inspection surfaces.

Note: not every API capability has UI yet — e.g. `POST /admin/users` (createUser) exists in `apps/api/src/routes/admin.routes.ts` but the panel only creates owners via tutor-request approval / role changes.

## 4. Data layer

- **All server calls go through `lib/api.ts`** — a single Axios instance with `baseURL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'`. A request interceptor injects `Authorization: Bearer <token>` from the auth store; a response interceptor logs out and hard-redirects to `/login` on any `401`.
- **Auth state**: `store/useAuthStore.ts` — Zustand `persist` to `localStorage` under key `talim-admin-auth` (`{ user, token }`). `components/providers.tsx` calls `useAuthStore.persist.rehydrate()` on mount; `auth-guard.tsx` waits for hydration before deciding to redirect.
- **Server state**: TanStack Query. `lib/queryClient.ts` sets `staleTime: 30s`, `retry: 1`. **Every query/mutation lives in `hooks/useAdmin.ts`** and maps 1:1 onto `/admin/*` endpoints; mutations invalidate the relevant `['admin', ...]` query keys. This is the file to read/extend when adding admin features. Response/request shapes come from `@talim/types` (e.g. `AdminPlatformStats`, `AdminUserDetail`, `AdminTenantDetail`, `PaginatedResponse<T>`).
- **API auth on the server side**: `apps/api/src/routes/admin.routes.ts` mounts `authMiddleware, requireRole('ADMIN'), adminRateLimit` on the whole router — so the client token alone is necessary but the API independently re-verifies the ADMIN role and rate-limits.
- **CORS**: `apps/api/src/index.ts` builds the allow-list from `CORS_ORIGIN` (comma-separated) and, in non-production, additionally allows `http://localhost:3000` and `http://localhost:3001`. In production the admin origin must be present in `CORS_ORIGIN`.

## 5. Sensitive behavior — handle with care

- **Plaintext passwords are shown on purpose.** `adminPasswordNote` is rendered as copyable plaintext on `/users` and `/users/[id]` (intentional support-lookup feature). "Set password" / "Generate new password" call `reset-password` and then mirror the new value back into the note. Treat this UI and the underlying field as sensitive; do not leak it into logs/screenshots and never weaken the ADMIN gate around it.
- **Destructive, cascading deletes.** Deleting a tenant-owner can destroy the whole organization: `useDeleteUser` retries with `confirmCascade: true` after the API returns `409` with a warning message (`/users/page.tsx`). Demoting an owner to `INDIVIDUAL` requires selecting a transfer-to owner first (`/users/[id]` `needsNewOwner`). Keep these confirm/transfer guards intact.
- **Every admin surface must stay behind admin auth.** Any new page must live under `app/(admin)/` (so `AuthGuard` wraps it) and call the API through `lib/api.ts`; any new endpoint must be under the ADMIN-guarded router. Never bypass `requireRole('ADMIN')` server-side or the `isAdmin` check client-side.

## 6. Gotchas

- **Run on port 3001 in dev** or the API CORS allow-list blocks you.
- **Needs the API + Doppler.** The panel is useless without `apps/api` running on :4000 (or `NEXT_PUBLIC_API_URL` set), and the API needs Doppler secrets (`doppler run --`, config `dev` locally).
- **Build `@talim/types` first** (`pnpm --filter @talim/types build`) — admin imports its types from there; a stale build causes phantom type errors.
- **No i18n / no locale prefixes.** `middleware.ts` strips `/en|/ru|/uz`; do not add locale-aware links here.
- `next.config.ts` uses `output: 'standalone'` and `transpilePackages: ['@talim/ui', '@talim/types']` — keep workspace UI/type imports transpiled.
