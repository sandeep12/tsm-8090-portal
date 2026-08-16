import { Router } from 'express';
import { createTaskController } from './task.controller';

export function createTaskRouter(): Router {
  const router = Router();
  const controller = createTaskController();

  router.get('/', ...controller.list);
  router.post('/', ...controller.create);
  router.patch('/:id/status', ...controller.changeStatus);
  router.get('/:id', ...controller.read);
  router.patch('/:id', ...controller.update);
  router.delete('/:id', ...controller.remove);

  return router;
}
