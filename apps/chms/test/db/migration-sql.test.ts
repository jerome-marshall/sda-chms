import Database from "better-sqlite3";
import { describe, expect, it } from "vite-plus/test";

import journal from "../../db/migrations/meta/_journal.json";

const migrationSql = import.meta.glob("../../db/migrations/*.sql", {
  query: "?raw",
  import: "default",
  eager: true,
});

const migrationSnapshots = import.meta.glob("../../db/migrations/meta/*.json", {
  eager: true,
});

/** Snapshot files per migration index (`<tag>_snapshot.json`), zipped with the journal order. */
const snapshotKeys = Object.keys(migrationSnapshots)
  .filter((key) => key.endsWith("_snapshot.json"))
  .toSorted();

interface JournalEntry {
  tag: string;
}

interface SnapshotTable {
  columns: Record<string, { type: string }>;
}

interface Snapshot {
  tables: Record<string, SnapshotTable>;
  enums: Record<string, unknown>;
}

const isJournal = (value: unknown): value is { entries: JournalEntry[] } =>
  typeof value === "object" &&
  value !== null &&
  Array.isArray((value as { entries?: unknown }).entries);

const isSnapshot = (value: unknown): value is Snapshot =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as { tables?: unknown }).tables === "object";

const snapshotAt = (index: number, tag: string): Snapshot => {
  const snapshot = migrationSnapshots[snapshotKeys[index] ?? ""];
  if (!isSnapshot(snapshot)) {
    throw new Error(`test: snapshot missing or malformed for ${tag}`);
  }
  return snapshot;
};

describe("committed SQL matches the migration snapshots", () => {
  it("builds the snapshotted tables, columns, and types on SQLite", () => {
    if (!isJournal(journal)) {
      throw new Error("test: migration journal is malformed");
    }

    const client = new Database(":memory:");
    try {
      const expectedTables = new Map<string, Map<string, string>>();

      for (const [index, entry] of journal.entries.entries()) {
        const sql = migrationSql[`../../db/migrations/${entry.tag}.sql`];
        if (typeof sql !== "string") {
          throw new TypeError(`test: SQL missing for ${entry.tag}`);
        }
        for (const statement of sql.split("--> statement-breakpoint")) {
          const trimmed = statement.trim();
          if (trimmed.length > 0) {
            client.exec(trimmed);
          }
        }

        const snapshot = snapshotAt(index, entry.tag);
        for (const [name, table] of Object.entries(snapshot.tables)) {
          const columns = new Map<string, string>();
          for (const [column, definition] of Object.entries(table.columns)) {
            columns.set(column, definition.type.toLowerCase());
          }
          expectedTables.set(name, columns);
        }
        // SQLite has no enums; the D1 snapshots must not smuggle any in.
        expect(Object.keys(snapshot.enums)).toStrictEqual([]);
      }

      const tables = client
        .prepare(
          "select name from sqlite_master where type = 'table' and name not like 'sqlite_%' and name != '__drizzle_migrations'"
        )
        .all() as { name: string }[];
      expect(tables.map((row) => row.name).toSorted()).toStrictEqual(
        [...expectedTables.keys()].toSorted()
      );

      const actual = new Map<string, Map<string, string>>();
      for (const { name } of tables) {
        // table_xinfo (not table_info) so stored generated columns
        // (identity_last_name, …) are included.
        const columns = client
          .prepare(`pragma table_xinfo("${name}")`)
          .all() as { name: string; type: string }[];
        const table = new Map<string, string>();
        for (const column of columns) {
          table.set(column.name, column.type.toLowerCase());
        }
        actual.set(name, table);
      }
      expect(actual).toStrictEqual(expectedTables);

      // The person-identity dedupe index from the D1 port must exist and be unique.
      const indexes = client
        .prepare("select name, sql from sqlite_master where type = 'index'")
        .all() as { name: string; sql: string }[];
      const identity = indexes.find(
        (row) => row.name === "unique_person_identity"
      );
      expect(identity?.sql).toContain("UNIQUE");
      expect(identity?.sql).toContain("identity_last_name");
    } finally {
      client.close();
    }
  });

  it("the D1 migration creates the coalesce generated columns", () => {
    if (!isJournal(journal)) {
      throw new Error("test: migration journal is malformed");
    }

    const client = new Database(":memory:");
    try {
      for (const entry of journal.entries) {
        const sql = migrationSql[`../../db/migrations/${entry.tag}.sql`];
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
      for (const entry of journal.entries) {
        const sql = migrationSql[`../../db/migrations/${entry.tag}.sql`];
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
});
