# Epic prompts

Self-contained **Cursor prompts** for each product epic. The roadmap overview lives in [../PLANS.md](../PLANS.md).

## How to use

Paste into Cursor — **one line is enough:**

```
@docs/plans/epic-5-usage-metering.md
```

Or copy the fenced prompt block from the epic file. Rules (`api-express-prisma`, `web-next-patterns`, etc.) load automatically via `.cursor/rules/docs-plans.mdc` — no manual `@` tags.

## Prompt index

| Epic | File | Build when |
|------|------|------------|
| 5 — Usage metering | [epic-5-usage-metering.md](./epic-5-usage-metering.md) | **First** — foundation for billing & admin costs |
| 1 — Subscriptions & billing | [epic-1-subscriptions-billing.md](./epic-1-subscriptions-billing.md) | After Epic 5 |
| 3 — Tenant + learner | [epic-3-tenant-experience.md](./epic-3-tenant-experience.md) | After Epic 1 |
| 2 — Admin panel | [epic-2-admin-panel.md](./epic-2-admin-panel.md) | After Epic 5 (Epic 1 optional) |
| 4 — Individual freemium UX | [epic-4-individual-freemium.md](./epic-4-individual-freemium.md) | After Epic 1 |
| 6 — Tenant AI assistant | [epic-6-tenant-assistant.md](./epic-6-tenant-assistant.md) | After Epic 3 |

## Backlog prompts

New ideas: add `docs/plans/backlog/<slug>.md` using the template in [../PLANS.md](../PLANS.md#backlog).
