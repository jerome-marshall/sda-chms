import { Context, Effect, Layer } from "effect";

import { getAllGroups as readGroups } from "../groups";
import { Db, fromDb } from "./db";
import type { InfraError } from "./errors";

type Group = Awaited<ReturnType<typeof readGroups>>[number];

export interface GroupsService {
  readonly getAll: () => Effect.Effect<Group[], InfraError>;
}

export class Groups extends Context.Service<Groups, GroupsService>()(
  "Groups"
) {}

export const GroupsLive = Layer.effect(
  Groups,
  Effect.gen(function* GroupsLive() {
    const db = yield* Db;
    return {
      getAll: () => fromDb(() => readGroups(db)),
    };
  })
);

export const getAllGroups = Effect.gen(function* getAllGroupsProgram() {
  const groups = yield* Groups;
  return yield* groups.getAll();
});
