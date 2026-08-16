import type { Request, RequestHandler } from 'express';
import type { z } from 'zod';
import { UserRole, type TaskDocument } from '../models';
import { TaskRepository } from '../repositories';
import { ForbiddenError, NotFoundAppError, UnauthorizedError } from '../errors/http-errors';
import { validateRequest } from '../middleware/validate';
import { requireAuth } from '../middleware/authenticate';
import { toTaskDto } from '../types/task';
import {
  taskInputSchema,
  taskListQuerySchema,
  taskStatusChangeSchema,
  taskUpdateSchema,
} from '../validation';

declare global {
  namespace Express {
    interface Request {
      task?: TaskDocument;
    }
  }
}

function scopeAssignedUserId(req: Request): string | undefined {
  if (!req.principal) return undefined;
  return req.principal.role === UserRole.Administrator ? undefined : req.principal.id;
}

function assertCanAccessTask(req: Request, task: TaskDocument): void {
  if (!req.principal) {
    throw new UnauthorizedError('Authentication required');
  }
  if (req.principal.role === UserRole.Administrator) {
    return;
  }
  if (String(task.assignedUserId) !== req.principal.id) {
    throw new ForbiddenError('You can only access your own tasks');
  }
}

export function createTaskController(tasks: TaskRepository = new TaskRepository()) {
  const loadTask: RequestHandler = async (req, _res, next) => {
    try {
      const task = await tasks.findById(req.params.id as string);
      if (!task) {
        throw new NotFoundAppError('The task is unavailable');
      }
      assertCanAccessTask(req, task);
      req.task = task;
      next();
    } catch (error) {
      next(error);
    }
  };

  const list: RequestHandler[] = [
    requireAuth(),
    validateRequest(taskListQuerySchema, 'query'),
    async (req, res, next) => {
      try {
        const query = (req.validatedQuery ?? req.query) as z.infer<typeof taskListQuerySchema>;
        const items = await tasks.list({
          assignedUserId: scopeAssignedUserId(req),
          status: query.status,
          priority: query.priority,
          titleSearch: query.q,
        });
        res.status(200).json({ tasks: items.map(toTaskDto) });
      } catch (error) {
        next(error);
      }
    },
  ];

  const read: RequestHandler[] = [
    requireAuth(),
    loadTask,
    (req, res) => {
      res.status(200).json({ task: toTaskDto(req.task!) });
    },
  ];

  const create: RequestHandler[] = [
    requireAuth(),
    validateRequest(taskInputSchema),
    async (req, res, next) => {
      try {
        const body = req.body as z.infer<typeof taskInputSchema>;
        const created = await tasks.create({
          title: body.title,
          description: body.description,
          priority: body.priority,
          status: body.status,
          dueDate: body.dueDate,
          assignedUserId: body.assignedUserId,
        });
        res.status(201).json({ task: toTaskDto(created) });
      } catch (error) {
        next(error);
      }
    },
  ];

  const update: RequestHandler[] = [
    requireAuth(),
    loadTask,
    validateRequest(taskUpdateSchema),
    async (req, res, next) => {
      try {
        const body = req.body as z.infer<typeof taskUpdateSchema>;
        const updated = await tasks.update(req.task!._id, {
          title: body.title,
          description: body.description,
          priority: body.priority,
          status: body.status,
          dueDate: body.dueDate,
          assignedUserId: body.assignedUserId,
        });
        res.status(200).json({ task: toTaskDto(updated) });
      } catch (error) {
        next(error);
      }
    },
  ];

  const changeStatus: RequestHandler[] = [
    requireAuth(),
    loadTask,
    validateRequest(taskStatusChangeSchema),
    async (req, res, next) => {
      try {
        const body = req.body as z.infer<typeof taskStatusChangeSchema>;
        const updated = await tasks.update(req.task!._id, { status: body.status });
        res.status(200).json({ task: toTaskDto(updated) });
      } catch (error) {
        next(error);
      }
    },
  ];

  const remove: RequestHandler[] = [
    requireAuth(),
    loadTask,
    async (req, res, next) => {
      try {
        await tasks.delete(req.task!._id);
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  ];

  return { list, read, create, update, changeStatus, remove };
}
