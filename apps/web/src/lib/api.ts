import { env } from "@sda-chms/env/web";
import { hcWithType } from "@sda-chms/server/client";
import type { ApiErrorBody } from "@sda-chms/shared/types/errors";
import type { ClientResponse } from "hono/client";

export const apiClient = hcWithType(env.VITE_SERVER_URL);

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

export const queryKeys = {
  people: () => [apiClient.people.$url().pathname],
  groups: () => [apiClient.groups.$url().pathname],
};
