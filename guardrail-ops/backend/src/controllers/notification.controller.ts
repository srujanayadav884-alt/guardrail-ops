import { Response } from "express";
import { pool } from "../config/db";
import { AuthRequest } from "../middleware/auth";

/** GET /api/notifications */
export async function listNotifications(req: AuthRequest, res: Response) {
  const result = await pool.query(
    `SELECT id, title, message, is_read, created_at
     FROM notifications WHERE user_id = $1 ORDER BY created_at DESC`,
    [req.user!.userId]
  );
  return res.json(result.rows);
}

/** PATCH /api/notifications/:id/read */
export async function markRead(req: AuthRequest, res: Response) {
  const result = await pool.query(
    `UPDATE notifications SET is_read = true
     WHERE id = $1 AND user_id = $2 RETURNING id, is_read`,
    [req.params.id, req.user!.userId]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Notification not found" });
  }
  return res.json(result.rows[0]);
}
