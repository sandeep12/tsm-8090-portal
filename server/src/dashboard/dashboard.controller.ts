import type { Request, RequestHandler } from 'express';
import { UserRole } from '../models';
import { TaskRepository } from '../repositories';
import { requireAuth } from '../middleware/authenticate';
import { toTaskDto } from '../types/task';
import type { DashboardSummary } from '../types/dashboard';

function scopeAssignedUserId(req: Request): string | undefined {
  if (!req.principal) return undefined;
  return req.principal.role === UserRole.Administrator ? undefined : req.principal.id;
}

const RECENT_LIMIT = 10;

export function createDashboardController(tasks: TaskRepository = new TaskRepository()) {
  const summary: RequestHandler[] = [
    requireAuth(),
    async (req, res, next) => {
      try {
        const assignedUserId = scopeAssignedUserId(req);
        const [counts, recent] = await Promise.all([
          tasks.getStatusCounts({ assignedUserId }),
          tasks.findRecent({ assignedUserId }, RECENT_LIMIT),
        ]);

        const body: DashboardSummary = {
          counts: {
            total: counts.total,
            toDo: counts.toDo,
            inProgress: counts.inProgress,
            done: counts.done,
          },
          recentTasks: recent.map(toTaskDto),
        };

        res.status(200).json(body);
      } catch (error) {
        next(error);
      }
    },
  ];

  return { summary };
}
