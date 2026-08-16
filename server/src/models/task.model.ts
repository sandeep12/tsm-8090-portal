import { Schema, model, type HydratedDocument, type InferSchemaType, type Types } from 'mongoose';

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

const taskSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: undefined },
    priority: {
      type: String,
      enum: Object.values(TaskPriority),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      required: true,
      default: TaskStatus.ToDo,
    },
    dueDate: { type: Date, default: undefined },
    assignedUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'tasks',
  },
);

taskSchema.index({ status: 1, priority: 1 });
taskSchema.index({ title: 'text' });
taskSchema.index({ updatedAt: -1 });

export type Task = InferSchemaType<typeof taskSchema> & { _id: Types.ObjectId };
export type TaskDocument = HydratedDocument<Task>;

export const TaskModel = model('Task', taskSchema);
