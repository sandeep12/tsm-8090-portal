export type UserRole = 'Administrator' | 'User';

export type UserDto = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
};

export type FieldError = {
  field: string;
  message: string;
};

export type ErrorResponse = {
  message: string;
  code?: string;
  errors?: FieldError[];
};

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly errors?: FieldError[];

  constructor(status: number, body: ErrorResponse) {
    super(body.message || 'Request failed');
    this.name = 'ApiError';
    this.status = status;
    this.code = body.code;
    this.errors = body.errors;
  }
}
