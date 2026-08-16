export const TaskPriority = {
  Low: 'Low',
  Medium: 'Medium',
  High: 'High',
} as const;

export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];

export const TaskStatus = {
  ToDo: 'To Do',
  InProgress: 'In Progress',
  Done: 'Done',
} as const;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export type TaskDto = {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority | string;
  status: TaskStatus | string;
  dueDate?: string;
  assignedUserId: string;
  createdAt: string;
  updatedAt: string;
};

export type TaskInput = {
  title: string;
  description?: string;
  priority: TaskPriority | string;
  status?: TaskStatus | string;
  dueDate?: string;
  assignedUserId: string;
};

export type TaskListParams = {
  q?: string;
  status?: string;
  priority?: string;
};
