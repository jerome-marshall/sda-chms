import type { PeopleInsertDb } from "@schema";
import type { Hono } from "hono";
import { beforeAll, beforeEach, describe, expect, it } from "vite-plus/test";

import { insertPerson } from "../../../../server/people";
import { json, postPerson as postPersonTo, validHead } from "../../../fixtures";
import type { PersonResponse } from "../../../fixtures";
import { createTestApp } from "../../../routes";
import { resetDb } from "../../../void-db";

describe("POST /api/people (integration, SQLite)", () => {
  let app: Hono;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(async () => {
    await resetDb();
  });

  const postPerson = (body: unknown) => postPersonTo(app, body);

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

  // Duplicate-Person prevention (issue #2): the unique index over
  // (first_name, last_name, date_of_birth) must hold even when last_name /
  // date_of_birth are null. SQLite treats nulls as distinct by default, so
  // the guard coalesces them through stored identity_* columns to catch
  // partial-data duplicates. The
  // user must see a clear "may already exist" 409, not a raw DB error.

  it("duplicate identity with a null last name and date of birth returns 409", async () => {
    // No lastName key: stored null and coalesced to '' by identity_last_name,
    // so the second POST with the same first name and date of birth is a
    // duplicate even though last_name is null.
    const body = {
      ...validHead,
      firstName: "null identity",
      dateOfBirth: "1985-05-05",
    };
    const first = await postPerson(body);
    expect(first.status).toBe(200);
    const res = await postPerson(body);

    expect(res.status).toBe(409);
    const response = await json<{ code: string; message: string }>(res);
    expect(response.code).toBe("DB_ERROR");
    expect(response.message.toLowerCase()).toContain("already exist");
  });

  it("the unique index coalesces a true null date of birth too", async () => {
    const row = {
      firstName: "Jo",
      lastName: null,
      dateOfBirth: null,
      maritalStatus: "single",
      membershipStatus: "member",
      isActive: true,
    } satisfies PeopleInsertDb;
    await insertPerson(row);
    await expect(insertPerson(row)).rejects.toThrow(
      /UNIQUE constraint failed/u
    );
  });

  it("the response has no identity_ key", async () => {
    const created = await postPerson(validHead);
    expect(created.status).toBe(200);
    const person = await json<Record<string, unknown>>(created);
    expect(
      Object.keys(person).filter((key) => key.startsWith("identity_"))
    ).toStrictEqual([]);

    const listRes = await app.request("/api/people");
    const list = await json<Record<string, unknown>[]>(listRes);
    expect(list).toHaveLength(1);
    expect(
      Object.keys(list[0] ?? {}).filter((key) => key.startsWith("identity_"))
    ).toStrictEqual([]);
  });

  it("does not block distinct People (no false positives on null fields)", async () => {
    const first = await postPerson({ ...validHead, firstName: "jo" });
    expect(first.status).toBe(200);
    const second = await postPerson({ ...validHead, firstName: "li" });
    expect(second.status).toBe(200);
    const third = await postPerson({
      ...validHead,
      firstName: "jo",
      lastName: "Smith",
    });
    expect(third.status).toBe(200);
  });

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
