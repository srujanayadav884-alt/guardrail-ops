import { Response } from "express";
import { pool } from "../config/db";
import { AuthRequest } from "../middleware/auth";

/** GET /api/transactions?accountId=123 */
export async function listTransactions(req: AuthRequest, res: Response) {
  const { accountId } = req.query;

  const ownershipCheck = await pool.query(
    `SELECT id FROM bank_accounts WHERE user_id = $1 ${accountId ? "AND id = $2" : ""}`,
    accountId ? [req.user!.userId, accountId] : [req.user!.userId]
  );
  if (ownershipCheck.rows.length === 0) {
    return res.status(404).json({ error: "No matching account found for this user" });
  }

  const accountIds = accountId ? [accountId] : ownershipCheck.rows.map((r) => r.id);

  const result = await pool.query(
    `SELECT t.id, t.account_id, t.type, t.channel, t.amount, t.description,
            t.counterparty, t.status, t.created_at
     FROM transactions t
     WHERE t.account_id = ANY($1::int[])
     ORDER BY t.created_at DESC
     LIMIT 100`,
    [accountIds]
  );
  return res.json(result.rows);
}
