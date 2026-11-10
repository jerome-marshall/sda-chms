import type { Hono } from "hono";

import type { Household, PersonDetail, Relationship } from "@/types/api";

/** The response shapes the route tests read, from the real API contract. */
export type PersonResponse = PersonDetail;
export type RelationshipItem = Relationship;
export type HouseholdResponse = Household;

/** A valid head-of-household payload; each head defines a new Household. */
export const validHead = {
  firstName: "jo",
  gender: "male",
  dateOfBirth: "1990-01-01",
  addressLine1: "123 Main St",
  city: "Hosur",
  state: "Tamil Nadu",
  country: "India",
  maritalStatus: "single",
  membershipStatus: "member",
  dietaryPreference: "none",
  householdRole: "head",
};

/** Parses a JSON response body. */
export const json = async <T>(res: Response): Promise<T> =>
  (await res.json()) as T;

/** Parses a response, failing loudly when the request did not succeed. */
export const readOk = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    throw new Error(`expected a successful response, got ${res.status}`);
  }
  return await json<T>(res);
};

/** POSTs a person body to the API. */
export const postPerson = (app: Hono, body: unknown) =>
  app.request("/api/people", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

/** Creates a person and returns the API shape. */
export const createPerson = async (
  app: Hono,
  overrides: Record<string, unknown> = {}
): Promise<PersonResponse> =>
  await readOk<PersonResponse>(
    await postPerson(app, { ...validHead, ...overrides })
  );

/** PUTs a person body to the API. */
export const putPerson = (
  app: Hono,
  id: string,
  body: Record<string, unknown>
) =>
  app.request(`/api/people/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

/** POSTs a relationship body to the API. */
export const postRelationship = (app: Hono, body: unknown) =>
  app.request("/api/relationships", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

/** Lists a person's relationships from their perspective. */
export const listFor = (app: Hono, personId: string) =>
  app.request(`/api/relationships/person/${personId}`);

/** Creates two heads, each in their own Household, for cross-household links. */
export const createTwoPeople = async (app: Hono) => {
  const a = await createPerson(app, { firstName: "ann" });
  const b = await createPerson(app, { firstName: "ben" });
  if (a.householdId === b.householdId) {
    throw new Error("fixtures: expected each head to define a new Household");
  }
  return { a, b };
};
