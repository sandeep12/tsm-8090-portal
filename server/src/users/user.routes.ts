import { Router } from 'express';
import { createUserController } from './user.controller';

export function createUserRouter(): Router {
  const router = Router();
  const controller = createUserController();

  router.get('/', ...controller.list);
  router.post('/', ...controller.create);
  router.get('/:id', ...controller.read);
  router.patch('/:id', ...controller.update);
  router.patch('/:id/active', ...controller.changeActive);
  router.patch('/:id/role', ...controller.changeRole);

  return router;
}
