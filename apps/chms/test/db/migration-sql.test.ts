import Database from "better-sqlite3";
import { getTableConfig, SQLiteTable } from "drizzle-orm/sqlite-core";
import { describe, expect, it } from "vite-plus/test";

import journal from "../../src/db/migrations/meta/_journal.json";

const schemaModules: Record<string, Record<string, unknown>> = import.meta.glob(
  "../../src/db/schema/*.ts",
  { eager: true }
);

const tables = Object.values(schemaModules)
  .flatMap((module) => Object.values(module))
  .filter((value): value is SQLiteTable => value instanceof SQLiteTable)
  .map((table) => getTableConfig(table));

/** Every `text({ enum })` column in the schema, as [table, column]. */
const enumColumns = tables.flatMap((table) =>
  table.columns
    .filter((column) => column.enumValues !== undefined)
    .map((column) => [table.name, column.name] as const)
);

/** Inserts one row that fills each required column with a legal value. */
const insertMinimalRow = (client: Database.Database, tableName: string) => {
  const table = tables.find((candidate) => candidate.name === tableName);
  if (!table) {
    throw new Error(`test: no table ${tableName}`);
  }
  const required = table.columns.filter(
    (column) =>
      column.notNull && column.default === undefined && !column.generated
  );
  const values = required.map((column) =>
    column.getSQLType() === "text" ? (column.enumValues?.[0] ?? "x") : 0
  );
  client
    .prepare(
      `insert into "${tableName}" (${required.map((column) => `"${column.name}"`).join(", ")}) values (${required.map(() => "?").join(", ")})`
    )
    .run(...values);
};

const migrationSql = import.meta.glob("../../src/db/migrations/*.sql", {
  query: "?raw",
  import: "default",
  eager: true,
});

interface JournalEntry {
  tag: string;
}

const isJournal = (value: unknown): value is { entries: JournalEntry[] } =>
  typeof value === "object" &&
  value !== null &&
  Array.isArray((value as { entries?: unknown }).entries);

/** Replays the journaled migration history into a fresh in-memory database. */
const applyMigrations = (
  client: { exec: (sql: string) => unknown },
  entries: { tag: string }[]
): void => {
  for (const entry of entries) {
    const sql = migrationSql[`../../src/db/migrations/${entry.tag}.sql`];
    if (typeof sql !== "string") {
      throw new TypeError(`test: SQL missing for ${entry.tag}`);
    }
    for (const statement of sql.split("--> statement-breakpoint")) {
      const trimmed = statement.trim();
      if (trimmed.length > 0) {
        client.exec(trimmed);
      }
    }
  }
};

describe("committed SQL behaviour", () => {
  it("the D1 migration creates the coalesce generated columns", () => {
    if (!isJournal(journal)) {
      throw new Error("test: migration journal is malformed");
    }

    const client = new Database(":memory:");
    try {
      applyMigrations(client, journal.entries);

      const people = client
        .prepare("select sql from sqlite_master where name = 'people'")
        .get() as { sql: string };
      expect(people.sql).toContain("coalesce(last_name, '')");
      expect(people.sql).toContain("coalesce(date_of_birth, '')");
      expect(people.sql).toContain("GENERATED ALWAYS AS");
    } finally {
      client.close();
    }
  });

  it("the D1 migration creates the unique identity index", () => {
    if (!isJournal(journal)) {
      throw new Error("test: migration journal is malformed");
    }

    const client = new Database(":memory:");
    try {
      applyMigrations(client, journal.entries);

      const identity = client
        .prepare(
          "select sql from sqlite_master where name = 'unique_person_identity'"
        )
        .get() as { sql: string };
      expect(identity.sql).toContain("UNIQUE");
      expect(identity.sql).toContain("identity_last_name");
      expect(identity.sql).toContain("identity_date_of_birth");
    } finally {
      client.close();
    }
  });

  it.each(enumColumns)(
    "the database rejects a value outside the enum of %s.%s",
    (tableName, columnName) => {
      if (!isJournal(journal)) {
        throw new Error("test: migration journal is malformed");
      }
      const client = new Database(":memory:");
      try {
        applyMigrations(client, journal.entries);
        client.pragma("foreign_keys = OFF");
        insertMinimalRow(client, tableName);
        expect(() =>
          client
            .prepare(`update "${tableName}" set "${columnName}" = ?`)
            .run("not-a-listed-value")
        ).toThrow(/CHECK constraint failed/u);
      } finally {
        client.close();
      }
    }
  );
});
