import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import { householdsTable, peopleTable } from "@schema";
import { describe, expect, it } from "vite-plus/test";

import { createDb, db, resetDb } from "./void-db";
// oxlint-disable-next-line import/no-namespace -- Object.keys over the module namespace is the parity assertion
import * as standIn from "./void-db";

const require = createRequire(import.meta.url);
const voidDir = path.join(
  path.dirname(require.resolve("void/handler")),
  "..",
  ".."
);

/**
 * The operator names Void's own db module exposes, read from the type entry
 * its export map points at (`./_db`). Parsed from source rather than imported:
 * importing Void's real db module pulls `cloudflare:workers`, which does not
 * resolve under Vitest. The type entry is the contract the generated virtual
 * module implements.
 */
const voidOperatorNames = (): string[] => {
  const voidPkg = JSON.parse(
    readFileSync(path.join(voidDir, "package.json"), "utf-8")
  ) as { exports: Record<string, { types: string }> };
  const typesEntry = voidPkg.exports["./_db"]?.types;
  if (!typesEntry) {
    throw new Error("void/_db has no types entry in void's export map");
  }
  const source = readFileSync(path.join(voidDir, typesEntry), "utf-8");
  const exportBlock = /export \{(?<exports>[^}]*)\}/u.exec(source)?.groups
    ?.exports;
  if (!exportBlock) {
    throw new Error(`no export block in void ${typesEntry}`);
  }
  return exportBlock
    .split(",")
    .map((name) => name.trim().replace(/^type\s+/u, ""))
    .filter((name) => name.length > 0 && !name.startsWith("Drizzle"));
};

/**
 * The stand-in `void/db` must expose exactly the surface Void's own db module
 * exposes (minus `db`/`createDb`, which the stand-in provides itself, and minus
 * `resetDb`, which is test-only). Void's generated virtual module re-exports
 * its operators from `void/_db`, so that subpath is the canonical reference —
 * it resolves to Void's real file even with `void/db` aliased to the stand-in.
 */
describe("void/db stand-in surface parity", () => {
  it("re-exports every operator Void's own db module exports, no more", () => {
    const ignored = new Set(["db", "createDb", "resetDb"]);
    const expected = voidOperatorNames()
      .filter((name) => !ignored.has(name))
      .toSorted();
    const actual = Object.keys(standIn)
      .filter((name) => !ignored.has(name))
      .toSorted();
    expect(actual).toStrictEqual(expected);
  });

  it("createDb throws instead of returning a client", () => {
    expect(() => createDb()).toThrow(/unavailable in tests/u);
  });
});

/**
 * The real baseline migration (`db/migrations/0000_baseline.sql`) applies in
 * PGlite through the drizzle migrator, so tests exercise the committed
 * migration history rather than a re-derived schema.
 */
describe("real baseline migration in PGlite", () => {
  it("insert, read back, and truncate across related tables", async () => {
    await resetDb();

    const [household] = await db
      .insert(householdsTable)
      .values({ familyName: "Krishnamurthy Family" })
      .returning();
    const [person] = await db
      .insert(peopleTable)
      .values({
        firstName: "Jo",
        maritalStatus: "single",
        membershipStatus: "member",
        householdId: household?.id,
      })
      .returning();
    expect(person?.id).toBeTruthy();
    expect(person?.householdId).toBe(household?.id);

    await resetDb();
    await expect(db.select().from(peopleTable)).resolves.toStrictEqual([]);
    await expect(db.select().from(householdsTable)).resolves.toStrictEqual([]);
  });
});
