/* eslint-disable vitest/no-standalone-expect -- expectations run inside it.effect's program */
import { beforeEach, describe, expect, it } from "@effect/vitest";
import { Effect, Layer } from "effect";

import { DbLive } from "../../server/effect/db";
import {
  getAllHouseholds,
  HouseholdsLive,
} from "../../server/effect/households";
import { MaritalStatusLive } from "../../server/effect/marital-status";
import { addPerson, PeopleLive } from "../../server/effect/people";
import { resetDb } from "../void-db";
import { headForm, seedPerson } from "./helpers";

const TestLive = Layer.mergeAll(PeopleLive, HouseholdsLive).pipe(
  Layer.provide(MaritalStatusLive),
  Layer.provide(DbLive)
);

describe("Households service", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it.effect("returns each Household with its Head and members", () =>
    Effect.gen(function* listHouseholdsProgram() {
      const firstHead = yield* addPerson(headForm);
      const member = yield* seedPerson({
        firstName: "Kid",
        householdId: firstHead.householdId,
        householdRole: "child",
      });
      const secondHead = yield* addPerson({
        ...headForm,
        firstName: "ann",
        dateOfBirth: "1985-05-05",
      });

      const households = yield* getAllHouseholds;

      expect(households).toHaveLength(2);
      const first = households.find(
        (household) => household.id === firstHead.householdId
      );
      const second = households.find(
        (household) => household.id === secondHead.householdId
      );

      expect(first?.head?.id).toBe(firstHead.id);
      expect(
        first?.members.map((householdMember) => householdMember.id)
      ).toStrictEqual([member.id]);
      expect(second?.head?.id).toBe(secondHead.id);
      expect(second?.members).toStrictEqual([]);
    }).pipe(Effect.provide(TestLive))
  );
});
