import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

// Support both DATABASE_URL (Render Postgres) and individual DB variables
const isProduction = process.env.NODE_ENV === "production";

export const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: isProduction ? { rejectUnauthorized: false } : false,
      }
    : {
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER || "postgres",
        password: process.env.DB_PASSWORD || "postgres",
        database: process.env.DB_NAME || "guardrail_ops",
      }
);

// Export testConnection function so server.ts can verify DB connection on boot
export const testConnection = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    console.log("✅ Database connected successfully!");
    client.release();
  } catch (err) {
    console.error("❌ Database connection error:", err);
  }
};

export default pool;