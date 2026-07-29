import { z } from "zod";

// ---- Auth ----
export const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(150),
  email: z.string().trim().toLowerCase().email(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128)
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  phone: z.string().trim().min(7).max(20).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1, "Password is required"),
});

export const adminLoginSchema = loginSchema;

// ---- Users ----
export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(150).optional(),
  phone: z.string().trim().min(7).max(20).optional(),
});

// ---- Chat ----
export const sendMessageSchema = z.object({
  message: z.string().trim().min(1, "Message cannot be empty").max(2000, "Message is too long"),
  sessionId: z.string().uuid("sessionId must be a valid UUID"),
});

// ---- Admin: Policies ----
export const createPolicySchema = z.object({
  name: z.string().trim().min(2).max(150),
  category: z.enum(["pii", "prompt_injection", "topic_restriction", "rate_limit"]),
  description: z.string().trim().max(1000).optional(),
  ruleConfig: z.record(z.unknown()).optional(),
});

// ---- Admin: User status ----
export const setUserStatusSchema = z.object({
  isActive: z.boolean(),
});

// ---- Admin: Security Events query/filter ----
export const securityEventsQuerySchema = z.object({
  search: z.string().trim().max(150).optional(),
  attackType: z
    .enum([
      "prompt_injection",
      "jailbreak",
      "pii_exposure",
      "unauthorized_access",
      "credential_request",
      "none",
    ])
    .optional(),
  decision: z.enum(["allow", "block", "sanitize"]).optional(),
  riskLevel: z.enum(["low", "medium", "high", "critical"]).optional(),
  dateFrom: z.string().datetime().optional().or(z.literal("")),
  dateTo: z.string().datetime().optional().or(z.literal("")),
  sortBy: z.enum(["newest", "riskScore", "attackType"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});
