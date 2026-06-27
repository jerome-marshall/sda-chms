import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { generateSchemaStatements } from "./schema-sql";

/**
 * The PGlite test DB and the CI Postgres bootstrap both derive their schema from
 * the live Drizzle schema (via {@link generateSchemaStatements}), never from the
 * committed migration files. Production, by contrast, applies the migrations with
 * `drizzle-kit migrate`. Nothing else in CI replays those files, so without this
 * test a schema change made without regenerating the migration (or a hand-edited
 * migration) would drift silently and only surface in production.
 *
 * This locks the two together: if they diverge, regenerate the baseline with
 * `bun run db:generate`.
 */
const migrationPath = new URL(
  "./migrations/0000_baseline.sql",
  import.meta.url
);

/** Drizzle joins statements with this marker when it writes a migration file. */
const STATEMENT_BREAKPOINT = /-->\s*statement-breakpoint/;
const TRAILING_SEMICOLON = /;\s*$/;

// drizzle-kit emits the same statements but not in a stable order, so compare as
// sets: drift = a statement added, removed, or changed (a real schema change),
// not a benign reordering of independent CREATE/ALTER statements.
const normalize = (statement: string) =>
  statement.trim().replace(TRAILING_SEMICOLON, "");

const asSortedStatements = (statements: string[]) =>
  statements.map(normalize).filter(Boolean).sort();

const statementsFromMigrationFile = () =>
  asSortedStatements(
    readFileSync(migrationPath, "utf8").split(STATEMENT_BREAKPOINT)
  );

describe("schema / migration drift", () => {
  it("the live schema matches the committed baseline migration statement-for-statement", async () => {
    const generated = asSortedStatements(await generateSchemaStatements());
    const fromFile = statementsFromMigrationFile();

    expect(generated).toEqual(fromFile);
  });
});
