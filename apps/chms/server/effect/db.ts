import { Context, Effect, Layer } from "effect";

import { getDb } from "../db";
import type { Database } from "../db";
import { DatabaseFailure } from "./errors";

/**
 * The request-scoped Drizzle database. Void hands each request its own D1
 * binding, so the service is built per handler invocation and never cached.
 */
export class Db extends Context.Service<Db, Database>()("Db") {}

/** Builds the `Db` service from Void's request-scoped binding. */
export const DbLive: Layer.Layer<Db> = Layer.sync(Db, getDb);

/**
 * Lifts a Drizzle promise into Effect. The rejection value is kept as the
 * cause so the existing constraint/Zod/HTTP mapping still sees it.
 */
export const fromDb = <A>(
  run: () => Promise<A>
): Effect.Effect<A, DatabaseFailure> =>
  Effect.tryPromise({
    try: run,
    catch: (cause) => new DatabaseFailure({ cause }),
  });
