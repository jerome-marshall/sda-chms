import { Effect, Layer } from "effect";

import { DbLive } from "./db";
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

/** The only place a route runs an Effect program. */
export const runEffect = <A, E>(
  effect: Effect.Effect<A, E, AppServices>
): Promise<A> => Effect.runPromise(effect.pipe(Effect.provide(AppLive)));
