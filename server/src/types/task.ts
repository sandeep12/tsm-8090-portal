import type { TaskDocument } from '../models';

export type TaskDto = {
  id: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  dueDate?: string;
  assignedUserId: string;
  createdAt: string;
  updatedAt: string;
};

export function toTaskDto(task: TaskDocument): TaskDto {
  return {
    id: String(task._id),
    title: task.title,
    ...(task.description ? { description: task.description } : {}),
    priority: task.priority,
    status: task.status,
    ...(task.dueDate ? { dueDate: new Date(task.dueDate).toISOString() } : {}),
    assignedUserId: String(task.assignedUserId),
    createdAt: new Date(task.createdAt).toISOString(),
    updatedAt: new Date(task.updatedAt).toISOString(),
  };
}
