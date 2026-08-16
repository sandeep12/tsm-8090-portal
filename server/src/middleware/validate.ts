import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodTypeAny } from 'zod';
import { ValidationAppError } from '../errors/http-errors';

type RequestTarget = 'body' | 'query' | 'params';

declare global {
  namespace Express {
    interface Request {
      /** Parsed/coerced query when `req.query` is read-only (Express 5). */
      validatedQuery?: unknown;
    }
  }
}

/**
 * Schema-based validation middleware. Reports every invalid field, then raises
 * a validation error for the terminal ErrorHandler.
 */
export function validateRequest(
  schema: ZodTypeAny,
  target: RequestTarget = 'body',
): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.length > 0 ? issue.path.join('.') : target,
        message: issue.message,
      }));
      next(new ValidationAppError(errors));
      return;
    }

    if (target === 'query') {
      // Express 5 exposes query as a getter-only property.
      req.validatedQuery = result.data;
    } else {
      (req as Request & Record<'body' | 'params', unknown>)[target] = result.data;
    }
    next();
  };
}
