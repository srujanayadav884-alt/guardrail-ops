import { Response } from "express";
import { pool } from "../config/db";
import { AuthRequest } from "../middleware/auth";

/** GET /api/accounts — all accounts belonging to the logged-in user */
export async function listAccounts(req: AuthRequest, res: Response) {
  const result = await pool.query(
    `SELECT id, account_number, account_type, balance, currency, status, created_at
     FROM bank_accounts WHERE user_id = $1 ORDER BY created_at ASC`,
    [req.user!.userId]
  );
  return res.json(result.rows);
}

/** GET /api/accounts/:id */
export async function getAccount(req: AuthRequest, res: Response) {
  const result = await pool.query(
    `SELECT id, account_number, account_type, balance, currency, status, created_at
     FROM bank_accounts WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.user!.userId]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Account not found" });
  }
  return res.json(result.rows[0]);
}
