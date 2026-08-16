export class DuplicateEmailError extends Error {
  readonly code = 'DUPLICATE_EMAIL' as const;

  constructor(email: string) {
    super(`A user with email "${email}" already exists`);
    this.name = 'DuplicateEmailError';
  }
}

export class InvalidAssigneeError extends Error {
  readonly code = 'INVALID_ASSIGNEE' as const;

  constructor(assignedUserId: string) {
    super(`Assignee "${assignedUserId}" must reference an existing active user`);
    this.name = 'InvalidAssigneeError';
  }
}

export class NotFoundError extends Error {
  readonly code = 'NOT_FOUND' as const;

  constructor(entity: string, id: string) {
    super(`${entity} "${id}" was not found`);
    this.name = 'NotFoundError';
  }
}

export function isMongoDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: number }).code === 11000
  );
}
