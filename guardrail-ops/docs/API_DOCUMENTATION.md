# API Documentation

Base URL: `http://localhost:4000/api` (local dev) — all endpoints below are
relative to this.

Authentication: JWT bearer token in `Authorization: Bearer <token>`, issued
by the login endpoints. Tokens are HS256-signed, include an issuer and
audience claim, and expire after `JWT_EXPIRES_IN` (default 2h).

All endpoints are rate-limited (see [ENV_VARIABLES.md](./ENV_VARIABLES.md)
for the defaults); exceeding the limit returns `429` with `{"error": "..."}`.

All request bodies are validated; a failed validation returns:
```json
{ "error": "Validation failed", "details": [{ "field": "email", "message": "Invalid email" }] }
```

---

## Auth

### `POST /auth/register`
Create a new customer account.

**Body**
```json
{ "fullName": "Jane Doe", "email": "jane@example.com", "password": "StrongPass1", "phone": "9876543210" }
```
Password requirements: ≥8 chars, at least one uppercase, one lowercase, one number.

**Response `201`**
```json
{ "token": "...", "user": { "id": 1, "fullName": "Jane Doe", "email": "jane@example.com", "role": "customer" } }
```
`409` if the email is already registered.

### `POST /auth/login`
Customer login only (rejects admin/security_admin accounts).

**Body**: `{ "email": "...", "password": "..." }`
**Response `200`**: same shape as register.
**Response `401`**: `{ "error": "Invalid email or password" }` — returned identically for unknown email, wrong password, wrong role, or a disabled account (prevents user enumeration).

### `POST /auth/admin-login`
Admin / security_admin login only (rejects customer accounts).
Same request/response shape as `/auth/login`.

---

## Users *(requires auth)*

### `GET /users/me`
Returns the logged-in user's profile (`full_name`, `email`, `phone`, `role`, `last_login_at`, `created_at`).

### `PATCH /users/me`
**Body**: `{ "fullName"?: string, "phone"?: string }` — both optional.

---

## Accounts *(requires auth)*

### `GET /accounts`
Lists all bank accounts owned by the logged-in user.

### `GET /accounts/:id`
Single account detail — `404` if it doesn't belong to the caller.

---

## Transactions *(requires auth)*

### `GET /transactions?accountId=123`
Lists transactions for the caller's accounts (all accounts if `accountId` omitted), newest first, capped at 100.

---

## Notifications *(requires auth)*

### `GET /notifications`
Lists the caller's notifications, newest first.

### `PATCH /notifications/:id/read`
Marks one notification as read.

---

## Chat / Banking Assistant *(requires auth)*

### `POST /chat`
Non-streaming send. Every message passes through the full GuardRail-Ops
security pipeline before Gemini is ever called.

**Body**: `{ "message": "How do I open a fixed deposit?", "sessionId": "<uuid>" }`

**Response `200`**
```json
{ "reply": "...", "blocked": false, "riskBand": "low" }
```

`blocked: true` means the Policy Engine, prompt-injection/jailbreak
detection, or the topic gate stopped the message before it reached Gemini.

### `POST /chat/stream`
Same input shape, streamed via Server-Sent Events. Event types:

| Event | Payload | Meaning |
|---|---|---|
| `token` | `{ "token": "..." }` | One chunk of the assistant's reply |
| `blocked` | `{ "reply": "...", "riskBand": "..." }` | Message was blocked before generation; stream ends |
| `correction` | `{ "reply": "..." }` | The full response contained PII that's now masked — client should replace the accumulated text with this |
| `done` | `{ "riskBand": "..." }` | Stream completed normally |
| `error` | `{ "reply": "..." }` | Something failed after streaming started |

### `GET /chat/history?sessionId=...`
Returns the message history for a session (or all of the caller's history
if `sessionId` is omitted), oldest first.

---

## Admin *(requires `admin` or `security_admin` role)*

All `/admin/*` routes return `401` with no token, `403` for a valid token
with the wrong role.

### `GET /admin/analytics`
```json
{
  "totalSecurityLogs": 42,
  "openAlerts": 3,
  "blockedMessages": 7,
  "activeUsers": 12,
  "riskBandCounts": { "low": 30, "medium": 8, "high": 3, "critical": 1 }
}
```

### `GET /admin/risk-scores`
Latest 200 `risk_scores` rows (id, user_id, chat_history_id, score, band, factors, created_at).

### `GET /admin/audit-logs`
Latest 200 `security_logs` rows.

### `GET /admin/blocked-requests`
Latest 200 blocked `chat_history` entries.

### `GET /admin/security-events`
The full Security Events dashboard feed — search, filter, sort, paginate.

**Query params** (all optional except pagination defaults):

| Param | Type | Notes |
|---|---|---|
| `search` | string | Matches user full name or email (case-insensitive) |
| `attackType` | `prompt_injection`\|`jailbreak`\|`pii_exposure`\|`unauthorized_access`\|`credential_request`\|`none` | |
| `decision` | `allow`\|`block`\|`sanitize` | |
| `riskLevel` | `low`\|`medium`\|`high`\|`critical` | |
| `dateFrom` / `dateTo` | ISO 8601 datetime | Inclusive range on `created_at` |
| `sortBy` | `newest`\|`riskScore`\|`attackType` | Default `newest` |
| `page` | integer ≥1 | Default `1` |
| `pageSize` | integer 1–100 | Default `25` |

**Response `200`**
```json
{
  "events": [
    {
      "id": 101,
      "userId": 7,
      "userName": "Jane Doe",
      "userEmail": "jane@example.com",
      "userRole": "customer",
      "originalPrompt": "What is my OTP?",
      "attackType": "credential_request",
      "riskScore": 65,
      "riskLevel": "high",
      "decision": "block",
      "eventType": "policy_block",
      "ipAddress": "127.0.0.1",
      "createdAt": "2026-07-16T10:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "pageSize": 25, "total": 1 }
}
```

> `originalPrompt` is the message **as stored** — PII is masked before
> anything is written to the database, by design. GuardRail-Ops does not
> retain raw PII anywhere, including for admin review.

### `GET /admin/security-events/:id`
Full detail for one event: everything above, plus the raw `details` JSONB
and the linked `risk_scores.factors` breakdown (if any).

### `GET /admin/policies`
Lists all policies (admin-manageable metadata; category, description,
active flag).

### `POST /admin/policies`
**Body**: `{ "name": string, "category": "pii"|"prompt_injection"|"topic_restriction"|"rate_limit", "description"?: string, "ruleConfig"?: object }`

### `PATCH /admin/policies/:id/toggle`
Flips a policy's `is_active` flag.

### `GET /admin/users`
Lists all users with role, active status, last login.

### `PATCH /admin/users/:id/status`
**Body**: `{ "isActive": boolean }` — enable/disable an account.

---

## Health

### `GET /health`
```json
{ "status": "ok", "service": "GuardRail-Ops API", "db": "connected" }
```
Returns `503` with `"status": "degraded"` if the database is unreachable.
Not authenticated; safe to use as a load-balancer/uptime health check.

---

## Error shape

Every error response is `{ "error": "human-readable message" }`, with an
additional `details` array for validation errors (see top of this doc). In
non-production environments, unexpected `5xx` errors also include a
`stack` field; this is stripped in production.
