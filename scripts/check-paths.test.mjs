import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { missing } from "./check-paths.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const present = new Set(
  ["apps/chms/src/db", "README.md", "docs/conventions/project.md"].map((file) =>
    path.join(root, file)
  )
);
const options = {
  exists: (absolute) => present.has(absolute),
  ignored: (absolute) => absolute.endsWith(".env"),
};
const named = (file, text) =>
  missing(file, text, options).map((item) => [item.line, item.reference]);

test("rejects a gate that diffs a path that does not exist (#36)", () => {
  assert.deepEqual(
    named(
      "vite.config.ts",
      '  "git diff --exit-code -- apps/chms/db",\n  "git diff --exit-code -- apps/chms/src/db",'
    ),
    [[1, "apps/chms/db"]]
  );
});

test("resolves a markdown link from the file that holds it", () => {
  assert.deepEqual(
    named("apps/chms/ENV.md", "See [the README](../README.md#local-database)."),
    [[1, "../README.md"]]
  );
  assert.deepEqual(
    named("apps/chms/ENV.md", "See [the README](../../README.md#local)."),
    []
  );
});

test("accepts a gitignored local file", () => {
  assert.deepEqual(named("README.md", "Copy it to `apps/chms/.env`."), []);
});

test("skips globs, placeholders and web links", () => {
  assert.deepEqual(
    named(
      "docs/x.md",
      "`apps/*/vite.config.ts`, `apps/chms/<area>.ts`, [site](https://x.dev/apps/y)"
    ),
    []
  );
});

test("ignores a path that only ends with a top-level name", () => {
  assert.deepEqual(named("docs/x.md", "node_modules/foo/docs/thing.md"), []);
});
