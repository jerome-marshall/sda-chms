import type { RouteMap } from "void/routes";

type RouteOutput<
  P extends keyof RouteMap,
  M extends keyof RouteMap[P],
> = RouteMap[P][M] extends { output: infer O } ? O : never;

export type People = RouteOutput<"/api/people", "GET">;

export type Person = People[number];

export type Relationships = RouteOutput<
  "/api/relationships/person/:personId",
  "GET"
>;
export type Relationship = Relationships[number];

export type Households = RouteOutput<"/api/households", "GET">;
export type Household = Households[number];
