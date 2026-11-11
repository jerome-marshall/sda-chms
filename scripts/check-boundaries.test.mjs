import assert from "node:assert/strict";
import test from "node:test";

import { dbImportIndex, scanText, specifiers } from "./check-boundaries.mjs";

const rulesFor = (file, text) => scanText(file, text).map((item) => item.rule);

test("rejects any in application code", () => {
  assert.deepEqual(rulesFor("apps/chms/server/x.ts", "const x = 1 as any;"), [
    "any-type",
  ]);
});

test("rejects any as a generic argument and a record value", () => {
  assert.deepEqual(
    rulesFor("apps/chms/server/x.ts", "type T = Record<string, any>;"),
    ["any-type"]
  );
  assert.deepEqual(
    rulesFor("apps/chms/server/x.ts", "type T = Foo<any, string>;"),
    ["any-type"]
  );
  assert.deepEqual(
    rulesFor("apps/chms/server/x.ts", "type T = any | string;"),
    ["any-type"]
  );
  assert.deepEqual(
    rulesFor("apps/chms/server/x.ts", "type T = Map<string, any[]>;"),
    ["any-type"]
  );
});

test("ignores a line comment", () => {
  assert.deepEqual(
    rulesFor("apps/chms/server/x.ts", "// const x = 1 as any;"),
    []
  );
});

test("sees code after a block comment on the same line", () => {
  assert.deepEqual(
    rulesFor("apps/chms/server/x.ts", "/* note */ const x = 1 as any;"),
    ["any-type"]
  );
});

test("allows the effect edge and rejects a run elsewhere", () => {
  assert.deepEqual(
    rulesFor(
      "apps/chms/server/effect/runtime.ts",
      "Effect.runPromise(program);"
    ),
    []
  );
  assert.deepEqual(
    rulesFor("apps/chms/src/routes/api/x.ts", "Effect.runPromise(program);"),
    ["run-promise-edge"]
  );
});

test("rejects an ambient database read in a service", () => {
  assert.deepEqual(
    rulesFor("apps/chms/server/effect/people.ts", "const db = getDb();"),
    ["ambient-db"]
  );
  assert.deepEqual(
    rulesFor("apps/chms/server/effect/db.ts", "Layer.sync(Db, getDb)"),
    []
  );
});

test("sees multi-line, namespace, re-export, and dynamic binding imports", () => {
  const multiLine = ["import {", "  db,", '} from "void/db";'].join("\n");
  assert.deepEqual(rulesFor("apps/chms/server/people.ts", multiLine), [
    "db-import",
  ]);
  assert.deepEqual(
    rulesFor("apps/chms/server/people.ts", 'import * as vdb from "void/db";'),
    ["db-import"]
  );
  assert.deepEqual(
    rulesFor("apps/chms/server/people.ts", 'export { db } from "void/db";'),
    ["db-import"]
  );
  assert.deepEqual(
    rulesFor(
      "apps/chms/server/people.ts",
      'const { db } = await import("void/db");'
    ),
    ["db-import"]
  );
  assert.deepEqual(
    rulesFor("apps/chms/server/people.ts", 'export * from "void/db";'),
    ["db-import"]
  );
  assert.deepEqual(
    rulesFor("apps/chms/server/people.ts", 'export * as vdb from "void/db";'),
    ["db-import"]
  );
  assert.equal(dbImportIndex('import { eq } from "void/db";'), -1);
});

test("sees a multi-line route import and a dynamic one", () => {
  const route = "apps/chms/src/routes/api/people/index.ts";
  const multiLine = [
    "import {",
    "  listPeople,",
    "} from",
    '  "../../../../server/people";',
  ].join("\n");
  assert.deepEqual(rulesFor(route, multiLine), ["route-reaches-db"]);
  assert.deepEqual(
    rulesFor(route, 'await import("../../../../server/people");'),
    ["route-reaches-db"]
  );
  assert.deepEqual(
    rulesFor(
      route,
      'import { getAllPeople } from "../../../../server/effect/people";'
    ),
    []
  );
  assert.equal(
    specifiers('import { x } from "../../../../server/effect/people";').length,
    1
  );
  assert.deepEqual(
    rulesFor(route, 'import { x } from "../../../../server/effect";'),
    []
  );
  assert.deepEqual(
    rulesFor(
      route,
      '// import { x } from "../../../../server/people";\nconst x = 1;'
    ),
    []
  );
});

test("rejects a route that imports a helper or a table", () => {
  assert.deepEqual(
    rulesFor(
      "apps/chms/src/routes/api/people/index.ts",
      'import { peopleTable } from "@schema";'
    ),
    ["route-reaches-db"]
  );
  assert.deepEqual(
    rulesFor(
      "apps/chms/src/routes/api/people/index.ts",
      'import { eq } from "drizzle-orm";'
    ),
    ["route-reaches-db"]
  );
});

test("rejects try/catch in a service but not Effect.catch", () => {
  assert.deepEqual(rulesFor("apps/chms/server/effect/people.ts", "try {"), [
    "try-catch-in-service",
  ]);
  assert.deepEqual(
    rulesFor("apps/chms/server/effect/people.ts", "Effect.catch(raise)"),
    []
  );
});

test("rejects a widened error channel", () => {
  assert.deepEqual(
    rulesFor(
      "apps/chms/server/effect/people.ts",
      "const program: Effect<A, Error> = value;"
    ),
    ["error-channel"]
  );
});

test("rejects environment reads in domain code only", () => {
  assert.deepEqual(
    rulesFor("apps/chms/server/effect/people.ts", "process.env.X"),
    ["env-in-domain"]
  );
  assert.deepEqual(
    rulesFor("apps/chms/server/lib/seed-guard.ts", "process.env.X"),
    []
  );
});
