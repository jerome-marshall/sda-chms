import assert from "node:assert/strict";
import test from "node:test";

import { checkDiffShape } from "./check-diff-shape.mjs";

const service = "apps/chms/server/effect/people.ts";
const suite = "apps/chms/test/people.test.ts";

const hunk = (path, lines) => [
  `--- a/${path}`,
  `+++ b/${path}`,
  `@@ -1,0 +2,${lines.length} @@`,
  ...lines.map((line) => `+${line}`),
];

const diffOf = (...files) => files.flat().join("\n");

test("rejects a TypeScript suppression", () => {
  const findings = checkDiffShape(
    diffOf(hunk(service, ["// @ts\u002Dexpect-error it is fine"]))
  );
  assert.equal(findings.length, 1);
  assert.match(findings[0], new RegExp(`${service}:2`, "u"));
});

test("rejects a weaker matcher that replaced an exact one", () => {
  const diff = [
    `--- a/${suite}`,
    `+++ b/${suite}`,
    "@@ -10,1 +10,1 @@",
    '-expect(result).toEqual({ id: "1" });',
    "+expect(result).toBeTruthy();",
  ].join("\n");
  const findings = checkDiffShape(diff);
  assert.equal(findings.length, 1);
  assert.match(findings[0], /weaker matcher/u);
});

test("accepts a weak matcher that was not a downgrade", () => {
  const diff = [
    `--- a/${suite}`,
    `+++ b/${suite}`,
    "@@ -10,0 +11,1 @@",
    "+expect(result).toBeTruthy();",
  ].join("\n");
  assert.deepEqual(checkDiffShape(diff), []);
});

test("rejects a new domain export with no test in the diff", () => {
  const findings = checkDiffShape(
    diffOf(hunk(service, ["export const listPeople = () => query;"]))
  );
  assert.equal(findings.length, 1);
  assert.match(findings[0], /new server or shared export/u);
});

test("accepts a new domain export when a test changed", () => {
  const diff = diffOf(
    hunk(service, ["export const listPeople = () => query;"]),
    hunk(suite, ['it("lists the people", () => {});'])
  );
  assert.deepEqual(checkDiffShape(diff), []);
});

test("ignores a new export outside the domain", () => {
  const diff = diffOf(
    hunk("apps/chms/src/pages/People.tsx", [
      "export const People = () => page;",
    ])
  );
  assert.deepEqual(checkDiffShape(diff), []);
});

test("ignores a new test helper", () => {
  const diff = diffOf(hunk(suite, ["export const makePerson = () => person;"]));
  assert.deepEqual(checkDiffShape(diff), []);
});
