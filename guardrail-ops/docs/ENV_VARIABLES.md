# Environment Variable Guide

## Backend (`backend/.env`)

Copy `backend/.env.example` to `backend/.env` and fill in. For a production
deployment, start from `backend/.env.production.example` instead.

| Variable | Required | Default | Notes |
|---|---|---|---|
| `NODE_ENV` | No | `development` | `development` \| `test` \| `production`. Controls error verbosity, CSP, logging format. |
| `PORT` | No | `4000` | Port the API listens on. |
| `CORS_ORIGIN` | **Yes** | — | Comma-separated list of allowed frontend origins, e.g. `http://localhost:5173` or `https://app.example.com,https://staging.example.com`. No wildcards. |
| `DB_HOST` | **Yes** | — | PostgreSQL host. |
| `DB_PORT` | No | `5432` | PostgreSQL port. |
| `DB_USER` | **Yes** | — | PostgreSQL user. |
| `DB_PASSWORD` | **Yes** | — | PostgreSQL password. |
| `DB_NAME` | **Yes** | — | Database name. |
| `DB_SSL` | No | `false` | Set `true` to require SSL to Postgres (recommended for managed DB providers in production). |
| `DATABASE_URL` | Only for `npm run db:*` scripts | — | Full psql connection string used by the schema/seed/migrate scripts. |
| `JWT_SECRET` | **Yes** | — | **Must be ≥32 characters.** The server refuses to start in production without one. Generate with `openssl rand -base64 48`. |
| `JWT_EXPIRES_IN` | No | `2h` | Access token lifetime (jsonwebtoken duration string). |
| `JWT_ISSUER` | No | `guardrail-ops` | Embedded in and verified against every token. |
| `JWT_AUDIENCE` | No | `guardbank-clients` | Embedded in and verified against every token. |
| `GEMINI_API_KEY` | Recommended | — | Without it, the assistant responds with a "not fully configured" message instead of calling Gemini. Never exposed to the frontend. |
| `GEMINI_MODEL` | No | `gemini-2.0-flash` | Any Gemini model your key has access to. |
| `RATE_LIMIT_WINDOW_MS` | No | `900000` (15 min) | Window for the general API rate limiter. |
| `RATE_LIMIT_MAX` | No | `300` | Max requests per window per IP, all `/api` routes. |
| `AUTH_RATE_LIMIT_MAX` | No | `10` | Max requests per window per IP, `/api/auth/*` only (brute-force mitigation). |
| `LOG_LEVEL` | No | `debug` (dev) / `info` (prod) | pino log level: `trace`\|`debug`\|`info`\|`warn`\|`error`\|`fatal`. |
| `SEED_DEFAULT_PASSWORD` | No | `ChangeMe123!` | Password assigned by `npm run seed:users`. Change before any shared use. |

### Getting a Gemini API key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Sign in with a Google account and click **Create API key**.
3. Copy the key into `backend/.env` as `GEMINI_API_KEY=...`.
4. Gemini API keys are billed per Google's usage pricing — check current
   rates before heavy use.

The key is read only by `backend/src/services/aiGateway.ts` (the AI
Gateway) from `process.env` on the server. It is never included in any
API response, never sent to the frontend, and never logged (the logger's
redaction rules strip `Authorization` headers and any `*.token` field, and
the key itself is never placed into a log call in the first place).

## Frontend (`frontend/.env`)

| Variable | Required | Default | Notes |
|---|---|---|---|
| `VITE_API_BASE_URL` | No | `http://localhost:4000/api` | Base URL the frontend calls. For Docker/production builds, this is baked in **at build time** (see below), not read at container runtime. |

### Important: Vite env vars are build-time, not runtime

Unlike the backend, `VITE_API_BASE_URL` is compiled into the JavaScript
bundle when you run `npm run build` (or the Docker image build). Changing
it in a running container's environment does nothing — you must rebuild
the frontend (or rebuild the Docker image with a different `--build-arg
VITE_API_BASE_URL=...`) to point it at a different backend.

## Secrets management in production

Never commit a filled-in `.env` file. In production:

- Use your platform's secret store (AWS Secrets Manager, GCP Secret
  Manager, Doppler, Vault, or your PaaS's built-in env var UI) to inject
  `JWT_SECRET`, `DB_PASSWORD`, and `GEMINI_API_KEY` at deploy time.
- Rotate `JWT_SECRET` periodically — this invalidates all existing
  sessions, so plan for it (e.g. a maintenance window or a dual-secret
  rollover if you need zero-downtime rotation, which this project does not
  implement out of the box).
- Rotate `GEMINI_API_KEY` if it's ever exposed (check your Google AI
  Studio console for usage anomalies first).
