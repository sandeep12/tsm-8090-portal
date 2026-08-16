import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodTypeAny } from 'zod';
import { ValidationAppError } from '../errors/http-errors';

type RequestTarget = 'body' | 'query' | 'params';

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

    // Replace with parsed/coerced values so controllers see clean input.
    (req as Request & Record<RequestTarget, unknown>)[target] = result.data;
    next();
  };
}
