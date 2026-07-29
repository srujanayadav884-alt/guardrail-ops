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
import { errorHandler } from "./middleware/errorHandler";

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
  app.set("trust proxy", 1); // required for correct req.ip behind a reverse proxy/load balancer

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
      crossOriginResourcePolicy: { policy: "same-site" },
    })
  );

  const allowedOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`Origin ${origin} is not allowed by CORS policy`));
        }
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
    } catch {
      res.status(503).json({ status: "degraded", service: "GuardRail-Ops API", db: "unreachable" });
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

  app.use(errorHandler);

  return app;
}
