/* eslint-disable vitest/no-standalone-expect -- expectations run inside it.effect's program */
import { beforeEach, describe, expect, it } from "@effect/vitest";
import type { PersonInsertForm } from "@sda-chms/shared/schema/people";
import { Effect, Layer } from "effect";

import { DbLive } from "../../server/effect/db";
import { PersonNotFound } from "../../server/effect/errors";
import { MaritalStatusLive } from "../../server/effect/marital-status";
import {
  addPerson,
  getAllPeople,
  getPersonById,
  PeopleLive,
  updatePerson,
} from "../../server/effect/people";
import { insertPerson } from "../../server/people";
import { resetDb } from "../void-db";

const TestLive = PeopleLive.pipe(
  Layer.provide(MaritalStatusLive),
  Layer.provide(DbLive)
);

const headForm = {
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
} as const satisfies PersonInsertForm;

const seedPerson = (overrides: Record<string, unknown> = {}) =>
  Effect.promise(() =>
    insertPerson({
      firstName: "Jo",
      maritalStatus: "single",
      membershipStatus: "member",
      isActive: true,
      ...overrides,
    })
  );

describe("People service", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it.effect("lists every Person through the Db service", () =>
    Effect.gen(function* listPeopleProgram() {
      yield* seedPerson();
      yield* seedPerson({ firstName: "Li" });

      const people = yield* getAllPeople;

      expect(people.map((person) => person.fullName)).toStrictEqual([
        "Jo",
        "Li",
      ]);
    }).pipe(Effect.provide(TestLive))
  );

  it.effect("reads one Person with the computed wire fields", () =>
    Effect.gen(function* readPersonProgram() {
      const created = yield* seedPerson();

      const person = yield* getPersonById(created.id);

      expect(person.fullName).toBe("Jo");
      expect(person.isHeadOfHousehold).toBe(false);
      expect(person.householdPhone).toBeNull();
    }).pipe(Effect.provide(TestLive))
  );

  it.effect("fails with PersonNotFound for an unknown id", () =>
    Effect.gen(function* missingPersonProgram() {
      const failure = yield* getPersonById(
        "00000000-0000-4000-8000-000000000000"
      ).pipe(Effect.flip);

      expect(failure).toBeInstanceOf(PersonNotFound);
      expect(failure._tag).toBe("PersonNotFound");
    }).pipe(Effect.provide(TestLive))
  );

  it.effect("adds a head and creates their Household", () =>
    Effect.gen(function* addPersonProgram() {
      const created = yield* addPerson(headForm);

      expect(created.fullName).toBe("Jo");
      expect(created.householdId).toBeTruthy();
      expect(created.isHeadOfHousehold).toBe(true);
    }).pipe(Effect.provide(TestLive))
  );

  it.effect("fails with PersonNotFound when updating an unknown id", () =>
    Effect.gen(function* updateUnknownProgram() {
      const failure = yield* updatePerson(
        "00000000-0000-4000-8000-000000000000",
        headForm
      ).pipe(Effect.flip);

      expect(failure).toBeInstanceOf(PersonNotFound);
    }).pipe(Effect.provide(TestLive))
  );
});
