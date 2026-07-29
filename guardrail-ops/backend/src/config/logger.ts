import pino from "pino";
import { isProduction } from "./env";

export const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
  transport: isProduction
    ? undefined
    : {
        target: "pino-pretty",
        options: { colorize: true, translateTime: "HH:MM:ss", ignore: "pid,hostname" },
      },
  redact: {
    // Never let raw credentials/tokens accidentally end up in log output
    paths: ["req.headers.authorization", "*.password", "*.password_hash", "*.token"],
    censor: "[REDACTED]",
  },
});
