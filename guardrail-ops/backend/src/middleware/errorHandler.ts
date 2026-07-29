import { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger";
import { isProduction } from "../config/env";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const status = err.status || err.statusCode || 500;

  logger.error(
    { err, path: req.path, method: req.method, status },
    "Unhandled request error"
  );

  const body: Record<string, unknown> = {
    error: status >= 500 && isProduction ? "Internal server error" : err.message || "Something went wrong",
  };

  // Never leak stack traces or internal details to clients in production
  if (!isProduction) {
    body.stack = err.stack;
  }

  res.status(status).json(body);
}
