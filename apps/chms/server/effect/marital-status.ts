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
import type { DatabaseFailure } from "./errors";

/**
 * The spouse-link rules the People and Relationship writes share (ADR-0003).
 * The rules stay pure; the service is the single Effect seam that reads the
 * request's graph and plans every Marital Status rewrite.
 */
export interface MaritalStatusService {
  readonly readGraph: (
    personIds: string[]
  ) => Effect.Effect<SpouseLinkGraph, DatabaseFailure>;
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

/** Spouse-link rules behind Effect, reading the request-scoped database. */
export class MaritalStatus extends Context.Service<
  MaritalStatus,
  MaritalStatusService
>()("MaritalStatus") {}

/** Builds the Marital Status service from the request-scoped database. */
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

/** Reads the spouse-link graph around the given People. */
export const readGraph = (personIds: string[]) =>
  Effect.gen(function* readGraphProgram() {
    const service = yield* MaritalStatus;
    return yield* service.readGraph(personIds);
  });

/** The Marital Status implied by a Person's governing spouse link, if any. */
export const governingStatus = (rows: SpouseLinkRow[], personId: string) =>
  Effect.gen(function* governingStatusProgram() {
    const service = yield* MaritalStatus;
    return yield* service.governingStatus(rows, personId);
  });

/** Plans every affected Person's stored Marital Status rewrite. */
export const planUpdates = (
  rows: SpouseLinkRow[],
  affectedPersonIds: string[],
  overrides?: MembershipOverrides
) =>
  Effect.gen(function* planUpdatesProgram() {
    const service = yield* MaritalStatus;
    return yield* service.planUpdates(rows, affectedPersonIds, overrides);
  });
