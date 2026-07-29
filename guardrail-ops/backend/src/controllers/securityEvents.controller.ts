import { Response } from "express";
import { pool } from "../config/db";
import { AuthRequest } from "../middleware/auth";

export type AttackType =
  | "prompt_injection"
  | "jailbreak"
  | "pii_exposure"
  | "unauthorized_access"
  | "credential_request"
  | "none";

export type Decision = "allow" | "block" | "sanitize";

/**
 * SQL expression that derives a single attack type label from the details
 * JSONB blob + event_type, computed in the database so filtering, sorting,
 * and pagination all stay consistent with each other.
 */
const ATTACK_TYPE_SQL = `
  CASE
    WHEN sl.details->>'policyCategory' = 'credential_request' THEN 'credential_request'
    WHEN sl.details->>'policyCategory' = 'unauthorized_access' THEN 'unauthorized_access'
    WHEN sl.details->'factors'->'promptInjection' IS NOT NULL THEN 'prompt_injection'
    WHEN sl.details->'factors'->'jailbreak' IS NOT NULL THEN 'jailbreak'
    WHEN sl.event_type IN ('pii_detected', 'response_pii_masked') THEN 'pii_exposure'
    ELSE 'none'
  END
`;

const DECISION_SQL = `
  CASE
    WHEN sl.details->>'decision' = 'block' THEN 'block'
    WHEN sl.event_type IN ('pii_detected', 'response_pii_masked') THEN 'sanitize'
    ELSE 'allow'
  END
`;

const SORT_COLUMNS: Record<string, string> = {
  newest: "sl.created_at DESC",
  riskScore: "COALESCE((sl.details->>'riskScore')::numeric, 0) DESC, sl.created_at DESC",
  attackType: "attack_type ASC, sl.created_at DESC",
};

interface SecurityEventsQuery {
  search?: string;
  attackType?: AttackType;
  decision?: Decision;
  riskLevel?: "low" | "medium" | "high" | "critical";
  dateFrom?: string;
  dateTo?: string;
  sortBy: "newest" | "riskScore" | "attackType";
  page: number;
  pageSize: number;
}

function buildFilters(q: SecurityEventsQuery) {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (q.search) {
    conditions.push(`(u.full_name ILIKE $${idx} OR u.email ILIKE $${idx})`);
    params.push(`%${q.search}%`);
    idx++;
  }
  if (q.riskLevel) {
    conditions.push(`sl.severity = $${idx}`);
    params.push(q.riskLevel);
    idx++;
  }
  if (q.dateFrom) {
    conditions.push(`sl.created_at >= $${idx}`);
    params.push(q.dateFrom);
    idx++;
  }
  if (q.dateTo) {
    conditions.push(`sl.created_at <= $${idx}`);
    params.push(q.dateTo);
    idx++;
  }
  if (q.attackType) {
    conditions.push(`(${ATTACK_TYPE_SQL}) = $${idx}`);
    params.push(q.attackType);
    idx++;
  }
  if (q.decision) {
    conditions.push(`(${DECISION_SQL}) = $${idx}`);
    params.push(q.decision);
    idx++;
  }

  return { whereClause: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "", params, nextIdx: idx };
}

/** GET /api/admin/security-events */
export async function listSecurityEvents(req: AuthRequest, res: Response) {
  const q = (req as any).validatedQuery as SecurityEventsQuery;
  const { whereClause, params, nextIdx } = buildFilters(q);
  const orderClause = SORT_COLUMNS[q.sortBy] || SORT_COLUMNS.newest;
  const offset = (q.page - 1) * q.pageSize;

  const fromClause = `
    FROM security_logs sl
    LEFT JOIN users u ON u.id = sl.user_id
    LEFT JOIN roles r ON r.id = u.role_id
    ${whereClause}
  `;

  const countResult = await pool.query(`SELECT COUNT(*)::int AS total ${fromClause}`, params);
  const total = countResult.rows[0].total;

  const dataResult = await pool.query(
    `SELECT
       sl.id, sl.user_id, sl.event_type, sl.severity, sl.request_snippet,
       sl.details, sl.ip_address, sl.created_at,
       u.full_name, u.email, r.name AS role,
       (${ATTACK_TYPE_SQL}) AS attack_type,
       (${DECISION_SQL}) AS decision
     ${fromClause}
     ORDER BY ${orderClause}
     LIMIT $${nextIdx} OFFSET $${nextIdx + 1}`,
    [...params, q.pageSize, offset]
  );

  const events = dataResult.rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    userName: row.full_name || "Unknown / deleted user",
    userEmail: row.email || "—",
    userRole: row.role || "—",
    originalPrompt: row.request_snippet,
    attackType: row.attack_type,
    riskScore: typeof row.details?.riskScore === "number" ? row.details.riskScore : null,
    riskLevel: row.severity,
    decision: row.decision,
    eventType: row.event_type,
    ipAddress: row.ip_address,
    createdAt: row.created_at,
  }));

  return res.json({
    events,
    pagination: { page: q.page, pageSize: q.pageSize, total },
  });
}

/** GET /api/admin/security-events/:id */
export async function getSecurityEventDetail(req: AuthRequest, res: Response) {
  const result = await pool.query(
    `SELECT
       sl.id, sl.user_id, sl.event_type, sl.severity, sl.request_snippet,
       sl.details, sl.ip_address, sl.created_at,
       u.full_name, u.email, r.name AS role,
       (${ATTACK_TYPE_SQL}) AS attack_type,
       (${DECISION_SQL}) AS decision
     FROM security_logs sl
     LEFT JOIN users u ON u.id = sl.user_id
     LEFT JOIN roles r ON r.id = u.role_id
     WHERE sl.id = $1`,
    [req.params.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Security event not found" });
  }

  const row = result.rows[0];
  const details = row.details || {};

  let riskFactors: Record<string, unknown> | null = null;
  if (details.riskScoreId) {
    const riskResult = await pool.query(`SELECT factors FROM risk_scores WHERE id = $1`, [
      details.riskScoreId,
    ]);
    if (riskResult.rows.length > 0) riskFactors = riskResult.rows[0].factors;
  }

  return res.json({
    id: row.id,
    userId: row.user_id,
    userName: row.full_name || "Unknown / deleted user",
    userEmail: row.email || "—",
    userRole: row.role || "—",
    originalPrompt: row.request_snippet,
    attackType: row.attack_type,
    riskScore: typeof details.riskScore === "number" ? details.riskScore : null,
    riskLevel: row.severity,
    decision: row.decision,
    eventType: row.event_type,
    ipAddress: row.ip_address,
    createdAt: row.created_at,
    details,
    riskFactors,
  });
}
