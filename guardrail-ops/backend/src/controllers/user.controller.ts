import { Response } from "express";
import { pool } from "../config/db";
import { AuthRequest } from "../middleware/auth";

/** GET /api/users/me */
export async function getProfile(req: AuthRequest, res: Response) {
  const result = await pool.query(
    `SELECT u.id, u.full_name, u.email, u.phone, u.last_login_at, u.created_at, r.name AS role
     FROM users u JOIN roles r ON r.id = u.role_id
     WHERE u.id = $1`,
    [req.user!.userId]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: "User not found" });
  }
  return res.json(result.rows[0]);
}

/** PATCH /api/users/me */
export async function updateProfile(req: AuthRequest, res: Response) {
  const { fullName, phone } = req.body;
  const result = await pool.query(
    `UPDATE users SET
       full_name = COALESCE($1, full_name),
       phone = COALESCE($2, phone),
       updated_at = now()
     WHERE id = $3
     RETURNING id, full_name, email, phone`,
    [fullName || null, phone || null, req.user!.userId]
  );
  return res.json(result.rows[0]);
}
