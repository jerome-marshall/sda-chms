/* eslint-disable vitest/no-standalone-expect -- expectations run inside it.effect's program */
import { beforeEach, describe, expect, it } from "@effect/vitest";
import { Effect, Layer } from "effect";

import { DbLive } from "../../server/effect/db";
import { getAllGroups, GroupsLive } from "../../server/effect/groups";
import { resetDb } from "../void-db";
import { seedGroup } from "./helpers";

const TestLive = GroupsLive.pipe(Layer.provide(DbLive));

describe("Groups service", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it.effect("returns every Group", () =>
    Effect.gen(function* listGroupsProgram() {
      yield* seedGroup("Choir");
      yield* seedGroup("Prayer Band");

      const groups = yield* getAllGroups;

      expect(
        groups
          .map((group) => group.name)
          .toSorted((left, right) => left.localeCompare(right))
      ).toStrictEqual(["Choir", "Prayer Band"]);
    }).pipe(Effect.provide(TestLive))
  );
});
