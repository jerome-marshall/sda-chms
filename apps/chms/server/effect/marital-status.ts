import { Context, Effect, Layer } from "effect";

import {
  governingMaritalStatusInGraph,
  planMaritalStatusUpdates,
  readSpouseLinkGraph,
} from "../marital-status";
import type {
  MaritalStatus as MaritalStatusValue,
  MaritalStatusPlan,
  MembershipOverrides,
  SpouseLinkGraph,
  SpouseLinkRow,
} from "../marital-status";
import { Db, fromDb } from "./db";
import type { InfraError } from "./errors";

export interface MaritalStatusService {
  readonly readGraph: (
    personIds: string[]
  ) => Effect.Effect<SpouseLinkGraph, InfraError>;
  readonly governingStatus: (
    rows: SpouseLinkRow[],
    personId: string
  ) => Effect.Effect<MaritalStatusValue | null>;
  readonly planUpdates: (
    rows: SpouseLinkRow[],
    affectedPersonIds: string[],
    overrides?: MembershipOverrides
  ) => Effect.Effect<MaritalStatusPlan[]>;
}

export class MaritalStatus extends Context.Service<
  MaritalStatus,
  MaritalStatusService
>()("MaritalStatus") {}

export const MaritalStatusLive = Layer.effect(
  MaritalStatus,
  Effect.gen(function* MaritalStatusLive() {
    const db = yield* Db;
    return {
      readGraph: (personIds) =>
        fromDb(() => readSpouseLinkGraph(db, personIds)),
      governingStatus: (rows, personId) =>
        Effect.sync(() => governingMaritalStatusInGraph(rows, personId)),
      planUpdates: (rows, affectedPersonIds, overrides) =>
        Effect.sync(() =>
          planMaritalStatusUpdates(rows, affectedPersonIds, overrides)
        ),
    };
  })
);

export const readGraph = (personIds: string[]) =>
  Effect.gen(function* readGraphProgram() {
    const service = yield* MaritalStatus;
    return yield* service.readGraph(personIds);
  });

export const governingStatus = (rows: SpouseLinkRow[], personId: string) =>
  Effect.gen(function* governingStatusProgram() {
    const service = yield* MaritalStatus;
    return yield* service.governingStatus(rows, personId);
  });

export const planUpdates = (
  rows: SpouseLinkRow[],
  affectedPersonIds: string[],
  overrides?: MembershipOverrides
) =>
  Effect.gen(function* planUpdatesProgram() {
    const service = yield* MaritalStatus;
    return yield* service.planUpdates(rows, affectedPersonIds, overrides);
  });
