// Ensures env.ts validation passes during tests without needing a real .env file.
process.env.NODE_ENV = "test";

process.env.CORS_ORIGIN =
  process.env.CORS_ORIGIN || "http://localhost:5173";

process.env.DB_HOST =
  process.env.DB_HOST || "localhost";

process.env.DB_PORT =
  process.env.DB_PORT || "5432";

process.env.DB_USER =
  process.env.DB_USER || "postgres";

process.env.DB_PASSWORD =
  process.env.DB_PASSWORD || "postgres";

process.env.DB_NAME =
  process.env.DB_NAME || "guardrail_ops_test";

process.env.JWT_SECRET =
  process.env.JWT_SECRET ||
  "test-only-secret-key-that-is-long-enough-1234567890";

process.env.JWT_ISSUER =
  process.env.JWT_ISSUER || "guardrail-ops";

process.env.JWT_AUDIENCE =
  process.env.JWT_AUDIENCE || "guardbank-clients";

process.env.GROQ_API_KEY =
  process.env.GROQ_API_KEY || "";

process.env.GROQ_MODEL =
  process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

process.env.LOG_LEVEL = "silent";
