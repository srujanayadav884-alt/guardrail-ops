const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://guardrail_ops_db_user:hMw5cpEIip7acSNVzM8js24gt9IEO7dv@dpg-d9ksbt37uimc7383bog0-a.ohio-postgres.render.com/guardrail_ops_db',
  ssl: { rejectUnauthorized: false }
});

async function fix() {
  try {
    console.log("Applying database fixes...");
    await pool.query('CREATE TABLE IF NOT EXISTS roles (id SERIAL PRIMARY KEY, name VARCHAR(50) UNIQUE NOT NULL);');
    await pool.query("INSERT INTO roles (name) VALUES ('customer'), ('admin'), ('security_admin'), ('super_admin'), ('bank_admin') ON CONFLICT (name) DO NOTHING;");
    await pool.query('CREATE TABLE IF NOT EXISTS security_logs (id SERIAL PRIMARY KEY, user_id INTEGER, event_type VARCHAR(100), severity VARCHAR(20), request_snippet TEXT, details JSONB, ip_address VARCHAR(45), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);');
    await pool.query('CREATE TABLE IF NOT EXISTS risk_scores (id SERIAL PRIMARY KEY, user_id INTEGER, prompt_snippet TEXT, risk_score NUMERIC(5,2), threat_category VARCHAR(100), action_taken VARCHAR(50), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);');
    await pool.query('CREATE TABLE IF NOT EXISTS security_alerts (id SERIAL PRIMARY KEY, user_id INTEGER, alert_type VARCHAR(100), severity VARCHAR(20), description TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;');
    console.log("✅ DATABASE FULLY REPAIRED!");
  } catch (err) {
    console.error("❌ Error repairing database:", err);
  } finally {
    await pool.end();
  }
}

fix();