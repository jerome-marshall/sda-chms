import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vite-plus/test";

import { householdsTable, peopleTable } from "./schema/people";
import { createTestDb } from "./test-db";
import type { TestDb } from "./test-db";

describe(createTestDb, () => {
  let testDb: TestDb;

  beforeAll(async () => {
    testDb = await createTestDb();
  });

  beforeEach(async () => {
    await testDb.reset();
  });

  afterAll(async () => {
    await testDb.close();
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
