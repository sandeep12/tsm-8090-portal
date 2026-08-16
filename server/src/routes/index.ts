import { Router } from 'express';
import { createAuthRouter } from '../auth/auth.routes';
import { createTaskRouter } from '../tasks/task.routes';
import { createDashboardRouter } from '../dashboard/dashboard.routes';

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
  api.use('/dashboard', createDashboardRouter());

  // Placeholder for WO-10
  api.use('/users', Router());

  return api;
}
