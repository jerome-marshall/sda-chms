/* eslint-disable vitest/no-standalone-expect -- expectations run inside it.effect's program */
import { beforeEach, describe, expect, it } from "@effect/vitest";
import { Effect, Layer } from "effect";

import { DbLive } from "../../server/effect/db";
import {
  governingStatus,
  MaritalStatusLive,
  planUpdates,
  readGraph,
} from "../../server/effect/marital-status";
import { resetDb } from "../void-db";
import { seedPerson, seedRelationship } from "./helpers";

const TestLive = MaritalStatusLive.pipe(Layer.provide(DbLive));

const older = new Date("2020-01-01T00:00:00Z");
const newer = new Date("2024-01-01T00:00:00Z");

describe("Marital Status service", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it.effect("lets the ongoing marriage govern over a later separation", () =>
    Effect.gen(function* governingLinkProgram() {
      const a = yield* seedPerson({ firstName: "Ann" });
      const b = yield* seedPerson({ firstName: "Ben" });
      const c = yield* seedPerson({ firstName: "Cara" });
      yield* seedRelationship({
        personId: a.id,
        relatedPersonId: c.id,
        type: "spouse",
        state: "married",
        createdAt: older,
      });
      yield* seedRelationship({
        personId: a.id,
        relatedPersonId: b.id,
        type: "spouse",
        state: "separated",
        createdAt: newer,
      });

      const { rows, affected } = yield* readGraph([a.id]);

      expect(yield* governingStatus(rows, a.id)).toBe("married");
      const plans = yield* planUpdates(rows, affected);
      expect(
        Object.fromEntries(
          plans.map((plan) => [plan.personId, plan.maritalStatus])
        )
      ).toStrictEqual({
        [a.id]: "married",
        [b.id]: "separated",
        [c.id]: "married",
      });
    }).pipe(Effect.provide(TestLive))
  );

  it.effect("loses a past marriage to the current one", () =>
    Effect.gen(function* pastMarriageProgram() {
      const a = yield* seedPerson({ firstName: "Ann" });
      const deceased = yield* seedPerson({
        firstName: "Ben",
        membershipStatus: "deceased",
      });
      const current = yield* seedPerson({ firstName: "Cara" });
      yield* seedRelationship({
        personId: a.id,
        relatedPersonId: current.id,
        type: "spouse",
        state: "married",
        createdAt: older,
      });
      yield* seedRelationship({
        personId: a.id,
        relatedPersonId: deceased.id,
        type: "spouse",
        state: "married",
        createdAt: newer,
      });

      const { rows } = yield* readGraph([a.id]);

      expect(yield* governingStatus(rows, a.id)).toBe("married");
    }).pipe(Effect.provide(TestLive))
  );

  it.effect("makes widowhood follow a deceased partner", () =>
    Effect.gen(function* widowhoodProgram() {
      const survivor = yield* seedPerson({ firstName: "Ann" });
      const deceased = yield* seedPerson({
        firstName: "Ben",
        membershipStatus: "deceased",
      });
      yield* seedRelationship({
        personId: survivor.id,
        relatedPersonId: deceased.id,
        type: "spouse",
        state: "married",
        createdAt: older,
      });

      const { rows } = yield* readGraph([survivor.id]);

      expect(yield* governingStatus(rows, survivor.id)).toBe("widowed");
      expect(yield* governingStatus(rows, deceased.id)).toBe("married");
      expect(
        yield* planUpdates(rows, [survivor.id, deceased.id])
      ).toStrictEqual([
        { personId: survivor.id, maritalStatus: "widowed" },
        { personId: deceased.id, maritalStatus: "married" },
      ]);
    }).pipe(Effect.provide(TestLive))
  );
});
