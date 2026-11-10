import { Context, Effect, Layer } from "effect";

import { getAllGroups as readGroups } from "../groups";
import { Db, fromDb } from "./db";
import type { DatabaseFailure } from "./errors";

type Group = Awaited<ReturnType<typeof readGroups>>[number];

/** The Group read operation the API exposes. */
export interface GroupsService {
  readonly getAll: () => Effect.Effect<Group[], DatabaseFailure>;
}

/** Group reads behind Effect. */
export class Groups extends Context.Service<Groups, GroupsService>()(
  "Groups"
) {}

/** Builds the Group service from the request-scoped database. */
export const GroupsLive = Layer.effect(
  Groups,
  Effect.gen(function* GroupsLive() {
    const db = yield* Db;
    return {
      getAll: () => fromDb(() => readGroups(db)),
    };
  })
);

/** Lists every Group. */
export const getAllGroups = Effect.gen(function* getAllGroupsProgram() {
  const groups = yield* Groups;
  return yield* groups.getAll();
});
