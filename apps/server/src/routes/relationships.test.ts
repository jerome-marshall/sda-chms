import { setTestDb } from "@sda-chms/db";
import { createTestDb, type TestDb } from "@sda-chms/db/test-db";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import app from "../index";

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
}

interface RelationshipItem {
  id: string;
  relatedPerson: { fullName: string; id: string };
  type: string;
}

const json = <T>(res: Response): Promise<T> => res.json() as Promise<T>;

const postPerson = (body: unknown) =>
  app.request("/people", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const postRelationship = (body: unknown) =>
  app.request("/relationships", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const listFor = (personId: string) =>
  app.request(`/relationships/person/${personId}`);

describe("relationships routes (integration, PGlite)", () => {
  let testDb: TestDb;

  beforeAll(async () => {
    testDb = await createTestDb();
    setTestDb(testDb.db);
  });

  afterAll(async () => {
    setTestDb(null);
    await testDb.close();
  });

  beforeEach(async () => {
    await testDb.reset();
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

  it("links two people and lists the link on the subject with the chosen type", async () => {
    const { a, b } = await seedTwoPeople();

    // "ann is ben's parent"
    const created = await postRelationship({
      personId: b.id,
      relatedPersonId: a.id,
      type: "parent",
    });
    expect(created.status).toBe(201);

    const benList = await json<RelationshipItem[]>(await listFor(b.id));
    expect(benList).toHaveLength(1);
    expect(benList[0]?.type).toBe("parent");
    expect(benList[0]?.relatedPerson.id).toBe(a.id);
    expect(benList[0]?.relatedPerson.fullName).toBe("Ann");
  });

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

    const del = await app.request(`/relationships/${relId}`, {
      method: "DELETE",
    });
    expect(del.status).toBe(200);

    expect(await json<RelationshipItem[]>(await listFor(b.id))).toHaveLength(0);
    expect(await json<RelationshipItem[]>(await listFor(a.id))).toHaveLength(0);
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
});
