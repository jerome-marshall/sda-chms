import { Context, Effect, Layer } from "effect";

import { getAllHouseholds as readHouseholds } from "../households";
import { Db, fromDb } from "./db";
import type { InfraError } from "./errors";

type Household = Awaited<ReturnType<typeof readHouseholds>>[number];

export interface HouseholdsService {
  readonly getAll: () => Effect.Effect<Household[], InfraError>;
}

export class Households extends Context.Service<
  Households,
  HouseholdsService
>()("Households") {}

export const HouseholdsLive = Layer.effect(
  Households,
  Effect.gen(function* HouseholdsLive() {
    const db = yield* Db;
    return {
      getAll: () => fromDb(() => readHouseholds(db)),
    };
  })
);

export const getAllHouseholds = Effect.gen(function* getAllHouseholdsProgram() {
  const households = yield* Households;
  return yield* households.getAll();
});
