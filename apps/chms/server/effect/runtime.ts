import { getDbConstraintViolation } from "@schema";
import { Effect, Layer } from "effect";

import { DbLive } from "./db";
import { toHttpException, toInvariantHttpException } from "./errors";
import type { ApiError } from "./errors";
import { GroupsLive } from "./groups";
import { HouseholdsLive } from "./households";
import { ImportLive } from "./import";
import { MaritalStatusLive } from "./marital-status";
import { PeopleLive } from "./people";
import { RelationshipsLive } from "./relationships";

/**
 * Every stateless service layer, with the spouse rules and the request-scoped
 * `Db` provided to them. The layer is built per run, so a cached runtime can
 * never share one request's D1 binding with another.
 */
export const AppLive = Layer.mergeAll(
  PeopleLive,
  RelationshipsLive,
  HouseholdsLive,
  GroupsLive,
  ImportLive
).pipe(Layer.provide(MaritalStatusLive), Layer.provide(DbLive));

/** The services a route's Effect program may require. */
export type AppServices = Layer.Success<typeof AppLive>;

/** Rethrows a typed failure in the shape the existing error middleware maps. */
const raise = (failure: ApiError): Effect.Effect<never> =>
  Effect.sync(() => {
    if (failure._tag === "InfraError") {
      // A recognized constraint keeps its mapping. Anything else is an
      // infrastructure fault whose message may carry SQL or D1 detail.
      if (getDbConstraintViolation(failure.cause)) {
        throw failure.cause;
      }
      console.error("🔴 infrastructure failed", failure.cause);
      throw toInvariantHttpException();
    }
    if (failure._tag === "InvariantError") {
      console.error("🔴 invariant failed", failure.cause);
      throw toInvariantHttpException();
    }
    throw toHttpException(failure);
  });

/**
 * The only place a route runs an Effect program. Each failure group is mapped
 * once, here: a domain rule becomes the `HTTPException` the middleware already
 * maps to `ApiErrorBody`, an infrastructure fault is rethrown as its original
 * cause so the existing constraint, Zod, and unknown-error mapping still
 * applies byte for byte, and a broken invariant becomes a generic 500 whose
 * developer text stays in the log.
 */
export const runApi = <A>(
  effect: Effect.Effect<A, ApiError, AppServices>
): Promise<A> =>
  Effect.runPromise(effect.pipe(Effect.catch(raise), Effect.provide(AppLive)));
