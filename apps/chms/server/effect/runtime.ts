import { Effect, Layer } from "effect";

import { DbLive } from "./db";
import { toHttpException } from "./errors";
import type { ApiError } from "./errors";
import { MaritalStatusLive } from "./marital-status";
import { PeopleLive } from "./people";

/**
 * Every stateless service layer, with the request-scoped `Db` provided to
 * them. The layer is built per run, so a cached runtime can never share one
 * request's D1 binding with another.
 */
export const AppLive = Layer.mergeAll(PeopleLive, MaritalStatusLive).pipe(
  Layer.provide(DbLive)
);

/** The services a route's Effect program may require. */
export type AppServices = Layer.Success<typeof AppLive>;

/** Rethrows a typed failure in the shape the existing error middleware maps. */
const raise = (failure: ApiError): Effect.Effect<never> =>
  Effect.sync(() => {
    if (failure._tag === "DatabaseFailure") {
      throw failure.cause;
    }
    throw toHttpException(failure);
  });

/**
 * The only place a route runs an Effect program. Domain failures become the
 * `HTTPException` the middleware already maps to `ApiErrorBody`; an
 * infrastructure failure is rethrown as its original cause so the existing
 * constraint, Zod, and unknown-error mapping still applies byte for byte.
 */
export const runApi = <A>(
  effect: Effect.Effect<A, ApiError, AppServices>
): Promise<A> =>
  Effect.runPromise(effect.pipe(Effect.catch(raise), Effect.provide(AppLive)));
