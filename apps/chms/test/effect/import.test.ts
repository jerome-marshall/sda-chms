/* eslint-disable vitest/no-standalone-expect -- expectations run inside it.effect's program */
import { beforeEach, describe, expect, it } from "@effect/vitest";
import { Effect, Layer } from "effect";

import { DbLive } from "../../server/effect/db";
import { ImportLimitExceeded } from "../../server/effect/errors";
import { importPeopleCsv, ImportLive } from "../../server/effect/import";
import { getAllHouseholds } from "../../server/households";
import { getAllPeopleWithHouseholdRows } from "../../server/people";
import { db, resetDb } from "../void-db";

const TestLive = ImportLive.pipe(Layer.provide(DbLive));

const csv = [
  "Name,Gender,DOB,Family,Relation,Phone",
  "Test Head,male,01/02/1990,Testers,head,9000000000",
  "Test Child,male,03/04/2015,Testers,child,",
  "Test Orphan,male,05/06/2000,,spouse,",
].join("\n");

const rowLimitCsv = () => {
  const header = "Name,Gender,DOB,Family,Relation";
  const rows = Array.from(
    { length: 50_001 },
    (_, index) => `Person ${index + 1},male,01/01/1990,,`
  );
  return [header, ...rows].join("\n");
};

describe("Import service", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it.effect("keeps one Head when a Family lists two", () =>
    Effect.gen(function* duplicateHeadProgram() {
      const summary = yield* importPeopleCsv(
        [
          "Name,Gender,DOB,Family,Relation",
          "First Head,male,01/02/1990,Dupes,head",
          "Second Head,male,02/03/1991,Dupes,head",
        ].join("\n")
      );

      expect(summary.failed).toBe(1);
      expect(summary.succeeded).toBe(1);

      const people = yield* Effect.promise(() =>
        getAllPeopleWithHouseholdRows(db)
      );
      const heads = people.filter((person) => person.householdRole === "head");
      expect(heads).toHaveLength(1);
      expect(heads[0]?.firstName).toBe("First");
    }).pipe(Effect.provide(TestLive))
  );

  it.effect("creates People and a Household from a small CSV", () =>
    Effect.gen(function* smallCsvProgram() {
      const summary = yield* importPeopleCsv(csv);

      expect(summary).toMatchObject({
        total: 3,
        skipped: 0,
        attempted: 2,
        succeeded: 2,
        failed: 1,
      });

      const people = yield* Effect.promise(() =>
        getAllPeopleWithHouseholdRows(db)
      );
      const households = yield* Effect.promise(() => getAllHouseholds(db));

      expect(
        people
          .map((person) =>
            `${person.firstName} ${person.lastName ?? ""}`.trim()
          )
          .toSorted((left, right) => left.localeCompare(right))
      ).toStrictEqual(["Test Child", "Test Head"]);
      expect(households).toHaveLength(1);
      expect(households[0]?.name).toBe("Testers");
    }).pipe(Effect.provide(TestLive))
  );

  it.effect(
    "fails with ImportLimitExceeded over the row limit",
    () =>
      Effect.gen(function* limitProgram() {
        const failure = yield* importPeopleCsv(rowLimitCsv()).pipe(Effect.flip);

        expect(failure).toBeInstanceOf(ImportLimitExceeded);
        expect(failure._tag).toBe("ImportLimitExceeded");
        if (failure._tag === "ImportLimitExceeded") {
          expect(failure.rows).toBe(50_001);
          expect(failure.limit).toBe(50_000);
        }
      }).pipe(Effect.provide(TestLive)),
    120_000
  );
});
