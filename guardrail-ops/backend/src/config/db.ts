import { Pool } from "pg";
import { env, isProduction } from "./env";

export const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: isProduction && process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle PostgreSQL client", err);
});

export async function testConnection() {
  const client = await pool.connect();
  try {
    await client.query("SELECT 1");
    console.log("PostgreSQL connection OK");
  } finally {
    client.release();
  }
}
