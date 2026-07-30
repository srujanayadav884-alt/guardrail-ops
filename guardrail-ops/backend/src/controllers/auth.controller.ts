import { Request, Response } from "express";
import { pool } from "../config/db";
import { hashPassword, comparePassword } from "../utils/password";
import { signToken } from "../utils/jwt";
import { writeSecurityLog } from "../security/securityLogger";

const DUMMY_HASH = "$2b$10$C6UzMDM.H6dfI/f5vNe6z.o8j5v2b9d1H8b5t9E6h9k4l7m2n8o0O";

export async function register(req: Request, res: Response) {
  try {
    const { fullName, email, password, phone } = req.body;

    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const roleRes = await pool.query("SELECT id FROM roles WHERE name = 'customer'");
    if (roleRes.rows.length === 0) {
      return res.status(500).json({ error: "Customer role not seeded — run seed.sql first" });
    }

    const passwordHash = await hashPassword(password);
    const inserted = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, phone, role_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, full_name, email, role_id, created_at`,
      [fullName, email, passwordHash, phone || null, roleRes.rows[0].id]
    );

    const user = inserted.rows[0];
    const token = signToken({ userId: user.id, email: user.email, role: "customer" });

    return res.status(201).json({
      token,
      user: { id: user.id, fullName: user.full_name, email: user.email, role: "customer" },
    });
  } catch (err: any) {
    console.error("REGISTER ERROR:", err);
    return res.status(500).json({ error: "Internal server error during registration" });
  }
}

async function loginWithRoleCheck(
  email: string,
  password: string,
  allowedRoles: string[],
  ipAddress: string | null
) {
  const GENERIC_ERROR = "Invalid email or password" as const;

  const result = await pool.query(
    `SELECT u.id, u.full_name, u.email, u.password_hash, u.is_active, r.name AS role
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.email = $1`,
    [email]
  );

  const logFailure = async (userId: number | null, reason: string) => {
    await writeSecurityLog({
      userId,
      eventType: "auth_failure",
      severity: "medium",
      requestSnippet: `login attempt for ${email}`,
      details: { reason },
      ipAddress,
    });
  };

  if (result.rows.length === 0) {
    await comparePassword(password, DUMMY_HASH);
    await logFailure(null, "unknown_email");
    return { error: GENERIC_ERROR };
  }

  const user = result.rows[0];

  if (!allowedRoles.includes(user.role)) {
    await comparePassword(password, DUMMY_HASH);
    await logFailure(user.id, "role_mismatch");
    return { error: GENERIC_ERROR };
  }
  if (!user.is_active) {
    await comparePassword(password, DUMMY_HASH);
    await logFailure(user.id, "account_disabled");
    return { error: GENERIC_ERROR };
  }

  const valid = await comparePassword(password, user.password_hash);
  if (!valid) {
    await logFailure(user.id, "wrong_password");
    return { error: GENERIC_ERROR };
  }

  await pool.query("UPDATE users SET last_login_at = now() WHERE id = $1", [user.id]);

  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  return {
    token,
    user: { id: user.id, fullName: user.full_name, email: user.email, role: user.role },
  };
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    const result = await loginWithRoleCheck(email, password, ["customer"], req.ip || null);
    if ("error" in result) {
      return res.status(401).json({ error: result.error });
    }
    return res.json(result);
  } catch (err: any) {
    console.error("CUSTOMER LOGIN ERROR:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function adminLogin(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    const result = await loginWithRoleCheck(
      email,
      password,
      ["admin", "security_admin", "super_admin", "bank_admin"],
      req.ip || null
    );
    if ("error" in result) {
      return res.status(401).json({ error: result.error });
    }
    return res.json(result);
  } catch (err: any) {
    console.error("ADMIN LOGIN ERROR:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}