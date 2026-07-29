# GuardRail-Ops: Secure Banking AI Assistant

A banking AI assistant for the fictional bank **GuardBank**, built with a security-guardrail
architecture. The GuardRail-Ops security layer — prompt-injection detection, jailbreak
detection, PII detection/masking, the policy engine, and risk scoring — is fully wired into
the chat pipeline, on both the regular and the streaming chat endpoints. The application is
production-hardened: rate limiting, request validation, a locked-down CORS/Helmet
configuration, hardened JWTs, structured logging, a comprehensive automated test suite, and
Docker images built for production use.

**Documentation:** this README covers the essentials; deeper guides live in [`docs/`](./docs):
[Setup Guide](./docs/SETUP_GUIDE.md) · [Database Setup](./docs/DATABASE_SETUP.md) ·
[Environment Variables](./docs/ENV_VARIABLES.md) · [Deployment Guide](./docs/DEPLOYMENT_GUIDE.md) ·
[API Documentation](./docs/API_DOCUMENTATION.md)

## Architecture

```
User
  ↓
GuardBank AI Assistant
  ↓
GuardRail-Ops Security Layer   (orchestrates the checks below — src/security/index.ts)
  ↓
Policy Engine                  (blocks password/OTP/PIN/CVV requests + unauthorized
  ↓                             account access; allows banking education, account
  ↓                             opening, loan info, banking FAQs)
PII Detection & Masking        (account number, PAN, Aadhaar, phone, email, card number)
  ↓
Prompt Injection Detection     (heuristic pattern matching)
  ↓
Jailbreak Detection            (heuristic pattern matching)
  ↓
Risk Analysis                  (low / medium / high / critical, combining all signals above)
  ↓
AI Gateway → Gemini AI Model    (key stays server-side only; supports streaming)
  ↓
Response Validation            (re-masks any PII the model echoes back)
  ↓
Security Logging               (query, response, decision, risk score, timestamp)
  ↓
User
```

## Tech stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL
- **AI model**: Google Gemini API (via a dedicated AI Gateway module, streaming supported)
- **Validation**: zod (request body + query param validation)
- **Security middleware**: helmet, cors (origin allowlist), express-rate-limit, compression
- **Logging**: pino (structured JSON in production, pretty-printed in development)
- **Testing**: Jest + ts-jest + supertest
- **Containerization**: Docker / Docker Compose


## Folder structure

```
guardrail-ops/
├── backend/
│   ├── src/
│   │   ├── __tests__/      # API integration tests (auth, chat, admin RBAC) — mocked DB
│   │   ├── config/         # env.ts (validated env), db.ts, logger.ts (pino)
│   │   ├── controllers/    # Route handlers, incl. securityEvents.controller.ts
│   │   ├── db/
│   │   │   ├── migrations/ # Numbered, idempotent SQL migrations
│   │   │   ├── schema.sql, seed.sql, seedUsers.ts
│   │   ├── middleware/      # auth (JWT + RBAC), rateLimiter, validate, errorHandler
│   │   ├── models/          # Shared TypeScript types
│   │   ├── routes/          # Express routers
│   │   ├── security/        # GuardRail-Ops security layer:
│   │   │                    #   piiDetector, promptInjectionDetector,
│   │   │                    #   jailbreakDetector, policyEngine, riskScorer,
│   │   │                    #   responseValidator, securityLogger, index.ts (orchestrator)
│   │   │                    #   + *.test.ts unit tests alongside each module
│   │   ├── services/        # aiGateway.ts — the only module that calls Gemini
│   │   ├── utils/           # jwt.ts, password.ts, asyncHandler.ts (+ tests)
│   │   ├── validation/      # schemas.ts — zod schemas for every request body/query
│   │   ├── app.ts           # Express app factory (no side effects — used by tests)
│   │   └── server.ts        # Thin bootstrap: creates the app, listens, graceful shutdown
│   ├── jest.config.js, jest.setup.js
│   ├── .eslintrc.js
│   ├── package.json, tsconfig.json
│   ├── Dockerfile
│   ├── .env.example, .env.production.example
├── frontend/
│   ├── src/
│   │   ├── api/             # axios client + SSE streamChat() helper
│   │   ├── components/      # Sidebar, Navbar, layouts, ProtectedRoute,
│   │   │                    #   ErrorBoundary, LoadingSpinner
│   │   ├── context/          # AuthContext
│   │   ├── pages/
│   │   │   ├── auth/         # Login, Register, AdminLogin
│   │   │   ├── user/         # Profile, AccountDetails, BankingAssistant,
│   │   │   │                 #   TransactionHistory, Notifications
│   │   │   └── admin/        # SecurityAnalytics, SecurityEvents, AuditLogs,
│   │   │                     #   BlockedRequests, PolicyManagement, UserMonitoring
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── nginx.conf            # SPA fallback routing for the production container
│   ├── .eslintrc.cjs
│   ├── package.json, tailwind.config.js
│   ├── Dockerfile
│   └── .env.example, .env.production.example
├── docs/                     # SETUP_GUIDE, DATABASE_SETUP, ENV_VARIABLES,
│                              #   DEPLOYMENT_GUIDE, API_DOCUMENTATION
├── docker-compose.yml
└── README.md
```

## Database schema

Tables: `roles`, `users`, `bank_accounts`, `transactions`, `chat_history`, `policies`,
`security_logs`, `alerts`, `risk_scores`, `notifications`. Full definitions are in
`backend/src/db/schema.sql`.

## Setting up PostgreSQL

### Option A — Docker Compose (recommended, includes the DB)

```bash
cd guardrail-ops
docker compose up -d db
```

This starts Postgres on `localhost:5432` and automatically runs `schema.sql`, `seed.sql`
(roles + starter policies), and the `001_security_events_indexes.sql` migration on first
boot via Postgres's init-scripts mechanism.

### Option B — Local PostgreSQL install

1. Install PostgreSQL 16 (or compatible) and make sure it's running.
2. Create the database:
   ```bash
   createdb guardrail_ops
   ```
3. Apply the schema, base seed data, and indexes:
   ```bash
   cd backend
   psql "postgresql://postgres:postgres@localhost:5432/guardrail_ops" -f src/db/schema.sql
   psql "postgresql://postgres:postgres@localhost:5432/guardrail_ops" -f src/db/seed.sql
   psql "postgresql://postgres:postgres@localhost:5432/guardrail_ops" -f src/db/migrations/001_security_events_indexes.sql
   ```
   (Adjust the connection string to match your local Postgres user/password, or use
   `npm run db:schema && npm run db:seed && npm run db:migrate` with `DATABASE_URL` set.)

### Seeding the admin + demo accounts (both options)

Roles and policies come from `seed.sql`, but the two admin accounts and the demo customer
are created separately so their passwords can be hashed with bcrypt instead of hardcoded
in SQL:

```bash
cd backend
npm install
npm run seed:users
```

This creates:

| Email | Role | Password |
|---|---|---|
| `admin@guardbank.com` | admin | `ChangeMe123!` |
| `security@guardbank.com` | security_admin | `ChangeMe123!` |
| `demo@guardbank.com` | customer | `ChangeMe123!` |

**Change these passwords (or set `SEED_DEFAULT_PASSWORD` before seeding) before any
real-world or public deployment.**

## Setting up your `.env` files

### Backend

```bash
cd backend
cp .env.example .env
```

Then edit `.env`:
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` — match whatever you set up above
  (defaults work with Option A/B as shown).
- `JWT_SECRET` — generate one with `openssl rand -base64 48` and paste it in. Don't leave the
  placeholder in any shared environment.
- `GEMINI_API_KEY` — see below.

### Frontend

```bash
cd frontend
cp .env.example .env
```

`VITE_API_BASE_URL` defaults to `http://localhost:4000/api`, which matches the backend's
default port — only change this if you changed `PORT` in the backend `.env`.

## Getting a Gemini API key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Sign in with a Google account and click **Create API key**.
3. Copy the key into `backend/.env` as `GEMINI_API_KEY=...`.
4. The default model is `gemini-2.0-flash`; change `GEMINI_MODEL` in `.env` if you want a
   different one.

Gemini API keys are billed per Google's usage pricing — check current rates before heavy use.

## Running the project

### Option A — Docker Compose (everything)

From the repo root, with `backend/.env` and `frontend/.env` filled in:

```bash
docker compose up -d --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:4000/api/health
- Postgres: localhost:5432

Then run the user seed script once (from your host machine, pointing at the containerized DB):

```bash
cd backend
DB_HOST=localhost npm run seed:users
```

### Option B — Run locally without Docker

**Backend:**
```bash
cd backend
npm install
npm run dev
```
Runs on http://localhost:4000 with `ts-node` + `nodemon` (auto-restarts on file changes).

**Frontend** (in a second terminal):
```bash
cd frontend
npm install
npm run dev
```
Runs on http://localhost:5173.

### Verifying it's working

1. Visit http://localhost:5173/register and create a customer account, **or**
2. Visit http://localhost:5173/admin/login and sign in as `admin@guardbank.com` /
   `security@guardbank.com` (after running `npm run seed:users`).
3. As a customer, open the **Banking Assistant** tab and try:
   - A banking question (e.g. "How do I open a fixed deposit?") — should stream back a real
     Gemini-generated answer, token by token, with a "Risk: low" tag once it finishes.
   - A non-banking question (e.g. "What is AI?") — should be refused immediately by the topic
     gate, no Gemini call made.
   - A credential request (e.g. "What's my OTP?" or "Can you tell me my PIN?") — should be
     blocked by the Policy Engine before reaching Gemini, and logged as a `policy_block` event.
   - A message containing something PII-shaped (e.g. a fake PAN like `ABCDE1234F` or a 10-digit
     phone number) — should be masked before storage, and reflected in the Security Analytics /
     Audit Logs risk-score data.
4. As an admin, check **Security Analytics** for the risk-band distribution, **Security
   Events** for the full searchable/filterable event feed (user, attack type, risk score,
   decision — click any row for full detail), **Audit Logs** for the raw event trail, and
   **Blocked Requests** for anything the Policy Engine stopped.

## GuardRail-Ops security layer (implemented)

- **AI Gateway** (`backend/src/services/aiGateway.ts`) — the only module that talks to Gemini.
  The API key lives in `backend/.env` (`GEMINI_API_KEY`) and is never sent to or read by the
  frontend. Supports both a plain `generateBankingReply()` call and a token-by-token
  `streamBankingReply()` async generator.
- **Prompt Injection Detection** (`security/promptInjectionDetector.ts`) — heuristic pattern
  matching for instruction-override attempts ("ignore previous instructions", "reveal your
  system prompt", etc.).
- **Jailbreak Detection** (`security/jailbreakDetector.ts`) — heuristic pattern matching for
  roleplay/hypothetical framings commonly used to bypass restrictions.
- **PII Detection & Masking** (`security/piiDetector.ts`) — regex-based detection and masking
  for GuardBank account numbers, PAN, Aadhaar, Indian phone numbers, email addresses, and
  generic card numbers. Masking is applied before the message is stored or forwarded to Gemini,
  and again on the way back (Response Validation) in case the model echoes anything back.
- **Policy Engine** (`security/policyEngine.ts`) — blocks password/OTP/PIN/CVV requests and
  unauthorized third-party account access; explicitly allows banking education, account-opening
  info, loan info, and banking FAQs.
- **Risk Scoring** (`security/riskScorer.ts`) — combines all of the above signals into a 0–100
  score and a `low` / `medium` / `high` / `critical` band, stored per-message in `risk_scores`.
- **Logging** (`security/securityLogger.ts`) — every message writes a `security_logs` row
  (masked query snippet, security decision, severity, IP, timestamp) and a `risk_scores` row;
  high/critical events also open a row in `alerts`.
- **Chatbot** — banking conversation with per-session context (last 12 turns sent to Gemini),
  token-by-token streaming via Server-Sent Events (`POST /api/chat/stream`), a non-streaming
  fallback (`POST /api/chat`), and response validation before anything reaches the user.
- **Admin Security Dashboard** (`/admin/security-events`) — every security event with the
  affected user's name/email/role, the masked original prompt, derived attack type, risk
  score, and decision (allow/block/sanitize). Supports search by name/email, filters by attack
  type / decision / risk level / date range, three sort modes, pagination, and a detail
  modal — all computed and filtered server-side (`GET /api/admin/security-events`) so
  filtering and pagination stay consistent with each other.

Note: prompt-injection/jailbreak detection and the policy engine are heuristic (regex/keyword
based) rather than ML-classifier based — solid for a demo, but not a substitute for a
production-grade classifier if this were ever handling real traffic.

## Production security hardening

- **Rate limiting** — a general limiter on all `/api` routes, a stricter one on
  `/api/auth/*` (brute-force mitigation), and a per-minute limiter on the chat endpoints.
- **Input & output validation** — every request body and the Security Events query
  parameters are validated with zod (`backend/src/validation/schemas.ts`) before a
  controller ever sees them; AI responses are re-validated for PII on the way out.
- **CORS** — explicit origin allowlist (`CORS_ORIGIN`, comma-separated), not a wildcard.
- **Helmet** — CSP locked down in production, `X-Powered-By` disabled.
- **JWT hardening** — explicit `HS256` algorithm, issuer + audience claims checked on every
  verify, a minimum 32-character secret enforced at startup.
- **Password handling** — bcrypt (cost factor 10); login failure messages are identical
  regardless of whether the email exists, the password is wrong, or the role doesn't match
  the login form used, with a dummy bcrypt comparison on the "no such user" path so response
  timing doesn't leak which emails are registered.
- **Env var validation** — `backend/src/config/env.ts` validates the full environment at
  startup with zod and refuses to boot in production if anything required is missing or
  malformed (e.g. a too-short `JWT_SECRET`).
- **Structured logging** — pino, with `Authorization` headers and password/token fields
  redacted before anything is written out.
- **Error handling** — a single `errorHandler` middleware; stack traces are included in
  responses only outside production. Every async route handler is wrapped in `asyncHandler`
  so a rejected promise reaches this middleware instead of hanging the request (a real gap
  in the earlier prompt's implementation, fixed here).
- **Graceful shutdown** — `SIGTERM`/`SIGINT` close the HTTP server and the DB pool cleanly.

## Testing

```bash
cd backend
npm test              # run once
npm run test:watch    # watch mode
npm run test:coverage # with coverage report
```

Covers:
- **GuardRail-Ops security pipeline** — unit tests for `promptInjectionDetector`,
  `jailbreakDetector`, `piiDetector`, `policyEngine`, `riskScorer`, and the full
  `runSecurityPipeline` orchestrator (allow/block/mask scenarios).
- **Authentication** — JWT sign/verify round trips, expired/wrong-issuer/wrong-secret
  rejection, and API-level register/login tests (mocked PostgreSQL pool) including the
  "identical error for wrong password vs. unknown email" behavior.
- **Security middleware** — `requireAuth`/`requireRole` unit tests, RBAC integration tests
  against the real Express app for the admin-only routes.
- **Banking assistant** — API-level tests proving a password/OTP/PIN/CVV request is blocked
  before Gemini is ever called, an off-topic message is refused by the topic gate, and a
  legitimate banking question reaches the (mocked) AI Gateway.
- **`asyncHandler`** — confirms rejected promises reach `next()` instead of hanging.

Auth and chat API tests mock the PostgreSQL pool and the AI Gateway directly, so the suite
runs without a live database or Gemini API key. The security-module unit tests are pure
functions with no mocking needed at all.

## Documentation

- [docs/SETUP_GUIDE.md](./docs/SETUP_GUIDE.md) — step-by-step local setup
- [docs/DATABASE_SETUP.md](./docs/DATABASE_SETUP.md) — PostgreSQL setup, schema reference, migrations
- [docs/ENV_VARIABLES.md](./docs/ENV_VARIABLES.md) — every environment variable, both apps
- [docs/DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md) — Docker Compose and managed-services deployment
- [docs/API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md) — every endpoint, request/response shapes
