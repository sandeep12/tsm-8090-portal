import { Router } from 'express';
import { createAuthController } from './auth.controller';

export function createAuthRouter(): Router {
  const router = Router();
  const controller = createAuthController();

  router.post('/sign-in', ...controller.signIn);
  router.post('/sign-out', ...controller.signOut);
  router.get('/me', ...controller.currentSession);

  return router;
}
