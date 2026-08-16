export type FieldError = {
  field: string;
  message: string;
};

/** Uniform API error body consumed by the client. */
export type ErrorResponse = {
  message: string;
  code?: string;
  errors?: FieldError[];
};
