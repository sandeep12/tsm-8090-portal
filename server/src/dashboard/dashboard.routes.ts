import { Router } from 'express';
import { createDashboardController } from './dashboard.controller';

export function createDashboardRouter(): Router {
  const router = Router();
  const controller = createDashboardController();

  router.get('/', ...controller.summary);

  return router;
}
