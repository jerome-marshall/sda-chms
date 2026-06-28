import { setTestDb } from "@sda-chms/db";
import type { PeopleInsertDb } from "@sda-chms/db/schema/people";
import { createTestDb, type TestDb } from "@sda-chms/db/test-db";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { insertPerson } from "../data-access/people";
import app from "../index";

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
  householdHead?: { phone: string | null };
  householdId: string | null;
  householdPhone?: string | null;
  id: string;
  isHeadOfHousehold: boolean;
  mothersName: string | null;
  phone: string | null;
}

/** `.json()` is typed `unknown` here (ts-reset); read it at a known shape. */
const json = <T>(res: Response): Promise<T> => res.json() as Promise<T>;

const postPerson = (body: unknown) =>
  app.request("/people", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

describe("people routes (integration, PGlite)", () => {
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

  it("GET /people returns an empty list initially", async () => {
    const res = await app.request("/people");
    expect(res.status).toBe(200);
    expect(await json<PersonResponse[]>(res)).toEqual([]);
  });

  it("POST /people creates a head, title-cases the name, and links a household", async () => {
    const res = await postPerson(validHead);
    expect(res.status).toBe(201);
    const person = await json<PersonResponse>(res);
    expect(person.firstName).toBe("Jo");
    expect(person.householdId).toBeTruthy();
  });

  it("GET /people lists the created person", async () => {
    await postPerson(validHead);
    const res = await app.request("/people");
    const list = await json<PersonResponse[]>(res);
    expect(list).toHaveLength(1);
    expect(list[0]?.fullName).toBe("Jo");
  });

  it("GET /people/:id returns the person with computed + head fields", async () => {
    const created = await json<PersonResponse>(await postPerson(validHead));
    const res = await app.request(`/people/${created.id}`);
    expect(res.status).toBe(200);

    const person = await json<PersonResponse>(res);
    expect(person.id).toBe(created.id);
    expect(person.fullName).toBe("Jo");
    expect(person.isHeadOfHousehold).toBe(true);
  });

  it("GET /people/:id falls a non-head's missing contact back to the household head", async () => {
    // Head carries the contact info; the child carries none of its own.
    const head = await json<PersonResponse>(
      await postPerson({ ...validHead, phone: "9000000000" })
    );
    const child = await json<PersonResponse>(
      await postPerson({
        ...validHead,
        firstName: "li",
        householdRole: "child",
        householdId: head.householdId,
      })
    );

    const res = await app.request(`/people/${child.id}`);
    expect(res.status).toBe(200);

    const person = await json<PersonResponse>(res);
    expect(person.fullName).toBe("Li");
    expect(person.isHeadOfHousehold).toBe(false);
    expect(person.phone).toBeFalsy();
    // The fallback the whole getPersonWithHead path exists to provide.
    expect(person.householdHead?.phone).toBe("9000000000");
    expect(person.householdPhone).toBe("9000000000");
  });

  it("POST /people stores and returns father's name and mother's name (issue #11)", async () => {
    const res = await postPerson({
      ...validHead,
      fathersName: "Joseph Krishnamurthy",
      mothersName: "Mary Krishnamurthy",
    });
    expect(res.status).toBe(201);
    const person = await json<PersonResponse>(res);
    expect(person.fathersName).toBe("Joseph Krishnamurthy");
    expect(person.mothersName).toBe("Mary Krishnamurthy");

    const detail = await json<PersonResponse>(
      await app.request(`/people/${person.id}`)
    );
    expect(detail.fathersName).toBe("Joseph Krishnamurthy");
    expect(detail.mothersName).toBe("Mary Krishnamurthy");
  });

  it("POST /people rejects invalid input with 400", async () => {
    const res = await postPerson({ firstName: "" });
    expect(res.status).toBe(400);
  });

  // ── Duplicate-Person prevention (issue #2) ───────────────────────────────
  // The unique index over (first_name, last_name, date_of_birth) must hold even
  // when last_name / date_of_birth are null. Postgres treats nulls as distinct
  // by default, so the guard needs NULLS NOT DISTINCT to catch partial-data
  // duplicates. The user must see a clear "may already exist" 409, not a raw
  // DB error.

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

  it("POST /people surfaces a clear 'may already exist' 409 for a duplicate", async () => {
    // validHead has no last name; a second identical POST is a null-lastName
    // duplicate — exactly the case the default index let through.
    await postPerson(validHead);
    const res = await postPerson(validHead);

    expect(res.status).toBe(409);
    const body = await json<{ code: string; message: string }>(res);
    expect(body.code).toBe("DB_ERROR");
    expect(body.message.toLowerCase()).toContain("already exist");
  });
});
