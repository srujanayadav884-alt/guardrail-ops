# Setup Guide

Follow these steps in order for a working local install. For a from-scratch
Docker install, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) instead —
this guide covers running the backend and frontend directly on your machine.

## Prerequisites

- Node.js 20+
- PostgreSQL 16 (or compatible; see [DATABASE_SETUP.md](./DATABASE_SETUP.md))
- A Gemini API key (see [ENV_VARIABLES.md](./ENV_VARIABLES.md#getting-a-gemini-api-key))
- (Optional) Docker + Docker Compose, if you'd rather not install Postgres/Node locally

## 1. Install dependencies

```bash
cd guardrail-ops/backend
npm install

cd ../frontend
npm install
```

## 2. Create the PostgreSQL database

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for full detail. Short version:

```bash
createdb guardrail_ops
```

## 3. Configure the `.env` files

```bash
cd guardrail-ops/backend
cp .env.example .env
# edit .env — at minimum set JWT_SECRET and DB_* to match step 2

cd ../frontend
cp .env.example .env
# defaults are fine for local dev
```

Full variable reference: [ENV_VARIABLES.md](./ENV_VARIABLES.md).

## 4. Add the Gemini API key

Edit `backend/.env` and set `GEMINI_API_KEY`. See
[ENV_VARIABLES.md](./ENV_VARIABLES.md#getting-a-gemini-api-key) for how to get one.

## 5. Run database migrations and seed data

```bash
cd guardrail-ops/backend

# Schema + base seed data (roles, sample policies)
npm run db:schema
npm run db:seed

# Indexes for the Security Events dashboard (safe to re-run)
npm run db:migrate

# Admin + demo accounts (bcrypt-hashed passwords, not in SQL)
npm run seed:users
```

This creates `admin@guardbank.com`, `security@guardbank.com`, and
`demo@guardbank.com`, all with the password `ChangeMe123!` (or whatever you
set `SEED_DEFAULT_PASSWORD` to). **Change these before any shared or public
use.**

## 6. Start the backend server

```bash
cd guardrail-ops/backend
npm run dev
```

You should see `GuardRail-Ops API listening on port 4000 (development)` and
`PostgreSQL connection OK`. Verify with:

```bash
curl http://localhost:4000/api/health
```

## 7. Start the frontend server

In a second terminal:

```bash
cd guardrail-ops/frontend
npm run dev
```

Visit **http://localhost:5173**.

## 8. Verify everything works

1. Register a new customer account, or log in as `demo@guardbank.com`.
2. Open the **Banking Assistant** tab and ask a banking question — you
   should see the reply stream in token by token.
3. Ask a non-banking question ("What is AI?") — it should be refused
   immediately.
4. Ask something containing "password", "OTP", "PIN", or "CVV" — it should
   be blocked by the Policy Engine.
5. Log out, then sign in at `/admin/login` as `admin@guardbank.com` or
   `security@guardbank.com`.
6. Open **Security Events** — you should see every message you just sent,
   with attack type, risk score, and decision.

## Running the test suite

```bash
cd guardrail-ops/backend
npm test
```

See the **Testing** section of the main [README](../README.md) for what's
covered and how the tests are structured.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Backend exits immediately with env variable errors | `JWT_SECRET` missing/too short, or another required var unset — check `backend/.env` against `.env.example` |
| `PostgreSQL connection OK` never appears | Postgres isn't running, or `DB_HOST`/`DB_PORT`/credentials don't match your local setup |
| Assistant replies with "not fully configured yet" | `GEMINI_API_KEY` is missing from `backend/.env` |
| Frontend can't reach the API / CORS errors | `CORS_ORIGIN` in `backend/.env` doesn't match the URL you're loading the frontend from |
| Login works but admin pages 403 | You're logged in as a customer — admin pages require `admin@guardbank.com` / `security@guardbank.com` via `/admin/login` |
