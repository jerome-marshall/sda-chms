#!/usr/bin/env node
import { execFileSync } from "node:child_process";

const focused =
  /^[+]\s*(?:it|test|describe)(?:\.\w+(?:\([^)]*\))?)*\.(?:skip|only|todo|fixme|skipIf)\s*\(/u;
const focusedPrefix = /^[+]\s*x(?:it|test|describe)\s*\(/u;
const testCase = /^[+-]\s*(?:it|test)(?:\.\w+)*\s*\(/u;
const testFile = /(?:\.test|\.spec)\.[cm]?[jt]sx?$/u;

const parseHunk = (line) => {
  const match = /^@@ -(?<old>\d+)(?:,\d+)? \+(?<new>\d+)(?:,\d+)? @@/u.exec(
    line
  );
  return match
    ? { old: Number(match.groups?.old), new: Number(match.groups?.new) }
    : null;
};

const isFocused = (line) => focused.test(line) || focusedPrefix.test(line);

const stem = (name) =>
  (name.split("/").pop() ?? "").replace(
    /(?:\.test|\.spec)?\.[cm]?[jt]sx?$/u,
    ""
  );

/**
 * Turns a unified diff into findings. Pure, so the gate itself can be tested.
 */
export const checkDiff = (diff, { allowDeletion = false } = {}) => {
  const findings = [];
  const perFile = new Map();
  let file = "";
  let pendingDelete = "";
  let oldLine = 0;
  let newLine = 0;
  const deleted = new Set();

  const counts = (name) => {
    const current = perFile.get(name) ?? {
      added: 0,
      removed: 0,
      firstRemoved: 0,
    };
    perFile.set(name, current);
    return current;
  };

  for (const line of diff.split("\n")) {
    if (line.startsWith("--- a/")) {
      pendingDelete = line.slice(6);
      continue;
    }
    if (line.startsWith("+++ b/")) {
      pendingDelete = "";
      file = line.slice(6);
      continue;
    }
    if (line.startsWith("+++ /dev/null")) {
      if (pendingDelete) {
        deleted.add(pendingDelete);
        file = pendingDelete;
      }
      pendingDelete = "";
      continue;
    }

    const hunk = parseHunk(line);
    if (hunk) {
      oldLine = hunk.old;
      newLine = hunk.new;
      continue;
    }

    if (line.startsWith("+")) {
      if (isFocused(line)) {
        findings.push(
          `${file}:${newLine}  a skipped or focused test was added`
        );
      }
      if (testCase.test(line)) {
        counts(file).added += 1;
      }
      newLine += 1;
      continue;
    }

    if (line.startsWith("-")) {
      if (testCase.test(line)) {
        const current = counts(file);
        current.removed += 1;
        current.firstRemoved ||= oldLine;
      }
      oldLine += 1;
    }
  }

  const deletedSources = new Set(
    [...deleted].filter((name) => !testFile.test(name)).map(stem)
  );

  if (!allowDeletion) {
    for (const [name, countsForFile] of perFile) {
      if (countsForFile.removed <= countsForFile.added) {
        continue;
      }
      // Deleting a feature means deleting its test. Deleting only the test
      // still needs a person to apply the label.
      if (testFile.test(name) && deletedSources.has(stem(name))) {
        continue;
      }
      findings.push(
        `${name}:${countsForFile.firstRemoved}  ${countsForFile.removed - countsForFile.added} test case(s) removed. Apply the test-deleted label, or restore the coverage.`
      );
    }
  }

  return findings;
};

const run = (args) =>
  execFileSync("git", args, {
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
  });

const resolveBase = () => {
  const candidates = [
    process.env.BASE_REF,
    "origin/main",
    "origin/HEAD",
    "main",
  ];
  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }
    try {
      run(["rev-parse", "--verify", candidate]);
      return candidate;
    } catch {
      // Try the next candidate.
    }
  }
  return null;
};

const main = () => {
  const base = resolveBase();
  if (!base) {
    console.error(
      "Cannot resolve a base ref. Fetch it, or pass BASE_REF with the branch to compare against."
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
    "e2e",
    "scripts",
  ]);
  const findings = checkDiff(diff, {
    allowDeletion: process.env.ALLOW_TEST_DELETION === "1",
  });

  if (findings.length > 0) {
    for (const finding of findings) {
      console.error(finding);
    }
    process.exit(1);
  }

  console.log(`Test integrity clean (base ${base}).`);
};

if (process.argv[1] === import.meta.filename) {
  main();
}
