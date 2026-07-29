import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().min(1, "CORS_ORIGIN is required"),

  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().positive().default(5432),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().min(1),

  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters — generate one with `openssl rand -base64 48`"),
  JWT_EXPIRES_IN: z.string().default("2h"),
  JWT_ISSUER: z.string().default("guardrail-ops"),
  JWT_AUDIENCE: z.string().default("guardbank-clients"),

  GROQ_API_KEY: z.string().optional(),
 GROQ_MODEL: z.string().default("llama-3.3-70b-versatile"),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Fail fast and loudly — a misconfigured deployment should never start.
  console.error("Invalid or missing environment variables:");
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  }
  if ((process.env.NODE_ENV || "development") === "production") {
    process.exit(1);
  } else {
    console.warn("Continuing in non-production mode with defaults where possible — fix your .env file.");
  }
}

const data = parsed.success ? parsed.data : envSchema.parse({ ...process.env, CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173", DB_HOST: process.env.DB_HOST || "localhost", DB_USER: process.env.DB_USER || "postgres", DB_PASSWORD: process.env.DB_PASSWORD || "postgres", DB_NAME: process.env.DB_NAME || "guardrail_ops", JWT_SECRET: process.env.JWT_SECRET || "dev-only-insecure-secret-change-me-please-32chars" });
if (!data.GROQ_API_KEY) {
  console.warn(
    "WARNING: GROQ_API_KEY is not set — the banking assistant will not be able to generate replies."
  );
}

export const env = data;
export const isProduction = env.NODE_ENV === "production";
