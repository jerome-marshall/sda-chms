import assert from "node:assert/strict";
import test from "node:test";

import { checkDiff } from "./check-test-integrity.mjs";

const file = "apps/chms/test/x.test.ts";

const added = (line) =>
  [`--- a/${file}`, `+++ b/${file}`, "@@ -1,0 +2,1 @@", line].join("\n");

test("rejects a skipped test", () => {
  const findings = checkDiff(added('+it.skip("x", () => {});'));
  assert.equal(findings.length, 1);
  assert.match(findings[0], new RegExp(`${file}:2`, "u"));
});

test("rejects a focused test", () => {
  assert.equal(checkDiff(added('+it.only("x", () => {});')).length, 1);
});

test("rejects fixme and skipIf", () => {
  assert.equal(checkDiff(added('+test.fixme("x", () => {});')).length, 1);
  assert.equal(checkDiff(added('+it.skipIf(true)("x", () => {});')).length, 1);
});

test("rejects a modifier after a parameterised call", () => {
  assert.equal(
    checkDiff(added('+it.each(cases).skip("x", () => {});')).length,
    1
  );
  assert.equal(
    checkDiff(added('+describe.each(cases).only("x", () => {});')).length,
    1
  );
});

test("rejects prefix and todo forms", () => {
  assert.equal(checkDiff(added('+xit("x", () => {});')).length, 1);
  assert.equal(checkDiff(added('+xdescribe("x", () => {});')).length, 1);
  assert.equal(checkDiff(added('+test.todo("x");')).length, 1);
});

test("accepts an added test", () => {
  assert.deepEqual(checkDiff(added('+it("x", () => {});')), []);
});

test("rejects a removed case without approval", () => {
  const diff = [
    `--- a/${file}`,
    `+++ b/${file}`,
    "@@ -10,1 +10,0 @@",
    '-it("x", () => {});',
  ].join("\n");
  const findings = checkDiff(diff);
  assert.equal(findings.length, 1);
  assert.match(findings[0], new RegExp(`${file}:10`, "u"));
});

test("allows a removed case with approval", () => {
  const diff = [
    `--- a/${file}`,
    `+++ b/${file}`,
    "@@ -10,1 +10,0 @@",
    '-it("x", () => {});',
  ].join("\n");
  assert.deepEqual(checkDiff(diff, { allowDeletion: true }), []);
});

test("a replacement case passes at net zero", () => {
  const diff = [
    `--- a/${file}`,
    `+++ b/${file}`,
    "@@ -10,1 +10,1 @@",
    '-it("x", () => {});',
    '+it("y", () => {});',
  ].join("\n");
  assert.deepEqual(checkDiff(diff), []);
});

test("counts removals per file, not across the diff", () => {
  const other = "apps/chms/test/y.test.ts";
  const diff = [
    `--- a/${file}`,
    `+++ b/${file}`,
    "@@ -1,1 +1,0 @@",
    '-it("x", () => {});',
    `--- a/${other}`,
    `+++ b/${other}`,
    "@@ -1,0 +1,2 @@",
    '+it("a", () => {});',
    '+it("b", () => {});',
  ].join("\n");
  const findings = checkDiff(diff);
  assert.equal(findings.length, 1);
  assert.match(findings[0], new RegExp(file, "u"));
});
