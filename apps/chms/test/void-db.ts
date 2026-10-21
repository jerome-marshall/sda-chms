// oxlint-disable-next-line import/no-namespace -- schema must be imported as a namespace for Drizzle
import * as schema from "@schema";
import Database from "better-sqlite3";
import { getTableName, is } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { SQLiteTable } from "drizzle-orm/sqlite-core";

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
 * In-process SQLite stand-in for `void/db` in tests. Vitest does not run
 * `voidPlugin`, so `void/db` would fall through to Void's static D1 stub;
 * the web vitest project aliases `void/db` to this module instead. The
 * operator re-exports mirror the names Void's own db module re-exports
 * (`test/void-db.test.ts` enforces the parity), so server code imports
 * `void/db` exactly as it does in production.
 *
 * better-sqlite3 executes synchronously while D1 is remote-async, but every
 * statement goes through the same SQLite engine and SQL dialect.
 */
const client = new Database(":memory:");
client.pragma("foreign_keys = ON");

const base = drizzle(client, { schema });

/**
 * D1-shaped batch that runs inside one better-sqlite3 transaction, so a
 * failing statement rolls back the earlier ones — the same all-or-nothing
 * shape D1 documents for batched statements ("Batched statements are SQL
 * transactions"). Every batched builder executes synchronously here (the
 * same `.all()` awaiting it would call), so the throw that triggers the
 * rollback happens before the transaction can commit. Callers pass
 * unexecuted builders and read row [0] of each result, exactly as with
 * D1's `db.batch`.
 */
const batch = (queries: PromiseLike<unknown>[]): Promise<unknown[]> => {
  try {
    return Promise.resolve(
      client.transaction(() =>
        queries.map((query) =>
          (query as unknown as { all: () => unknown }).all()
        )
      )()
    );
  } catch (error) {
    return Promise.reject(
      error instanceof Error ? error : new Error(String(error))
    );
  }
};

/** The shared test database: Drizzle over in-memory SQLite with D1's batch shape. */
export const db = Object.assign(base, { batch });

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
  const sqlText = migrationSql[key] as string | undefined;
  if (sqlText === undefined) {
    throw new Error(
      `test/void-db: migration file missing for journal entry ${entry.tag}`
    );
  }
  for (const statement of sqlText.split("--> statement-breakpoint")) {
    const trimmed = statement.trim();
    if (trimmed.length > 0) {
      client.exec(trimmed);
    }
  }
}

/** Every Drizzle table in the schema, used to clear between tests. */
const allTables = (Object.values(schema) as unknown[]).filter(
  (value): value is SQLiteTable => is(value, SQLiteTable)
);

// Fail loudly if table discovery ever returns nothing (e.g. a refactor changes
// how the schema is exported). A silent empty list would make `resetDb()` a
// no-op and leak rows across tests instead of erroring.
if (allTables.length === 0) {
  throw new Error(
    "test/void-db: no tables discovered in the @schema namespace — resetDb() would clear nothing"
  );
}

/**
 * Removes all rows from every table (keeps the schema) — every DB test calls
 * this in `beforeEach`, as with the previous `setTestDb` seam. Foreign keys
 * are enforced, so the pragma is dropped for the clear and restored after.
 */
export const resetDb = (): Promise<void> => {
  client.pragma("foreign_keys = OFF");
  try {
    for (const table of allTables) {
      client.exec(`DELETE FROM "${getTableName(table)}"`);
    }
  } finally {
    client.pragma("foreign_keys = ON");
  }
  return Promise.resolve();
};

/** No per-database clients in tests — use the shared `db` instance. */
export const createDb = (): never => {
  throw new Error(
    "test/void-db: createDb() is unavailable in tests — use the shared db instance"
  );
};
