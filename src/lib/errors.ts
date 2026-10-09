import type { ApiErrorBody } from "./types";

export type ErrorCode =
  | "invalid_input"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "database_error"
  | "config_error"
  | "internal_error";

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  invalid_input: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  rate_limited: 429,
  database_error: 500,
  config_error: 500,
  internal_error: 500,
};

/**
 * Application error with a stable public message. Internal details are kept in
 * the server logs (via `cause`) and never sent to clients.
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: Record<string, string[]>;

  constructor(
    code: ErrorCode,
    message: string,
    details?: Record<string, string[]>,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "AppError";
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.details = details;
  }
}

interface PostgrestLikeError {
  code?: string;
  message?: string;
  details?: string | null;
}

/** Translate low-level Postgrest/Postgres errors into safe AppErrors. */
export function fromDatabaseError(error: PostgrestLikeError): AppError {
  switch (error.code) {
    case "23505":
      return new AppError(
        "conflict",
        "A service with that slug already exists.",
        undefined,
        { cause: error },
      );
    case "23503":
      return new AppError(
        "conflict",
        "That change conflicts with a related record.",
        undefined,
        { cause: error },
      );
    case "23514":
      return new AppError(
        "invalid_input",
        "The submitted values are not allowed.",
        undefined,
        { cause: error },
      );
    default:
      return new AppError(
        "database_error",
        "The database could not complete the request. Please try again.",
        undefined,
        { cause: error },
      );
  }
}

/** Serialise any thrown value into the public API error envelope. */
export function toApiErrorBody(error: unknown): ApiErrorBody {
  if (error instanceof AppError) {
    return {
      ok: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
    };
  }
  return {
    ok: false,
    error: {
      code: "internal_error",
      message: "An unexpected error occurred. Please try again.",
    },
  };
}

export function statusForError(error: unknown): number {
  return error instanceof AppError ? error.status : 500;
}
