import { Context, Effect, Layer } from "effect";

import { getDb } from "../db";
import type { Database } from "../db";

/**
 * The request-scoped Drizzle database. Void hands each request its own D1
 * binding, so the service is built per handler invocation and never cached.
 */
export class Db extends Context.Service<Db, Database>()("Db") {}

/** Builds the `Db` service from Void's request-scoped binding. */
export const DbLive: Layer.Layer<Db> = Layer.sync(Db, getDb);

/**
 * Lifts a Drizzle promise into Effect. The rejection value stays as the error
 * cause so the existing constraint/Zod/HTTP mapping still sees it.
 */
export const fromDb = <A>(run: () => Promise<A>): Effect.Effect<A, unknown> =>
  Effect.tryPromise({ try: run, catch: (cause) => cause });
