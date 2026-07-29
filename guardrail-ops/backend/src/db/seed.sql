-- ============================================================
-- GuardRail-Ops — Seed data (roles & policies only)
-- Run AFTER schema.sql
-- User accounts (including the two admins) are seeded by
-- `npm run seed:users` (backend/src/db/seedUsers.ts) instead of
-- here, so passwords are hashed with bcrypt at insert time
-- rather than hardcoded in SQL.
-- ============================================================

INSERT INTO roles (name, description) VALUES
    ('customer', 'Standard GuardBank customer'),
    ('admin', 'GuardBank operations admin'),
    ('security_admin', 'GuardRail-Ops security administrator');

INSERT INTO policies (name, category, description, rule_config, is_active)
VALUES
    ('Block SSN / Aadhaar patterns', 'pii', 'Foundation placeholder -- detection logic added in a later phase.', '{}', true),
    ('Block instruction-override attempts', 'prompt_injection', 'Foundation placeholder -- detection logic added in a later phase.', '{}', true),
    ('Restrict to banking topics only', 'topic_restriction', 'Assistant must refuse non-banking topics.', '{}', true);
