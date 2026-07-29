import { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Express 4 does not automatically forward rejected promises from async
 * route handlers to the error-handling middleware — an uncaught rejection
 * in an async controller just hangs the request. Wrap every async
 * controller with this so errors always reach errorHandler.ts.
 */
export function asyncHandler(fn: RequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
