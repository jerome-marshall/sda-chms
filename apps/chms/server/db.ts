import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import { db } from "void/db";

/**
 * The application's Drizzle database type. `void/db` provides it
 * (request-scoped D1 session in production, the SQLite stand-in under
 * Vitest); this module names it once for every signature.
 *
 * D1 has no interactive transactions — Drizzle's `db.transaction()` issues
 * raw BEGIN/COMMIT, which remote D1 rejects. Multi-write domain operations
 * issue one `getDb().batch([...])` instead: reads first, every write
 * computed in memory, then a single batch of unexecuted query builders.
 */
export type Database = typeof db;

/**
 * The handle both drivers share. D1 runs every statement asynchronously and
 * better-sqlite3 synchronously, so the result mode is widened to the union
 * here; every helper awaits its statements, and the schema and row types come
 * straight from `Database`.
 */
export type SharedDatabase = BaseSQLiteDatabase<
  "sync" | "async",
  unknown,
  Database["_"]["fullSchema"]
>;

/**
 * The database surfaces helpers accept. Each is structural, so the SQLite
 * stand-in has to implement it rather than assert its way in, and a helper
 * that starts using a method the stand-in lacks fails the type check at its
 * call site.
 */
export type QueryDatabase = Pick<SharedDatabase, "query">;
export type WriteDatabase = Pick<
  SharedDatabase,
  "insert" | "update" | "delete"
>;

/**
 * A `.returning()` statement: awaitable on its own, or one entry in a D1
 * batch. `_` is the shape Drizzle batches read to type each result, so the row
 * type survives the batch.
 */
export interface ReturningStatement<TRow> extends PromiseLike<TRow[]> {
  readonly _: {
    readonly dialect: "sqlite";
    readonly result: TRow[];
  };
}

/** One D1 batch: every statement in it runs or none does. */
export interface BatchDatabase {
  batch: (
    statements: readonly [
      ReturningStatement<unknown>,
      ...ReturningStatement<unknown>[],
    ]
  ) => Promise<readonly unknown[]>;
}

/** A batch writer builds statements and sends them as one D1 batch. */
export type BatchWriteDatabase = WriteDatabase & BatchDatabase;

/** Every surface the server touches, in one name for the stand-in's proof. */
export type DatabaseSurface = QueryDatabase & BatchWriteDatabase;

/**
 * Returns the active database. In production this is Void's request-scoped
 * D1 instance; in tests it is the SQLite stand-in the `void/db` alias
 * provides.
 */
export const getDb = (): Database => db;
