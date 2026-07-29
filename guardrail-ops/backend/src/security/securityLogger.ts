import { pool } from "../config/db";
import { RiskResult } from "./riskScorer";

export interface SecurityLogInput {
  userId: number | null;
  eventType: string;
  severity: "low" | "medium" | "high" | "critical";
  /** Store the MASKED query/snippet only — never raw PII */
  requestSnippet: string;
  details: Record<string, unknown>;
  ipAddress: string | null;
}

/** Writes one row to security_logs. Returns the new row's id. */
export async function writeSecurityLog(input: SecurityLogInput): Promise<number> {
  const result = await pool.query(
    `INSERT INTO security_logs (user_id, event_type, severity, request_snippet, details, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [
      input.userId,
      input.eventType,
      input.severity,
      input.requestSnippet,
      JSON.stringify(input.details),
      input.ipAddress,
    ]
  );
  return result.rows[0].id;
}

/** Writes one row to risk_scores, linked to a chat_history entry. */
export async function writeRiskScore(
  userId: number | null,
  chatHistoryId: number | null,
  risk: RiskResult
): Promise<number> {
  const result = await pool.query(
    `INSERT INTO risk_scores (user_id, chat_history_id, score, band, factors)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [userId, chatHistoryId, risk.score, risk.band, JSON.stringify(risk.factors)]
  );
  return result.rows[0].id;
}

/** Convenience: opens an alert row for high/critical severity events. */
export async function maybeRaiseAlert(
  securityLogId: number,
  title: string,
  description: string,
  severity: "high" | "critical"
) {
  await pool.query(
    `INSERT INTO alerts (security_log_id, title, description, severity)
     VALUES ($1, $2, $3, $4)`,
    [securityLogId, title, description, severity]
  );
}
