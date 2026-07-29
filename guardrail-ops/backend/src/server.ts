import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { testConnection, pool } from "./config/db";

const app = createApp();
const PORT = env.PORT;

const server = app.listen(PORT, async () => {
  logger.info(`GuardRail-Ops API listening on port ${PORT} (${env.NODE_ENV})`);
  try {
    await testConnection();
  } catch (err) {
    logger.error({ err }, "Could not connect to PostgreSQL on startup");
  }
});

function shutdown(signal: string) {
  logger.info(`${signal} received — shutting down gracefully`);
  server.close(async () => {
    await pool.end();
    logger.info("Server and DB pool closed. Bye.");
    process.exit(0);
  });
  // Force-exit if graceful shutdown hangs
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled promise rejection");
});
