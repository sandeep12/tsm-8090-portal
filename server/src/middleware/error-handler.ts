import type { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import {
  DuplicateEmailError,
  InvalidAssigneeError,
  NotFoundError,
} from '../repositories/errors';
import { AppError, ConflictError, NotFoundAppError, ValidationAppError } from '../errors/http-errors';
import type { ErrorResponse } from '../types/error-response';

function toErrorResponse(error: unknown): { status: number; body: ErrorResponse } {
  if (error instanceof AppError) {
    return {
      status: error.statusCode,
      body: {
        message: error.message,
        code: error.code,
        ...(error.errors ? { errors: error.errors } : {}),
      },
    };
  }

  if (error instanceof DuplicateEmailError) {
    return {
      status: 409,
      body: {
        message: error.message,
        code: error.code,
        errors: [{ field: 'email', message: error.message }],
      },
    };
  }

  if (error instanceof InvalidAssigneeError) {
    return {
      status: 400,
      body: {
        message: error.message,
        code: error.code,
        errors: [{ field: 'assignedUserId', message: error.message }],
      },
    };
  }

  if (error instanceof NotFoundError) {
    return {
      status: 404,
      body: {
        message: error.message,
        code: error.code,
      },
    };
  }

  return {
    status: 500,
    body: {
      message: 'An unexpected error occurred',
      code: 'INTERNAL_SERVER_ERROR',
    },
  };
}

/** Terminal Express error handler — uniform ErrorResponse, no stack leakage. */
export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const knownDomainError =
    error instanceof AppError ||
    error instanceof DuplicateEmailError ||
    error instanceof InvalidAssigneeError ||
    error instanceof NotFoundError;

  if (process.env.NODE_ENV !== 'production' && !knownDomainError) {
    // Keep diagnostics in non-production logs only; never send stack to clients.
    console.error(error);
  }

  const { status, body } = toErrorResponse(error);
  res.status(status).json(body);
};

/** Catch-all for unmatched routes. */
export function notFoundHandler(_req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundAppError('Route not found'));
}

/** Convenience re-export for conflict mapping from controllers. */
export { ConflictError, ValidationAppError };
