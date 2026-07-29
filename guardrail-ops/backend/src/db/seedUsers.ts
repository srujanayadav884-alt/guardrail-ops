/**
 * Seeds the two GuardBank admin accounts + one demo customer.
 * Run with: npm run seed:users
 *
 * Default password for ALL seeded accounts: ChangeMe123!
 * Change this immediately in any non-local environment.
 */
import bcrypt from "bcrypt";
import { pool } from "../config/db";

const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD || "ChangeMe123!";

async function getRoleId(name: string): Promise<number> {
  const res = await pool.query("SELECT id FROM roles WHERE name = $1", [name]);
  if (res.rows.length === 0) {
    throw new Error(`Role '${name}' not found — did you run schema.sql + seed.sql first?`);
  }
  return res.rows[0].id;
}

async function upsertUser(fullName: string, email: string, roleName: string) {
  const roleId = await getRoleId(roleName);
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
  if (existing.rows.length > 0) {
    console.log(`Skipping ${email} — already exists.`);
    return existing.rows[0].id as number;
  }

  const res = await pool.query(
    `INSERT INTO users (full_name, email, password_hash, role_id, is_active)
     VALUES ($1, $2, $3, $4, true) RETURNING id`,
    [fullName, email, passwordHash, roleId]
  );
  console.log(`Created ${email}`);
  return res.rows[0].id as number;
}

async function main() {
  await upsertUser("GuardBank Admin", "admin@guardbank.com", "admin");
  await upsertUser("GuardRail Security Admin", "security@guardbank.com", "security_admin");
  const demoId = await upsertUser("Demo Customer", "demo@guardbank.com", "customer");

  const acctExists = await pool.query(
    "SELECT id FROM bank_accounts WHERE user_id = $1",
    [demoId]
  );
  if (acctExists.rows.length === 0) {
    await pool.query(
      `INSERT INTO bank_accounts (user_id, account_number, account_type, balance)
       VALUES ($1, 'GB0001000123', 'savings', 45230.50)`,
      [demoId]
    );
    await pool.query(
      `INSERT INTO notifications (user_id, title, message)
       VALUES ($1, 'Welcome to GuardBank', 'Your account has been set up successfully.')`,
      [demoId]
    );
    console.log("Created demo account + notification.");
  }

  console.log(`\nDone. All seeded accounts use the password: ${DEFAULT_PASSWORD}`);
  await pool.end();
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
