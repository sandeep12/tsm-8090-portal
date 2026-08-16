import { z } from 'zod';
import { UserRole } from '../models';

/** Shared UserInput rules for create/update-style bodies (WO-2 validation scaffold). */
export const userInputSchema = z.object({
  name: z.string().trim().min(1, 'name is required'),
  email: z.string().trim().email('email must be a valid email address'),
  role: z.nativeEnum(UserRole),
  password: z.string().min(8, 'password must be at least 8 characters').optional(),
  active: z.boolean().optional(),
});

export type UserInput = z.infer<typeof userInputSchema>;
