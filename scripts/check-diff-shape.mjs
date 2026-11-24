#!/usr/bin/env node
import { execFileSync } from "node:child_process";

const codeFile = /\.[cm]?[jt]sx?$/u;
const testFile = /(?:\.test|\.spec)\.[cm]?[jt]sx?$/u;

// The domain is where "a new rule with no test" is a real risk. The UI is
// covered by the required e2e job, so this rule stays out of its way.
const domainFile = (file) =>
  file.startsWith("apps/chms/server/") ||
  file.startsWith("packages/shared/src/");

const suppression = /@ts-(?:ignore|expect-error|nocheck)\b/u;

const strongAssertion =
  /\.(?:toStrictEqual|toEqual|toContain|toMatchObject|toHaveBeenCalledWith|toHaveBeenCalledTimes)\(/u;
const weakAssertion =
  /\.(?:toBeTruthy|toBeFalsy|toBeDefined|not\.toBeNull|not\.toBeUndefined)\(/u;

const newCallable =
  /^\s*export\s+(?:default\s+)?(?:async\s+)?(?:function|class)\s+\w+|^\s*export\s+const\s+\w+\s*=\s*(?:async\s*)?\(/u;

const parseHunk = (line) => {
  const match = /^@@ -(?<old>\d+)(?:,\d+)? \+(?<new>\d+)(?:,\d+)? @@/u.exec(
    line
  );
  return match
    ? { old: Number(match.groups?.old), new: Number(match.groups?.new) }
    : null;
};

/** Splits a unified diff into the added and removed lines, with file and line. */
const parse = (diff) => {
  const added = [];
  const removed = [];
  const changed = new Set();
  let file = "";
  let oldLine = 0;
  let newLine = 0;

  for (const line of diff.split("\n")) {
    if (line.startsWith("+++ b/")) {
      file = line.slice(6);
      changed.add(file);
      continue;
    }
    if (line.startsWith("---")) {
      continue;
    }

    const hunk = parseHunk(line);
    if (hunk) {
      oldLine = hunk.old;
      newLine = hunk.new;
      continue;
    }

    if (line.startsWith("+")) {
      added.push({ file, line: newLine, text: line.slice(1) });
      newLine += 1;
      continue;
    }
    if (line.startsWith("-")) {
      removed.push({ file, line: oldLine, text: line.slice(1) });
      oldLine += 1;
    }
  }

  return { added, removed, changed };
};

/**
 * The findings a script can decide on its own. Everything else on
 * docs/agents/self-review.md needs a person.
 */
export const checkDiffShape = (diff) => {
  const findings = [];
  const { added, removed, changed } = parse(diff);

  for (const entry of added) {
    if (codeFile.test(entry.file) && suppression.test(entry.text)) {
      findings.push(
        `${entry.file}:${entry.line}  a TypeScript suppression was added. Fix the type, or name the reason in the PR body.`
      );
    }
  }

  const weakened = new Set();
  for (const entry of removed) {
    if (testFile.test(entry.file) && strongAssertion.test(entry.text)) {
      weakened.add(entry.file);
    }
  }
  for (const entry of added) {
    if (!(testFile.test(entry.file) && weakAssertion.test(entry.text))) {
      continue;
    }
    if (!weakened.has(entry.file)) {
      continue;
    }
    weakened.delete(entry.file);
    findings.push(
      `${entry.file}:${entry.line}  a weaker matcher replaced an exact one. Assert the value a caller sees.`
    );
  }

  const hasTest = [...changed].some((name) => testFile.test(name));
  if (!hasTest) {
    for (const entry of added) {
      if (
        !codeFile.test(entry.file) ||
        testFile.test(entry.file) ||
        !domainFile(entry.file)
      ) {
        continue;
      }
      if (newCallable.test(entry.text)) {
        findings.push(
          `${entry.file}:${entry.line}  a new server or shared export with no test in this diff. Add the test that fails when it breaks.`
        );
      }
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
  const findings = checkDiffShape(diff);

  if (findings.length > 0) {
    for (const finding of findings) {
      console.error(finding);
    }
    process.exit(1);
  }

  console.log(`Diff shape clean (base ${base}).`);
};

if (process.argv[1] === import.meta.filename) {
  main();
}
