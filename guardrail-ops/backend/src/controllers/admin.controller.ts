import { Response } from "express";
import { pool } from "../config/db";
import { AuthRequest } from "../middleware/auth";

/** GET /api/admin/analytics — high-level security counters */
export async function securityAnalytics(_req: AuthRequest, res: Response) {
  const [logs, alerts, blocked, users, riskBands] = await Promise.all([
    pool.query("SELECT COUNT(*)::int AS count FROM security_logs"),
    pool.query("SELECT COUNT(*)::int AS count FROM alerts WHERE status = 'open'"),
    pool.query("SELECT COUNT(*)::int AS count FROM chat_history WHERE was_blocked = true"),
    pool.query("SELECT COUNT(*)::int AS count FROM users WHERE is_active = true"),
    pool.query("SELECT band, COUNT(*)::int AS count FROM risk_scores GROUP BY band"),
  ]);

  const bandCounts: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
  for (const row of riskBands.rows) {
    bandCounts[row.band] = row.count;
  }

  return res.json({
    totalSecurityLogs: logs.rows[0].count,
    openAlerts: alerts.rows[0].count,
    blockedMessages: blocked.rows[0].count,
    activeUsers: users.rows[0].count,
    riskBandCounts: bandCounts,
  });
}

/** GET /api/admin/risk-scores — recent per-message risk scores */
export async function riskScores(_req: AuthRequest, res: Response) {
  const result = await pool.query(
    `SELECT id, user_id, chat_history_id, score, band, factors, created_at
     FROM risk_scores ORDER BY created_at DESC LIMIT 200`
  );
  return res.json(result.rows);
}

/** GET /api/admin/audit-logs */
export async function auditLogs(_req: AuthRequest, res: Response) {
  const result = await pool.query(
    `SELECT id, user_id, event_type, severity, request_snippet, details, ip_address, created_at
     FROM security_logs ORDER BY created_at DESC LIMIT 200`
  );
  return res.json(result.rows);
}

/** GET /api/admin/blocked-requests */
export async function blockedRequests(_req: AuthRequest, res: Response) {
  const result = await pool.query(
    `SELECT id, user_id, session_id, message, created_at
     FROM chat_history WHERE was_blocked = true
     ORDER BY created_at DESC LIMIT 200`
  );
  return res.json(result.rows);
}

/** GET /api/admin/policies */
export async function listPolicies(_req: AuthRequest, res: Response) {
  const result = await pool.query(
    `SELECT id, name, category, description, rule_config, is_active, created_at, updated_at
     FROM policies ORDER BY created_at DESC`
  );
  return res.json(result.rows);
}

/** POST /api/admin/policies */
export async function createPolicy(req: AuthRequest, res: Response) {
  const { name, category, description, ruleConfig } = req.body;
  if (!name || !category) {
    return res.status(400).json({ error: "name and category are required" });
  }
  const result = await pool.query(
    `INSERT INTO policies (name, category, description, rule_config, created_by)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [name, category, description || null, JSON.stringify(ruleConfig || {}), req.user!.userId]
  );
  return res.status(201).json(result.rows[0]);
}

/** PATCH /api/admin/policies/:id/toggle */
export async function togglePolicy(req: AuthRequest, res: Response) {
  const result = await pool.query(
    `UPDATE policies SET is_active = NOT is_active, updated_at = now()
     WHERE id = $1 RETURNING id, is_active`,
    [req.params.id]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Policy not found" });
  }
  return res.json(result.rows[0]);
}

/** GET /api/admin/users — user monitoring list */
export async function listUsers(_req: AuthRequest, res: Response) {
  const result = await pool.query(
    `SELECT u.id, u.full_name, u.email, u.is_active, u.last_login_at, u.created_at, r.name AS role
     FROM users u JOIN roles r ON r.id = u.role_id
     ORDER BY u.created_at DESC`
  );
  return res.json(result.rows);
}

/** PATCH /api/admin/users/:id/status */
export async function setUserStatus(req: AuthRequest, res: Response) {
  const { isActive } = req.body;
  const result = await pool.query(
    `UPDATE users SET is_active = $1, updated_at = now() WHERE id = $2 RETURNING id, is_active`,
    [Boolean(isActive), req.params.id]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: "User not found" });
  }
  return res.json(result.rows[0]);
}
