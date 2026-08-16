import type { TaskDto } from './task';

export type DashboardCounts = {
  total: number;
  toDo: number;
  inProgress: number;
  done: number;
};

export type DashboardSummary = {
  counts: DashboardCounts;
  recentTasks: TaskDto[];
};
