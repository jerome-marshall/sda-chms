import { PGlite } from "@electric-sql/pglite";
// oxlint-disable-next-line import/no-namespace -- schema must be imported as a namespace for Drizzle
import * as schema from "@schema";
import { getTableName, is } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/pglite";

import migrationJournal from "../db/migrations/meta/_journal.json";

export {
  and,
  asc,
  avg,
  between,
  count,
  desc,
  eq,
  exists,
  gt,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  like,
  lt,
  lte,
  max,
  min,
  ne,
  not,
  notBetween,
  notExists,
  notInArray,
  notLike,
  or,
  sql,
  sum,
} from "drizzle-orm";

/**
 * In-process PGlite stand-in for `void/db` in tests. Vitest does not run
 * `voidPlugin`, so `void/db` would fall through to Void's static D1 stub;
 * the web vitest project aliases `void/db` to this module instead. The
 * operator re-exports mirror the names Void's own virtual module re-exports
 * (`test/void-db.test.ts` enforces the parity), so data-access code imports
 * `void/db` exactly as it does in production.
 */
const client = new PGlite();

/** Drizzle over the in-process PGlite, bound to the app's real schema. */
export const db = drizzle(client, { schema });

/**
 * Applies the committed migration history, statement by statement in journal
 * order — the same files `void db migrate` replays in production. The SQL is
 * bundled with `?raw` so no filesystem path has to survive module
 * transformation; `import.meta` URLs are not stable across the test runner.
 */
const migrationSql = import.meta.glob("../db/migrations/*.sql", {
  query: "?raw",
  import: "default",
  eager: true,
});

const journal = migrationJournal as { entries: { tag: string }[] };
for (const entry of journal.entries) {
  const key = `../db/migrations/${entry.tag}.sql`;
  const sql = migrationSql[key];
  if (sql === undefined) {
    throw new Error(
      `test/void-db: migration file missing for journal entry ${entry.tag}`
    );
  }
  for (const statement of sql.split("--> statement-breakpoint")) {
    const trimmed = statement.trim();
    if (trimmed.length > 0) {
      await client.exec(trimmed);
    }
  }
}

/** Every Drizzle table in the schema, used to truncate between tests. */
const allTables = (Object.values(schema) as unknown[]).filter(
  (value): value is PgTable => is(value, PgTable)
);

// Fail loudly if table discovery ever returns nothing (e.g. a refactor changes
// how the schema is exported). A silent empty list would make `resetDb()` a no-op
// and leak rows across tests instead of erroring.
if (allTables.length === 0) {
  throw new Error(
    "test/void-db: no tables discovered in the @schema namespace — resetDb() would truncate nothing"
  );
}

/**
 * Removes all rows from every table (keeps the schema) — every DB test calls
 * this in `beforeEach`, as with the previous `setTestDb` seam.
 */
export const resetDb = async (): Promise<void> => {
  await client.exec(
    `TRUNCATE TABLE ${allTables.map((table) => `"${getTableName(table)}"`).join(", ")} RESTART IDENTITY CASCADE;`
  );
};

/** No per-database clients in tests — use the shared `db` instance. */
export const createDb = (): never => {
  throw new Error(
    "test/void-db: createDb() is unavailable in tests — use the shared db instance"
  );
};
