import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { UserRepository } from '../repositories';
import { UnauthorizedError } from '../errors/http-errors';
import { TokenService } from '../auth/token.service';
import type { AuthPrincipal } from '../types/auth';

declare global {
  namespace Express {
    interface Request {
      principal?: AuthPrincipal;
    }
  }
}

function extractBearerToken(req: Request): string | null {
  const header = req.header('authorization');
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
}

/**
 * Verify bearer token, load user, re-check active status, attach principal.
 */
export function requireAuth(
  tokenService: TokenService = new TokenService(),
  users: UserRepository = new UserRepository(),
): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = extractBearerToken(req);
      if (!token) {
        throw new UnauthorizedError('Authentication required');
      }

      const payload = tokenService.verify(token);
      const user = await users.findById(payload.sub);
      if (!user || !user.active) {
        throw new UnauthorizedError('Invalid or expired session');
      }

      req.principal = {
        id: String(user._id),
        role: user.role,
        user,
      };
      next();
    } catch (error) {
      next(error);
    }
  };
}
