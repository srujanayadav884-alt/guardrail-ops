import { pool } from "../config/db";

export interface SecurityLogData {
  userId?: number | null;
  eventType: string;
  severity: "low" | "medium" | "high" | "critical";
  requestSnippet?: string;
  details?: Record<string, any>;
  ipAddress?: string | null;
}

/**
 * Supports both object parameter style: writeSecurityLog({ userId, eventType, ... })
 * AND positional parameter style: writeSecurityLog(userId, eventType, severity, ...)
 */
export async function writeSecurityLog(...args: any[]): Promise<void> {
  try {
    let userId: number | null = null;
    let eventType = "unknown";
    let severity = "medium";
    let requestSnippet: string | null = null;
    let details: Record<string, any> | null = null;
    let ipAddress: string | null = null;

    if (args.length === 1 && typeof args[0] === "object" && args[0] !== null) {
      const data = args[0] as SecurityLogData;
      userId = data.userId ?? null;
      eventType = data.eventType;
      severity = data.severity;
      requestSnippet = data.requestSnippet ?? null;
      details = data.details ?? null;
      ipAddress = data.ipAddress ?? null;
    } else {
      userId = typeof args[0] === "number" ? args[0] : null;
      eventType = args[1] || "unknown";
      severity = args[2] || "medium";
      details = typeof args[3] === "object" ? args[3] : (args[3] ? { info: args[3] } : null);
      ipAddress = args[4] || null;
    }

    await pool.query(
      `INSERT INTO security_logs (user_id, event_type, severity, request_snippet, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        eventType,
        severity,
        requestSnippet,
        details ? JSON.stringify(details) : null,
        ipAddress,
      ]
    );
  } catch (err) {
    console.error("Failed to write security audit log to DB:", err);
  }
}

export async function writeRiskScore(data: any): Promise<void> {
  try {
    const userId = data.userId ?? null;
    const promptSnippet = data.promptSnippet ?? null;
    const riskScore = data.riskScore ?? 0;
    const threatCategory = data.threatCategory || "general";
    const actionTaken = data.actionTaken || "allowed";

    await pool.query(
      `INSERT INTO risk_scores (user_id, prompt_snippet, risk_score, threat_category, action_taken)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, promptSnippet, riskScore, threatCategory, actionTaken]
    );
  } catch (err) {
    console.error("Failed to write risk score to DB:", err);
  }
}

export async function maybeRaiseAlert(data: any): Promise<void> {
  try {
    const userId = data.userId ?? null;
    const alertType = data.alertType || "security_event";
    const severity = data.severity || "medium";
    const description = data.description || "";

    await pool.query(
      `INSERT INTO security_alerts (user_id, alert_type, severity, description)
       VALUES ($1, $2, $3, $4)`,
      [userId, alertType, severity, description]
    );
  } catch (err) {
    console.error("Failed to write security alert to DB:", err);
  }
}