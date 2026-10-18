import type { ApiErrorBody } from "@sda-chms/shared/types/errors";
import { FetchError } from "void/client";

/** Client-side error thrown when the API returns a non-OK response. */
export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(
    message: string,
    code: string,
    status: number,
    details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/**
 * Unwraps a Void typed-fetch promise, rethrowing failures as ApiError built
 * from the ApiErrorBody the API contract guarantees.
 */
export const fetchApi = async <T>(promise: Promise<T>): Promise<T> => {
  try {
    return await promise;
  } catch (error) {
    if (error instanceof FetchError) {
      const body = error.data as Partial<ApiErrorBody> | undefined;
      throw new ApiError(
        body?.message ?? error.message,
        body?.code ?? "HTTP_ERROR",
        error.status ?? 0,
        body?.details
      );
    }
    throw error;
  }
};
