import type { UserDocument, UserRole } from '../models';

export type UserDto = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
};

export type AuthResponse = {
  token: string;
  user: UserDto;
};

export type AuthPrincipal = {
  id: string;
  role: UserRole;
  user: UserDocument;
};

export function toUserDto(user: UserDocument): UserDto {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
    active: user.active,
  };
}
