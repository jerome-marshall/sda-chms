#!/usr/bin/env node
import { execFileSync } from "node:child_process";

const base = process.env.BASE_REF || "origin/main";
const allowed = process.env.ALLOW_TEST_DELETION === "1";

const run = (args) =>
  execFileSync("git", args, {
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
  });

try {
  run(["rev-parse", "--verify", base]);
} catch {
  console.error(
    `Cannot resolve ${base}. Fetch it, or pass BASE_REF with the branch to compare against.`
  );
  process.exit(1);
}

const diff = run([
  "diff",
  "--unified=0",
  `${base}...HEAD`,
  "--",
  "apps",
  "packages",
]);

const skipped =
  /^[+]\s*(?:it|test|describe)(?:\.\w+)*\.(?:skip|only|todo)\s*\(/u;
const skippedPrefix = /^[+]\s*x(?:it|test|describe)\s*\(/u;
const testCase = /^[+-]\s*(?:it|test)(?:\.\w+)*\s*\(/u;

let file = "";
let added = 0;
let removed = 0;
const findings = [];

for (const line of diff.split("\n")) {
  if (line.startsWith("+++ b/")) {
    file = line.slice(6);
    continue;
  }
  if (line.startsWith("@@") || line.startsWith("---")) {
    continue;
  }
  if (
    line.startsWith("+") &&
    (skipped.test(line) || skippedPrefix.test(line))
  ) {
    findings.push(`${file}  a skipped or focused test was added`);
  }
  if (testCase.test(line)) {
    if (line.startsWith("+")) {
      added += 1;
    } else {
      removed += 1;
    }
  }
}

if (removed > added && !allowed) {
  findings.push(
    `tests  ${removed} case(s) removed and ${added} added. Apply the test-deleted label, or restore the coverage.`
  );
}

if (findings.length > 0) {
  for (const finding of findings) {
    console.error(finding);
  }
  process.exit(1);
}

console.log(`Test integrity clean (${added} added, ${removed} removed).`);
