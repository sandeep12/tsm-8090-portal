import type { FieldError } from '../types/error-response';

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly errors?: FieldError[];

  constructor(
    message: string,
    statusCode: number,
    code: string,
    errors?: FieldError[],
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
  }
}

export class ValidationAppError extends AppError {
  constructor(errors: FieldError[], message = 'Validation failed') {
    super(message, 400, 'VALIDATION_ERROR', errors);
    this.name = 'ValidationAppError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class NotFoundAppError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundAppError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code = 'CONFLICT') {
    super(message, 409, code);
    this.name = 'ConflictError';
  }
}
