# Deployment Guide

## Option A — Docker Compose (single host)

Good for a demo deployment, a small internal tool, or a staging environment
on a single VM.

1. Copy the production env template and fill it in:
   ```bash
   cp backend/.env.production.example backend/.env.production
   # edit backend/.env.production with real values — see ENV_VARIABLES.md
   ```
2. Export the two secrets docker-compose reads from the shell (or use a
   `.env` file in the repo root, which Compose reads automatically):
   ```bash
   export JWT_SECRET="$(openssl rand -base64 48)"
   export GEMINI_API_KEY="your-real-key"
   ```
3. Build and start everything:
   ```bash
   docker compose up -d --build
   ```
4. Run the one-time database seeding (schema/seed/migrations run
   automatically via Postgres init scripts on first boot — this step is
   just the bcrypt-hashed user accounts):
   ```bash
   cd backend
   DB_HOST=localhost npm run seed:users
   ```
5. Verify:
   - `curl http://localhost:4000/api/health` → `{"status":"ok",...}`
   - Visit `http://localhost:5173`

### Updating the frontend's API URL for a real domain

The frontend bakes `VITE_API_BASE_URL` in at build time. If you're serving
the API from a real domain instead of `localhost:4000`, rebuild with:

```bash
docker compose build --build-arg VITE_API_BASE_URL=https://api.your-domain.example/api frontend
docker compose up -d frontend
```

(Or edit the `args:` block for the `frontend` service in `docker-compose.yml`
directly and rebuild.)

### Health checks

All three services (`db`, `backend`, `frontend`) define Docker
`HEALTHCHECK`/`healthcheck` directives, and `backend`/`frontend` wait on
their dependency's healthcheck via `depends_on: condition: service_healthy`
— so `docker compose up` won't consider the stack "up" until the database
is actually accepting connections and the API is actually responding.

## Option B — Separate managed services

For a real production deployment, running Postgres yourself in a container
next to the app is usually not what you want. A more typical layout:

- **Database**: a managed Postgres instance (RDS, Cloud SQL, Supabase,
  Neon, etc.) — set `DB_HOST`, `DB_SSL=true`, and use the provider's
  connection details.
- **Backend**: deploy the `backend` Docker image (or `npm run build && npm
  start` directly) to any container platform — Cloud Run, ECS/Fargate,
  Render, Railway, Fly.io, a plain VM behind a reverse proxy, etc.
- **Frontend**: the built frontend is static files (`frontend/dist` after
  `npm run build`) — serve them from any static host/CDN (S3+CloudFront,
  Netlify, Vercel, Cloudflare Pages) or keep using the nginx container.
  Whichever you choose, the SPA needs a fallback-to-`index.html` rule for
  client-side routes — `frontend/nginx.conf` shows the pattern if your host
  needs an equivalent config.

Steps:

1. Provision the database, run migrations (`DATABASE_URL` pointed at the
   managed instance):
   ```bash
   cd backend
   npm run db:schema
   npm run db:seed
   npm run db:migrate
   npm run seed:users
   ```
2. Set all required backend env vars in your platform's environment/secret
   configuration (see [ENV_VARIABLES.md](./ENV_VARIABLES.md)).
3. Deploy the backend. Confirm `/api/health` responds `"db": "connected"`.
4. Build the frontend with `VITE_API_BASE_URL` pointed at the deployed
   backend's public URL, then deploy the static output.
5. Update `CORS_ORIGIN` on the backend to the frontend's real origin (and
   redeploy/restart the backend) — until this matches exactly, the browser
   will block all API requests with a CORS error.

## Zero-downtime considerations (if you get there)

This project's current setup assumes a maintenance-window style deploy
(brief downtime acceptable). If you need zero-downtime deploys later,
you'd want to add, roughly in priority order:

1. **Rolling deploys** for the backend (run N+1 replicas behind a load
   balancer, drain old ones) — most container platforms do this for you.
2. **Backward-compatible migrations** — add columns as nullable first, add
   NOT NULL/defaults in a follow-up deploy, never rename/drop a column the
   currently-running code still reads.
3. **JWT secret rotation without logging everyone out** — support verifying
   against two secrets during a rollover window.

None of this is implemented today — noting it here so it isn't confused
with something this codebase already handles.

## Rollback

Because there's no automated migration runner tracking applied versions,
rollback is manual:

- **App code**: redeploy the previous Docker image tag / git commit.
- **Database**: this project doesn't ship down-migrations. For anything
  beyond the initial schema, take a database snapshot/backup *before*
  applying a new migration in production, and restore from it if needed.

## Monitoring

- `GET /api/health` — checks the DB connection; wire this into your
  platform's health-check / uptime monitoring.
- Structured JSON logs (via pino) on stdout — pipe these into whatever log
  aggregator your platform provides (CloudWatch, Stackdriver, Datadog,
  etc.). Sensitive fields (`Authorization` headers, password/token fields)
  are redacted before logging — see `backend/src/config/logger.ts`.
- The **Security Events** and **Security Analytics** admin dashboards are
  themselves a monitoring surface for anomalous usage of the banking
  assistant — consider alerting on a spike in `critical`-band events via
  whatever your log aggregator supports.
