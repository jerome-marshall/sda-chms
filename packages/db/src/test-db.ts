import { PGlite } from "@electric-sql/pglite";
import { getTableName, is } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/pglite";
import type { Database } from ".";
// biome-ignore lint/performance/noNamespaceImport: schema must be imported as a namespace for Drizzle
import * as schema from "./schema";
import { generateSchemaStatements } from "./schema-sql";

/** Every Drizzle table in the schema, used to truncate between tests. */
const allTables = (Object.values(schema) as unknown[]).filter(
  (value): value is PgTable => is(value, PgTable)
);

// Fail loudly if table discovery ever returns nothing (e.g. a refactor changes
// how the schema is exported). A silent empty list would make `reset()` a no-op
// and leak rows across tests instead of erroring.
if (allTables.length === 0) {
  throw new Error(
    "test-db: no tables discovered in the schema namespace — reset() would not truncate anything"
  );
}

/**
 * PGlite's Drizzle client and the production node-postgres client share the same
 * `PgDatabase` query-builder surface (`insert/update/.returning()`, relational
 * `query.*.findMany({ with })`, `transaction()`), which is all the data-access
 * layer uses — so injecting one where the other is expected is sound. The cast
 * is the one unavoidable seam: the two differ in their driver-level result HKT
 * (`NodePgQueryResultHKT` vs PGlite's), and `Transaction` is pinned to the
 * node-postgres HKT, so a shared supertype can't be expressed without breaking
 * `createTransaction`. It stays sound only while data-access avoids
 * node-postgres-only escape hatches (`$client`, raw Postgres-specific SQL).
 */
const asDatabase = (db: ReturnType<typeof drizzle>): Database =>
  db as unknown as Database;

export interface TestDb {
  /** The underlying PGlite client. */
  client: PGlite;
  /** Closes the PGlite instance — call after the suite. */
  close: () => Promise<void>;
  /** Drizzle instance bound to the in-process PGlite database. */
  db: Database;
  /** Removes all rows from every table (keeps the schema) — call between tests. */
  reset: () => Promise<void>;
}

/**
 * Spins up a fresh in-process PGlite database with the current schema applied.
 * No Docker, no network — the in-process integration layer for tests.
 */
export async function createTestDb(): Promise<TestDb> {
  const client = new PGlite();
  const db = drizzle(client, { schema });

  for (const statement of await generateSchemaStatements()) {
    await client.exec(statement);
  }

  const truncate = `TRUNCATE TABLE ${allTables
    .map((table) => `"${getTableName(table)}"`)
    .join(", ")} RESTART IDENTITY CASCADE;`;

  return {
    db: asDatabase(db),
    client,
    reset: () => client.exec(truncate).then(() => undefined),
    close: () => client.close(),
  };
}
