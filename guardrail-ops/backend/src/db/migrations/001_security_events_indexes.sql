-- ============================================================
-- Migration 001: Security Events dashboard support
-- Run AFTER schema.sql + seed.sql, any time after the initial
-- setup (safe to run on an existing database — all statements
-- are IF NOT EXISTS / idempotent).
-- ============================================================

-- Faster "sort by newest" / date-range filtering on the Security Events page
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at DESC);

-- Faster "sort by risk score" (details->>'riskScore' is queried as numeric)
CREATE INDEX IF NOT EXISTS idx_security_logs_risk_score
  ON security_logs (((details->>'riskScore')::numeric));

-- Faster policy-category / attack-type filtering
CREATE INDEX IF NOT EXISTS idx_security_logs_policy_category
  ON security_logs ((details->>'policyCategory'));

-- Faster risk_scores lookups by recency (used by /api/admin/risk-scores)
CREATE INDEX IF NOT EXISTS idx_risk_scores_created_at ON risk_scores(created_at DESC);

-- Case-insensitive search by name/email on the Security Events page
CREATE INDEX IF NOT EXISTS idx_users_full_name_lower ON users (LOWER(full_name));
