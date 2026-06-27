import { env } from "@sda-chms/env/server";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";

// biome-ignore lint/performance/noNamespaceImport: <import schema>
import * as schema from "./schema";
import type { Transaction } from "./utils";

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

// biome-ignore lint/performance/noBarrelFile: <required here>
export { and, eq, ilike, isNotNull, sql } from "drizzle-orm";
export { createTransaction } from "./utils";

export type DbTransaction = Database | Transaction;
