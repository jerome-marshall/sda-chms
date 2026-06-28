import { setTestDb } from "@sda-chms/db";
import { createTestDb, type TestDb } from "@sda-chms/db/test-db";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import app from "../index";

/** A head that defines a new household. */
const validHead = {
  firstName: "john",
  lastName: "smith",
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

interface HouseholdResponse {
  id: string;
  name: string;
}

interface PersonResponse {
  householdId: string | null;
  id: string;
}

const json = <T>(res: Response): Promise<T> => res.json() as Promise<T>;

const postPerson = (body: unknown) =>
  app.request("/people", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

describe("household routes (integration, PGlite)", () => {
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

  it("GET /households surfaces the family name the user stored, not one derived from the head", async () => {
    // A blended family: the head's surname is "Smith" but the family goes by "The Robinson-Smiths".
    await postPerson({ ...validHead, familyName: "The Robinson-Smiths" });

    const res = await app.request("/households");
    expect(res.status).toBe(200);
    const households = await json<HouseholdResponse[]>(res);
    expect(households).toHaveLength(1);
    expect(households[0]?.name).toBe("The Robinson-Smiths");
  });

  it("GET /households falls back to the derived name for households with no stored family name (backfill)", async () => {
    await postPerson(validHead);

    const res = await app.request("/households");
    const households = await json<HouseholdResponse[]>(res);
    expect(households[0]?.name).toBe("John Smith Family");
  });

  it("a head can rename their family via PUT /people/:id", async () => {
    const head = await json<PersonResponse>(
      await postPerson({ ...validHead, familyName: "The Smiths" })
    );

    const putRes = await app.request(`/people/${head.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...validHead,
        householdId: head.householdId,
        familyName: "The Robinson-Smiths",
      }),
    });
    expect(putRes.status).toBe(200);

    const res = await app.request("/households");
    const households = await json<HouseholdResponse[]>(res);
    expect(households[0]?.name).toBe("The Robinson-Smiths");
  });
});
