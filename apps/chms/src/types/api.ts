import type { RouteMap } from "void/routes";

/** Extracts the serialized JSON output type of a Void route handler. */
type RouteOutput<
  P extends keyof RouteMap,
  M extends keyof RouteMap[P],
> = RouteMap[P][M] extends { output: infer O } ? O : never;

export type People = RouteOutput<"/api/people", "GET">;
export type Person = People[number];

/** Single person view — includes the Household's shared contact fields for the effective-value rule (ADR-0001). */
export type PersonDetail = RouteOutput<"/api/people/:id", "GET">;

/** Minimal person shape returned by the POST /api/people endpoint (no household contact fields). */
export type PersonCreated = RouteOutput<"/api/people", "POST">;

/** A person's relationships, resolved from that person's perspective. */
export type Relationships = RouteOutput<
  "/api/relationships/person/:personId",
  "GET"
>;
export type Relationship = Relationships[number];
