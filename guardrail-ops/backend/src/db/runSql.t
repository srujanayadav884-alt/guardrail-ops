import { pool } from "../config/db";

async function run() {
  console.log("Connecting to database and applying schema updates...");

  try {
    // 1. Ensure security_logs table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS security_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        event_type VARCHAR(100) NOT NULL,
        severity VARCHAR(20) DEFAULT 'medium',
        request_snippet TEXT,
        details JSONB,
        ip_address VARCHAR(45),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Ensure risk_scores table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS risk_scores (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        prompt_snippet TEXT,
        risk_score NUMERIC(5, 2) DEFAULT 0.00,
        threat_category VARCHAR(100) DEFAULT 'general',
        action_taken VARCHAR(50) DEFAULT 'allowed',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Ensure security_alerts table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS security_alerts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        alert_type VARCHAR(100) NOT NULL,
        severity VARCHAR(20) DEFAULT 'medium',
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("SCHEMA UPDATE SUCCESSFUL: All security tables are ready!");
  } catch (err) {
    console.error("SCHEMA UPDATE ERROR:", err);
  } finally {
    await pool.end();
  }
}

run();