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

describe("PATCH and DELETE /api/relationships/:id (integration, PGlite)", () => {
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

  const patchState = (id: string, state: string) =>
    app.request(`/api/relationships/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state }),
    });

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

  it("removes a relationship from both perspectives", async () => {
    const { a, b } = await seedTwoPeople();
    await postRelationship({
      personId: b.id,
      relatedPersonId: a.id,
      type: "parent",
    });

    const benList = await json<RelationshipItem[]>(await listFor(b.id));
    const relId = benList[0]?.id;
    expect(relId).toBeTruthy();

    const del = await app.request(`/api/relationships/${relId}`, {
      method: "DELETE",
    });
    expect(del.status).toBe(200);

    await expect(
      json<RelationshipItem[]>(await listFor(b.id))
    ).resolves.toHaveLength(0);
    await expect(
      json<RelationshipItem[]>(await listFor(a.id))
    ).resolves.toHaveLength(0);
  });

  it("persists the link through a state change (divorce does not delete it)", async () => {
    const { a, b } = await seedTwoPeople();
    const created = await json<{ id: string }>(
      await postRelationship({
        personId: a.id,
        relatedPersonId: b.id,
        type: "spouse",
        state: "married",
      })
    );

    const patched = await patchState(created.id, "divorced");
    expect(patched.status).toBe(200);

    // The link still exists on both sides, now divorced.
    const list = await json<RelationshipItem[]>(await listFor(a.id));
    expect(list).toHaveLength(1);
    expect(list[0]?.state).toBe("divorced");
    const other = await json<RelationshipItem[]>(await listFor(b.id));
    expect(other[0]?.state).toBe("divorced");
  });

  it("lets a person hold more than one spouse link in different states", async () => {
    const { a, b } = await seedTwoPeople();
    const c = await json<PersonResponse>(
      await postPerson({ ...validHead, firstName: "cara" })
    );

    const first = await json<{ id: string }>(
      await postRelationship({
        personId: a.id,
        relatedPersonId: b.id,
        type: "spouse",
        state: "married",
      })
    );
    await patchState(first.id, "divorced");
    await postRelationship({
      personId: a.id,
      relatedPersonId: c.id,
      type: "spouse",
      state: "married",
    });

    const list = await json<RelationshipItem[]>(await listFor(a.id));
    const spouses = list.filter((r) => r.type === "spouse");
    expect(spouses).toHaveLength(2);
    expect(
      spouses
        .map((s) => s.state)
        .toSorted((stateA, stateB) => {
          const x = stateA ?? "";
          const y = stateB ?? "";
          if (x < y) {
            return -1;
          }
          if (x > y) {
            return 1;
          }
          return 0;
        })
    ).toStrictEqual(["divorced", "married"]);
  });
});
