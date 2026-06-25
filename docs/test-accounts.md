# Test accounts

> ⚠️ **Security:** these are shared test credentials for **dev + prod**. Keep this
> repo private. Rotate or delete these accounts before any public exposure, and
> never reuse these passwords for real users.

Created with the real code paths (tenant-owner script + `/auth/register` +
`POST /tenant/students`). The **same credentials work on both dev and prod**.

| Role | Login (email / username) | Password | Notes |
| --- | --- | --- | --- |
| INDIVIDUAL (B2C learner) | `individual@talim.test` | `Individual2026` | FREE plan |
| TENANT_OWNER (tutor) | `owner@talim.test` | `Owner2026pass` | Org **Demo Academy** · TENANT_STARTER (ACTIVE) |
| TENANT_LEARNER (student) | `student1` | `Student2026` | Belongs to Demo Academy · synthetic email `student1@students.talim.local` |

## Where to sign in

- **Dev:** http://localhost:3000/uz/login
- **Prod:** https://talim-ai.uz/uz/login
- The student logs in with the **username** `student1` (or the synthetic email). The
  others use their email.
- All three live in the learner/tenant web app (`apps/web`). Platform **admins** use
  the separate admin panel (`apps/admin`) — none of these accounts are admins.

## Post-login landing

- INDIVIDUAL → `/dashboard`
- TENANT_OWNER → `/tenant/dashboard`
- TENANT_LEARNER → `/learner/dashboard`

## Recreate / reset

```bash
# Owner (dev)
pnpm create-tenant-owner --email owner@talim.test --password Owner2026pass --orgName "Demo Academy" --name "Test Owner"
# Owner (prod)
docker exec talim-ai-api-1 node dist/scripts/create-tenant-owner.js --email owner@talim.test --password Owner2026pass --orgName "Demo Academy" --name "Test Owner"
```

The individual is created via `POST /auth/register`; the student via
`POST /tenant/students` (owner-authed). Both scripts/endpoints are idempotent-ish
(re-running updates the owner; duplicate register/student returns 409).
