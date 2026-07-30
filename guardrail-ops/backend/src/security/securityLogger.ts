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