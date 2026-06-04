# Deploy talim-ai to VPS (Docker)

## Stack

- **Compose:** `docker-compose.yml` + `docker-compose.prod.yml`
- **Secrets:** Doppler project `talim-ai`, config **`prd`** (server/CI only)
- **Proxy:** nginx container on ports 80/443
- **Path on VPS:** `~/talim-ai` (e.g. `/root/talim-ai` when `VPS_USER=root`)

## One-time VPS setup

1. Stop legacy apps (jarviddin/Caddy) so ports 80/443 are free.
2. Install Docker Engine + Compose plugin, git, Doppler CLI.
3. Clone repo:

```bash
git clone https://github.com/KAMRONBEK/talim-ai.git ~/talim-ai
cd ~/talim-ai
```

4. Add swap if builds OOM on a 2GB VPS:

```bash
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
```

## Doppler `prd` secrets

Set in Doppler dashboard or CLI (do **not** put real values in git):

| Secret | Production example |
|--------|-------------------|
| `JWT_SECRET` | 32+ character random string |
| `DEEPSEEK_API_KEY` | Your API key |
| `OPENAI_API_KEY` | Optional |
| `CORS_ORIGIN` | `http://talim-ai.uz` |
| `NEXT_PUBLIC_API_URL` | `http://talim-ai.uz/api` |

Do **not** set `DATABASE_URL` / `REDIS_URL` to `localhost` in `prd` — Compose uses internal Docker hostnames (`db`, `redis`).

Create a **service token** for `talim-ai` / `prd` and add to GitHub:

- `DOPPLER_TOKEN`
- `VPS_HOST`, `VPS_USER` (e.g. `root`), `VPS_SSH_KEY`

## Manual deploy

```bash
cd ~/talim-ai
git pull origin main
export DOPPLER_TOKEN='<prd-service-token>'
doppler run --project talim-ai --config prd -- \
  docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

## Verify

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
curl -I http://127.0.0.1/ -H 'Host: talim-ai.uz'
curl -s http://127.0.0.1/api/health -H 'Host: talim-ai.uz'
```

## CI deploy

Pushes to `main` run [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml).

## Cursor MCP ops

Project MCP `talim-vps` uses Doppler `dev` + `TALIM_VPS_SSH_PASSWORD` for SSH from your machine. Production deploys use `prd` on the server.

## SSL (later)

1. Obtain certs (certbot) into compose volumes `certbot_www` / `certbot_conf`.
2. Uncomment HTTPS server blocks in [`nginx.conf`](../nginx.conf).
