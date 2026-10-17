import type * as schema from "@schema";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import type { PgTransaction } from "drizzle-orm/pg-core";
import { db } from "void/db";

/**
 * The application's Drizzle database type — node-postgres bound to the full
 * schema. `void/db` provides it (request-scoped pool in production, the PGlite
 * stand-in under Vitest); this module names it once for every signature.
 */
export type Database = typeof db;

export type Transaction = PgTransaction<
  NodePgQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

export type DbTransaction = Database | Transaction;

/**
 * Returns the active database. In production this is Void's request-scoped
 * instance; in tests it is the PGlite stand-in the `void/db` alias provides.
 */
export const getDb = (): Database => db;

/** Wraps a callback in a database transaction, rolling back on error. */
export function createTransaction<T>(
  // oxlint-disable-next-line promise/prefer-await-to-callbacks -- transaction wrapper takes a work function by design (drizzle pattern)
  cb: (trx: Transaction) => Promise<T>
): Promise<T> {
  return db.transaction(cb);
}
