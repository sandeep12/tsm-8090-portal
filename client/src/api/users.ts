import type { ApiClient } from './client';
import type { UserDto, UserRole } from '../types/api';

export type UserCreateInput = {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  active?: boolean;
};

export type UserUpdateInput = {
  name?: string;
  email?: string;
  password?: string;
};

export async function listUsers(api: ApiClient): Promise<UserDto[]> {
  const response = await api.get<{ users: UserDto[] }>('/api/users');
  return response.users;
}

export async function getUser(api: ApiClient, id: string): Promise<UserDto> {
  const response = await api.get<{ user: UserDto }>(`/api/users/${id}`);
  return response.user;
}

export async function createUser(api: ApiClient, input: UserCreateInput): Promise<UserDto> {
  const response = await api.post<{ user: UserDto }>('/api/users', input);
  return response.user;
}

export async function updateUser(
  api: ApiClient,
  id: string,
  input: UserUpdateInput,
): Promise<UserDto> {
  const response = await api.patch<{ user: UserDto }>(`/api/users/${id}`, input);
  return response.user;
}

export async function setUserActive(
  api: ApiClient,
  id: string,
  active: boolean,
): Promise<UserDto> {
  const response = await api.patch<{ user: UserDto }>(`/api/users/${id}/active`, { active });
  return response.user;
}

export async function setUserRole(api: ApiClient, id: string, role: UserRole): Promise<UserDto> {
  const response = await api.patch<{ user: UserDto }>(`/api/users/${id}/role`, { role });
  return response.user;
}
