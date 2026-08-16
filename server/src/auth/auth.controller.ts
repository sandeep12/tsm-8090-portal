import type { RequestHandler } from 'express';
import { z } from 'zod';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { toUserDto, type AuthResponse } from '../types/auth';
import { validateRequest } from '../middleware/validate';
import { requireAuth } from '../middleware/authenticate';

export const credentialsSchema = z.object({
  email: z.string().trim().email('email is required'),
  password: z.string().min(1, 'password is required'),
});

export function createAuthController(
  authService: AuthService = new AuthService(),
  tokenService: TokenService = new TokenService(),
) {
  const signIn: RequestHandler[] = [
    validateRequest(credentialsSchema),
    async (req, res, next) => {
      try {
        const { email, password } = req.body as z.infer<typeof credentialsSchema>;
        const user = await authService.authenticate(email, password);
        const token = tokenService.sign(String(user._id), user.role);
        const body: AuthResponse = {
          token,
          user: toUserDto(user),
        };
        res.status(200).json(body);
      } catch (error) {
        next(error);
      }
    },
  ];

  const signOut: RequestHandler[] = [
    requireAuth(),
    (_req, res) => {
      // Stateless JWT: client discards the token. Endpoint exists for a uniform API.
      res.status(204).send();
    },
  ];

  const currentSession: RequestHandler[] = [
    requireAuth(),
    (req, res) => {
      res.status(200).json({ user: toUserDto(req.principal!.user) });
    },
  ];

  return { signIn, signOut, currentSession };
}
