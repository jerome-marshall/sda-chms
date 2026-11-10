import type { Hono } from "hono";
import { beforeAll, beforeEach, describe, expect, it } from "vite-plus/test";

import { json, postPerson as postPersonTo } from "../../../fixtures";
import type { HouseholdResponse } from "../../../fixtures";
import { createTestApp } from "../../../routes";
import { resetDb } from "../../../void-db";

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

describe("GET /api/households (integration, SQLite)", () => {
  let app: Hono;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(async () => {
    await resetDb();
  });

  const postPerson = (body: unknown) => postPersonTo(app, body);

  it("GET /api/households surfaces the family name the user stored, not one derived from the head", async () => {
    // A blended family: the head's surname is "Smith" but the family goes by "The Robinson-Smiths".
    await postPerson({ ...validHead, familyName: "The Robinson-Smiths" });

    const res = await app.request("/api/households");
    expect(res.status).toBe(200);
    const households = await json<HouseholdResponse[]>(res);
    expect(households).toHaveLength(1);
    expect(households[0]?.name).toBe("The Robinson-Smiths");
  });

  it("GET /api/households falls back to the derived name for households with no stored family name (backfill)", async () => {
    await postPerson(validHead);

    const res = await app.request("/api/households");
    expect(res.status).toBe(200);
    const households = await json<HouseholdResponse[]>(res);
    expect(households).toHaveLength(1);
    expect(households[0]?.name).toBe("John Smith Family");
  });
});
