import type { ApiClient } from './client';
import type { TaskDto, TaskInput, TaskListParams } from '../types/task';

function withQuery(path: string, params: TaskListParams = {}): string {
  const query = new URLSearchParams();
  if (params.q?.trim()) query.set('q', params.q.trim());
  if (params.status) query.set('status', params.status);
  if (params.priority) query.set('priority', params.priority);
  const suffix = query.toString();
  return suffix ? `${path}?${suffix}` : path;
}

export async function listTasks(api: ApiClient, params?: TaskListParams): Promise<TaskDto[]> {
  const response = await api.get<{ tasks: TaskDto[] }>(withQuery('/api/tasks', params));
  return response.tasks;
}

export async function getTask(api: ApiClient, id: string): Promise<TaskDto> {
  const response = await api.get<{ task: TaskDto }>(`/api/tasks/${id}`);
  return response.task;
}

export async function createTask(api: ApiClient, input: TaskInput): Promise<TaskDto> {
  const response = await api.post<{ task: TaskDto }>('/api/tasks', input);
  return response.task;
}

export async function updateTask(
  api: ApiClient,
  id: string,
  input: Partial<TaskInput>,
): Promise<TaskDto> {
  const response = await api.patch<{ task: TaskDto }>(`/api/tasks/${id}`, input);
  return response.task;
}

export async function changeTaskStatus(
  api: ApiClient,
  id: string,
  status: string,
): Promise<TaskDto> {
  const response = await api.patch<{ task: TaskDto }>(`/api/tasks/${id}/status`, { status });
  return response.task;
}

export async function deleteTask(api: ApiClient, id: string): Promise<void> {
  await api.delete(`/api/tasks/${id}`);
}
