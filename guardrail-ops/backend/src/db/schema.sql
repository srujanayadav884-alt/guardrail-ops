-- ============================================================
-- GuardRail-Ops: Secure Banking AI Assistant
-- PostgreSQL Schema (Foundation)
-- ============================================================

-- Clean (re)start — safe for local dev only
DROP TABLE IF EXISTS risk_scores CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS security_logs CASCADE;
DROP TABLE IF EXISTS policies CASCADE;
DROP TABLE IF EXISTS chat_history CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS bank_accounts CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- ------------------------------------------------------------
-- Roles
-- ------------------------------------------------------------
CREATE TABLE roles (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(50) UNIQUE NOT NULL,     -- 'customer' | 'admin' | 'security_admin'
    description     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- Users
-- ------------------------------------------------------------
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    full_name       VARCHAR(150) NOT NULL,
    email           VARCHAR(150) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    phone           VARCHAR(20),
    role_id         INTEGER NOT NULL REFERENCES roles(id),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- Bank Accounts (fictional, GuardBank only)
-- ------------------------------------------------------------
CREATE TABLE bank_accounts (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_number  VARCHAR(20) UNIQUE NOT NULL,
    account_type    VARCHAR(30) NOT NULL,   -- 'savings' | 'current' | 'fixed_deposit'
    balance         NUMERIC(14,2) NOT NULL DEFAULT 0,
    currency        VARCHAR(10) NOT NULL DEFAULT 'INR',
    status          VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active' | 'frozen' | 'closed'
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- Transactions
-- ------------------------------------------------------------
CREATE TABLE transactions (
    id                  SERIAL PRIMARY KEY,
    account_id          INTEGER NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
    type                VARCHAR(20) NOT NULL,   -- 'credit' | 'debit'
    channel             VARCHAR(20),            -- 'UPI' | 'NEFT' | 'RTGS' | 'IMPS' | 'internal'
    amount              NUMERIC(14,2) NOT NULL,
    description         VARCHAR(255),
    counterparty        VARCHAR(150),
    status              VARCHAR(20) NOT NULL DEFAULT 'success', -- 'success' | 'pending' | 'failed'
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- Chat History (assistant conversations)
-- ------------------------------------------------------------
CREATE TABLE chat_history (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id      VARCHAR(100) NOT NULL,
    role            VARCHAR(20) NOT NULL,   -- 'user' | 'assistant' | 'system'
    message         TEXT NOT NULL,
    was_blocked     BOOLEAN NOT NULL DEFAULT false,
    risk_score_id   INTEGER,                -- FK added after risk_scores exists
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- Policies (Policy Engine rules — foundation only, no engine logic yet)
-- ------------------------------------------------------------
CREATE TABLE policies (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    category        VARCHAR(50) NOT NULL,   -- 'pii' | 'prompt_injection' | 'topic_restriction' | 'rate_limit'
    description     TEXT,
    rule_config     JSONB NOT NULL DEFAULT '{}',
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_by      INTEGER REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- Security Logs (every guardrail decision gets logged here later)
-- ------------------------------------------------------------
CREATE TABLE security_logs (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
    event_type      VARCHAR(50) NOT NULL,   -- 'pii_detected' | 'prompt_injection' | 'policy_block' | 'auth_failure' | ...
    severity        VARCHAR(20) NOT NULL DEFAULT 'low', -- 'low' | 'medium' | 'high' | 'critical'
    request_snippet TEXT,
    details         JSONB NOT NULL DEFAULT '{}',
    ip_address      VARCHAR(50),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- Alerts (surfaced to security/admin dashboard)
-- ------------------------------------------------------------
CREATE TABLE alerts (
    id                  SERIAL PRIMARY KEY,
    security_log_id     INTEGER REFERENCES security_logs(id) ON DELETE SET NULL,
    title               VARCHAR(200) NOT NULL,
    description         TEXT,
    severity            VARCHAR(20) NOT NULL DEFAULT 'low',
    status              VARCHAR(20) NOT NULL DEFAULT 'open', -- 'open' | 'acknowledged' | 'resolved'
    assigned_to         INTEGER REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at         TIMESTAMPTZ
);

-- ------------------------------------------------------------
-- Risk Scores (per message / session risk analysis result)
-- ------------------------------------------------------------
CREATE TABLE risk_scores (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
    chat_history_id INTEGER REFERENCES chat_history(id) ON DELETE SET NULL,
    score           NUMERIC(5,2) NOT NULL DEFAULT 0,  -- 0-100
    band            VARCHAR(20) NOT NULL DEFAULT 'low', -- 'low' | 'medium' | 'high' | 'critical'
    factors         JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE chat_history
    ADD CONSTRAINT fk_chat_risk_score
    FOREIGN KEY (risk_score_id) REFERENCES risk_scores(id) ON DELETE SET NULL;

-- ------------------------------------------------------------
-- Notifications (user dashboard)
-- ------------------------------------------------------------
CREATE TABLE notifications (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(200) NOT NULL,
    message         TEXT NOT NULL,
    is_read         BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- Indexes
-- ------------------------------------------------------------
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_accounts_user ON bank_accounts(user_id);
CREATE INDEX idx_transactions_account ON transactions(account_id);
CREATE INDEX idx_chat_user_session ON chat_history(user_id, session_id);
CREATE INDEX idx_security_logs_user ON security_logs(user_id);
CREATE INDEX idx_security_logs_event ON security_logs(event_type);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_notifications_user ON notifications(user_id);
