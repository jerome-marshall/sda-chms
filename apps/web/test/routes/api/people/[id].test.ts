import { setTestDb } from "@sda-chms/db";
import { createTestDb } from "@sda-chms/db/test-db";
import type { TestDb } from "@sda-chms/db/test-db";
import type { Hono } from "hono";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vite-plus/test";

import { createTestApp } from "../../../routes";

/** Short, lowercase first name exercises issue #1 + the title-casing transformer. */
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

/** The response fields these tests read. */
interface PersonResponse {
  fathersName: string | null;
  firstName: string;
  fullName: string;
  householdId: string | null;
  householdPhone?: string | null;
  id: string;
  isHeadOfHousehold: boolean;
  mothersName: string | null;
  phone: string | null;
}

const json = async <T>(res: Response): Promise<T> => (await res.json()) as T;

describe("GET /api/people/:id (integration, PGlite)", () => {
  let testDb: TestDb;
  let app: Hono;

  beforeAll(async () => {
    testDb = await createTestDb();
    setTestDb(testDb.db);
    app = createTestApp();
  });

  beforeEach(async () => {
    await testDb.reset();
  });

  afterAll(async () => {
    setTestDb(null);
    await testDb.close();
  });

  const postPerson = (body: unknown) =>
    app.request("/api/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

  it("GET /api/people/:id returns the person with computed + head fields", async () => {
    const created = await json<PersonResponse>(await postPerson(validHead));
    const res = await app.request(`/api/people/${created.id}`);
    expect(res.status).toBe(200);

    const person = await json<PersonResponse>(res);
    expect(person.id).toBe(created.id);
    expect(person.fullName).toBe("Jo");
    expect(person.isHeadOfHousehold).toBe(true);
  });

  it("GET /api/people/:id falls a member's missing contact back to the Household (ADR-0001)", async () => {
    // The head defines the household's shared phone; the child carries none.
    const head = await json<PersonResponse>(
      await postPerson({ ...validHead, phone: "9000000000" })
    );
    const child = await json<PersonResponse>(
      await postPerson({
        firstName: "li",
        gender: "male",
        dateOfBirth: "2012-01-01",
        maritalStatus: "single",
        membershipStatus: "member",
        dietaryPreference: "none",
        householdRole: "child",
        householdId: head.householdId,
      })
    );

    const res = await app.request(`/api/people/${child.id}`);
    expect(res.status).toBe(200);

    const person = await json<PersonResponse>(res);
    expect(person.fullName).toBe("Li");
    expect(person.isHeadOfHousehold).toBe(false);
    expect(person.phone).toBeFalsy();
    // The effective value falls back to the Household, not the Head person.
    expect(person.householdPhone).toBe("9000000000");
  });

  it("POST /api/people stores and returns father's name and mother's name (issue #11)", async () => {
    const res = await postPerson({
      ...validHead,
      fathersName: "Joseph Krishnamurthy",
      mothersName: "Mary Krishnamurthy",
    });
    expect(res.status).toBe(200);
    const person = await json<PersonResponse>(res);
    expect(person.fathersName).toBe("Joseph Krishnamurthy");
    expect(person.mothersName).toBe("Mary Krishnamurthy");

    const detail = await json<PersonResponse>(
      await app.request(`/api/people/${person.id}`)
    );
    expect(detail.fathersName).toBe("Joseph Krishnamurthy");
    expect(detail.mothersName).toBe("Mary Krishnamurthy");
  });
});
