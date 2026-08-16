import { z } from 'zod';
import { UserRole } from '../models';

/** Create-user body for administrators. */
export const userCreateSchema = z.object({
  name: z.string().trim().min(1, 'name is required'),
  email: z.string().trim().email('email must be a valid email address'),
  password: z.string().min(8, 'password must be at least 8 characters'),
  role: z.nativeEnum(UserRole).optional(),
  active: z.boolean().optional(),
});

export type UserCreateInput = z.infer<typeof userCreateSchema>;

/** Update profile fields (password optional). */
export const userUpdateSchema = z
  .object({
    name: z.string().trim().min(1, 'name is required').optional(),
    email: z.string().trim().email('email must be a valid email address').optional(),
    password: z.string().min(8, 'password must be at least 8 characters').optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  });

export type UserUpdateBody = z.infer<typeof userUpdateSchema>;

export const userRoleChangeSchema = z.object({
  role: z.nativeEnum(UserRole, {
    message: 'role must be Administrator or User',
  }),
});

export const userActiveChangeSchema = z.object({
  active: z.boolean(),
});

/** @deprecated Prefer userCreateSchema / userUpdateSchema. Kept for shared exports. */
export const userInputSchema = userCreateSchema;
export type UserInput = UserCreateInput;
