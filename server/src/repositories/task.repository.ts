import type { FilterQuery, Types } from 'mongoose';
import { TaskModel, TaskStatus, type TaskDocument, type TaskPriority, type TaskStatus as TaskStatusType } from '../models';
import { InvalidAssigneeError, NotFoundError } from './errors';
import { UserRepository } from './user.repository';

export type CreateTaskInput = {
  title: string;
  description?: string;
  priority: TaskPriority;
  status?: TaskStatusType;
  dueDate?: Date;
  assignedUserId: string | Types.ObjectId;
};

export type UpdateTaskInput = {
  title?: string;
  description?: string | null;
  priority?: TaskPriority;
  status?: TaskStatusType;
  dueDate?: Date | null;
  assignedUserId?: string | Types.ObjectId;
};

export type TaskListFilter = {
  /** When set, only tasks assigned to this user. Omit (or pass null) for all tasks. */
  assignedUserId?: string | Types.ObjectId | null;
  status?: TaskStatusType;
  priority?: TaskPriority;
  /** Case-insensitive substring match on title. */
  titleSearch?: string;
};

export type TaskStatusCounts = {
  total: number;
  toDo: number;
  inProgress: number;
  done: number;
};

export class TaskRepository {
  constructor(private readonly users: UserRepository = new UserRepository()) {}

  async create(input: CreateTaskInput): Promise<TaskDocument> {
    await this.assertActiveAssignee(input.assignedUserId);

    return TaskModel.create({
      title: input.title,
      description: input.description,
      priority: input.priority,
      status: input.status ?? TaskStatus.ToDo,
      dueDate: input.dueDate,
      assignedUserId: input.assignedUserId,
    });
  }

  async findById(id: string | Types.ObjectId): Promise<TaskDocument | null> {
    return TaskModel.findById(id).exec();
  }

  async update(id: string | Types.ObjectId, input: UpdateTaskInput): Promise<TaskDocument> {
    if (input.assignedUserId !== undefined) {
      await this.assertActiveAssignee(input.assignedUserId);
    }

    const update: Record<string, unknown> = {};
    if (input.title !== undefined) update.title = input.title;
    if (input.description !== undefined) {
      update.description = input.description === null ? undefined : input.description;
    }
    if (input.priority !== undefined) update.priority = input.priority;
    if (input.status !== undefined) update.status = input.status;
    if (input.dueDate !== undefined) {
      update.dueDate = input.dueDate === null ? undefined : input.dueDate;
    }
    if (input.assignedUserId !== undefined) update.assignedUserId = input.assignedUserId;

    const task = await TaskModel.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).exec();

    if (!task) {
      throw new NotFoundError('Task', String(id));
    }
    return task;
  }

  async delete(id: string | Types.ObjectId): Promise<void> {
    const result = await TaskModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundError('Task', String(id));
    }
  }

  async list(filter: TaskListFilter = {}): Promise<TaskDocument[]> {
    return TaskModel.find(this.buildQuery(filter)).sort({ updatedAt: -1 }).exec();
  }

  async getStatusCounts(filter: Pick<TaskListFilter, 'assignedUserId'> = {}): Promise<TaskStatusCounts> {
    const match = this.buildQuery(filter);
    const rows = await TaskModel.aggregate<{ _id: TaskStatusType; count: number }>([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]).exec();

    const byStatus = new Map(rows.map((row) => [row._id, row.count]));
    const toDo = byStatus.get(TaskStatus.ToDo) ?? 0;
    const inProgress = byStatus.get(TaskStatus.InProgress) ?? 0;
    const done = byStatus.get(TaskStatus.Done) ?? 0;

    return {
      total: toDo + inProgress + done,
      toDo,
      inProgress,
      done,
    };
  }

  /** Recent activity ordered by updatedAt descending (dashboard). */
  async findRecent(
    filter: Pick<TaskListFilter, 'assignedUserId'> = {},
    limit = 10,
  ): Promise<TaskDocument[]> {
    return TaskModel.find(this.buildQuery(filter)).sort({ updatedAt: -1 }).limit(limit).exec();
  }

  private buildQuery(filter: TaskListFilter): FilterQuery<TaskDocument> {
    const query: FilterQuery<TaskDocument> = {};

    if (filter.assignedUserId) {
      query.assignedUserId = filter.assignedUserId;
    }
    if (filter.status) {
      query.status = filter.status;
    }
    if (filter.priority) {
      query.priority = filter.priority;
    }
    if (filter.titleSearch?.trim()) {
      query.title = { $regex: filter.titleSearch.trim(), $options: 'i' };
    }

    return query;
  }

  private async assertActiveAssignee(assignedUserId: string | Types.ObjectId): Promise<void> {
    const user = await this.users.findById(assignedUserId);
    if (!user || !user.active) {
      throw new InvalidAssigneeError(String(assignedUserId));
    }
  }
}
