import { env } from "@sda-chms/env/web";
import { hcWithType } from "@sda-chms/server/client";
import type { ClientResponse } from "hono/client";

export const apiClient = hcWithType(env.VITE_SERVER_URL);

export const fetchApi = async <T>(
  promise: Promise<ClientResponse<T, number, "json">>
): Promise<T> => {
  const response = await promise;
  const data = await response.json();
  if (!response.ok) {
    throw data;
  }
  return data;
};

export const queryKeys = {
  groups: () => [apiClient.groups.$url().pathname],
};
