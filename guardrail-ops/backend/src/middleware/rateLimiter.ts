import rateLimit from "express-rate-limit";
import { env } from "../config/env";

/** General API rate limit — applied to all /api routes. */
export const apiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down and try again shortly." },
});

/** Stricter limit for login/register endpoints — mitigates credential stuffing / brute force. */
export const authRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: "Too many authentication attempts. Please try again later." },
});

/** Slightly more permissive limit for the chat endpoints, which are used interactively. */
export const chatRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "You're sending messages too quickly. Please wait a moment." },
});
