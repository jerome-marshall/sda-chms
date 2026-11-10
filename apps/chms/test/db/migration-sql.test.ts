import Database from "better-sqlite3";
import { describe, expect, it } from "vite-plus/test";

import journal from "../../src/db/migrations/meta/_journal.json";

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

  it("the database rejects values outside each enum", () => {
    if (!isJournal(journal)) {
      throw new Error("test: migration journal is malformed");
    }

    const client = new Database(":memory:");
    try {
      applyMigrations(client, journal.entries);

      const insertPerson = client.prepare(
        "insert into people (id, created_at, updated_at, first_name, marital_status, membership_status) values (?, 0, 0, 'Test', ?, ?)"
      );
      insertPerson.run("valid", "single", "member");
      expect(() =>
        insertPerson.run("bad-marital", "engaged", "member")
      ).toThrow(/CHECK constraint failed: marital_status_check/u);
      expect(() =>
        insertPerson.run("bad-membership", "single", "guest")
      ).toThrow(/CHECK constraint failed: membership_status_check/u);

      const insertLink = client.prepare(
        "insert into relationships (id, person_id, related_person_id, type, state, created_at) values (?, 'valid', 'valid', ?, ?, 0)"
      );
      insertLink.run("spouse-link", "spouse", "married");
      expect(() => insertLink.run("bad-type", "cousin", null)).toThrow(
        /CHECK constraint failed: type_check/u
      );
      expect(() => insertLink.run("bad-state", "parent", "engaged")).toThrow(
        /CHECK constraint failed: state_check/u
      );
    } finally {
      client.close();
    }
  });
});
