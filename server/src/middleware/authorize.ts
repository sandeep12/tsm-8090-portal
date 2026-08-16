import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { UserRole } from '../models';
import { ForbiddenError, UnauthorizedError } from '../errors/http-errors';

/** Require an authenticated principal with Administrator role. */
export function requireAdmin(): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.principal) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }
    if (req.principal.role !== UserRole.Administrator) {
      next(new ForbiddenError('Administrator access required'));
      return;
    }
    next();
  };
}

/**
 * Enforce task ownership for non-administrators.
 * Administrators may access any task; Users may only access their own.
 */
export function requireTaskOwner(getAssignedUserId: (req: Request) => string | undefined): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.principal) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }
    if (req.principal.role === UserRole.Administrator) {
      next();
      return;
    }

    const assignedUserId = getAssignedUserId(req);
    if (!assignedUserId || assignedUserId !== req.principal.id) {
      next(new ForbiddenError('You can only access your own tasks'));
      return;
    }
    next();
  };
}
