import { z } from 'zod';
import { TaskPriority, TaskStatus } from '../models';

/** Shared TaskInput rules for create/update-style bodies (WO-2 validation scaffold). */
export const taskInputSchema = z.object({
  title: z.string().trim().min(1, 'title is required'),
  description: z.string().optional(),
  priority: z.nativeEnum(TaskPriority, {
    message: 'priority must be Low, Medium, or High',
  }),
  status: z.nativeEnum(TaskStatus).optional(),
  dueDate: z.coerce.date().optional(),
  assignedUserId: z.string().min(1, 'assigned user is required'),
});

export type TaskInput = z.infer<typeof taskInputSchema>;
