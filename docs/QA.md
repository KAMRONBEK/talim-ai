# QA with Playwright MCP (Cursor)

Project MCP **`playwright`** runs [@playwright/mcp](https://playwright.dev/docs/getting-started-mcp) so the agent can open the app in a real browser, interact like a user, and report issues.

Enable in Cursor: **Settings → MCP** → turn on **playwright** (loads from [`.cursor/mcp.json`](../.cursor/mcp.json)).

First run installs Chromium via Playwright (~one-time download).

## URLs

| Environment | Base URL |
|-------------|----------|
| Local dev | `http://localhost:3000` (run `pnpm dev` first) |
| Production | `http://talim-ai.uz` |

API health (browser or curl): `http://localhost:4000/api/health` or `http://talim-ai.uz/api/health`

## Example prompts

**Smoke test (local):**

> Open http://localhost:3000, take a snapshot, check for console errors, and confirm the home page loads.

**After a UI change:**

> Test the chat flow on localhost:3000 as a new user would: open the page, start a conversation, send a message, verify a response appears. List bugs and missing states.

**Production check:**

> Open http://talim-ai.uz, verify the page loads (200), hit /api/health, report any broken assets or console errors.

**Regression loop:**

> Implement X, then use Playwright MCP to test X on localhost:3000 and give me a QA report before we commit.

## Tips

- Run **`pnpm dev`** (or `pnpm dev:infra && pnpm dev`) before testing localhost.
- Use **headed** mode (default) to watch the agent; add `--headless` to MCP args for CI-style runs.
- For logged-in flows, provide test credentials in chat (store real secrets in Doppler `dev`, not in git).
- **`talim-vps`** MCP is for server/docker ops; **`playwright`** is for UI QA — use both when needed.
- **Cleanup after QA:** delete repo-root `*.png` screenshots and `.playwright-mcp/` snapshots before committing. They are gitignored and must not be left in the workspace (see `.cursor/rules/mcp-qa.mdc`).

## Optional: headless MCP args

In `.cursor/mcp.json`, append to `playwright` args if you prefer no visible browser window:

```json
"args": ["-y", "@playwright/mcp@latest", "--headless"]
```
