import type { Hono } from "hono";
import { beforeAll, beforeEach, describe, expect, it } from "vite-plus/test";

import { createTestApp } from "../../../../routes";
import { resetDb } from "../../../../void-db";

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

describe("GET /api/relationships/person/:personId (integration, PGlite)", () => {
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

  const getPerson = (id: string) => app.request(`/api/people/${id}`);

  const putPerson = (
    id: string,
    householdId: string,
    overrides: Record<string, unknown> = {}
  ) =>
    app.request(`/api/people/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...validHead,
        householdId,
        ...overrides,
      }),
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

  it("applies the reciprocity rule on the related person's list", async () => {
    const { a, b } = await seedTwoPeople();
    await postRelationship({
      personId: b.id,
      relatedPersonId: a.id,
      type: "parent",
    });

    // ann is ben's parent ⇒ ben is ann's child
    const annList = await json<RelationshipItem[]>(await listFor(a.id));
    expect(annList).toHaveLength(1);
    expect(annList[0]?.type).toBe("child");
    expect(annList[0]?.relatedPerson.id).toBe(b.id);
  });

  it("reflects widowhood when the partner is deceased", async () => {
    const a = await json<PersonResponse>(
      await postPerson({ ...validHead, firstName: "ann" })
    );
    const dead = await json<PersonResponse>(
      await postPerson({
        ...validHead,
        firstName: "sam",
        membershipStatus: "deceased",
      })
    );
    await postRelationship({
      personId: a.id,
      relatedPersonId: dead.id,
      type: "spouse",
      state: "married",
    });

    // From ann's perspective her partner is deceased → widowed.
    const list = await json<RelationshipItem[]>(await listFor(a.id));
    expect(list[0]?.state).toBe("widowed");
  });

  describe("Marital Status follows the spouse link (ADR-0003, issue #8)", () => {
    it("sets both People's Marital Status from a new spouse link", async () => {
      const { a, b } = await seedTwoPeople();
      expect(
        (await json<PersonResponse>(await getPerson(a.id))).maritalStatus
      ).toBe("single");

      await postRelationship({
        personId: a.id,
        relatedPersonId: b.id,
        type: "spouse",
      });

      expect(
        (await json<PersonResponse>(await getPerson(a.id))).maritalStatus
      ).toBe("married");
      expect(
        (await json<PersonResponse>(await getPerson(b.id))).maritalStatus
      ).toBe("married");
    });

    it("updates Marital Status when the spouse link's state changes", async () => {
      const { a, b } = await seedTwoPeople();
      const created = await json<{ id: string }>(
        await postRelationship({
          personId: a.id,
          relatedPersonId: b.id,
          type: "spouse",
          state: "married",
        })
      );

      const patched = await app.request(`/api/relationships/${created.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: "separated" }),
      });
      expect(patched.status).toBe(200);

      expect(
        (await json<PersonResponse>(await getPerson(a.id))).maritalStatus
      ).toBe("separated");
      expect(
        (await json<PersonResponse>(await getPerson(b.id))).maritalStatus
      ).toBe("separated");
    });

    it("lets Marital Status be set manually when no spouse link exists", async () => {
      const { a } = await seedTwoPeople();
      const res = await putPerson(a.id, a.householdId ?? "", {
        maritalStatus: "divorced",
      });
      expect(res.status).toBe(200);
      expect((await json<PersonResponse>(res)).maritalStatus).toBe("divorced");
    });

    it("rejects a manual Marital Status that contradicts the governing spouse link", async () => {
      const { a, b } = await seedTwoPeople();
      await postRelationship({
        personId: a.id,
        relatedPersonId: b.id,
        type: "spouse",
        state: "married",
      });

      const res = await putPerson(a.id, a.householdId ?? "", {
        maritalStatus: "single",
      });
      expect(res.status).toBe(400);
      const body = await json<{ code: string; message: string }>(res);
      expect(body.code).toBe("HTTP_ERROR");
      expect(body.message.toLowerCase()).toContain("spouse");
      expect(
        (await json<PersonResponse>(await getPerson(a.id))).maritalStatus
      ).toBe("married");
    });

    it("follows the current marriage when a Person has several spouse links", async () => {
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
      await app.request(`/api/relationships/${first.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: "divorced" }),
      });
      await postRelationship({
        personId: a.id,
        relatedPersonId: c.id,
        type: "spouse",
        state: "married",
      });

      expect(
        (await json<PersonResponse>(await getPerson(a.id))).maritalStatus
      ).toBe("married");
    });

    it("sets Marital Status to widowed when the partner is deceased", async () => {
      const a = await json<PersonResponse>(
        await postPerson({ ...validHead, firstName: "ann" })
      );
      const dead = await json<PersonResponse>(
        await postPerson({
          ...validHead,
          firstName: "sam",
          membershipStatus: "deceased",
        })
      );
      await postRelationship({
        personId: a.id,
        relatedPersonId: dead.id,
        type: "spouse",
        state: "married",
      });

      expect(
        (await json<PersonResponse>(await getPerson(a.id))).maritalStatus
      ).toBe("widowed");
    });

    it("updates the surviving spouse when the partner is marked deceased", async () => {
      const { a, b } = await seedTwoPeople();
      await postRelationship({
        personId: a.id,
        relatedPersonId: b.id,
        type: "spouse",
        state: "married",
      });

      const res = await putPerson(b.id, b.householdId ?? "", {
        firstName: "ben",
        membershipStatus: "deceased",
        maritalStatus: "married",
      });
      expect(res.status).toBe(200);

      expect(
        (await json<PersonResponse>(await getPerson(a.id))).maritalStatus
      ).toBe("widowed");
    });

    it("does not change Marital Status for a non-spouse relationship", async () => {
      const { a, b } = await seedTwoPeople();
      await postRelationship({
        personId: b.id,
        relatedPersonId: a.id,
        type: "parent",
      });

      expect(
        (await json<PersonResponse>(await getPerson(a.id))).maritalStatus
      ).toBe("single");
      expect(
        (await json<PersonResponse>(await getPerson(b.id))).maritalStatus
      ).toBe("single");
    });
  });
});
