import { Router } from 'express';
import { createAuthRouter } from '../auth/auth.routes';
import { createTaskRouter } from '../tasks/task.routes';

/**
 * Top-level API router.
 */
export function createApiRouter(): Router {
  const api = Router();

  api.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  api.use('/auth', createAuthRouter());
  api.use('/tasks', createTaskRouter());

  // Placeholders for WO-8 / WO-10
  api.use('/users', Router());
  api.use('/dashboard', Router());

  return api;
}
