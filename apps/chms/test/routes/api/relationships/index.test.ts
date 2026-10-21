import type { Hono } from "hono";
import { beforeAll, beforeEach, describe, expect, it } from "vite-plus/test";

import { createTestApp } from "../../../routes";
import { resetDb } from "../../../void-db";

/** A valid head-of-household payload; each head gets its own household. */
const validHead = {
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

interface PersonResponse {
  householdId: string | null;
  id: string;
  maritalStatus: string;
}

interface RelationshipItem {
  id: string;
  relatedPerson: { fullName: string; id: string };
  state: string | null;
  type: string;
}

const json = async <T>(res: Response): Promise<T> => (await res.json()) as T;

describe("POST /api/relationships (integration, SQLite)", () => {
  let app: Hono;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(async () => {
    await resetDb();
  });

  const postPerson = (body: unknown) =>
    app.request("/api/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

  const postRelationship = (body: unknown) =>
    app.request("/api/relationships", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

  const listFor = (personId: string) =>
    app.request(`/api/relationships/person/${personId}`);

  /** Two heads each get their own household, so any link between them is cross-household. */
  const seedTwoPeople = async () => {
    const a = await json<PersonResponse>(
      await postPerson({ ...validHead, firstName: "ann" })
    );
    const b = await json<PersonResponse>(
      await postPerson({ ...validHead, firstName: "ben" })
    );
    expect(a.householdId).not.toBe(b.householdId);
    return { a, b };
  };

  it("links two people and lists the link on the subject with the chosen type", async () => {
    const { a, b } = await seedTwoPeople();

    // "ann is ben's parent"
    const created = await postRelationship({
      personId: b.id,
      relatedPersonId: a.id,
      type: "parent",
    });
    expect(created.status).toBe(200);

    const benList = await json<RelationshipItem[]>(await listFor(b.id));
    expect(benList).toHaveLength(1);
    expect(benList[0]?.type).toBe("parent");
    expect(benList[0]?.relatedPerson.id).toBe(a.id);
    expect(benList[0]?.relatedPerson.fullName).toBe("Ann");
  });

  it("rejects linking a person to themselves with 400", async () => {
    const { a } = await seedTwoPeople();
    const res = await postRelationship({
      personId: a.id,
      relatedPersonId: a.id,
      type: "sibling",
    });
    expect(res.status).toBe(400);
  });

  it("rejects a link to an unknown person with 422 DB_ERROR", async () => {
    const { a } = await seedTwoPeople();
    const res = await postRelationship({
      personId: a.id,
      relatedPersonId: "00000000-0000-4000-8000-000000000000",
      type: "spouse",
    });
    expect(res.status).toBe(422);
    const body = await json<{ code: string }>(res);
    expect(body.code).toBe("DB_ERROR");
  });

  it("creates a spouse link with an explicit lifecycle state", async () => {
    const { a, b } = await seedTwoPeople();
    const created = await postRelationship({
      personId: a.id,
      relatedPersonId: b.id,
      type: "spouse",
      state: "separated",
    });
    expect(created.status).toBe(200);

    const list = await json<RelationshipItem[]>(await listFor(a.id));
    expect(list[0]?.type).toBe("spouse");
    expect(list[0]?.state).toBe("separated");
    // Reciprocal view shows the same state.
    const other = await json<RelationshipItem[]>(await listFor(b.id));
    expect(other[0]?.state).toBe("separated");
  });

  it("defaults a spouse link with no state to married", async () => {
    const { a, b } = await seedTwoPeople();
    await postRelationship({
      personId: a.id,
      relatedPersonId: b.id,
      type: "spouse",
    });
    const list = await json<RelationshipItem[]>(await listFor(a.id));
    expect(list[0]?.state).toBe("married");
  });

  it("stores no state for a non-spouse link", async () => {
    const { a, b } = await seedTwoPeople();
    await postRelationship({
      personId: b.id,
      relatedPersonId: a.id,
      type: "parent",
    });
    const list = await json<RelationshipItem[]>(await listFor(b.id));
    expect(list[0]?.state).toBeNull();
  });

  it("rejects a lifecycle state on a non-spouse link with 400", async () => {
    const { a, b } = await seedTwoPeople();
    const res = await postRelationship({
      personId: a.id,
      relatedPersonId: b.id,
      type: "sibling",
      state: "married",
    });
    expect(res.status).toBe(400);
  });
});
