import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { householdsTable, peopleTable } from "./schema/people";
import { createTestDb, type TestDb } from "./test-db";

describe("createTestDb", () => {
  let testDb: TestDb;

  beforeAll(async () => {
    testDb = await createTestDb();
  });

  afterAll(async () => {
    await testDb.close();
  });

  beforeEach(async () => {
    await testDb.reset();
  });

  it("applies the live schema and round-trips a person", async () => {
    const { db } = testDb;
    const [household] = await db.insert(householdsTable).values({}).returning();
    expect(household?.id).toBeDefined();

    const [person] = await db
      .insert(peopleTable)
      .values({
        firstName: "Asha",
        maritalStatus: "single",
        membershipStatus: "member",
        sabbathSchoolClass: "young_adult",
        householdId: household?.id,
        householdRole: "head",
      })
      .returning();
    expect(person?.firstName).toBe("Asha");

    const everyone = await db.query.peopleTable.findMany();
    expect(everyone).toHaveLength(1);
  });

  it("reset() truncates tables between tests", async () => {
    const everyone = await testDb.db.query.peopleTable.findMany();
    expect(everyone).toHaveLength(0);
  });
});
