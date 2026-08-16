import { z } from 'zod';
import { TaskPriority, TaskStatus } from '../models';

const objectIdString = z
  .string()
  .trim()
  .min(1, 'assigned user is required')
  .regex(/^[a-fA-F0-9]{24}$/, 'assigned user must be a valid id');

/** Create-task body: title, priority, and assigned user are mandatory. */
export const taskInputSchema = z.object({
  title: z.string().trim().min(1, 'title is required'),
  description: z.string().optional(),
  priority: z.nativeEnum(TaskPriority, {
    message: 'priority must be Low, Medium, or High',
  }),
  status: z.nativeEnum(TaskStatus, {
    message: 'status must be To Do, In Progress, or Done',
  }).optional(),
  dueDate: z.coerce.date().optional(),
  assignedUserId: objectIdString,
});

export type TaskInput = z.infer<typeof taskInputSchema>;

/** Partial update body for edit. */
export const taskUpdateSchema = z
  .object({
    title: z.string().trim().min(1, 'title is required').optional(),
    description: z.string().nullable().optional(),
    priority: z
      .nativeEnum(TaskPriority, {
        message: 'priority must be Low, Medium, or High',
      })
      .optional(),
    status: z
      .nativeEnum(TaskStatus, {
        message: 'status must be To Do, In Progress, or Done',
      })
      .optional(),
    dueDate: z.coerce.date().nullable().optional(),
    assignedUserId: objectIdString.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  });

export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;

export const taskStatusChangeSchema = z.object({
  status: z.nativeEnum(TaskStatus, {
    message: 'status must be To Do, In Progress, or Done',
  }),
});

export type TaskStatusChangeInput = z.infer<typeof taskStatusChangeSchema>;

export const taskListQuerySchema = z.object({
  q: z.string().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
});

export type TaskListQuery = z.infer<typeof taskListQuerySchema>;
