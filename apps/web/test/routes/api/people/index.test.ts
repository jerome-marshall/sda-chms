import { setTestDb } from "@sda-chms/db";
import type { PeopleInsertDb } from "@sda-chms/db/schema/people";
import { createTestDb } from "@sda-chms/db/test-db";
import type { TestDb } from "@sda-chms/db/test-db";
import { insertPerson } from "@sda-chms/server/data-access/people";
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

/** A bare person row for direct data-access inserts (no household needed). */
const minimalPerson = (
  overrides: Partial<PeopleInsertDb> = {}
): PeopleInsertDb => ({
  firstName: "Jo",
  maritalStatus: "single",
  membershipStatus: "member",
  isActive: true,
  ...overrides,
});

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

describe("POST /api/people (integration, PGlite)", () => {
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

  it("GET /api/people returns an empty list initially", async () => {
    const res = await app.request("/api/people");
    expect(res.status).toBe(200);
    await expect(json<PersonResponse[]>(res)).resolves.toStrictEqual([]);
  });

  it("POST /api/people creates a head, title-cases the name, and links a household", async () => {
    const res = await postPerson(validHead);
    expect(res.status).toBe(200);
    const person = await json<PersonResponse>(res);
    expect(person.firstName).toBe("Jo");
    expect(person.householdId).toBeTruthy();
  });

  it("GET /api/people lists the created person", async () => {
    await postPerson(validHead);
    const res = await app.request("/api/people");
    const list = await json<PersonResponse[]>(res);
    expect(list).toHaveLength(1);
    expect(list[0]?.fullName).toBe("Jo");
  });

  it("POST /api/people rejects invalid input with 400", async () => {
    const res = await postPerson({ firstName: "" });
    expect(res.status).toBe(400);
  });

  // ── Duplicate-Person prevention (issue #2) ───────────────────────────────
  // The unique index over (first_name, last_name, date_of_birth) must hold even
  // when last_name / date_of_birth are null. Postgres treats nulls as distinct
  // by default, so the guard needs NULLS NOT DISTINCT to catch partial-data
  // duplicates. The user must see a clear "may already exist" 409, not a raw
  // DB error. These three target data-access directly and move with it in the
  // server-code commit; the HTTP 409 below stays here.

  it("blocks a second Person with the same first name and null last name + null DOB", async () => {
    await insertPerson(minimalPerson());
    await expect(insertPerson(minimalPerson())).rejects.toMatchObject({
      name: "DbError",
      httpCode: 409,
    });
  });

  it("blocks a second Person with same first + last name and null DOB", async () => {
    await insertPerson(minimalPerson({ lastName: "Smith" }));
    await expect(
      insertPerson(minimalPerson({ lastName: "Smith" }))
    ).rejects.toMatchObject({ name: "DbError", httpCode: 409 });
  });

  it("does not block distinct People (no false positives on null fields)", async () => {
    await insertPerson(minimalPerson({ firstName: "Jo" }));
    await expect(
      insertPerson(minimalPerson({ firstName: "Li" }))
    ).resolves.toBeTruthy();
    await expect(
      insertPerson(minimalPerson({ firstName: "Jo", lastName: "Smith" }))
    ).resolves.toBeTruthy();
  });

  // (The HTTP-level 409 assertion waits for the error middleware in the
  // middleware commit: until then a DbError thrown from a route has no
  // ApiErrorBody mapping. The data-access duplicate tests above pin the
  // DbError itself here.)

  it("POST /api/people rejects a Memorial Day on a non-deceased Person (issue #3)", async () => {
    const res = await postPerson({
      ...validHead,
      membershipStatus: "member",
      memorialDay: "2024-05-01",
    });
    expect(res.status).toBe(400);
  });

  it("POST /api/people accepts a Memorial Day on a deceased Person (issue #3)", async () => {
    const res = await postPerson({
      ...validHead,
      membershipStatus: "deceased",
      memorialDay: "2024-05-01",
    });
    expect(res.status).toBe(200);
  });
});
