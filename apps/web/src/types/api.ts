import type { ClientResponse } from "hono/client";
import type { apiClient } from "@/lib/api";

type ExtractClientResponseData<T> =
  T extends ClientResponse<infer D, number, string> ? D : never;

export type People = ExtractClientResponseData<
  Awaited<ReturnType<typeof apiClient.people.$get>>
>;
export type Person = People[number];

/** Single person view — includes household head fields for the contact fallback. */
export type PersonDetail = ExtractClientResponseData<
  Awaited<ReturnType<(typeof apiClient.people)[":id"]["$get"]>>
>;
