import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import type { UserRole } from '../models';
import { UnauthorizedError } from '../errors/http-errors';

export type TokenPayload = {
  sub: string;
  role: UserRole;
};

export class TokenService {
  sign(userId: string, role: UserRole): string {
    const secret = config.jwtSecret;
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }

    return jwt.sign({ role } satisfies Omit<TokenPayload, 'sub'>, secret, {
      subject: userId,
      expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
    });
  }

  verify(token: string): TokenPayload {
    const secret = config.jwtSecret;
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }

    try {
      const decoded = jwt.verify(token, secret);
      if (typeof decoded === 'string' || !decoded.sub || typeof decoded.sub !== 'string') {
        throw new UnauthorizedError('Invalid or expired session');
      }
      const role = (decoded as jwt.JwtPayload & { role?: UserRole }).role;
      if (role !== 'Administrator' && role !== 'User') {
        throw new UnauthorizedError('Invalid or expired session');
      }
      return { sub: decoded.sub, role };
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      throw new UnauthorizedError('Invalid or expired session');
    }
  }
}
