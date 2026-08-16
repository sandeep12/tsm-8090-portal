import type { RequestHandler } from 'express';
import type { z } from 'zod';
import { UserRole } from '../models';
import { UserRepository } from '../repositories';
import { NotFoundAppError } from '../errors/http-errors';
import { NotFoundError } from '../repositories/errors';
import { validateRequest } from '../middleware/validate';
import { requireAuth } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/authorize';
import { hashPassword } from '../auth/password';
import { toUserDto } from '../types/auth';
import {
  userActiveChangeSchema,
  userCreateSchema,
  userRoleChangeSchema,
  userUpdateSchema,
} from '../validation';
const adminOnly: RequestHandler[] = [requireAuth(), requireAdmin()];

export function createUserController(users: UserRepository = new UserRepository()) {
  const list: RequestHandler[] = [
    ...adminOnly,
    async (_req, res, next) => {
      try {
        const items = await users.list();
        res.status(200).json({ users: items.map(toUserDto) });
      } catch (error) {
        next(error);
      }
    },
  ];

  const read: RequestHandler[] = [
    ...adminOnly,
    async (req, res, next) => {
      try {
        const user = await users.findById(req.params.id as string);
        if (!user) {
          throw new NotFoundAppError('The user is unavailable');
        }
        res.status(200).json({ user: toUserDto(user) });
      } catch (error) {
        next(error);
      }
    },
  ];

  const create: RequestHandler[] = [
    ...adminOnly,
    validateRequest(userCreateSchema),
    async (req, res, next) => {
      try {
        const body = req.body as z.infer<typeof userCreateSchema>;
        const passwordHash = await hashPassword(body.password);
        const created = await users.create({
          name: body.name,
          email: body.email,
          passwordHash,
          role: body.role ?? UserRole.User,
          active: body.active ?? true,
        });
        res.status(201).json({ user: toUserDto(created) });
      } catch (error) {
        next(error);
      }
    },
  ];

  const update: RequestHandler[] = [
    ...adminOnly,
    validateRequest(userUpdateSchema),
    async (req, res, next) => {
      try {
        const body = req.body as z.infer<typeof userUpdateSchema>;
        const passwordHash =
          body.password !== undefined ? await hashPassword(body.password) : undefined;
        const updated = await users.update(req.params.id as string, {
          name: body.name,
          email: body.email,
          passwordHash,
        });
        res.status(200).json({ user: toUserDto(updated) });
      } catch (error) {
        if (error instanceof NotFoundError) {
          next(new NotFoundAppError('The user is unavailable'));
          return;
        }
        next(error);
      }
    },
  ];

  const changeActive: RequestHandler[] = [
    ...adminOnly,
    validateRequest(userActiveChangeSchema),
    async (req, res, next) => {
      try {
        const body = req.body as z.infer<typeof userActiveChangeSchema>;
        const updated = await users.setActive(req.params.id as string, body.active);
        res.status(200).json({ user: toUserDto(updated) });
      } catch (error) {
        if (error instanceof NotFoundError) {
          next(new NotFoundAppError('The user is unavailable'));
          return;
        }
        next(error);
      }
    },
  ];

  const changeRole: RequestHandler[] = [
    ...adminOnly,
    validateRequest(userRoleChangeSchema),
    async (req, res, next) => {
      try {
        const body = req.body as z.infer<typeof userRoleChangeSchema>;
        const updated = await users.setRole(req.params.id as string, body.role);
        res.status(200).json({ user: toUserDto(updated) });
      } catch (error) {
        if (error instanceof NotFoundError) {
          next(new NotFoundAppError('The user is unavailable'));
          return;
        }
        next(error);
      }
    },
  ];

  return { list, read, create, update, changeActive, changeRole };
}
