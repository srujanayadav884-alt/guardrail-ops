import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import pinoHttp from "pino-http";

import { env, isProduction } from "./config/env";
import { logger } from "./config/logger";
import { pool } from "./config/db";
import { apiRateLimiter, authRateLimiter, chatRateLimiter } from "./middleware/rateLimiter";

import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import accountRoutes from "./routes/account.routes";
import transactionRoutes from "./routes/transaction.routes";
import chatRoutes from "./routes/chat.routes";
import notificationRoutes from "./routes/notification.routes";
import adminRoutes from "./routes/admin.routes";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", true);

  app.use(
    helmet({
      contentSecurityPolicy: isProduction
        ? {
            directives: {
              defaultSrc: ["'none'"],
              frameAncestors: ["'none'"],
            },
          }
        : false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const allowedOrigins = env.CORS_ORIGIN ? env.CORS_ORIGIN.split(",").map((o) => o.trim()) : [];
        if (
          allowedOrigins.includes(origin) ||
          origin.includes("onrender.com") ||
          origin.includes("localhost")
        ) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      credentials: true,
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  app.use(compression());
  app.use(express.json({ limit: "100kb" }));

  if (env.NODE_ENV !== "test") {
    app.use(
      pinoHttp({
        logger,
        autoLogging: { ignore: (req) => req.url === "/api/health" },
      })
    );
    if (!isProduction) {
      app.use(morgan("dev"));
    }
  }

  app.use("/api", apiRateLimiter);

  app.get("/api/health", async (_req, res) => {
    try {
      await pool.query("SELECT 1");
      res.json({ status: "ok", service: "GuardRail-Ops API", db: "connected" });
    } catch (err: any) {
      res.status(503).json({ status: "degraded", service: "GuardRail-Ops API", db: "unreachable", error: err.message });
    }
  });

  app.use("/api/auth", authRateLimiter, authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/accounts", accountRoutes);
  app.use("/api/transactions", transactionRoutes);
  app.use("/api/chat", chatRateLimiter, chatRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/admin", adminRoutes);

  app.use((req, res) => {
    res.status(404).json({ error: `No route for ${req.method} ${req.path}` });
  });

  app.use((err: any, req: any, res: any, _next: any) => {
    console.error("SERVER CRASH DETECTED:", err);
    res.status(err.status || 500).json({
      error: err.message || "Internal Server Error",
      details: err.stack,
    });
  });

  return app;
}