# PostgreSQL Database Setup Guide

## Option A — Docker (recommended)

From the repo root:

```bash
docker compose up -d db
```

This starts Postgres 16 on `localhost:5432` and automatically runs, in order:

1. `backend/src/db/schema.sql` — creates all tables
2. `backend/src/db/seed.sql` — seeds roles + starter policies
3. `backend/src/db/migrations/001_security_events_indexes.sql` — adds indexes

on first container start (via Postgres's `docker-entrypoint-initdb.d`
mechanism — these only run once, against an empty data volume).

You still need to run `npm run seed:users` afterward (see below) — user
accounts are seeded from Node so their passwords are bcrypt-hashed rather
than hardcoded in SQL.

## Option B — Local PostgreSQL install

1. Install PostgreSQL 16 (or a compatible version) and make sure the
   service is running.
2. Create the database:
   ```bash
   createdb guardrail_ops
   ```
3. Apply the schema, seed data, and migration:
   ```bash
   cd backend
   export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/guardrail_ops"
   npm run db:schema
   npm run db:seed
   npm run db:migrate
   ```
   (Adjust the connection string to match your local Postgres user/password.)

## Seeding user accounts (both options)

```bash
cd backend
npm run seed:users
```

Creates:

| Email | Role | Password |
|---|---|---|
| `admin@guardbank.com` | admin | `ChangeMe123!` |
| `security@guardbank.com` | security_admin | `ChangeMe123!` |
| `demo@guardbank.com` | customer | `ChangeMe123!` |

Set `SEED_DEFAULT_PASSWORD` in `backend/.env` before running this script to
use a different password. **Rotate these before any shared or public
deployment.**

## Schema overview

| Table | Purpose |
|---|---|
| `roles` | `customer` / `admin` / `security_admin` |
| `users` | Accounts, bcrypt password hashes, role, active status |
| `bank_accounts` | Fictional GuardBank accounts per user |
| `transactions` | Account transaction history |
| `chat_history` | Every banking-assistant message (masked before storage) |
| `policies` | Admin-manageable policy metadata (PII / prompt-injection / topic / rate-limit categories) |
| `security_logs` | Every GuardRail-Ops security decision — query snippet, event type, severity, IP, timestamp, structured `details` JSONB |
| `alerts` | Raised automatically for high/critical-severity security events |
| `risk_scores` | Per-message risk score (0–100), band, and factor breakdown |
| `notifications` | User-facing notifications |

Full column definitions live in `backend/src/db/schema.sql` — that file is
the source of truth; this table is just an index into it.

## Migrations

Migrations live in `backend/src/db/migrations/`, numbered in run order. All
statements in this project's migrations are idempotent (`IF NOT EXISTS`),
so it's safe to re-run `npm run db:migrate` — it won't error on a database
that already has the indexes.

When you need to add a new migration:

1. Create `backend/src/db/migrations/00N_description.sql`.
2. Write idempotent SQL (`IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, etc.)
   wherever possible.
3. Add a corresponding `npm run db:migrate:00N` script if you want it
   runnable independently, or extend `db:migrate` to run all migration
   files in order.
4. Document the change here.

## Resetting the database (local dev only)

`schema.sql` starts with `DROP TABLE IF EXISTS ...` for every table, so
re-running it wipes and recreates everything:

```bash
npm run db:schema
npm run db:seed
npm run db:migrate
npm run seed:users
```

**Never do this against a database with real data** — there is no
confirmation prompt, and it is destructive by design (this is a demo/dev
convenience, not a production migration tool).

## Backups (production)

This project doesn't include a backup mechanism — for a real deployment,
use your PostgreSQL provider's automated backups (most managed providers —
RDS, Cloud SQL, Supabase, etc. — enable this by default) or `pg_dump` on a
schedule if self-hosting.
