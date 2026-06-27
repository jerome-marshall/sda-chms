import { generateDrizzleJson, generateMigration } from "drizzle-kit/api";
// biome-ignore lint/performance/noNamespaceImport: schema must be imported as a namespace for Drizzle
import * as schema from "./schema";

let cached: Promise<string[]> | null = null;

/**
 * Generates the CREATE statements for the current Drizzle schema by diffing it
 * against an empty database.
 *
 * Deriving the test/CI schema straight from the schema (the source of truth in
 * this push-based repo) keeps the in-process DB in lockstep with the code
 * without replaying migration files inside PGlite. The output matches the
 * committed baseline migration statement-for-statement (enforced by
 * {@link import("./schema-sql.test")}).
 *
 * The schema is static within a process, so the (non-trivial) drizzle-kit diff
 * is computed once and memoized — every later `createTestDb()`/`applySchema()`
 * reuses the same statements instead of re-diffing.
 *
 * Used by the in-process PGlite test DB ({@link import("./test-db")}) and the
 * CI Postgres bootstrap ({@link import("./apply-schema")}).
 */
export function generateSchemaStatements(): Promise<string[]> {
  cached ??= (async () => {
    const empty = generateDrizzleJson({});
    const current = generateDrizzleJson(schema, empty.id);
    return await generateMigration(empty, current);
  })();
  return cached;
}
