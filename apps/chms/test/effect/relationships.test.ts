/* eslint-disable vitest/no-standalone-expect -- expectations run inside it.effect's program */
import { beforeEach, describe, expect, it } from "@effect/vitest";
import { Effect, Layer } from "effect";

import { DbLive } from "../../server/effect/db";
import {
  RelationshipNotFound,
  SpouseStateOnNonSpouse,
} from "../../server/effect/errors";
import { MaritalStatusLive } from "../../server/effect/marital-status";
import {
  addRelationship,
  RelationshipsLive,
  removeRelationship,
  updateRelationshipState,
} from "../../server/effect/relationships";
import { getRelationshipRowById } from "../../server/relationships";
import { db, resetDb } from "../void-db";
import { readPerson, seedPerson } from "./helpers";

const TestLive = RelationshipsLive.pipe(
  Layer.provide(MaritalStatusLive),
  Layer.provide(DbLive)
);

const unknownId = "00000000-0000-4000-8000-000000000000";

describe("Relationships service", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it.effect("sets both People's Marital Status from a new spouse link", () =>
    Effect.gen(function* addSpouseProgram() {
      const a = yield* seedPerson({ firstName: "Ann" });
      const b = yield* seedPerson({ firstName: "Ben" });

      const link = yield* addRelationship({
        personId: a.id,
        relatedPersonId: b.id,
        type: "spouse",
      });

      expect(link.state).toBe("married");
      expect((yield* readPerson(a.id)).maritalStatus).toBe("married");
      expect((yield* readPerson(b.id)).maritalStatus).toBe("married");
    }).pipe(Effect.provide(TestLive))
  );

  it.effect("stores no state and changes nothing for a non-spouse link", () =>
    Effect.gen(function* addParentProgram() {
      const a = yield* seedPerson({ firstName: "Ann" });
      const b = yield* seedPerson({ firstName: "Ben" });

      const link = yield* addRelationship({
        personId: b.id,
        relatedPersonId: a.id,
        type: "parent",
        state: "divorced",
      });

      expect(link.state).toBeNull();
      expect((yield* readPerson(a.id)).maritalStatus).toBe("single");
      expect((yield* readPerson(b.id)).maritalStatus).toBe("single");
    }).pipe(Effect.provide(TestLive))
  );

  it.effect("re-derives both People's Marital Status from a state change", () =>
    Effect.gen(function* changeStateProgram() {
      const a = yield* seedPerson({ firstName: "Ann" });
      const b = yield* seedPerson({ firstName: "Ben" });
      const link = yield* addRelationship({
        personId: a.id,
        relatedPersonId: b.id,
        type: "spouse",
      });

      const updated = yield* updateRelationshipState(link.id, "separated");

      expect(updated.state).toBe("separated");
      expect((yield* readPerson(a.id)).maritalStatus).toBe("separated");
      expect((yield* readPerson(b.id)).maritalStatus).toBe("separated");
    }).pipe(Effect.provide(TestLive))
  );

  it.effect("re-derives Marital Status from the remaining link on remove", () =>
    Effect.gen(function* removeProgram() {
      const a = yield* seedPerson({ firstName: "Ann" });
      const b = yield* seedPerson({ firstName: "Ben" });
      const c = yield* seedPerson({ firstName: "Cara" });

      const past = yield* addRelationship({
        personId: a.id,
        relatedPersonId: b.id,
        type: "spouse",
        state: "married",
      });
      yield* updateRelationshipState(past.id, "divorced");
      const current = yield* addRelationship({
        personId: a.id,
        relatedPersonId: c.id,
        type: "spouse",
      });
      expect((yield* readPerson(a.id)).maritalStatus).toBe("married");

      yield* removeRelationship(current.id);

      expect((yield* readPerson(a.id)).maritalStatus).toBe("divorced");
    }).pipe(Effect.provide(TestLive))
  );

  it.effect("fails with RelationshipNotFound for an unknown id", () =>
    Effect.gen(function* unknownIdProgram() {
      const removed = yield* removeRelationship(unknownId).pipe(Effect.flip);
      expect(removed).toBeInstanceOf(RelationshipNotFound);

      const updated = yield* updateRelationshipState(
        unknownId,
        "divorced"
      ).pipe(Effect.flip);
      expect(updated).toBeInstanceOf(RelationshipNotFound);
    }).pipe(Effect.provide(TestLive))
  );

  it.effect("fails with SpouseStateOnNonSpouse when assigning a state", () =>
    Effect.gen(function* nonSpouseStateProgram() {
      const a = yield* seedPerson({ firstName: "Ann" });
      const b = yield* seedPerson({ firstName: "Ben" });
      const link = yield* addRelationship({
        personId: b.id,
        relatedPersonId: a.id,
        type: "parent",
      });

      const failure = yield* updateRelationshipState(link.id, "divorced").pipe(
        Effect.flip
      );

      expect(failure).toBeInstanceOf(SpouseStateOnNonSpouse);
      expect(failure._tag).toBe("SpouseStateOnNonSpouse");
      const stored = yield* Effect.promise(() =>
        getRelationshipRowById(db, link.id)
      );
      expect(stored?.state).toBeNull();
    }).pipe(Effect.provide(TestLive))
  );
});
