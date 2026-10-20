import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vite-plus/test";

import journal from "../../db/migrations/meta/_journal.json";

/**
 * The committed migration SQL must build exactly the schema the drizzle
 * snapshots describe. A hand edit to a `.sql` file that the snapshot does
 * not contain (or vice versa) would otherwise slip past `void db generate`,
 * which diffs the live schema against the snapshots but never replays the
 * SQL. This test applies every migration in journal order to a fresh PGlite
 * and compares the resulting catalog against every snapshot.
 */

interface JournalEntry {
  tag: string;
}

interface SnapshotTable {
  columns: Record<string, { type: string }>;
}

interface Snapshot {
  enums: Record<string, unknown>;
  tables: Record<string, SnapshotTable>;
}

const isJournal = (value: unknown): value is { entries: JournalEntry[] } =>
  typeof value === "object" &&
  value !== null &&
  Array.isArray((value as { entries?: unknown }).entries);

const isSnapshot = (value: unknown): value is Snapshot =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as { tables?: unknown }).tables === "object" &&
  typeof (value as { enums?: unknown }).enums === "object";

const migrationSql = import.meta.glob("../../db/migrations/*.sql", {
  query: "?raw",
  import: "default",
  eager: true,
});

const migrationSnapshots = import.meta.glob("../../db/migrations/meta/*.json", {
  eager: true,
});

/** Snapshot files are per-migration index (`0000_snapshot.json`), zipped with the journal order. */
const snapshotKeys = Object.keys(migrationSnapshots)
  .filter((key) => key.endsWith("_snapshot.json"))
  .toSorted();

const snapshotAt = (index: number, tag: string): Snapshot => {
  const snapshot = migrationSnapshots[snapshotKeys[index] ?? ""];
  if (!isSnapshot(snapshot)) {
    throw new Error(`test: snapshot missing or malformed for ${tag}`);
  }
  return snapshot;
};

/** Normalizes information_schema column descriptors to snapshot type strings. */
const normalizeColumnType = (row: {
  data_type: string;
  udt_name: string;
  character_maximum_length: number | null;
}): string => {
  if (row.data_type === "USER-DEFINED") {
    return row.udt_name;
  }
  if (row.data_type === "character varying") {
    return `varchar(${row.character_maximum_length ?? ""})`;
  }
  if (row.data_type === "timestamp without time zone") {
    return "timestamp";
  }
  return row.data_type;
};

describe("committed SQL matches the migration snapshots", () => {
  it("builds the snapshotted tables, columns, types, and enums", async () => {
    if (!isJournal(journal)) {
      throw new Error("test: migration journal is malformed");
    }

    const client = new PGlite();
    try {
      const expectedTables = new Map<string, Map<string, string>>();
      const expectedEnums = new Set<string>();

      for (const [index, entry] of journal.entries.entries()) {
        const sql = migrationSql[`../../db/migrations/${entry.tag}.sql`];
        if (sql === undefined) {
          throw new Error(`test: SQL missing for ${entry.tag}`);
        }
        for (const statement of sql.split("--> statement-breakpoint")) {
          const trimmed = statement.trim();
          if (trimmed.length > 0) {
            await client.query(trimmed);
          }
        }

        const snapshot = snapshotAt(index, entry.tag);
        for (const [qualified, table] of Object.entries(snapshot.tables)) {
          const name = qualified.includes(".")
            ? (qualified.split(".")[1] ?? qualified)
            : qualified;
          const columns = new Map<string, string>();
          for (const [column, definition] of Object.entries(table.columns)) {
            columns.set(column, definition.type);
          }
          expectedTables.set(name, columns);
        }
        for (const qualified of Object.keys(snapshot.enums)) {
          expectedEnums.add(
            qualified.includes(".")
              ? (qualified.split(".")[1] ?? qualified)
              : qualified
          );
        }
      }

      const tables = (await client.query(
        "select tablename from pg_tables where schemaname = 'public'"
      )) as { rows: { tablename: string }[] };
      expect(tables.rows.map((row) => row.tablename).toSorted()).toStrictEqual(
        [...expectedTables.keys()].toSorted()
      );

      const columns = (await client.query(
        `select table_name, column_name, data_type, udt_name, character_maximum_length
         from information_schema.columns where table_schema = 'public'`
      )) as {
        rows: {
          table_name: string;
          column_name: string;
          data_type: string;
          udt_name: string;
          character_maximum_length: number | null;
        }[];
      };
      const actual = new Map<string, Map<string, string>>();
      for (const row of columns.rows) {
        const table = actual.get(row.table_name) ?? new Map<string, string>();
        table.set(row.column_name, normalizeColumnType(row));
        actual.set(row.table_name, table);
      }
      expect(actual).toStrictEqual(expectedTables);

      const enums = (await client.query(
        `select typname from pg_type where typnamespace = (select oid from pg_namespace where nspname = 'public') and typtype = 'e'`
      )) as { rows: { typname: string }[] };
      expect(enums.rows.map((row) => row.typname).toSorted()).toStrictEqual(
        [...expectedEnums].toSorted()
      );
    } finally {
      await client.close();
    }
  });
});
