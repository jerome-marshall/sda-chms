import type { ClientResponse } from "hono/client";
import type { apiClient } from "@/lib/api";

type ExtractClientResponseData<T> =
  T extends ClientResponse<infer D, number, string> ? D : never;

export type People = ExtractClientResponseData<
  Awaited<ReturnType<typeof apiClient.people.$get>>
>;
export type Person = People[number];
