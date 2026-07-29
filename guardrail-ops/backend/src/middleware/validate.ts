import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

/**
 * Validates req.body against a zod schema. On success, replaces req.body
 * with the parsed (and coerced/trimmed) value so controllers can trust
 * its shape. On failure, responds 400 with field-level error messages —
 * never reaches the controller or the database.
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: result.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      });
    }
    req.body = result.data;
    next();
  };
}

/** Same as validateBody, but for req.query (used by list/filter endpoints). */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({
        error: "Invalid query parameters",
        details: result.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      });
    }
    // Express's req.query is technically read-only typed; cast is safe here
    // since we're only ever replacing it with our own validated shape.
    (req as any).validatedQuery = result.data;
    next();
  };
}
