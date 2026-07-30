import { pool } from "../config/db";

export interface SecurityLogData {
  userId?: number | null;
  eventType: string;
  severity: "low" | "medium" | "high" | "critical";
  requestSnippet?: string;
  details?: Record<string, any>;
  ipAddress?: string | null;
}

export async function writeSecurityLog(data: SecurityLogData): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO security_logs (user_id, event_type, severity, request_snippet, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        data.userId || null,
        data.eventType,
        data.severity,
        data.requestSnippet || null,
        data.details ? JSON.stringify(data.details) : null,
        data.ipAddress || null,
      ]
    );
  } catch (err) {
    console.error("Failed to write security audit log to DB:", err);
  }
}

export async function writeRiskScore(data: {
  userId?: number | null;
  promptSnippet?: string;
  riskScore: number;
  threatCategory?: string;
  actionTaken: string;
}): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO risk_scores (user_id, prompt_snippet, risk_score, threat_category, action_taken)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        data.userId || null,
        data.promptSnippet || null,
        data.riskScore,
        data.threatCategory || "general",
        data.actionTaken,
      ]
    );
  } catch (err) {
    console.error("Failed to write risk score to DB:", err);
  }
}

export async function maybeRaiseAlert(data: {
  userId?: number | null;
  alertType: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
}): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO security_alerts (user_id, alert_type, severity, description)
       VALUES ($1, $2, $3, $4)`,
      [
        data.userId || null,
        data.alertType,
        data.severity,
        data.description,
      ]
    );
  } catch (err) {
    console.error("Failed to write security alert to DB:", err);
  }
}