import { env } from "@sda-chms/env/web";
import { hcWithType } from "@sda-chms/server/client";
import type { ApiErrorBody } from "@sda-chms/shared/types/errors";
import type { ClientResponse } from "hono/client";

/** Type-safe Hono RPC client — all API calls go through this. */
export const apiClient = hcWithType(env.VITE_SERVER_URL);

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

/** Unwraps a Hono client response, throwing an ApiError on non-OK status. */
export const fetchApi = async <T>(
  promise: Promise<ClientResponse<T, number, "json">>
): Promise<T> => {
  const response = await promise;
  const data = await response.json();

  if (!response.ok) {
    const body = data as ApiErrorBody;
    throw new ApiError(body.message, body.code, response.status, body.details);
  }
  return data;
};
