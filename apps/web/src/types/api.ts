import type { ClientResponse } from "hono/client";
import type { apiClient } from "@/lib/api";

/** Extracts the JSON data type from a Hono ClientResponse. */
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

/** Minimal person shape returned by the POST /people endpoint (no household head data). */
export type PersonCreated = ExtractClientResponseData<
  Awaited<ReturnType<typeof apiClient.people.$post>>
>;

/** A person's relationships, resolved from that person's perspective. */
export type Relationships = ExtractClientResponseData<
  Awaited<
    ReturnType<(typeof apiClient.relationships.person)[":personId"]["$get"]>
  >
>;
export type Relationship = Relationships[number];
