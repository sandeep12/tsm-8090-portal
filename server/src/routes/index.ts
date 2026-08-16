import { Router } from 'express';
import { createAuthRouter } from '../auth/auth.routes';

/**
 * Top-level API router.
 */
export function createApiRouter(): Router {
  const api = Router();

  api.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  api.use('/auth', createAuthRouter());

  // Placeholders for WO-6 / WO-8 / WO-10
  api.use('/tasks', Router());
  api.use('/users', Router());
  api.use('/dashboard', Router());

  return api;
}
