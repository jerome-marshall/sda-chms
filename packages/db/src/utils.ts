import { env } from "@sda-chms/env/server";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import type {
  NodePgDatabase,
  NodePgQueryResultHKT,
} from "drizzle-orm/node-postgres";
import type { PgTransaction } from "drizzle-orm/pg-core";

// oxlint-disable-next-line import/no-namespace -- schema must be imported as a namespace for Drizzle
import * as schema from "./schema";

export type Transaction = PgTransaction<
  NodePgQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

/** The application's Drizzle database type — node-postgres bound to the full schema. */
export type Database = NodePgDatabase<typeof schema>;

let prodDb: Database | null = null;
let injectedDb: Database | null = null;

/**
 * Returns the active database. Tests inject an alternative (e.g. PGlite) via
 * {@link setTestDb}; otherwise the production node-postgres singleton is created
 * lazily on first use, so importing this module never requires a live connection.
 */
export const getDb = (): Database => {
  if (injectedDb) {
    return injectedDb;
  }
  if (!prodDb) {
    prodDb = drizzle(env.DATABASE_URL, { schema });
  }
  return prodDb;
};

/**
 * Test seam: swap the database used by every data-access call (pass `null` to
 * restore the production singleton). Integration tests set a PGlite instance here.
 */
export const setTestDb = (db: Database | null): void => {
  injectedDb = db;
};

/** Wraps a callback in a database transaction, rolling back on error. */
export function createTransaction<T>(
  // oxlint-disable-next-line promise/prefer-await-to-callbacks -- transaction wrapper takes a work function by design (drizzle pattern)
  cb: (trx: Transaction) => Promise<T>
): Promise<T> {
  return getDb().transaction(cb);
}
