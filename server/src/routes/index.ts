import { Router } from 'express';

/**
 * Route registration shell for upcoming feature work orders.
 * Controllers are intentionally empty in WO-2.
 */
export function createApiRouter(): Router {
  const api = Router();

  api.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // Placeholders for WO-4 / WO-6 / WO-8 / WO-10
  api.use('/auth', Router());
  api.use('/tasks', Router());
  api.use('/users', Router());
  api.use('/dashboard', Router());

  return api;
}
