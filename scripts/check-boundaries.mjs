#!/usr/bin/env node
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const roots = ["apps/chms", "packages"];
const skipDirs = new Set([
  "node_modules",
  "dist",
  ".void",
  ".turbo",
  ".wrangler",
  ".vite",
  ".vite-hooks",
  "test-results",
  "playwright-report",
  "coverage",
]);
const extensions = [".ts", ".tsx"];

/** Replaces block comments with spaces so line numbers survive. */
export const stripBlockComments = (text) =>
  text.replaceAll(/\/\*[\s\S]*?\*\//gu, (match) =>
    match.replaceAll(/[^\n]/gu, " ")
  );

/** The 1-based line of a character index. */
export const lineOf = (text, index) => text.slice(0, index).split("\n").length;

/** The index of a `void/db` import of the binding, or -1. */
export const dbImportIndex = (text) => {
  const pattern =
    /import\s+(?<clause>\*\s+as\s+\w+|\{[\s\S]*?\})\s*from\s*["']void\/db["']/gu;
  for (const match of text.matchAll(pattern)) {
    const clause = match.groups?.clause ?? "";
    if (clause.startsWith("*") || /\bdb\b/u.test(clause)) {
      return match.index ?? -1;
    }
  }
  return -1;
};

export const rules = [
  {
    id: "run-promise-edge",
    message:
      "Run effects only in server/effect/runtime.ts. Tests and scripts may run them directly.",
    appliesTo: () => true,
    allow: (file) =>
      file === "apps/chms/server/effect/runtime.ts" ||
      file.startsWith("apps/chms/test/") ||
      file.startsWith("apps/chms/scripts/"),
    lineTest: /\bEffect\.(?:runPromise|runSync)\s*\(/u,
  },
  {
    id: "ambient-db",
    message:
      "Take `db: Database` as a parameter. getDb() belongs to server/db.ts and the Db layer.",
    appliesTo: (file) => file.startsWith("apps/chms/server/"),
    allow: (file) =>
      file === "apps/chms/server/db.ts" ||
      file === "apps/chms/server/effect/db.ts" ||
      file.startsWith("apps/chms/test/") ||
      file.startsWith("apps/chms/scripts/"),
    lineTest: /\bgetDb\s*\(/u,
  },
  {
    id: "db-import",
    message:
      "Import the database binding only in server/db.ts. Query helpers such as `eq` are fine.",
    appliesTo: () => true,
    allow: (file) =>
      file === "apps/chms/server/db.ts" || file === "apps/chms/test/void-db.ts",
    fileTest: dbImportIndex,
  },
  {
    id: "try-catch-in-service",
    message: "Use fromDb, Effect.try, or Effect.fail in a service.",
    appliesTo: (file) => file.startsWith("apps/chms/server/effect/"),
    allow: () => false,
    lineTest: /(?<![.\w])catch\s*\(|\btry\s*\{/u,
  },
  {
    id: "any-type",
    message: "Use `unknown` and a type guard.",
    appliesTo: () => true,
    allow: (file) =>
      file.endsWith(".d.ts") || file.startsWith("apps/chms/test/"),
    lineTest: /(?::\s*any\b|\bas\s+any\b|<any>)/u,
  },
  {
    id: "error-channel",
    message: "Name the failure type in the error channel.",
    appliesTo: (file) => file.startsWith("apps/chms/server/effect/"),
    allow: (file) => file === "apps/chms/server/effect/runtime.ts",
    lineTest: /Effect<[^>]*,\s*(?:Error|unknown)\s*[,>]/u,
  },
  {
    id: "route-reaches-db",
    message:
      "A route calls one Effect program from server/effect and runApi. It never touches the database or a query helper.",
    appliesTo: (file) => file.startsWith("apps/chms/src/routes/"),
    allow: () => false,
    lineTest:
      /from\s+["'][^"']*\/server\/(?!effect\/)[^"']*["']|from\s+["'](?:void\/db|drizzle-orm|@schema)["']/u,
  },
  {
    id: "env-in-domain",
    message: "Read the environment at an edge, not in domain code.",
    appliesTo: (file) =>
      file.startsWith("apps/chms/server/") ||
      file.startsWith("apps/chms/src/db/"),
    allow: (file) =>
      file === "apps/chms/server/lib/seed-guard.ts" ||
      file === "apps/chms/src/db/seed.ts",
    lineTest: /\bprocess\.env\b/u,
  },
];

/** Returns every violation for one rule in one file. */
const ruleViolations = (file, clean, rule) => {
  if (!rule.appliesTo(file) || rule.allow(file)) {
    return [];
  }

  if (rule.fileTest) {
    const index = rule.fileTest(clean);
    return index < 0
      ? []
      : [
          {
            file,
            line: lineOf(clean, index),
            rule: rule.id,
            message: rule.message,
          },
        ];
  }

  const found = [];
  for (const [index, line] of clean.split("\n").entries()) {
    if (line.trimStart().startsWith("//")) {
      continue;
    }
    if (rule.lineTest.test(line)) {
      found.push({
        file,
        line: index + 1,
        rule: rule.id,
        message: rule.message,
      });
    }
  }
  return found;
};

/** Returns every violation in one file. Pure, so the rules can be tested. */
export const scanText = (file, text) =>
  rules.flatMap((rule) => ruleViolations(file, stripBlockComments(text), rule));

const walk = (dir, found = []) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || skipDirs.has(entry.name)) {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, found);
    } else if (extensions.some((extension) => entry.name.endsWith(extension))) {
      found.push(full);
    }
  }
  return found;
};

const main = () => {
  const violations = [];
  for (const base of roots) {
    for (const full of walk(path.join(root, base))) {
      const file = path.relative(root, full);
      if (file.endsWith(".d.ts")) {
        continue;
      }
      violations.push(...scanText(file, readFileSync(full, "utf-8")));
    }
  }

  for (const violation of violations) {
    console.log(
      `${violation.file}:${violation.line}  ${violation.rule}  ${violation.message}`
    );
  }

  if (violations.length > 0) {
    console.error(`\n${violations.length} boundary violation(s).`);
    process.exit(1);
  }

  console.log("Boundaries clean.");
};

if (process.argv[1] === import.meta.filename) {
  main();
}
